const Logger = require('../utils/logger');

class UnmuteCommand {
  constructor(database) {
    this.database = database;
  }

  async execute(message, args, sock, chatId) {
    try {
      if (!args[0]) {
        await sock.sendMessage(chatId, {
          text: '❌ استخدام: !unmute @user'
        });
        return;
      }

      let userToUnmute;

      // محاولة الحصول على المستخدم من mention
      if (message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
        userToUnmute = message.message.extendedTextMessage.contextInfo.mentionedJid[0];
      } else {
        const phone = args[0].replace(/\D/g, '');
        userToUnmute = phone + '@s.whatsapp.net';
      }

      // إزالة المستخدم من قائمة المكتومين
      await this.database.unmuteUser(userToUnmute, chatId);

      const response = `🔊 تم إلغاء كتم صوت العضو`;
      await sock.sendMessage(chatId, { text: response });
      Logger.info(`🔊 تم إلغاء كتم صوت: ${userToUnmute}`);

    } catch (error) {
      await sock.sendMessage(chatId, {
        text: `❌ خطأ: ${error.message}`
      });
      Logger.error(`❌ خطأ في إلغاء كتم الصوت: ${error.message}`);
    }
  }
}

module.exports = UnmuteCommand;
