import { writeFileSync } from 'node:fs';

const states = [
  {
    slug: 'california', name: 'California', fee: '$30', filing: 'Articles of Incorporation — Nonprofit Public Benefit Corporation', agency: 'California Secretary of State',
    source: 'https://bizfileonline.sos.ca.gov/forms',
    overview: 'California founders must choose the correct nonprofit corporation type. A public charity commonly begins as a nonprofit public benefit corporation, then addresses a Statement of Information, Attorney General registration, federal exemption, and California tax matters.',
    special: 'Choose among public benefit, mutual benefit, and religious forms based on the organization’s actual purpose. A public-benefit charity generally also has California Attorney General and Franchise Tax Board steps after incorporation.',
    mistakes: ['Choosing a mutual-benefit form for an organization intended to serve the public','Treating Secretary of State incorporation as automatic federal or California tax exemption','Missing the initial Statement of Information or charity-registration steps'],
    extraSources: [['California business forms and filing portal','https://www.sos.ca.gov/business-programs/business-entities/forms'],['California Attorney General charities resources','https://oag.ca.gov/charities'],['California Franchise Tax Board charities and nonprofits','https://www.ftb.ca.gov/file/business/types/charities-nonprofits/index.html']]
  },
  {
    slug: 'texas', name: 'Texas', fee: '$25', filing: 'Form 202, Certificate of Formation — Nonprofit Corporation', agency: 'Texas Secretary of State',
    source: 'https://www.sos.state.tx.us/corp/instructions/202.shtml',
    overview: 'A Texas nonprofit corporation is created by filing a certificate of formation with the Secretary of State. Form 202 must be completed carefully because nonprofit status under Texas law is separate from federal tax-exempt recognition.',
    special: 'The Secretary of State identifies Form 202 as the nonprofit-corporation formation document and currently lists a $25 filing fee. Credit-card convenience fees may apply.',
    mistakes: ['Assuming a Texas nonprofit corporation is automatically exempt from federal or state taxes','Using an LLC filing merely because it states a nonprofit purpose','Failing to preserve the filed certificate, bylaws, resolutions, and organizational minutes'],
    extraSources: [['Texas nonprofit organizations overview','https://www.sos.state.tx.us/corp/nonprofit_org.shtml'],['Texas business and nonprofit forms','https://www.sos.state.tx.us/corp/forms_boc.shtml'],['Texas Comptroller exempt organizations','https://comptroller.texas.gov/taxes/exempt/nonprofit.php']]
  },
  {
    slug: 'florida', name: 'Florida', fee: '$70 required state charges', filing: 'Articles of Incorporation — Florida Non-Profit Corporation', agency: 'Florida Division of Corporations (Sunbiz)',
    source: 'https://dos.fl.gov/sunbiz/start-business/efile/fl-nonprofit-corporation/instructions/',
    overview: 'Florida’s online instructions separate the nonprofit filing fee from the required registered-agent designation charge. Optional certified copies and certificates of status can increase the checkout total.',
    special: 'Florida currently lists a $35 filing fee plus a $35 registered-agent designation charge. Optional certified copies and certificates of status are additional. Confirm the live total immediately before submitting.',
    mistakes: ['Budgeting only for the $35 filing line and overlooking the required registered-agent designation charge','Buying optional copies without deciding whether they are actually needed','Missing Florida annual-report obligations after formation'],
    extraSources: [['Florida nonprofit filing page','https://dos.fl.gov/sunbiz/start-business/efile/fl-nonprofit-corporation/'],['Florida corporate fee schedule','https://dos.fl.gov/sunbiz/forms/fees/'],['Florida charitable solicitation registration','https://www.fdacs.gov/Business-Services/Solicitation-of-Contributions']]
  },
  {
    slug: 'new-york', name: 'New York', fee: '$75', filing: 'Certificate of Incorporation — Domestic Not-for-Profit Corporation', agency: 'New York Department of State',
    source: 'https://dos.ny.gov/certificate-incorporation-domestic-not-profit-corporations-0',
    overview: 'New York formation can involve more than the Department of State. Depending on purpose and activities, founders may need agency consent or approval, Charities Bureau registration, and separate federal and state tax-exemption steps.',
    special: 'The Department of State currently lists a $75 filing fee. Purpose-specific consent or approval requirements can affect some organizations, so review the current incorporation instructions before submitting.',
    mistakes: ['Using a broad purpose clause without checking whether agency consent or approval is required','Assuming Department of State filing completes Charities Bureau registration','Treating not-for-profit incorporation as automatic tax exemption'],
    extraSources: [['New York not-for-profit incorporation instructions','https://dos.ny.gov/not-profit-incorporation-instructions'],['New York Attorney General charities registration','https://ag.ny.gov/resources/organizations/charities-nonprofits-fundraisers/charities-registration'],['New York sales-tax exemption information','https://www.tax.ny.gov/bus/st/exempt.htm']]
  },
  {
    slug: 'pennsylvania', name: 'Pennsylvania', fee: '$125', filing: 'Articles of Incorporation — Nonprofit', agency: 'Pennsylvania Department of State',
    source: 'https://www.pa.gov/agencies/dos/programs/business/types-of-filings-and-registrations/pennsylvania-nonprofit-corporations',
    overview: 'Pennsylvania nonprofit formation begins with Articles of Incorporation, but founders must also address public-notice, charitable-registration, tax, and annual-report requirements that may apply to the organization.',
    special: 'Pennsylvania currently lists a $125 incorporation fee. The state also requires most domestic nonprofit corporations to publish either the Articles or a notice of incorporation in two newspapers, including a legal journal when possible.',
    mistakes: ['Budgeting for the state filing but overlooking the publication step','Assuming incorporation completes charitable-organization registration','Missing Pennsylvania’s annual-report requirement for nonprofit corporations'],
    extraSources: [['Pennsylvania business filing fees','https://www.pa.gov/agencies/dos/programs/business/fees-and-payments'],['Pennsylvania charitable organizations','https://www.pa.gov/agencies/dos/programs/charities/information-for-charities/-charitable-organizations'],['Pennsylvania annual reports','https://www.pa.gov/agencies/dos/programs/business/types-of-filings-and-registrations/annual-reports']]
  },
  {
    slug: 'georgia', name: 'Georgia', fee: '$110 including service charge', filing: 'Articles of Incorporation — Nonprofit Corporation', agency: 'Georgia Secretary of State',
    source: 'https://sos.ga.gov/how-to-guide/how-guide-register-domestic-entity',
    overview: 'Georgia nonprofit founders file Articles of Incorporation and then complete initial and recurring registrations. The Articles must address whether the corporation will have members and should be coordinated with intended federal tax-exempt status.',
    special: 'Georgia’s current fee schedule lists a $100 Articles fee plus a $10 service charge. Nonprofit corporations also have an annual registration requirement and fee.',
    mistakes: ['Leaving out whether the corporation will have members','Using purpose language without considering the intended federal exemption','Missing the nonprofit annual registration after incorporation'],
    extraSources: [['Georgia corporation filing fees','https://sos.ga.gov/sites/default/files/forms/Reference%20-%20Filing%20Fees_0.pdf'],['Georgia business forms','https://sos.ga.gov/page/georgia-business-forms'],['Georgia charitable organizations','https://sos.ga.gov/how-to-guide/how-guide-charities']]
  },
  {
    slug: 'north-carolina', name: 'North Carolina', fee: '$60', filing: 'Form N-01, Articles of Incorporation — Nonprofit Corporation', agency: 'North Carolina Secretary of State',
    source: 'https://www.sosnc.gov/forms/by_title/_Business_Registration_Nonprofit_Corporations',
    overview: 'North Carolina founders form a nonprofit corporation through the Secretary of State and may separately need charitable-solicitation licensing, tax treatment, and activity-specific permits.',
    special: 'North Carolina currently lists a $60 filing fee for nonprofit Articles of Incorporation. Organizations that solicit contributions may need a charitable-solicitation license unless an exemption applies.',
    mistakes: ['Assuming the state’s basic form automatically includes every clause needed for the intended federal exemption','Soliciting donations without checking charitable-licensing rules','Using a registered-agent address without confirming the agent’s consent and eligibility'],
    extraSources: [['North Carolina business registration','https://www.sosnc.gov/divisions/business_registration'],['North Carolina charitable solicitation licensing','https://www.sosnc.gov/divisions/charities'],['North Carolina Department of Revenue nonprofit information','https://www.ncdor.gov/taxes-forms/business-registration/nonprofit-organizations']]
  },
  {
    slug: 'michigan', name: 'Michigan', fee: '$20 total formation fees', filing: 'Form 502, Articles of Incorporation — Nonprofit', agency: 'Michigan Department of Licensing and Regulatory Affairs',
    source: 'https://www.michigan.gov/lara/bureau-list/cscl/corps/filing-fees/domestic-nonprofit',
    overview: 'Michigan nonprofit formation begins with Form 502 through LARA. Charitable organizations may also need Attorney General registration, and nonprofit corporations must maintain recurring state and federal filings.',
    special: 'Michigan currently lists a $10 filing fee and $10 franchise fee for Form 502, for a $20 total. Michigan’s MiBusiness Registry is the current online filing portal.',
    mistakes: ['Budgeting only for formation while overlooking recurring reports','Assuming LARA formation completes Attorney General charity requirements','Failing to preserve the filed Articles and organizational approvals'],
    extraSources: [['Michigan domestic nonprofit overview','https://www.michigan.gov/lara/bureau-list/cscl/corps/corporations/types/domestic-nonprofit-corporation'],['Michigan charitable organizations','https://www.michigan.gov/consumerprotection/charities/charitable-organizations'],['Michigan annual reports and statements','https://www.michigan.gov/lara/bureau-list/cscl/corps/michigan-business-roadmap/annual-reports-and-annual-statements']]
  },
  {
    slug: 'ohio', name: 'Ohio', fee: '$99', filing: 'Form 532B, Initial Articles of Incorporation — Nonprofit Corporation', agency: 'Ohio Secretary of State',
    source: 'https://www.ohiosos.gov/business/business-filing-forms',
    overview: 'Ohio nonprofit founders file Form 532B or use Ohio Business Central, appoint a statutory agent, organize the board, and separately address federal tax exemption and Ohio charitable requirements.',
    special: 'Ohio currently lists a $99 filing fee for nonprofit Articles and the original statutory-agent appointment. Nonprofit corporations must also file a statement of continued existence on the state’s five-year cycle.',
    mistakes: ['Submitting the Articles without a properly accepted statutory-agent appointment','Assuming incorporation creates federal tax exemption','Missing Ohio’s statement-of-continued-existence cycle'],
    extraSources: [['Ohio nonprofit startup guide','https://www.ohiosos.gov/assets/business-start-a-nonprofit.pdf'],['Ohio business roadmap','https://www.ohiosos.gov/business/ohio-business-roadmap'],['Ohio continued-existence guidance','https://www.ohiosos.gov/business/ohio-business-roadmap/keeping-your-business-up-to-date']]
  },
  {
    slug: 'new-jersey', name: 'New Jersey', fee: '$50', filing: 'Certificate of Incorporation — Domestic Non-Profit Corporation', agency: 'New Jersey Division of Revenue and Enterprise Services',
    source: 'https://www.nj.gov/treasury/revenue/gettingregistered.shtml',
    overview: 'New Jersey nonprofit founders file a formation certificate, complete NJ-REG for tax and employer registration, organize the corporation, and separately pursue federal and any applicable state tax exemptions.',
    special: 'New Jersey’s current Division of Revenue fee schedule lists $50 for a domestic nonprofit Certificate of Incorporation. NJ-REG follows formation, and annual reports carry a separate fee.',
    mistakes: ['Failing to complete NJ-REG after the formation filing','Confusing nonprofit incorporation with federal tax-exempt recognition','Assuming every New Jersey tax exemption is automatic'],
    extraSources: [['New Jersey nonprofit filing fees','https://www.nj.gov/treasury/revenue/fees.shtml'],['New Jersey nonprofit tax FAQs','https://www.nj.gov/treasury/taxation/rsb100.shtml'],['New Jersey sales-tax exemption','https://www.nj.gov/treasury/taxation/exemptintro.shtml']]
  }
];

