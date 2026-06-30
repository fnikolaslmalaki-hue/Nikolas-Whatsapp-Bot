const Logger = require('../utils/logger');
const HelpCommand = require('../commands/help');
const KickCommand = require('../commands/kick');
const MuteCommand = require('../commands/mute');
const UnmuteCommand = require('../commands/unmute');
const WarnCommand = require('../commands/warn');
const StatsCommand = require('../commands/stats');
const PromoteCommand = require('../commands/promote');
const DemoteCommand = require('../commands/demote');

class CommandHandler {
  constructor(database) {
    this.database = database;
    this.commands = {
      help: new HelpCommand(),
      kick: new KickCommand(database),
      mute: new MuteCommand(database),
      unmute: new UnmuteCommand(database),
      warn: new WarnCommand(database),
      stats: new StatsCommand(database),
      promote: new PromoteCommand(),
      demote: new DemoteCommand()
    };
  }

  async handle(message, sock, messageText) {
    try {
      const args = messageText.slice(1).trim().split(/ +/);
      const commandName = args.shift().toLowerCase();

      if (!this.commands[commandName]) {
        await sock.sendMessage(message.key.remoteJid, {
          text: '❌ أمر غير معروف. اكتب !help للمساعدة'
        });
        return;
      }

      const chatId = message.key.remoteJid;
      const senderId = message.key.participant || message.key.remoteJid;

      // التحقق من الصلاحيات
      const isAdmin = await this.isAdmin(sock, chatId, senderId);
      const isBotOwner = senderId.includes(process.env.BOT_OWNER.replace('+', ''));

      if (!isAdmin && !isBotOwner) {
        await sock.sendMessage(chatId, {
          text: '❌ هذا الأمر متاح فقط للمسؤولين'
        });
        return;
      }

      // تنفيذ الأمر
      await this.commands[commandName].execute(message, args, sock, chatId);
      
      // تسجيل الأمر
      await this.database.logCommand(commandName, senderId, messageText);
      Logger.info(`📝 تنفيذ أمر: !${commandName} من ${senderId}`);

    } catch (error) {
      Logger.error(`❌ خطأ في تنفيذ الأمر: ${error.message}`);
      await sock.sendMessage(message.key.remoteJid, {
        text: `❌ حدث خطأ: ${error.message}`
      });
    }
  }

  async isAdmin(sock, groupId, userId) {
    try {
      const groupMetadata = await sock.groupMetadata(groupId);
      const admins = groupMetadata.participants
        .filter(p => p.admin)
        .map(p => p.id);
      return admins.includes(userId);
    } catch (error) {
      Logger.error(`❌ خطأ في التحقق من الصلاحيات: ${error.message}`);
      return false;
    }
  }
}

module.exports = CommandHandler;
