import express from 'express';
import mongoose from 'mongoose';
import { body } from 'express-validator';
import SupportConversation from '../models/SupportConversation';
import SupportMessage from '../models/SupportMessage';
import Team from '../models/Team';
import { isAdmin } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { generateSupportReply, getSupportAiStatus } from '../services/supportAiService';

const router = express.Router();

const MESSAGE_MAX_LEN = 2000;

const asObjectId = (value: unknown): mongoose.Types.ObjectId | null => {
  if (!value) return null;
  const stringValue = String(value).trim();
  if (!mongoose.Types.ObjectId.isValid(stringValue)) return null;
  return new mongoose.Types.ObjectId(stringValue);
};

const getUserId = (req: any): mongoose.Types.ObjectId | null => {
  const id = req.user?._id || req.user?.id;
  return asObjectId(id);
};

const sanitizePreview = (message: string) => message.trim().replace(/\s+/g, ' ').slice(0, 300);

const ensureTeamAccess = async (teamId: mongoose.Types.ObjectId, userId: mongoose.Types.ObjectId): Promise<boolean> => {
  const team: any = await Team.findById(teamId).select('_id captain members').lean();
  if (!team) return false;
  const members: string[] = (team.members || []).map((member: any) => String(member));
  const captainId = team.captain ? String(team.captain) : '';
  const uid = String(userId);
  return members.includes(uid) || captainId === uid;
};

const normalizeMessage = (msg: any) => ({
  id: String(msg?._id || ''),
  conversationId: String(msg?.conversationId || ''),
  senderType: msg?.senderType || 'system',
  senderId: msg?.senderId ? String(msg.senderId) : null,
  content: msg?.content || '',
  provider: msg?.provider || null,
  createdAt: msg?.createdAt || null
});

const normalizeConversation = (conv: any) => ({
  id: String(conv?._id || ''),
  userId: conv?.userId?._id ? String(conv.userId._id) : String(conv?.userId || ''),
  username: conv?.userId?.username || '',
  email: conv?.userId?.email || '',
  teamId: conv?.teamId?._id ? String(conv.teamId._id) : (conv?.teamId ? String(conv.teamId) : null),
  teamName: conv?.teamId?.name || null,
  subject: conv?.subject || 'Emergency Support',
  source: conv?.source || 'settings',
  status: conv?.status || 'open',
  priority: conv?.priority || 'normal',
  aiEnabled: Boolean(conv?.aiEnabled),
  unreadForUser: Number(conv?.unreadForUser || 0),
  unreadForAdmin: Number(conv?.unreadForAdmin || 0),
  lastMessagePreview: conv?.lastMessagePreview || '',
  lastMessageAt: conv?.lastMessageAt || conv?.updatedAt || null,
  createdAt: conv?.createdAt || null
});

router.get('/ai-status', (_req, res) => {
  return res.json({ success: true, data: getSupportAiStatus() });
});

router.get('/thread', async (req: any, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ success: false, error: 'Authentication required' });

    const teamId = asObjectId(req.query?.teamId);
    if (teamId) {
      const allowed = await ensureTeamAccess(teamId, userId);
      if (!allowed) return res.status(403).json({ success: false, error: 'Team access denied' });
    }

    const query: any = { userId };
    if (teamId) query.teamId = teamId;
    else query.teamId = { $exists: false };

    let conversation: any = await SupportConversation.findOne(query).lean();
    if (!conversation && !teamId) {
      conversation = await SupportConversation.create({
        userId,
        subject: 'Emergency Support',
        source: 'settings',
        status: 'open'
      });
      conversation = await SupportConversation.findById((conversation as any)._id).lean();
    }

    if (!conversation) {
      return res.json({
        success: true,
        data: { conversation: null, messages: [] }
      });
    }

    await SupportConversation.updateOne({ _id: conversation._id }, { $set: { unreadForUser: 0 } });
    await SupportMessage.updateMany(
      { conversationId: conversation._id, senderType: { $in: ['admin', 'ai'] }, readByUser: false },
      { $set: { readByUser: true } }
    );

    const messages = await SupportMessage.find({ conversationId: conversation._id })
      .sort({ createdAt: 1 })
      .limit(300)
      .lean();

    return res.json({
      success: true,
      data: {
        conversation: normalizeConversation(conversation),
        messages: messages.map(normalizeMessage)
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to load support thread' });
  }
});

