const Logger = require('../utils/logger');

class HelpCommand {
  async execute(message, args, sock, chatId) {
    const helpText = `
╔════════════════════════════════════╗
║   🤖 NIKOLAS BOT - قائمة الأوامر   ║
╚════════════════════════════════════╝

📋 *أوامر الإدارة:*
  !kick @user - طرد عضو من المجموعة
  !mute @user - كتم عضو
  !unmute @user - إلغاء كتم عضو
  !warn @user - إصدار تحذير
  !promote @user - تعيين مسؤول
  !demote @user - إزالة صلاحية مسؤول

📊 *أوامر المعلومات:*
  !stats - عرض إحصائيات المجموعة
  !help - عرض قائمة الأوامر

⚙️ *الميزات التلقائية:*
  ✅ الترحيب بالأعضاء الجدد
  ✅ حذف الرسائل غير المرغوبة
  ✅ تسجيل سجل الأوامر
  ✅ إدارة الأذونات

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 *ملاحظة:* معظم الأوامر متاحة فقط للمسؤولين
🔗 القناة: https://whatsapp.com/channel/0029Vb7xCilBfxo7EKSaOk1J
    `;

    await sock.sendMessage(chatId, { text: helpText });
  }
}

module.exports = HelpCommand;
