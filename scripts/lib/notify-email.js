'use strict';

require('dotenv').config();
const nodemailer = require('nodemailer');

function getTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT || 465);
  const secure = process.env.SMTP_SECURE !== 'false';
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    throw new Error('SMTP_USER / SMTP_PASS not configured. See .env.example');
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
}

/**
 * @param {Object} opts
 * @param {string} opts.subject
 * @param {string} opts.markdown
 * @param {string} [opts.to]
 */
async function sendReportEmail(opts) {
  const { subject, markdown } = opts;
  if (!subject || !markdown) {
    throw new Error('subject and markdown are required');
  }
  const to = opts.to || process.env.REPORT_EMAIL_TO;
  if (!to) {
    throw new Error('REPORT_EMAIL_TO not configured');
  }
  const from = process.env.REPORT_EMAIL_FROM || process.env.SMTP_USER;
  const transporter = getTransporter();

  const html = `<pre style="font-family: ui-monospace, Menlo, monospace; white-space: pre-wrap; line-height: 1.5;">${escapeHtml(
    markdown
  )}</pre>`;

  const info = await transporter.sendMail({
    from,
    to,
    subject,
    text: markdown,
    html,
  });
  return { messageId: info.messageId, accepted: info.accepted, rejected: info.rejected };
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

if (require.main === module) {
  (async () => {
    const subject = '[Mr. Kims Cafe] notify-email self-test';
    const markdown = `# Self Test\n\nSent at ${new Date().toISOString()}\n`;
    try {
      const result = await sendReportEmail({ subject, markdown });
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

module.exports = { sendReportEmail };
