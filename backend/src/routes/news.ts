import express from 'express';
import mongoose from 'mongoose';
import News, { INews } from '../models/News';
import { authenticateJWT, isAdmin } from '../middleware/auth';
import { parsePagination, buildPaginationMeta } from '../utils/pagination';
import cacheService from '../services/cacheService';

const router = express.Router();

type NewsDocument = INews & { [key: string]: any };
type ReactionValue = 'like' | 'dislike';

const extractViewerId = (req: any): string | null => {
  const raw = req.user?._id || req.user?.id;
  return raw ? String(raw) : null;
};

const summarizeReactions = (item: any, viewerId?: string | null) => {
  const reactions = Array.isArray(item?.reactions) ? item.reactions : [];
  let likeCount = 0;
  let dislikeCount = 0;
  let myReaction: ReactionValue | null = null;

  for (const reaction of reactions) {
    const value = String(reaction?.value || '');
    if (value === 'like') likeCount += 1;
    if (value === 'dislike') dislikeCount += 1;
    if (viewerId && String(reaction?.user || '') === viewerId && (value === 'like' || value === 'dislike')) {
      myReaction = value as ReactionValue;
    }
  }

  return { likeCount, dislikeCount, myReaction };
};

const mapNewsDto = (item: any, viewerId?: string | null) => {
  const { likeCount, dislikeCount, myReaction } = summarizeReactions(item, viewerId);
  return {
    ...item,
    likeCount,
    dislikeCount,
    myReaction,
    likes: likeCount
  };
};

router.get('/', async (req, res) => {
  try {
    const limitRaw = Number(req.query.limit || 50);
    const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(100, limitRaw)) : 50;
    const category = String(req.query.category || '').trim().toLowerCase();
    const game = String(req.query.game || '').trim();
    const search = String(req.query.search || '').trim();
    const query: any = { status: 'published' };
    if (category) query.category = category;
    if (game) query.game = game;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { summary: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }
    const cacheKey = `news:published:list:${limit}:${category || 'all'}:${game || 'all'}:${search || 'all'}`;
    const items = (await cacheService.getOrSet(
      cacheKey,
      async () => {
        return News.find(query)
          .populate('author', 'username firstName lastName')
          .populate('relatedTournament', 'name game')
          .populate('relatedTeam', 'name tag game')
          .sort({ publishDate: -1, createdAt: -1 })
          .limit(limit)
          .lean();
      },
      { key: cacheKey, ttl: 30 }
    )) || [];
    const viewerId = extractViewerId(req as any);
    res.json({ success: true, data: items.map((item: any) => mapNewsDto(item, viewerId)) });
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch news' });
  }
});

router.get('/admin', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const { status } = req.query as { status?: string };
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>, {
      defaultLimit: 20,
      maxLimit: 200
    });
    const query: any = {};
    if (status && status !== 'all') {
      query.status = status;
    }
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      query.$or = [{ title: regex }, { summary: regex }, { content: regex }, { category: regex }, { game: regex }];
    }

    const [total, items] = await Promise.all([
      News.countDocuments(query),
      News.find(query)
        .populate('author', 'username firstName lastName')
        .sort({ publishDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
    ]);

    res.json({
      success: true,
      data: items,
      pagination: buildPaginationMeta(page, limit, total),
      summary: {
        filteredTotal: total
      }
    });
  } catch (error) {
    console.error('Error fetching admin news:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch news' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const item: any = await News.findById(req.params.id)
      .populate('author', 'username firstName lastName')
      .populate('relatedTournament', 'name game')
      .populate('relatedTeam', 'name tag game')
      .lean();

    if (!item || item.status !== 'published') {
      return res.status(404).json({ success: false, error: 'News not found' });
    }

    const viewerId = extractViewerId(req as any);
    res.json({ success: true, data: mapNewsDto(item, viewerId) });
  } catch (error) {
    console.error('Error fetching news by id:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch news' });
  }
});