router.post(
  '/message',
  [
    body('message').trim().isLength({ min: 1, max: MESSAGE_MAX_LEN }).withMessage('Message is required'),
    body('teamId').optional().isString(),
    body('source').optional().isIn(['settings', 'profile', 'team', 'other']),
    body('subject').optional().isString().isLength({ min: 1, max: 180 })
  ],
  validateRequest,
  async (req: any, res: any) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ success: false, error: 'Authentication required' });

      const content = String(req.body?.message || '').trim();
      const subject = String(req.body?.subject || 'Emergency Support').trim().slice(0, 180);
      const source = (req.body?.source || 'settings') as 'settings' | 'profile' | 'team' | 'other';
      const teamId = asObjectId(req.body?.teamId);

      if (teamId) {
        const allowed = await ensureTeamAccess(teamId, userId);
        if (!allowed) return res.status(403).json({ success: false, error: 'Team access denied' });
      }

      const query: any = { userId };
      if (teamId) query.teamId = teamId;
      else query.teamId = { $exists: false };

      let conversation: any = await SupportConversation.findOne(query);
      if (!conversation) {
        conversation = await SupportConversation.create({
          userId,
          teamId: teamId || undefined,
          subject,
          source,
          status: 'open',
          unreadForAdmin: 0,
          unreadForUser: 0
        });
      }

      const userMessage = await SupportMessage.create({
        conversationId: conversation._id,
        senderType: 'user',
        senderId: userId,
        content,
        readByUser: true,
        readByAdmin: false
      });

      await SupportConversation.updateOne(
        { _id: conversation._id },
        {
          $set: {
            status: 'waiting_admin',
            source,
            subject,
            lastMessageAt: new Date(),
            lastMessagePreview: sanitizePreview(content)
          },
          $inc: { unreadForAdmin: 1 }
        }
      );

      const contextMessages = await SupportMessage.find({ conversationId: conversation._id })
        .sort({ createdAt: 1 })
        .limit(12)
        .lean();

      const ai = await generateSupportReply({
        username: req.user?.username || 'user',
        subject,
        messages: contextMessages.map((row: any) => ({
          role: row.senderType,
          content: row.content,
          createdAt: row.createdAt
        }))
      });

      const aiMessage = await SupportMessage.create({
        conversationId: conversation._id,
        senderType: 'ai',
        content: ai.text,
        provider: ai.provider,
        readByUser: false,
        readByAdmin: false
      });

      await SupportConversation.updateOne(
        { _id: conversation._id },
        {
          $set: {
            status: 'waiting_user',
            lastMessageAt: new Date(),
            lastMessagePreview: sanitizePreview(ai.text)
          },
          $inc: { unreadForUser: 1, unreadForAdmin: 1 }
        }
      );

      return res.status(201).json({
        success: true,
        data: {
          userMessage: normalizeMessage(userMessage),
          aiMessage: normalizeMessage(aiMessage)
        }
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || 'Failed to send support message' });
    }
  }
);

router.get('/admin/conversations', isAdmin, async (req, res) => {
  try {
    const statusFilter = typeof req.query?.status === 'string' ? req.query.status.trim() : '';
    const query: any = {};
    if (statusFilter) query.status = statusFilter;

    const conversations = await SupportConversation.find(query)
      .populate('userId', 'username email')
      .populate('teamId', 'name tag')
      .sort({ lastMessageAt: -1 })
      .limit(300)
      .lean();

    return res.json({
      success: true,
      data: conversations.map(normalizeConversation)
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to load support conversations' });
  }
});

router.get('/admin/conversations/:id/messages', isAdmin, async (req, res) => {
  try {
    const conversationId = asObjectId(req.params.id);
    if (!conversationId) return res.status(400).json({ success: false, error: 'Invalid conversation id' });

    const conversation = await SupportConversation.findById(conversationId)
      .populate('userId', 'username email')
      .populate('teamId', 'name tag')
      .lean();
    if (!conversation) return res.status(404).json({ success: false, error: 'Conversation not found' });

    await SupportConversation.updateOne({ _id: conversationId }, { $set: { unreadForAdmin: 0 } });
    await SupportMessage.updateMany(
      { conversationId, senderType: { $in: ['user'] }, readByAdmin: false },
      { $set: { readByAdmin: true } }
    );

    const messages = await SupportMessage.find({ conversationId })
      .sort({ createdAt: 1 })
      .limit(600)
      .lean();

    return res.json({
      success: true,
      data: {
        conversation: normalizeConversation(conversation),
        messages: messages.map(normalizeMessage)
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to load conversation messages' });
  }
});

router.post(
  '/admin/conversations/:id/reply',
  isAdmin,
  [body('message').trim().isLength({ min: 1, max: MESSAGE_MAX_LEN }).withMessage('Message is required')],
  validateRequest,
  async (req: any, res: any) => {
    try {
      const conversationId = asObjectId(req.params.id);
      if (!conversationId) return res.status(400).json({ success: false, error: 'Invalid conversation id' });

      const conversation = await SupportConversation.findById(conversationId);
      if (!conversation) return res.status(404).json({ success: false, error: 'Conversation not found' });

      const adminId = getUserId(req);
      const content = String(req.body?.message || '').trim();

      const reply = await SupportMessage.create({
        conversationId,
        senderType: 'admin',
        senderId: adminId || undefined,
        content,
        readByAdmin: true,
        readByUser: false
      });

      conversation.status = 'waiting_user';
      conversation.assignedAdminId = adminId || conversation.assignedAdminId;
      conversation.lastMessageAt = new Date();
      conversation.lastMessagePreview = sanitizePreview(content);
      conversation.unreadForUser = Number(conversation.unreadForUser || 0) + 1;
      conversation.unreadForAdmin = 0;
      await conversation.save();

      return res.status(201).json({
        success: true,
        data: normalizeMessage(reply)
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || 'Failed to send admin reply' });
    }
  }
);

router.patch('/admin/conversations/:id/status', isAdmin, async (req: any, res: any) => {
  try {
    const conversationId = asObjectId(req.params.id);
    if (!conversationId) return res.status(400).json({ success: false, error: 'Invalid conversation id' });

    const status = String(req.body?.status || '').trim();
    if (!['open', 'waiting_user', 'waiting_admin', 'resolved'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status value' });
    }

    const updated = await SupportConversation.findByIdAndUpdate(
      conversationId,
      { $set: { status } },
      { new: true }
    ).lean();

    if (!updated) return res.status(404).json({ success: false, error: 'Conversation not found' });
    return res.json({ success: true, data: normalizeConversation(updated) });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to update conversation status' });
  }
});

export default router;
