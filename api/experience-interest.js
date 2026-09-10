const { baseLead, clean, emailLayout, escapeHtml, json, protect, readBody, saveLead, sendEmail, validateEmail } = require('./_lib');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return json(res, 405, { success: false, message: 'Método no permitido.' });
  let body;
  try { body = readBody(req); } catch { return json(res, 400, { success: false, message: 'Solicitud inválida.' }); }
  const blocked = protect(req, res, body);
  if (blocked) return blocked;
  const name = clean(body.name, 120);
  const email = clean(body.email, 180).toLowerCase();
  const experience = clean(body.experience, 120);
  const experienceId = clean(body.experienceId, 80);
  if (!name || !validateEmail(email) || !experience || !experienceId) return json(res, 422, { success: false, message: 'Completá tus datos y elegí una experiencia.' });
  const lead = baseLead({ ...body, name, email }, { experience_id: experienceId, experience_name: experience, interest_type: clean(body.type, 80) });
  try {
    await saveLead(lead);
    await sendEmail({
      to: process.env.CONTACT_EMAIL,
      replyTo: email,
      subject: `Nueva consulta — ${experience}`,
      html: emailLayout(`Interés en ${escapeHtml(experience)}`, `<p><strong>Nombre:</strong> ${escapeHtml(name)}</p><p><strong>Email:</strong> ${escapeHtml(email)}</p><p><strong>WhatsApp:</strong> ${escapeHtml(body.whatsapp)}</p><p><strong>Experiencia:</strong> ${escapeHtml(experience)} (${escapeHtml(experienceId)})</p><p><strong>Tipo:</strong> ${escapeHtml(body.type)}</p><p><strong>Origen:</strong> ${escapeHtml(lead.source)}<br>${escapeHtml(lead.page)}</p>`)
    });
    await sendEmail({
      to: email,
      subject: `Recibimos tu consulta — ${experience}`,
      html: emailLayout('Recibimos tu consulta', `<p>Hola ${escapeHtml(name)},</p><p>Recibimos tu consulta sobre <strong>${escapeHtml(experience)}</strong>.</p><p>Nos pondremos en contacto con vos para brindarte toda la información del viaje.</p>`)
    });
    return json(res, 200, { success: true });
  } catch (error) {
    console.error('experience_interest_error', error);
    return json(res, 500, { success: false, message: 'No pudimos procesar la solicitud.' });
  }
};
