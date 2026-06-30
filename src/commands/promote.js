const Logger = require('../utils/logger');

class PromoteCommand {
  constructor() {}

  async execute(message, args, sock, chatId) {
    try {
      if (!args[0]) {
        await sock.sendMessage(chatId, {
          text: '❌ استخدام: !promote @user أو !promote <رقم الهاتف>'
        });
        return;
      }

      let userToPromote;

      // محاولة الحصول على المستخدم من mention
      if (message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
        userToPromote = message.message.extendedTextMessage.contextInfo.mentionedJid[0];
      } else {
        const phone = args[0].replace(/\D/g, '');
        userToPromote = phone + '@s.whatsapp.net';
      }

      // ترقية العضو لمسؤول
      await sock.groupParticipantsUpdate(chatId, [userToPromote], 'promote');

      const response = `✅ تم ترقية العضو لمسؤول`;
      await sock.sendMessage(chatId, { text: response });
      Logger.info(`⬆️ تم ترقية عضو للمسؤول: ${userToPromote}`);

    } catch (error) {
      await sock.sendMessage(chatId, {
        text: `❌ خطأ: ${error.message}`
      });
      Logger.error(`❌ خطأ في ترقية عضو: ${error.message}`);
    }
  }
}

module.exports = PromoteCommand;
