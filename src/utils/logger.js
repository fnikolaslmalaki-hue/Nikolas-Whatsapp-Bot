const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logsDir = path.join(__dirname, '../../logs');
    this.ensureLogsDir();
  }

  ensureLogsDir() {
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
  }

  getTimestamp() {
    return new Date().toLocaleString('ar-EG', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  log(level, message) {
    const timestamp = this.getTimestamp();
    const logMessage = `[${timestamp}] [${level}] ${message}`;
    
    console.log(logMessage);

    // حفظ السجل في ملف
    const logFile = path.join(this.logsDir, `bot-${new Date().toISOString().split('T')[0]}.log`);
    fs.appendFileSync(logFile, logMessage + '\n');
  }

  info(message) {
    this.log('INFO', message);
  }

  success(message) {
    this.log('SUCCESS', message);
  }

  warn(message) {
    this.log('WARN', message);
  }

  error(message) {
    this.log('ERROR', message);
  }

  debug(message) {
    if (process.env.DEBUG === 'true') {
      this.log('DEBUG', message);
    }
  }
}

module.exports = new Logger();
