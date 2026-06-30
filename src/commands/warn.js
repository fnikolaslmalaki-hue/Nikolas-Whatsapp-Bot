const Logger = require('../utils/logger');

class WarnCommand {
  constructor(database) {
    this.database = database;
  }

  async execute(message, args, sock, chatId) {
    try {
      if (!args[0]) {
        await sock.sendMessage(chatId, {
          text: '❌ استخدام: !warn @user <السبب>'
        });
        return;
      }

      let userToWarn;
      const reason = args.slice(1).join(' ') || 'بدون سبب';

      // محاولة الحصول على المستخدم من mention
      if (message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
        userToWarn = message.message.extendedTextMessage.contextInfo.mentionedJid[0];
      } else {
        const phone = args[0].replace(/\D/g, '');
        userToWarn = phone + '@s.whatsapp.net';
      }

      // إضافة تحذير في قاعدة البيانات
      const warns = await this.database.addWarn(userToWarn, chatId, reason);

      const response = `⚠️ تم إصدار تحذير للعضو\n📋 السبب: ${reason}\n⚡ عدد التحذيرات: ${warns}/3`;
      
      await sock.sendMessage(chatId, { text: response });

      // إذا وصل للتحذير الثالث، طرده
      if (warns >= 3) {
        await sock.groupParticipantsUpdate(chatId, [userToWarn], 'remove');
        const kickMsg = `🚫 تم طرد العضو بعد 3 تحذيرات`;
        await sock.sendMessage(chatId, { text: kickMsg });
        Logger.info(`⚠️ تم طرد عضو بسبب التحذيرات: ${userToWarn}`);
      }

      Logger.info(`⚠️ تحذير: ${userToWarn} - السبب: ${reason}`);

    } catch (error) {
      await sock.sendMessage(chatId, {
        text: `❌ خطأ: ${error.message}`
      });
      Logger.error(`❌ خطأ في إصدار تحذير: ${error.message}`);
    }
  }
}

module.exports = WarnCommand;
