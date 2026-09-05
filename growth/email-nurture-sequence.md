# Start Your Cause consented-subscriber email sequence

Send only to people whose Netlify submission explicitly records consent: yes for founder-checklist or nonprofit-startup-updates. Never add a personal name, personal email, photograph, biography, or location. Send from and reply to hello@startyourcause.org, sign only as Start Your Cause Support, and suppress a recipient immediately after an unsubscribe request.

Every message must end with:

Start Your Cause Support

You received this because you requested Start Your Cause resources. Reply with unsubscribe to stop future emails.

## Immediately — Your nonprofit startup checklist

Subject: Your nonprofit startup checklist

Hi,

Here is your printable nonprofit startup checklist:
https://startyourcause.org/nonprofit-startup-checklist

The most important distinction is simple: creating or printing a document does not file it. Start Your Cause provides customizable templates and educational guidance. You remain responsible for reviewing, signing, and submitting required filings and government fees.

Start with the checklist and reply if a step is unclear.

Start Your Cause Support

## Day 3 — Estimate the complete startup cost

Subject: What will your nonprofit cost to start?

State incorporation, IRS recognition, charity registration, and optional support can create separate expenses. Use the calculator before committing funds:
https://startyourcause.org/nonprofit-startup-cost-calculator

Government fees are paid separately and Start Your Cause does not submit filings or fees.

## Day 6 — 1023 or 1023-EZ?

Subject: Can you use Form 1023-EZ?

The shorter application is not available to every organization. Use our preliminary screener, then complete the official IRS eligibility worksheet before deciding:
https://startyourcause.org/1023-vs-1023-ez

## Day 10 — Preview the filing packet and decide

Subject: See what your nonprofit filing packet will contain

Before paying, preview the document types and how Start Your Cause labels what gets filed, what goes to the IRS separately, and what stays in your internal records:
https://startyourcause.org/document-previews

See the current options:
https://startyourcause.org/?view=pricing

The Formation Package is a one-time payment for twelve months of access and does not renew automatically. The optional monthly Compliance Membership is for ongoing compliance support. Government fees are separate, and Start Your Cause does not submit filings.

## Automation requirements

- Deduplicate by normalized recipient email plus sequence step.
- Never send if consent is missing or is not exactly yes.
- Stop the entire sequence after any unsubscribe request.
- Do not send the immediate email twice when the existing welcome automation already handled it.
- Record form name, consent timestamp, sequence step, send timestamp, and unsubscribe status.
- Use plain text so the message remains accessible and easy to audit.
