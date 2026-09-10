const { baseLead, clean, emailLayout, escapeHtml, json, protect, readBody, saveLead, sendEmail, validateEmail } = require('./_lib');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return json(res, 405, { success: false, message: 'Método no permitido.' });
  let body;
  try { body = readBody(req); } catch { return json(res, 400, { success: false, message: 'Solicitud inválida.' }); }
  const blocked = protect(req, res, body);
  if (blocked) return blocked;
  const name = clean(body.name, 120);
  const email = clean(body.email, 180).toLowerCase();
  const message = clean(body.message, 4000);
  if (!name || !validateEmail(email) || !message) return json(res, 422, { success: false, message: 'Completá nombre, email y mensaje.' });
  const lead = baseLead({ ...body, name, email }, { interest_type: clean(body.interest, 100), experience_name: clean(body.experience, 120), message });
  try {
    await saveLead(lead);
    await sendEmail({
      to: process.env.CONTACT_EMAIL,
      replyTo: email,
      subject: 'Nueva consulta — Manchas Plein Air',
      html: emailLayout('Nueva consulta', `<p><strong>Nombre:</strong> ${escapeHtml(name)}</p><p><strong>Email:</strong> ${escapeHtml(email)}</p><p><strong>WhatsApp:</strong> ${escapeHtml(body.whatsapp)}</p><p><strong>Interés:</strong> ${escapeHtml(body.interest)}</p><p><strong>Experiencia:</strong> ${escapeHtml(body.experience)}</p><p><strong>Mensaje:</strong><br>${escapeHtml(message)}</p><p><strong>Fecha:</strong> ${escapeHtml(lead.created_at)}</p><p><strong>Origen:</strong> ${escapeHtml(lead.source)}<br>${escapeHtml(lead.page)}</p>`)
    });
    return json(res, 200, { success: true });
  } catch (error) {
    console.error('contact_error', error);
    return json(res, 500, { success: false, message: 'No pudimos procesar la consulta.' });
  }
};
