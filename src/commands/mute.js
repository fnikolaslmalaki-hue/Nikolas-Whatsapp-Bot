const Logger = require('../utils/logger');

class MuteCommand {
  constructor(database) {
    this.database = database;
  }

  async execute(message, args, sock, chatId) {
    try {
      if (!args[0]) {
        await sock.sendMessage(chatId, {
          text: '❌ استخدام: !mute @user'
        });
        return;
      }

      let userToMute;

      // محاولة الحصول على المستخدم من mention
      if (message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
        userToMute = message.message.extendedTextMessage.contextInfo.mentionedJid[0];
      } else {
        const phone = args[0].replace(/\D/g, '');
        userToMute = phone + '@s.whatsapp.net';
      }

      // حفظ المستخدم المكتوم في قاعدة البيانات
      await this.database.muteUser(userToMute, chatId);

      const response = `🔇 تم كتم صوت العضو`;
      await sock.sendMessage(chatId, { text: response });
      Logger.info(`🔇 تم كتم صوت: ${userToMute}`);

    } catch (error) {
      await sock.sendMessage(chatId, {
        text: `❌ خطأ: ${error.message}`
      });
      Logger.error(`❌ خطأ في كتم الصوت: ${error.message}`);
    }
  }
}

module.exports = MuteCommand;
