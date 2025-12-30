import express from 'express';
import News, { INews } from '../models/News';
import { authenticateJWT, isAdmin } from '../middleware/auth';

const router = express.Router();

type NewsDocument = INews & { [key: string]: any };

router.get('/', async (req, res) => {
  try {
    const items = await News.find({ status: 'published' })
      .populate('author', 'username firstName lastName')
      .sort({ publishDate: -1, createdAt: -1 })
      .lean();

    res.json({ success: true, data: items });
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch news' });
  }
});

router.get('/admin', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const { status } = req.query as { status?: string };
    const query: any = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    const items = await News.find(query)
      .populate('author', 'username firstName lastName')
      .sort({ publishDate: -1, createdAt: -1 })
      .lean();

    res.json({ success: true, data: items });
  } catch (error) {
    console.error('Error fetching admin news:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch news' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const item: any = await News.findById(req.params.id)
      .populate('author', 'username firstName lastName')
      .lean();

    if (!item || item.status !== 'published') {
      return res.status(404).json({ success: false, error: 'News not found' });
    }

    res.json({ success: true, data: item });
  } catch (error) {
    console.error('Error fetching news by id:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch news' });
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

    res.json({ success: true, data: item });
  } catch (error) {
    console.error('Error deleting news:', error);
    res.status(500).json({ success: false, error: 'Failed to delete news' });
  }
});

export default router;
