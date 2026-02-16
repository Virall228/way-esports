import AuthLog, { AuthLogEvent, AuthLogMethod, AuthLogStatus } from '../models/AuthLog';

interface AuthLogPayload {
  userId?: string;
  event: AuthLogEvent;
  status: AuthLogStatus;
  method: AuthLogMethod;
  identifier?: string;
  reason?: string;
  ip?: string;
  userAgent?: string;
  metadata?: unknown;
}

export const logAuthEvent = async (payload: AuthLogPayload) => {
  try {
    await AuthLog.create({
      userId: payload.userId || undefined,
      event: payload.event,
      status: payload.status,
      method: payload.method,
      identifier: payload.identifier,
      reason: payload.reason,
      ip: payload.ip,
      userAgent: payload.userAgent,
      metadata: payload.metadata
    });
  } catch (error) {
    console.error('Failed to write auth log:', error);
  }
};

