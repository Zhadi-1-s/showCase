const nodemailer = require('nodemailer');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, phone, email, message } = req.body || {};

    if (!name?.trim() || !phone?.trim() || !message?.trim()) {
      return res.status(400).json({ error: 'Заполните имя, телефон и сообщение' });
    }

    const text = [
      '🆕 Новая заявка с лендинга Lombard Showcase',
      '',
      `👤 Имя: ${name.trim()}`,
      `📞 Телефон: ${phone.trim()}`,
      email?.trim() ? `📧 Email: ${email.trim()}` : '',
      '',
      `💬 Сообщение:`,
      message.trim(),
    ]
      .filter(Boolean)
      .join('\n');

    const results = { email: false, whatsapp: false };

    // Email via Gmail SMTP
    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_APP_PASSWORD;

    if (gmailUser && gmailPass) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: gmailUser, pass: gmailPass },
      });

      await transporter.sendMail({
        from: gmailUser,
        to: process.env.CONTACT_EMAIL || 'zhadi000s@gmail.com',
        subject: `Заявка с лендинга — ${name.trim()}`,
        text,
        replyTo: email?.trim() || undefined,
      });
      results.email = true;
    }

    // WhatsApp via CallMeBot (free: https://www.callmebot.com/blog/free-api-whatsapp-messages/)
    const callmebotKey = process.env.CALLMEBOT_API_KEY;
    const whatsappPhone = process.env.WHATSAPP_PHONE || '77086757610';

    if (callmebotKey) {
      const waUrl = `https://api.callmebot.com/whatsapp.php?phone=${whatsappPhone}&text=${encodeURIComponent(text)}&apikey=${callmebotKey}`;
      const waRes = await fetch(waUrl);
      results.whatsapp = waRes.ok;
    }

    if (!results.email && !results.whatsapp) {
      return res.status(503).json({
        error: 'Сервер не настроен. Используется резервная отправка.',
        fallback: true,
      });
    }

    return res.status(200).json({ success: true, ...results });
  } catch (err) {
    console.error('Contact API error:', err);
    return res.status(500).json({ error: 'Ошибка отправки', fallback: true });
  }
};
