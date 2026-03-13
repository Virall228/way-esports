import User from '../models/User';
import Team from '../models/Team';
import BotSubscriber from '../models/BotSubscriber';
import BotNotification from '../models/BotNotification';

const BotSubscriberModel: any = BotSubscriber;
const BotNotificationModel: any = BotNotification;

const toStringId = (value: any): string => {
  if (!value) return '';
  return value.toString ? value.toString() : String(value);
};

const ensureUserNotification = async (user: any, title: string, message: string) => {
  try {
    if (!Array.isArray(user.notifications)) {
      user.notifications = [];
    }
    user.notifications.push({
      type: 'system',
      title,
      message,
      read: false,
      date: new Date()
    });
    await user.save();
  } catch (error) {
    console.error('[bot-push] failed to write in-app notification:', error);
  }
};

const enqueueTelegram = async (params: {
  user: any;
  eventType: string;
  title: string;
  message: string;
  payload?: Record<string, any>;
  sendAt?: Date;
}) => {
  const telegramId = Number(params.user?.telegramId || 0);
  if (!Number.isFinite(telegramId) || telegramId <= 0) return null;

  const subscriber: any = await BotSubscriberModel.findOne({ telegramId }).lean();
  const chatId = Number(subscriber?.chatId || telegramId);
  if (!Number.isFinite(chatId) || chatId <= 0) return null;

  return BotNotificationModel.create({
    userId: params.user?._id,
    telegramId,
    chatId,
    eventType: params.eventType,
    title: params.title,
    message: params.message,
    payload: params.payload || {},
    sendAt: params.sendAt || new Date(),
    status: 'pending'
  });
};

const notifyUser = async (params: {
  userId: any;
  eventType: string;
  title: string;
  message: string;
  payload?: Record<string, any>;
  sendAt?: Date;
}) => {
  const user: any = await User.findById(params.userId);
  if (!user) return;

  await Promise.allSettled([
    ensureUserNotification(user, params.title, params.message),
    enqueueTelegram({
      user,
      eventType: params.eventType,
      title: params.title,
      message: params.message,
      payload: params.payload,
      sendAt: params.sendAt
    })
  ]);
};

const notifyUsers = async (params: {
  userIds: any[];
  eventType: string;
  title: string;
  message: string;
  payload?: Record<string, any>;
  sendAt?: Date;
}) => {
  const uniqueIds = Array.from(new Set((params.userIds || []).map((id) => toStringId(id)).filter(Boolean)));
  await Promise.all(
    uniqueIds.map((userId) =>
      notifyUser({
        userId,
        eventType: params.eventType,
        title: params.title,
        message: params.message,
        payload: params.payload,
        sendAt: params.sendAt
      })
    )
  );
};

const getTeamMemberIds = async (teamId: any): Promise<string[]> => {
  const team: any = await Team.findById(teamId).select('members players captain').lean();
  if (!team) return [];
  const ids = new Set<string>();
  if (team.captain) ids.add(toStringId(team.captain));
  (Array.isArray(team.members) ? team.members : []).forEach((m: any) => ids.add(toStringId(m)));
  (Array.isArray(team.players) ? team.players : []).forEach((m: any) => ids.add(toStringId(m)));
  return Array.from(ids).filter(Boolean);
};

export const botPushService = {
  notifyUser,
  notifyUsers,
  getTeamMemberIds
};

export default botPushService;
