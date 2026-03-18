const nodemailer = require("nodemailer");
const path = require("path");

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeText(value) {
  return String(value || '')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .trim();
}

function stripHtml(value) {
  return String(value || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function appendSignatureToText(body, smtpSignature) {
  const normalizedSignature = normalizeText(smtpSignature);
  const normalizedBody = normalizeText(body);

  if (!normalizedSignature) {
    return normalizedBody;
  }

  if (normalizedBody.includes(normalizedSignature)) {
    return normalizedBody;
  }

  return [normalizedBody, '--', normalizedSignature].filter(Boolean).join('\n\n');
}

function appendSignatureToHtml(html, smtpSignature) {
  const normalizedSignature = normalizeText(smtpSignature);
  if (!normalizedSignature) {
    return String(html || '').trim();
  }

  const existingText = normalizeText(stripHtml(html));
  if (existingText.includes(normalizedSignature)) {
    return String(html || '').trim();
  }

  const signatureHtml = escapeHtml(normalizedSignature).replace(/\n/g, '<br>');
  return `${String(html || '').trim()}<div style="margin-top:18px;padding-top:12px;border-top:1px solid #d1d5db;color:#374151;white-space:normal;">${signatureHtml}</div>`;
}

function makeTransporter(smtpUser, smtpPass) {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: String(smtpUser || '').trim(),
      pass: String(smtpPass || '').trim()
    }
  });
}

function sendNewLeadEmail(lead = {}) {
  const name = String(lead.name || "").trim() || "Unknown";
  const email = String(lead.email || "").trim() || "Not provided";
  const phone = String(lead.phone || "").trim() || "Not provided";
  const message = String(lead.message || "").trim() || "No message provided";

  const fromEmail = process.env.SMTP_USER || "yourgmail@gmail.com";
  const toEmail = process.env.LEAD_NOTIFY_EMAIL || "agent@email.com";

  const mailOptions = {
    from: fromEmail,
    to: toEmail,
    subject: "New Lead",
    text: [
      "A new lead came from the website",
      "",
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${phone}`,
      `Message: ${message}`
    ].join("\n")
  };

  return makeTransporter(process.env.SMTP_USER, process.env.SMTP_PASS).sendMail(mailOptions);
}

// smtpUser / smtpPass are optional per-user overrides; falls back to process.env
function sendAgentEmail({ fromName, fromEmail, toName, toEmail, subject, body, htmlBody, ecardAttachmentPath, ecardAttachmentName, attachments, smtpSignature, smtpUser, smtpPass }) {
  const resolvedUser = String(smtpUser || process.env.SMTP_USER || '').trim();
  const resolvedPass = String(smtpPass || process.env.SMTP_PASS || '').trim();
  const replyTo = String(fromEmail || '').trim();
  const to = String(toEmail || '').trim();
  const resolvedSignature = String(smtpSignature || '').trim();

  if (!resolvedUser) return Promise.reject(new Error('No Gmail account configured. Add your Gmail SMTP settings in Settings → Profile.'));
  if (!resolvedPass) return Promise.reject(new Error('No Gmail App Password configured. Add your Gmail SMTP settings in Settings → Profile.'));
  if (!to) return Promise.reject(new Error('Recipient email is required'));

  const mailOptions = {
    from: `"${String(fromName || 'Real Estate Investor').trim()}" <${resolvedUser}>`,
    to: toName ? `"${String(toName).trim()}" <${to}>` : to,
    subject: String(subject || '(No Subject)').trim(),
    text: appendSignatureToText(body, resolvedSignature)
  };

  const html = String(htmlBody || '').trim();
  if (html) {
    mailOptions.html = appendSignatureToHtml(html, resolvedSignature);
  }

  const mailAttachments = [];

  if (ecardAttachmentPath) {
    mailAttachments.push({
      filename: `inline-${path.basename(ecardAttachmentPath)}`,
      path: ecardAttachmentPath,
      cid: 'offer-ecard-inline'
    });

    mailAttachments.push({
      filename: String(ecardAttachmentName || path.basename(ecardAttachmentPath)).trim() || path.basename(ecardAttachmentPath),
      path: ecardAttachmentPath,
      contentDisposition: 'attachment'
    });
  }

  if (Array.isArray(attachments)) {
    attachments.forEach((attachment) => {
      const filename = String(attachment?.filename || '').trim();
      const content = attachment?.content;
      const attachmentPath = String(attachment?.path || '').trim();
      if (!filename || (!content && !attachmentPath)) {
        return;
      }

      if (attachmentPath) {
        mailAttachments.push({
          filename,
          path: attachmentPath,
          contentType: String(attachment?.contentType || 'application/octet-stream').trim() || 'application/octet-stream'
        });
        return;
      }

      mailAttachments.push({
        filename,
        content,
        contentType: String(attachment?.contentType || 'application/octet-stream').trim() || 'application/octet-stream'
      });
    });
  }

  if (mailAttachments.length > 0) {
    mailOptions.attachments = mailAttachments;
  }

  if (replyTo) {
    mailOptions.replyTo = replyTo;
  }

  return makeTransporter(resolvedUser, resolvedPass).sendMail(mailOptions);
}

module.exports = {
  sendNewLeadEmail,
  sendAgentEmail
};
