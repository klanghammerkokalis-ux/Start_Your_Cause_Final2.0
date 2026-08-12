function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
    body: JSON.stringify(body),
  };
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') return json(405, { error: 'Method not allowed' });

  const supabaseUrl = process.env.SUPABASE_URL || 'https://lehgxworaefgsvkigjza.supabase.co';
  const supabasePublishableKey = process.env.SUPABASE_PUBLISHABLE_KEY
    || process.env.SUPABASE_ANON_KEY
    || 'sb_publishable_jm2MRb0rbT2pJ72EMflT1Q_pEeZJBiG';
  if (!supabaseUrl || !supabasePublishableKey) {
    return json(503, { error: 'Account recovery is not configured' });
  }

  return json(200, { supabaseUrl, supabasePublishableKey });
};
