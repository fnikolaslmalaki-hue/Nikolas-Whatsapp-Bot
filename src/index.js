const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, isJidGroup } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
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

// إنشاء readline للإدخال من المستخدم
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

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

    // حفظ بيانات المصادقة
    sock.ev.on('creds.update', saveCreds);

    // معالجة تحديثات الاتصال
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        Logger.info('📱 جاري انتظار مسح رمز QR...\n');
      }

      if (connection === 'close') {
        let reason = new Error('WhatsApp Web closed the connection').toString();
        if (lastDisconnect?.error) {
          reason = lastDisconnect.error;
        }

        if (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
          Logger.warn(`⚠️ إعادة الاتصال...`);
          setTimeout(() => connectToWhatsApp(), 5000);
        } else {
          Logger.error('❌ تم تسجيل الخروج. احذف مجلد credentials وأعد المحاولة.');
        }
      } else if (connection === 'open') {
        Logger.success('✅ البوت جاهز وعاملة!');
        Logger.info(`📱 اسم البوت: ${process.env.BOT_NAME}`);
        Logger.info(`👤 مالك البوت: ${process.env.BOT_OWNER}`);
        rl.close();
      }
    });

    // استقبال الرسائل
    sock.ev.on('messages.upsert', async (m) => {
      try {
        const message = m.messages[0];
        
        if (!message.message) return;
        if (message.key.fromMe) return;

        const from = message.key.remoteJid;
        const isGroup = isJidGroup(from);

        if (!isGroup) return;

        const messageText = message.message?.conversation || 
                          message.message?.extendedTextMessage?.text || 
                          '';

        if (!messageText) return;

        // معالجة الرسائل غير المرغوبة
        const isSpam = await messageFilter.checkSpam(messageText);
        if (isSpam) {
          try {
            await sock.sendMessage(from, { 
              delete: message.key 
            });
            Logger.warn(`⚠️ تم حذف رسالة غير مرغوبة من ${from}`);
          } catch (e) {
            // تجاهل الأخطاء
          }
          return;
        }

        // معالجة الأوامر
        if (messageText.startsWith('!')) {
          await commandHandler.handle(message, sock, messageText);
        }

        // تسجيل الرسائل
        await database.logMessage(messageText, from);
      } catch (error) {
        Logger.error(`❌ خطأ في معالجة الرسالة: ${error.message}`);
      }
    });

    // معالجة أحداث المجموعة
    sock.ev.on('group-participants.update', async (update) => {
      try {
        const { id, participants, action } = update;

        if (action === 'add') {
          for (let participant of participants) {
            const welcomeMsg = `👋 أهلا وسهلا بك في المجموعة! \n\n🤖 اسم البوت: ${process.env.BOT_NAME}\n📖 اكتب: !help للحصول على قائمة الأوامر`;
            
            await sock.sendMessage(id, { text: welcomeMsg });
            Logger.info(`✅ تم الترحيب بعضو جديد: ${participant}`);
          }
        } else if (action === 'remove') {
          Logger.info(`👤 مغادرة عضو: ${participants[0]}`);
        }
      } catch (error) {
        Logger.error(`❌ خطأ في حدث المجموعة: ${error.message}`);
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
    
    Logger.info('📱 اكتب رقم هاتفك بصيغة: +966xxxxxxxxx أو +212xxxxxxxxx');
    
    await connectToWhatsApp();
  } catch (error) {
    Logger.error(`❌ خطأ في التهيئة: ${error.message}`);
    process.exit(1);
  }
}

initialize();

// معالجة الإيقاف الآمن
process.on('SIGINT', async () => {
  Logger.info('🛑 إيقاف البوت بشكل آمن...');
  rl.close();
  process.exit(0);
});
