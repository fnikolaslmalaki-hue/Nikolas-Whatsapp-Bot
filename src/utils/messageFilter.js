const Logger = require('./logger');

class MessageFilter {
  constructor(database) {
    this.database = database;
    // كلمات محظورة
    this.bannedWords = [
      'spam',
      'hack',
      'porn',
      'xxx'
    ];
    
    // أنماط غير مرغوبة
    this.spamPatterns = [
      /https?:\/\/.*bit\.ly/gi, // روابط مختصرة مريبة
      /\$\$\$/g, // رموز مريبة
      /.{100,}/g // رسائل طويلة جداً
    ];
  }

  async checkSpam(text) {
    try {
      // التحقق من الكلمات المحظورة
      const textLower = text.toLowerCase();
      for (let word of this.bannedWords) {
        if (textLower.includes(word)) {
          Logger.warn(`⚠️ رسالة تحتوي على كلمة محظورة: ${word}`);
          return true;
        }
      }

      // التحقق من الأنماط المريبة
      for (let pattern of this.spamPatterns) {
        if (pattern.test(text)) {
          Logger.warn(`⚠️ رسالة تحتوي على نمط مريب`);
          return true;
        }
      }

      // التحقق من الرسائل المتكررة
      if (this.isRepeatingMessage(text)) {
        Logger.warn(`⚠️ رسالة متكررة`);
        return true;
      }

      return false;
    } catch (error) {
      Logger.error(`❌ خطأ في فحص الرسالة: ${error.message}`);
      return false;
    }
  }

  isRepeatingMessage(text) {
    // التحقق من الأحرف المتكررة بكثرة
    const repeatingPattern = /(.){10,}/;
    return repeatingPattern.test(text);
  }

  addBannedWord(word) {
    if (!this.bannedWords.includes(word.toLowerCase())) {
      this.bannedWords.push(word.toLowerCase());
      Logger.info(`➕ تم إضافة كلمة محظورة جديدة: ${word}`);
    }
  }

  removeBannedWord(word) {
    const index = this.bannedWords.indexOf(word.toLowerCase());
    if (index > -1) {
      this.bannedWords.splice(index, 1);
      Logger.info(`➖ تم حذف كلمة محظورة: ${word}`);
    }
  }
}

module.exports = MessageFilter;
