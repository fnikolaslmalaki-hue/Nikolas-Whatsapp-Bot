const fs = require('fs');
const path = require('path');
const Logger = require('./logger');

class Database {
  constructor() {
    this.dbPath = process.env.DB_PATH || './database';
    this.messagesFile = path.join(this.dbPath, 'messages.json');
    this.commandsFile = path.join(this.dbPath, 'commands.json');
    this.usersFile = path.join(this.dbPath, 'users.json');
    this.warnsFile = path.join(this.dbPath, 'warns.json');
  }

  async init() {
    try {
      if (!fs.existsSync(this.dbPath)) {
        fs.mkdirSync(this.dbPath, { recursive: true });
      }

      // إنشاء الملفات إذا لم تكن موجودة
      [this.messagesFile, this.commandsFile, this.usersFile, this.warnsFile].forEach(file => {
        if (!fs.existsSync(file)) {
          fs.writeFileSync(file, JSON.stringify([], null, 2));
        }
      });

      Logger.info('✅ تم تهيئة قاعدة البيانات');
    } catch (error) {
      Logger.error(`❌ خطأ في تهيئة قاعدة البيانات: ${error.message}`);
    }
  }

  async logMessage(messageText, from) {
    try {
      const data = JSON.parse(fs.readFileSync(this.messagesFile, 'utf-8'));
      data.push({
        from,
        body: messageText,
        timestamp: new Date().toISOString()
      });
      fs.writeFileSync(this.messagesFile, JSON.stringify(data, null, 2));
    } catch (error) {
      Logger.error(`❌ خطأ في تسجيل الرسالة: ${error.message}`);
    }
  }

  async logCommand(commandName, userId, commandText) {
    try {
      const data = JSON.parse(fs.readFileSync(this.commandsFile, 'utf-8'));
      data.push({
        command: commandName,
        user: userId,
        text: commandText,
        timestamp: new Date().toISOString()
      });
      fs.writeFileSync(this.commandsFile, JSON.stringify(data, null, 2));
    } catch (error) {
      Logger.error(`❌ خطأ في تسجيل الأمر: ${error.message}`);
    }
  }

  async muteUser(userId, groupId) {
    try {
      const data = JSON.parse(fs.readFileSync(this.usersFile, 'utf-8'));
      const userIndex = data.findIndex(u => u.userId === userId && u.groupId === groupId);
      
      if (userIndex !== -1) {
        data[userIndex].muted = true;
      } else {
        data.push({
          userId,
          groupId,
          muted: true,
          warns: 0,
          mutedAt: new Date().toISOString()
        });
      }
      
      fs.writeFileSync(this.usersFile, JSON.stringify(data, null, 2));
    } catch (error) {
      Logger.error(`❌ خطأ في كتم العضو: ${error.message}`);
    }
  }

  async unmuteUser(userId, groupId) {
    try {
      const data = JSON.parse(fs.readFileSync(this.usersFile, 'utf-8'));
      const userIndex = data.findIndex(u => u.userId === userId && u.groupId === groupId);
      
      if (userIndex !== -1) {
        data[userIndex].muted = false;
      }
      
      fs.writeFileSync(this.usersFile, JSON.stringify(data, null, 2));
    } catch (error) {
      Logger.error(`❌ خطأ في إلغاء كتم العضو: ${error.message}`);
    }
  }

  async addWarn(userId, groupId, reason) {
    try {
      const data = JSON.parse(fs.readFileSync(this.warnsFile, 'utf-8'));
      const userWarns = data.filter(w => w.userId === userId && w.groupId === groupId);
      const newWarnCount = userWarns.length + 1;
      
      data.push({
        userId,
        groupId,
        reason,
        timestamp: new Date().toISOString(),
        count: newWarnCount
      });
      
      fs.writeFileSync(this.warnsFile, JSON.stringify(data, null, 2));
      return newWarnCount;
    } catch (error) {
      Logger.error(`❌ خطأ في إضافة تحذير: ${error.message}`);
      return 0;
    }
  }

  async getGroupMessagesCount(groupId) {
    try {
      const data = JSON.parse(fs.readFileSync(this.messagesFile, 'utf-8'));
      return data.filter(m => m.from === groupId).length;
    } catch (error) {
      return 0;
    }
  }

  async getGroupCommandsCount(groupId) {
    try {
      const data = JSON.parse(fs.readFileSync(this.commandsFile, 'utf-8'));
      return data.length;
    } catch (error) {
      return 0;
    }
  }
}

module.exports = Database;
