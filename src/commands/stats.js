const Logger = require('../utils/logger');

class StatsCommand {
  constructor(database) {
    this.database = database;
  }

  async execute(message, args, sock, chatId) {
    try {
      const groupMetadata = await sock.groupMetadata(chatId);
      const messagesCount = await this.database.getGroupMessagesCount(chatId);
      const commandsCount = await this.database.getGroupCommandsCount(chatId);

      const stats = `
╔════════════════════════════════════╗
║       📊 إحصائيات المجموعة         ║
╚════════════════════════════════════╝

👥 *معلومات المجموعة:*
  اسم: ${groupMetadata.subject}
  الأعضاء: ${groupMetadata.participants.length}
  المسؤولين: ${groupMetadata.participants.filter(p => p.admin).length}

📝 *الرسائل والأوامر:*
  إجمالي الرسائل: ${messagesCount}
  الأوامر المنفذة: ${commandsCount}

🤖 *معلومات البوت:*
  الاسم: ${process.env.BOT_NAME}
  الإصدار: 1.0.0

⏰ *آخر تحديث:* ${new Date().toLocaleString('ar-EG')}
      `;

      await sock.sendMessage(chatId, { text: stats });
      Logger.info(`📊 تم عرض الإحصائيات للمجموعة: ${chatId}`);

    } catch (error) {
      await sock.sendMessage(chatId, {
        text: `❌ خطأ: ${error.message}`
      });
      Logger.error(`❌ خطأ في عرض الإحصائيات: ${error.message}`);
    }
  }
}

module.exports = StatsCommand;
