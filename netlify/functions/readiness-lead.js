exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  let body;
  try { body = JSON.parse(event.body || '{}'); } catch (_) { return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request' }) }; }
  const email = String(body.email || '').trim().toLowerCase();
  const band = ['ready','groundwork','validate'].includes(body.band) ? body.band : '';
  if (!email || !/^\S+@\S+\.\S+$/.test(email) || !band) return { statusCode: 400, body: JSON.stringify({ error: 'Valid email and result are required' }) };
  // Lead persistence intentionally remains disabled until the project's approved email/CRM destination is configured.
  // Never log questionnaire answers or sensitive founder data.
  return { statusCode: 200, body: JSON.stringify({ ok: true, persistence: false }) };
};