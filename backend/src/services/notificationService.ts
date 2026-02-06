import TelegramBot from 'node-telegram-bot-api';
// Using the existing emailService (which currently logs to console, but can be extended)
import emailService from '../../services/emailService';

class NotificationService {
    private bot: TelegramBot | null = null;

    constructor() {
        if (process.env.TELEGRAM_BOT_TOKEN) {
            this.bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });
        } else {
            console.warn('TELEGRAM_BOT_TOKEN not set, Telegram notifications will be disabled');
        }
    }

    async sendToUser(user: any, title: string, message: string, data?: any) {
        try {
            const promises = [];

            // 1. Send via Telegram if user has linked account
            if (this.bot && user.telegramId) {
                promises.push(this.sendTelegramMessage(user.telegramId, `<b>${title}</b>\n\n${message}`));
            }

            // 2. Send via Email if user has email
            if (user.email) {
                promises.push(emailService.sendEmail(user.email, title, `<h1>${title}</h1><p>${message}</p>`));
            }

            // 3. Store in-app notification (assuming user model has notifications array)
            if (user.notifications) {
                user.notifications.push({
                    type: 'system',
                    title,
                    message,
                    read: false,
                    date: new Date()
                });
                promises.push(user.save());
            }

            await Promise.allSettled(promises);
        } catch (error) {
            console.error('Error sending notification:', error);
        }
    }

    private async sendTelegramMessage(chatId: number, htmlProps: string) {
        if (!this.bot) return;
        try {
            await this.bot.sendMessage(chatId, htmlProps, { parse_mode: 'HTML' });
        } catch (error) {
            console.error(`Failed to send Telegram message to ${chatId}:`, error);
        }
    }

    async notifyAdmin(message: string) {
        // Send to a configured admin channel or user
        const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
        if (this.bot && adminChatId) {
            try {
                await this.bot.sendMessage(adminChatId, `🚨 <b>Admin Alert</b>\n\n${message}`, { parse_mode: 'HTML' });
            } catch (e) {
                console.error("Failed to notify admin", e);
            }
        }
    }
}

export default new NotificationService();