router.post('/:id/reaction', authenticateJWT, async (req: any, res) => {
  try {
    const newsId = String(req.params.id || '').trim();
    if (!mongoose.Types.ObjectId.isValid(newsId)) {
      return res.status(400).json({ success: false, error: 'Invalid news id' });
    }
    const userId = String(req.user?._id || req.user?.id || '').trim();
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const rawValue = String(req.body?.value || '').trim().toLowerCase();
    const value = rawValue as ReactionValue;
    if (!['like', 'dislike'].includes(value)) {
      return res.status(400).json({ success: false, error: 'value must be like or dislike' });
    }

    const item: any = await News.findById(newsId);
    if (!item || item.status !== 'published') {
      return res.status(404).json({ success: false, error: 'News not found' });
    }

    const reactions = Array.isArray(item.reactions) ? item.reactions : [];
    const existing = reactions.find((reaction: any) => String(reaction?.user || '') === userId);
    if (existing && existing.value === value) {
      item.reactions = reactions.filter((reaction: any) => String(reaction?.user || '') !== userId);
    } else if (existing) {
      existing.value = value;
      existing.updatedAt = new Date();
    } else {
      reactions.push({
        user: new mongoose.Types.ObjectId(userId),
        value,
        updatedAt: new Date()
      });
      item.reactions = reactions;
    }

    const stats = summarizeReactions(item, userId);
    item.likes = stats.likeCount;
    await item.save();
    await cacheService.invalidatePattern('news:published:list:*');

    return res.json({
      success: true,
      data: {
        id: String(item._id),
        ...stats
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to set reaction' });
  }
});

router.post('/', authenticateJWT, isAdmin, async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const payload: Partial<INews> = {
      ...req.body,
      author: req.user._id
    } as any;

    if ((payload as any).status === 'published' && !(payload as any).publishDate) {
      (payload as any).publishDate = new Date();
    }

    const item = await new News(payload).save();
    const populated: any = await News.findById(item._id).populate('author', 'username firstName lastName').lean();
    await cacheService.invalidatePattern('news:published:list:*');

    res.status(201).json({ success: true, data: populated || item });
  } catch (error: any) {
    console.error('Error creating news:', error);
    res.status(400).json({ success: false, error: error?.message || 'Failed to create news' });
  }
});

router.put('/:id', authenticateJWT, isAdmin, async (req, res) => {
  const updates = Object.keys(req.body || {});
  const allowedUpdates = [
    'title',
    'content',
    'summary',
    'category',
    'tags',
    'coverImage',
    'game',
    'relatedTournament',
    'relatedTeam',
    'status',
    'publishDate'
  ];
  const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

  if (!isValidOperation) {
    return res.status(400).json({ success: false, error: 'Invalid updates' });
  }

  try {
    const item = (await News.findById(req.params.id)) as NewsDocument | null;
    if (!item) {
      return res.status(404).json({ success: false, error: 'News not found' });
    }

    updates.forEach((update) => {
      (item as any)[update] = (req.body as any)[update];
    });

    if ((item as any).status === 'published' && !(item as any).publishDate) {
      (item as any).publishDate = new Date();
    }

    await item.save();
    await cacheService.invalidatePattern('news:published:list:*');

    const populated: any = await News.findById(item._id).populate('author', 'username firstName lastName').lean();
    res.json({ success: true, data: populated || item });
  } catch (error: any) {
    console.error('Error updating news:', error);
    res.status(400).json({ success: false, error: error?.message || 'Failed to update news' });
  }
});

router.delete('/:id', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const item = await News.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, error: 'News not found' });
    }

    await cacheService.invalidatePattern('news:published:list:*');

    res.json({ success: true, data: item });
  } catch (error) {
    console.error('Error deleting news:', error);
    res.status(500).json({ success: false, error: 'Failed to delete news' });
  }
});

export default router;
