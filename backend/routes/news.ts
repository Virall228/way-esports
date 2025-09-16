import express from 'express';
import News from '../src/models/News';
import { auth, admin, AuthRequest } from '../middleware/auth';

const router = express.Router();

type NewsWithIndexSignature = import('../src/models/News').INews & {
  [key: string]: any;
};

// Create news article (Admin)
router.post('/news', auth, admin, async (req: AuthRequest, res) => {
  try {
    const news = new News({
      ...req.body,
      author: req.user?._id,
    });
    await news.save();
    res.status(201).send(news);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Get all news articles
router.get('/news', async (req, res) => {
  try {
    const news = await News.find({}).populate('author', 'username');
    res.send(news);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Get news article by ID
router.get('/news/:id', async (req, res) => {
  try {
    const news = await News.findById(req.params.id).populate('author', 'username');
    if (!news) {
      return res.status(404).send();
    }
    res.send(news);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Update news article (Admin)
router.patch('/news/:id', auth, admin, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['title', 'content', 'game', 'tags', 'imageUrl'];
  const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

  if (!isValidOperation) {
    return res.status(400).send({ error: 'Invalid updates!' });
  }

  try {
    const news = await News.findById(req.params.id) as NewsWithIndexSignature;
    if (!news) {
      return res.status(404).send();
    }
    updates.forEach((update) => (news[update] = req.body[update]));
    await news.save();
    res.send(news);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Delete news article (Admin)
router.delete('/news/:id', auth, admin, async (req, res) => {
  try {
    const news = await News.findByIdAndDelete(req.params.id);
    if (!news) {
      return res.status(404).send();
    }
    res.send(news);
  } catch (error) {
    res.status(500).send(error);
  }
});

export default router; 