const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

for (const state of states) {
  const title = `How to Start a Nonprofit in ${state.name} | Start Your Cause`;
  const description = `Follow the steps to start a nonprofit in ${state.name}, including the formation filing, government fee, EIN, 501(c)(3) application, governance, and ongoing compliance.`;
  const steps = [
    ['Define the charitable purpose','Write what the organization will do, whom it will serve, and where it will operate.'],
    ['Build the initial board','Choose directors who can govern independently, approve finances, document decisions, and manage conflicts.'],
    ['Check the proposed name',`Search the ${state.agency} records before paying for branding or printing.`],
    ['Choose a registered agent','Confirm the agent meets current state requirements and has agreed to receive official notices.'],
    [`Prepare the ${state.filing}`,`Follow the current ${state.agency} instructions. The listed starting charge is ${state.fee}.`],
    ['Adopt governance documents','Approve bylaws, conflict procedures, officers, banking authority, and organizational minutes.'],
    ['Obtain an EIN','Apply directly with the IRS after the entity is formed and preserve the confirmation notice.'],
    ['Choose the correct IRS application','Complete the official eligibility worksheet before deciding between Form 1023 and Form 1023-EZ.'],
    ['Complete additional state registrations','Address state tax exemption, fundraising registration, and any purpose-specific approvals that apply.'],
    ['Calendar recurring filings','Track the IRS Form 990 series, state reports, charity renewals, board meetings, and conflict disclosures.']
  ];
  const faq = [
    [`How much does it cost to incorporate a nonprofit in ${state.name}?`,`${state.agency} currently lists ${state.fee} for the primary formation filing or required state charges described above. Optional services, payment charges, and other registrations may add cost.`],
    [`Does ${state.name} incorporation create 501(c)(3) status?`,'No. State incorporation creates the state-law entity. Federal 501(c)(3) recognition generally requires a separate IRS application.'],
    ['Which IRS form should a new organization use?','Organizations must complete the current IRS Form 1023-EZ Eligibility Worksheet. Those that are not eligible for Form 1023-EZ generally use the full Form 1023.'],
    ['Does Start Your Cause file these documents?','No. Start Your Cause provides customizable document templates and educational guidance. Customers review, sign, and submit required filings themselves.']
  ];
  const faqSchema = faq.map(([q,a])=>({ '@type':'Question', name:q, acceptedAnswer:{'@type':'Answer',text:a} }));
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><meta name="description" content="${esc(description)}"><link rel="canonical" href="https://startyourcause.org/start-a-nonprofit-${state.slug}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:type" content="article"><meta property="og:url" content="https://startyourcause.org/start-a-nonprofit-${state.slug}"><link rel="stylesheet" href="/resources.css"><script async src="https://www.googletagmanager.com/gtag/js?id=G-BE983T68NN"></script><script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org','@type':'Article',headline:`How to start a nonprofit in ${state.name}`,description,dateModified:'2026-09-04',author:{'@type':'Organization',name:'Start Your Cause'},publisher:{'@type':'Organization',name:'Start Your Cause',url:'https://startyourcause.org'}})}</script><script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org','@type':'FAQPage',mainEntity:faqSchema})}</script></head><body data-slug="start-a-nonprofit-${state.slug}"><header><div class="nav"><a class="logo" href="/">🌱 Start Your Cause</a><nav><a href="/resources">Resources</a><a href="/nonprofit-startup-cost-calculator">Cost Calculator</a><a href="/1023-ez-eligibility-quiz">Free Screener</a><a href="/?view=pricing">Pricing</a></nav></div></header><main><section class="hero"><div class="hero-inner"><div class="crumbs"><a href="/">Home</a> / Resources / Start a ${state.name} nonprofit</div><span class="tag">${state.name} nonprofit guide</span><h1>How to start a nonprofit in ${state.name}</h1><p>${esc(state.overview)}</p><a class="btn" href="/?view=form" data-track="state_primary_cta">Start the questionnaire without an account →</a></div></section><div class="wrap"><div class="layout"><article><div class="notice good"><strong>${state.name} snapshot:</strong> ${esc(state.special)}</div><h2>The ${state.name} nonprofit formation sequence</h2><ol class="steps">${steps.map(([h,p])=>`<li><strong>${esc(h)}.</strong> ${esc(p)}</li>`).join('')}</ol><h2>Common ${state.name} formation mistakes</h2><ul>${state.mistakes.map(x=>`<li>${esc(x)}.</li>`).join('')}<li>Failing to distinguish documents filed with agencies from bylaws, policies, and minutes kept in the corporate record book.</li></ul><h2>What Start Your Cause prepares</h2><p>The guided questionnaire organizes the facts used in customizable formation and governance templates, including Articles language, bylaws, a conflict-of-interest policy, organizational minutes, an EIN guide, a Form 1023 preparation guide, and a state-specific next-step checklist.</p><div class="notice"><strong>Service boundary:</strong> Start Your Cause does not submit filings, pay government fees, or replace legal or tax advice. Review generated documents and current agency instructions before filing.</div><section class="faq"><h2>Frequently asked questions</h2>${faq.map(([q,a])=>`<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</section><h2>Related tools</h2><div class="related"><a href="/nonprofit-startup-cost-calculator" data-track="state_to_calculator">Estimate startup costs →</a><a href="/1023-ez-eligibility-quiz" data-track="state_to_quiz">Check 1023-EZ indicators →</a><a href="/nonprofit-startup-checklist" data-track="state_to_checklist">Use the startup checklist →</a><a href="/document-previews" data-track="state_to_previews">Preview generated documents →</a></div><div class="cta"><h2>Turn the plan into organized documents</h2><p>Begin the questionnaire without registering. Your answers stay on this device until you choose to create an account.</p><a class="btn" href="/?view=form" data-track="state_bottom_cta">Begin the questionnaire →</a></div></article><aside class="side"><div class="card"><strong>Formation filing</strong><p>${esc(state.filing)}</p><p><strong>Listed charge:</strong> ${esc(state.fee)}</p><a href="${state.source}" target="_blank" rel="noopener">Verify with ${esc(state.agency)} →</a></div><div class="card source-list"><strong>Official sources</strong><ul><li><a href="${state.source}" target="_blank" rel="noopener">${esc(state.agency)} filing instructions</a></li>${state.extraSources.map(([label,url])=>`<li><a href="${url}" target="_blank" rel="noopener">${esc(label)}</a></li>`).join('')}<li><a href="https://www.irs.gov/pub/irs-pdf/i1023ez.pdf" target="_blank" rel="noopener">IRS Form 1023-EZ instructions</a></li></ul><p class="small">Reviewed September 4, 2026. Requirements can change.</p></div></aside></div></div></main><footer><div class="inner"><strong>Start Your Cause</strong><p>Plain-language nonprofit formation tools for everyday founders.</p><p><a href="/privacy.html">Privacy</a> · <a href="/terms.html">Terms</a> · <a href="mailto:hello@startyourcause.org">hello@startyourcause.org</a></p></div></footer><script src="/resources.js"></script></body></html>`;
  writeFileSync(new URL(`../start-a-nonprofit-${state.slug}.html`, import.meta.url), html);
}

console.log(`Generated ${states.length} state guides.`);
