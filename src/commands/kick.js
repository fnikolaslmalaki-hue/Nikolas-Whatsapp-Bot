const Logger = require('../utils/logger');

class KickCommand {
  constructor(database) {
    this.database = database;
  }

  async execute(message, args, sock, chatId) {
    try {
      if (!args[0]) {
        await sock.sendMessage(chatId, {
          text: '❌ استخدام: !kick @user أو !kick <رقم الهاتف>'
        });
        return;
      }

      let userToKick;

      // محاولة الحصول على المستخدم من mention
      if (message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
        userToKick = message.message.extendedTextMessage.contextInfo.mentionedJid[0];
      } else {
        const phone = args[0].replace(/\D/g, '');
        userToKick = phone + '@s.whatsapp.net';
      }

      // طرد العضو
      await sock.groupParticipantsUpdate(chatId, [userToKick], 'remove');
      
      const response = `✅ تم طرد العضو بنجاح`;
      await sock.sendMessage(chatId, { text: response });
      Logger.info(`🚫 تم طرد عضو: ${userToKick}`);

    } catch (error) {
      await sock.sendMessage(chatId, {
        text: `❌ خطأ: ${error.message}`
      });
      Logger.error(`❌ خطأ في طرد عضو: ${error.message}`);
    }
  }
}

module.exports = KickCommand;
