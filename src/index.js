const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, isJidGroup } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const CommandHandler = require('./handlers/commandHandler');
const MessageFilter = require('./utils/messageFilter');
const Logger = require('./utils/logger');
const Database = require('./utils/database');

let sock;
let commandHandler;
let messageFilter;
let database;

const SESSION_ID = process.env.SESSION_ID || 'bot_session';
const CREDS_DIR = path.join(process.cwd(), 'credentials', SESSION_ID);

async function connectToWhatsApp() {
  try {
    const { state, saveCreds } = await useMultiFileAuthState(CREDS_DIR);
    const { version } = await fetchLatestBaileysVersion();

    Logger.info(`🔄 استخدام إصدار Baileys: ${version.join('.')}`);

    sock = makeWASocket({
      version,
      printQRInTerminal: false,
      auth: state,
      logger: require('pino')({ level: 'silent' })
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        Logger.info('📱 جاري انتظار Pairing Code...');
        const pairingCode = await sock.requestPairingCode(process.env.BOT_OWNER.replace('+', ''));
        Logger.success(`✅ رمز الربط: ${pairingCode}`);
        Logger.info('📲 افتح WhatsApp > الإعدادات > الأجهزة المرتبطة > ربط جهاز جديد');
        Logger.info(`⏱️ ادخل هذا الرمز: ${pairingCode}`);
      }

      if (connection === 'close') {
        if (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
          Logger.warn(`⚠️ إعادة الاتصال...`);
          setTimeout(() => connectToWhatsApp(), 5000);
        } else {
          Logger.error('❌ تم تسجيل الخروج.');
        }
      } else if (connection === 'open') {
        Logger.success('✅ البوت جاهز وعاملة!');
        Logger.info(`📱 اسم البوت: ${process.env.BOT_NAME}`);
      }
    });

    sock.ev.on('messages.upsert', async (m) => {
      try {
        const message = m.messages[0];
        if (!message.message) return;
        if (message.key.fromMe) return;

        const from = message.key.remoteJid;
        if (!isJidGroup(from)) return;

        const messageText = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
        if (!messageText) return;

        const isSpam = await messageFilter.checkSpam(messageText);
        if (isSpam) {
          try {
            await sock.sendMessage(from, { delete: message.key });
          } catch (e) {}
          return;
        }

        if (messageText.startsWith('!')) {
          await commandHandler.handle(message, sock, messageText);
        }

        await database.logMessage(messageText, from);
      } catch (error) {
        Logger.error(`❌ خطأ في معالجة الرسالة: ${error.message}`);
      }
    });

    sock.ev.on('group-participants.update', async (update) => {
      try {
        const { id, participants, action } = update;
        if (action === 'add') {
          for (let participant of participants) {
            const welcomeMsg = `👋 أهلا وسهلا بك في المجموعة!\n\n🤖 اسم البوت: ${process.env.BOT_NAME}\n📖 اكتب: !help`;
            await sock.sendMessage(id, { text: welcomeMsg });
            Logger.info(`✅ ترحيب جديد: ${participant}`);
          }
        }
      } catch (error) {
        Logger.error(`❌ خطأ: ${error.message}`);
      }
    });

  } catch (error) {
    Logger.error(`❌ خطأ في الاتصال: ${error.message}`);
    process.exit(1);
  }
}

async function initialize() {
  try {
    database = new Database();
    await database.init();
    messageFilter = new MessageFilter(database);
    commandHandler = new CommandHandler(database);
    
    Logger.info('🔄 جاري تهيئة البوت...');
    console.log('\n════════════════════════════════════');
    console.log('   🤖 NIKOLAS WHATSAPP BOT');
    console.log('════════════════════════════════════\n');
    
    await connectToWhatsApp();
  } catch (error) {
    Logger.error(`❌ خطأ في التهيئة: ${error.message}`);
    process.exit(1);
  }
}

initialize();

process.on('SIGINT', async () => {
  Logger.info('🛑 إيقاف البوت...');
  process.exit(0);
});
