const Logger = require('../utils/logger');

class DemoteCommand {
  constructor() {}

  async execute(message, args, sock, chatId) {
    try {
      if (!args[0]) {
        await sock.sendMessage(chatId, {
          text: '❌ استخدام: !demote @user أو !demote <رقم الهاتف>'
        });
        return;
      }

      let userToDemote;

      // محاولة الحصول على المستخدم من mention
      if (message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
        userToDemote = message.message.extendedTextMessage.contextInfo.mentionedJid[0];
      } else {
        const phone = args[0].replace(/\D/g, '');
        userToDemote = phone + '@s.whatsapp.net';
      }

      // إزالة صلاحيات المسؤول
      await sock.groupParticipantsUpdate(chatId, [userToDemote], 'demote');

      const response = `✅ تم إزالة صلاحيات المسؤول`;
      await sock.sendMessage(chatId, { text: response });
      Logger.info(`⬇️ تم إزالة صلاحية المسؤول: ${userToDemote}`);

    } catch (error) {
      await sock.sendMessage(chatId, {
        text: `❌ خطأ: ${error.message}`
      });
      Logger.error(`❌ خطأ في إزالة الصلاحيات: ${error.message}`);
    }
  }
}

module.exports = DemoteCommand;
