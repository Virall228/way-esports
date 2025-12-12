import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to transform MongoDB documents to frontend-friendly format
 * Converts _id to id and ensures consistent response structure
 */
export function transformResponse(req: Request, res: Response, next: NextFunction) {
  const originalJson = res.json.bind(res);

  res.json = function (data: any) {
    if (data && typeof data === 'object') {
      // Transform single object
      if (data._id && !data.id) {
        data.id = data._id.toString();
      }

      // Transform array
      if (Array.isArray(data)) {
        data = data.map(transformDocument);
      } else if (data.data && Array.isArray(data.data)) {
        // Transform nested data array
        data.data = data.data.map(transformDocument);
      } else if (data.data && data.data._id) {
        // Transform single nested document
        data.data = transformDocument(data.data);
      }
    }

    return originalJson(data);
  };

  next();
}

function transformDocument(doc: any): any {
  if (!doc || typeof doc !== 'object') {
    return doc;
  }

  const transformed: any = { ...doc };

  // Convert _id to id
  if (doc._id && !doc.id) {
    transformed.id = doc._id.toString();
    // Optionally remove _id if you want clean frontend data
    // delete transformed._id;
  }

  // Transform nested objects
  if (doc.registeredTeams && Array.isArray(doc.registeredTeams)) {
    transformed.registeredTeams = doc.registeredTeams.map((team: any) => {
      if (typeof team === 'object' && team._id) {
        return {
          id: team._id.toString(),
          name: team.name || '',
          tag: team.tag || '',
          logo: team.logo || '',
          players: team.members?.map((m: any) => m.toString()) || []
        };
      }
      return team;
    });
  }

  // Transform matches
  if (doc.matches && Array.isArray(doc.matches)) {
    transformed.matches = doc.matches.map((match: any) => {
      if (typeof match === 'object' && match._id) {
        return {
          id: match._id.toString(),
          ...match
        };
      }
      return match;
    });
  }

  // Transform team members
  if (doc.members && Array.isArray(doc.members)) {
    transformed.members = doc.members.map((member: any) => {
      if (typeof member === 'object' && member._id) {
        return {
          id: member._id.toString(),
          username: member.username || '',
          firstName: member.firstName || '',
          lastName: member.lastName || ''
        };
      }
      return member;
    });
  }

  // Transform dates to ISO strings for frontend
  if (doc.startDate && doc.startDate instanceof Date) {
    transformed.startDate = doc.startDate.toISOString();
  }
  if (doc.endDate && doc.endDate instanceof Date) {
    transformed.endDate = doc.endDate.toISOString();
  }
  if (doc.startTime && doc.startTime instanceof Date) {
    transformed.startTime = doc.startTime.toISOString();
  }
  if (doc.endTime && doc.endTime instanceof Date) {
    transformed.endTime = doc.endTime.toISOString();
  }
  if (doc.createdAt && doc.createdAt instanceof Date) {
    transformed.createdAt = doc.createdAt.toISOString();
  }
  if (doc.updatedAt && doc.updatedAt instanceof Date) {
    transformed.updatedAt = doc.updatedAt.toISOString();
  }

  return transformed;
}

