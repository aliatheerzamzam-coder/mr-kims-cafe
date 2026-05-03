'use strict';

require('dotenv').config();

function getClient() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) {
    throw new Error('TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN not configured. See .env.example');
  }
  const twilio = require('twilio');
  return twilio(sid, token);
}

/**
 * Send a WhatsApp message via Twilio.
 * @param {string} body - Plain text message
 * @returns {Promise<{sid:string, status:string}>}
 */
async function sendWhatsAppPush(body) {
  if (!body || typeof body !== 'string') {
    throw new Error('body is required');
  }
  const from = process.env.TWILIO_WHATSAPP_FROM;
  const to = process.env.WHATSAPP_TO;
  if (!from || !to) {
    throw new Error('TWILIO_WHATSAPP_FROM / WHATSAPP_TO not configured');
  }

  const truncated = body.length > 1500 ? body.slice(0, 1490) + '\n…(truncated)' : body;
  const client = getClient();
  const msg = await client.messages.create({
    from: from.startsWith('whatsapp:') ? from : `whatsapp:${from}`,
    to: to.startsWith('whatsapp:') ? to : `whatsapp:${to}`,
    body: truncated,
  });
  return { sid: msg.sid, status: msg.status };
}

if (require.main === module) {
  (async () => {
    const body = process.argv.slice(2).join(' ') ||
      `[Mr. Kims Cafe] WhatsApp self-test ${new Date().toISOString()}`;
    try {
      const result = await sendWhatsAppPush(body);
      // eslint-disable-next-line no-console
      console.log('OK', result);
      process.exit(0);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('FAIL', err.message);
      process.exit(1);
    }
  })();
}

module.exports = { sendWhatsAppPush };
