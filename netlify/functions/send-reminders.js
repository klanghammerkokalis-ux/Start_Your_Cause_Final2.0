// netlify/functions/send-reminders.js
// Run this on a schedule via Netlify scheduled functions
// Checks for upcoming deadlines and sends email reminders

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // service role key for admin access
);

exports.handler = async (event) => {
  try {
    const today = new Date();
    const in30 = new Date(today); in30.setDate(in30.getDate() + 30);
    const in7 = new Date(today); in7.setDate(in7.getDate() + 7);
    const in1 = new Date(today); in1.setDate(in1.getDate() + 1);

    const formatDate = (d) => d.toISOString().split('T')[0];

    // Get reminders due in 30 days (not yet emailed)
    const { data: reminders30 } = await supabase
      .from('reminders')
      .select('*, profiles!inner(email, full_name), nonprofits!inner(org_name)')
      .eq('due_date', formatDate(in30))
      .eq('email_sent_30', false)
      .eq('status', 'upcoming');

    // Get reminders due in 7 days
    const { data: reminders7 } = await supabase
      .from('reminders')
      .select('*, profiles!inner(email, full_name), nonprofits!inner(org_name)')
      .eq('due_date', formatDate(in7))
      .eq('email_sent_7', false)
      .eq('status', 'upcoming');

    // Get reminders due tomorrow
    const { data: reminders1 } = await supabase
      .from('reminders')
      .select('*, profiles!inner(email, full_name), nonprofits!inner(org_name)')
      .eq('due_date', formatDate(in1))
      .eq('email_sent_1', false)
      .eq('status', 'upcoming');

    let emailsSent = 0;

    // Send emails (using fetch to any email service — Resend, SendGrid, etc.)
    const sendEmail = async (reminder, daysUntil) => {
      const profile = reminder.profiles;
      const nonprofit = reminder.nonprofits;
      const emailBody = {
        from: 'noreply@startyourcause.org',
        to: profile.email,
        subject: `⏰ Reminder: ${reminder.title} is due in ${daysUntil} day${daysUntil > 1 ? 's' : ''}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:2rem">
            <h1 style="color:#1d6b52;font-size:20px">🌱 Start Your Cause</h1>
            <p>Hi ${profile.full_name || 'there'},</p>
            <p>This is a reminder that the following deadline is coming up for <strong>${nonprofit.org_name || 'your nonprofit'}</strong>:</p>
            <div style="background:#e8f5ef;border-left:4px solid #2d8f6f;padding:1rem 1.25rem;margin:1.25rem 0;border-radius:0 8px 8px 0">
              <strong style="font-size:16px">${reminder.title}</strong><br>
              <span style="color:#6b5c4c">Due: ${new Date(reminder.due_date).toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</span><br>
              ${reminder.description ? `<span style="color:#6b5c4c">${reminder.description}</span>` : ''}
            </div>
            <p style="color:#6b5c4c">You have <strong>${daysUntil} day${daysUntil > 1 ? 's' : ''}</strong> to complete this.</p>
            <a href="https://startyourcause.org/portal.html" style="display:inline-block;background:#2d8f6f;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:500;margin:1rem 0">View my portal →</a>
            <p style="font-size:12px;color:#9e8e7e;margin-top:2rem">You're receiving this because you have reminders set up in your Start Your Cause portal. <a href="https://startyourcause.org/portal.html" style="color:#2d8f6f">Manage your reminders</a></p>
          </div>
        `
      };

      // Send via Resend (recommended — free tier available)
      // Sign up at resend.com and add RESEND_API_KEY to Netlify env vars
      if (process.env.RESEND_API_KEY) {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(emailBody),
        });
        emailsSent++;
      }
    };

    // Process 30-day reminders
    for (const r of (reminders30 || [])) {
      await sendEmail(r, 30);
      await supabase.from('reminders').update({ email_sent_30: true }).eq('id', r.id);
    }

    // Process 7-day reminders
    for (const r of (reminders7 || [])) {
      await sendEmail(r, 7);
      await supabase.from('reminders').update({ email_sent_7: true }).eq('id', r.id);
    }

    // Process 1-day reminders
    for (const r of (reminders1 || [])) {
      await sendEmail(r, 1);
      await supabase.from('reminders').update({ email_sent_1: true }).eq('id', r.id);
    }

    // Mark overdue reminders
    await supabase
      .from('reminders')
      .update({ status: 'overdue' })
      .lt('due_date', formatDate(today))
      .eq('status', 'upcoming');

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, emailsSent }),
    };
  } catch (error) {
    console.error('Send reminders error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
