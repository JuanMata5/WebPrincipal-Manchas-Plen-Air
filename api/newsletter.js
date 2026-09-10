const { baseLead, clean, emailLayout, escapeHtml, json, protect, readBody, saveLead, sendEmail, validateEmail } = require('./_lib');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return json(res, 405, { success: false, message: 'Método no permitido.' });
  let body;
  try { body = readBody(req); } catch { return json(res, 400, { success: false, message: 'Solicitud inválida.' }); }
  const blocked = protect(req, res, body);
  if (blocked) return blocked;
  const email = clean(body.email, 180).toLowerCase();
  if (!validateEmail(email)) return json(res, 422, { success: false, message: 'Ingresá un email válido.' });
  const lead = baseLead({ ...body, email }, { interest_type: 'Newsletter' });
  try {
    await saveLead(lead);
    await sendEmail({
      to: email,
      subject: 'Bienvenido a Manchas Plein Air',
      html: emailLayout('Bienvenido a la comunidad', `<p>Hola ${escapeHtml(body.name) || 'visitante'},</p><p>Gracias por sumarte a Manchas Plein Air.</p><p>Por este medio recibirás información sobre nuevos viajes, jornadas Plein Air, residencias y experiencias.</p>`)
    });
    return json(res, 200, { success: true });
  } catch (error) {
    console.error('newsletter_error', error);
    return json(res, 500, { success: false, message: 'No pudimos completar la suscripción.' });
  }
};
