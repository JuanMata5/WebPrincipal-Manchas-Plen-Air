const buckets = new Map();

const json = (res, status, body) => res.status(status).json(body);

const clean = (value, max = 5000) => String(value || '').trim().slice(0, max);

const escapeHtml = (value) => clean(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));

const readBody = (req) => typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});

const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const protect = (req, res, body) => {
  if (clean(body.website, 120)) return json(res, 200, { success: true });
  const ip = req.headers?.['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
  const now = Date.now();
  const recent = (buckets.get(ip) || []).filter((time) => now - time < 60 * 60 * 1000);
  if (recent.length >= 10) return json(res, 429, { success: false, message: 'Demasiadas solicitudes. Probá nuevamente más tarde.' });
  recent.push(now);
  buckets.set(ip, recent);
  return null;
};

const baseLead = (body, extra = {}) => ({
  name: clean(body.name, 120),
  email: clean(body.email, 180).toLowerCase(),
  whatsapp: clean(body.whatsapp, 40),
  source: clean(body.source, 180) || 'manchas_web',
  page: clean(body.page, 500),
  status: 'Nuevo',
  created_at: body.createdAt || new Date().toISOString(),
  ...extra
});

const saveLead = async (lead) => {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return;
  const response = await fetch(`${process.env.SUPABASE_URL.replace(/\/$/, '')}/rest/v1/leads`, {
    method: 'POST',
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal'
    },
    body: JSON.stringify(lead)
  });
  if (!response.ok) throw new Error('No se pudo guardar el lead');
};

const sendEmail = async ({ to, subject, html, replyTo }) => {
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) throw new Error('Falta configurar el proveedor de email');
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: process.env.EMAIL_FROM, to, subject, html, reply_to: replyTo })
  });
  if (!response.ok) throw new Error('No se pudo enviar el email');
};

const emailLayout = (title, content) => `<!doctype html><html lang="es"><body style="margin:0;background:#f6f1e9;color:#28231f;font-family:Arial,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:40px 20px"><table role="presentation" width="100%" style="max-width:620px;margin:auto;background:#fffaf2"><tr><td style="padding:42px"><p style="font-size:12px;letter-spacing:2px;text-transform:uppercase">MANCHAS PLEIN AIR</p><h1 style="font:normal 38px Georgia,serif;line-height:1.05">${title}</h1>${content}<p style="margin-top:36px;font:italic 20px Georgia,serif">Viajamos para mirar distinto.</p><p style="font-size:12px">Manchas Plein Air</p></td></tr></table></td></tr></table></body></html>`;

module.exports = { baseLead, clean, emailLayout, escapeHtml, json, protect, readBody, saveLead, sendEmail, validateEmail };
