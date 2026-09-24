import { writeFileSync } from 'node:fs';

const states = [
  'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia',
  'Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland',
  'Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey',
  'New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina',
  'South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming'
];

const verified = {
  California: { fee: '$30', agency: 'California Secretary of State', guide: '/start-a-nonprofit-california' },
  Florida: { fee: '$70 required state charges', agency: 'Florida Division of Corporations', guide: '/start-a-nonprofit-florida' },
  Georgia: { fee: '$110 including service charge', agency: 'Georgia Secretary of State', guide: '/start-a-nonprofit-georgia' },
  Illinois: { fee: '$50', agency: 'Illinois Secretary of State', guide: '/start-a-nonprofit-illinois' },
  Michigan: { fee: '$20 total formation fees', agency: 'Michigan LARA', guide: '/start-a-nonprofit-michigan' },
  'New Jersey': { fee: '$50', agency: 'New Jersey Division of Revenue', guide: '/start-a-nonprofit-new-jersey' },
  'New York': { fee: '$75', agency: 'New York Department of State', guide: '/start-a-nonprofit-new-york' },
  'North Carolina': { fee: '$60', agency: 'North Carolina Secretary of State', guide: '/start-a-nonprofit-north-carolina' },
  Ohio: { fee: '$99', agency: 'Ohio Secretary of State', guide: '/start-a-nonprofit-ohio' },
  Pennsylvania: { fee: '$125', agency: 'Pennsylvania Department of State', guide: '/start-a-nonprofit-pennsylvania' },
  Texas: { fee: '$25', agency: 'Texas Secretary of State', guide: '/start-a-nonprofit-texas' }
};

const slug = value => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const rows = states.map(name => {
  const item = verified[name];
  const irs = `https://www.irs.gov/charities-non-profits/${slug(name)}`;
  if (item) return `<tr data-state="${name.toLowerCase()}"><th scope="row">${name}</th><td>${item.fee}</td><td>${item.agency}</td><td><a href="${item.guide}" data-track="state_directory_guide">Detailed guide</a> · <a href="${irs}" target="_blank" rel="noopener">Official state links</a></td></tr>`;
  return `<tr data-state="${name.toLowerCase()}"><th scope="row">${name}</th><td>Verify current amount</td><td>State corporation office</td><td><a href="${irs}" target="_blank" rel="noopener">IRS directory of official state links</a></td></tr>`;
}).join('');

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Nonprofit Filing Fees and Official Links by State | Start Your Cause</title>
<meta name="description" content="Compare verified nonprofit incorporation fees and find official corporation, charity-registration, and tax resources for all 50 states.">
<link rel="canonical" href="https://startyourcause.org/nonprofit-filing-fees-by-state">
<meta property="og:title" content="Nonprofit filing fees and official links by state"><meta property="og:description" content="A free 50-state directory for nonprofit founders, with verified fee details for states covered by Start Your Cause guides."><meta property="og:type" content="article"><meta property="og:url" content="https://startyourcause.org/nonprofit-filing-fees-by-state">
<link rel="stylesheet" href="/resources.css"><script async src="https://www.googletagmanager.com/gtag/js?id=G-BE983T68NN"></script><script defer src="/resources.js"></script>
<script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org','@type':'Dataset',name:'Nonprofit filing fees and official links by state',description:'A directory of nonprofit corporation filing resources for all 50 states, with verified incorporation fees for states covered by detailed Start Your Cause guides.',url:'https://startyourcause.org/nonprofit-filing-fees-by-state',creator:{'@type':'Organization',name:'Start Your Cause'},dateModified:'2026-09-24',spatialCoverage:'United States'})}</script>
<style>.directory-tools{display:flex;gap:12px;align-items:end;flex-wrap:wrap;margin:24px 0}.directory-tools label{font-weight:700;display:block}.directory-tools input{width:min(430px,90vw);min-height:48px;border:1px solid var(--sand2);border-radius:var(--rs);padding:10px 12px;font:inherit}.table-wrap{overflow-x:auto;border:1px solid var(--sand2);border-radius:12px;background:#fff}.state-table{width:100%;border-collapse:collapse;min-width:760px}.state-table th,.state-table td{text-align:left;padding:13px 14px;border-bottom:1px solid var(--sand2);vertical-align:top}.state-table thead th{background:var(--glight);color:var(--gdark)}.state-table tr:last-child th,.state-table tr:last-child td{border-bottom:0}.state-table a{font-weight:700}.verified-key{display:flex;gap:16px;flex-wrap:wrap;font-size:14px;color:var(--tmid)}.verified-key span:first-child{color:var(--gdark);font-weight:700}</style>
</head><body data-slug="nonprofit-filing-fees-by-state">
<header><div class="nav"><a class="logo" href="/">🌱 Start Your Cause</a><nav><a href="/resources">Resources</a><a href="/nonprofit-startup-cost-calculator">Cost Calculator</a><a href="/1023-ez-eligibility-quiz">Free Screener</a><a href="/?view=pricing">Pricing</a></nav></div></header>
<main><section class="hero"><div class="hero-inner"><div class="crumbs"><a href="/">Home</a> / <a href="/resources">Resources</a> / State filing directory</div><span class="tag">50-state nonprofit directory</span><h1>Nonprofit filing fees and official links by state</h1><p>Find the government offices responsible for nonprofit corporations, charity registration, and state tax matters. Detailed Start Your Cause guides include a recently reviewed incorporation fee; every other row links to the IRS directory of official state resources.</p><a class="btn" href="/nonprofit-startup-cost-calculator" data-track="state_directory_to_calculator">Estimate my startup costs →</a></div></section>
<div class="wrap"><div class="notice"><strong>Verify before paying:</strong> State fees, forms, optional charges, exemptions, and agency websites can change. This directory is educational and does not replace current agency instructions or professional advice.</div>
<div class="directory-tools"><div><label for="state-search">Find your state</label><input id="state-search" type="search" placeholder="Type a state name" autocomplete="off"></div><p id="state-count" class="small">Showing all 50 states</p></div>
<div class="verified-key"><span>Verified fee:</span><span>Included where a detailed state guide was reviewed against current agency materials.</span><span>Other states: use the official links before budgeting.</span></div>
<div class="table-wrap"><table class="state-table"><thead><tr><th>State</th><th>Primary incorporation fee</th><th>Corporation office</th><th>Resources</th></tr></thead><tbody>${rows}</tbody></table></div>
<section><h2>Why incorporation is only one part of the cost</h2><p>A nonprofit may also face charitable-solicitation registration, annual-report, registered-agent, optional copy, local-license, state-tax, and IRS application charges. State incorporation creates a state-law entity; it does not automatically create federal 501(c)(3) status.</p><div class="related"><a href="/nonprofit-startup-cost-calculator" data-track="state_directory_related">Use the cost calculator →</a><a href="/1023-vs-1023-ez" data-track="state_directory_related">Compare Form 1023 and 1023-EZ →</a><a href="/nonprofit-startup-checklist" data-track="state_directory_related">Follow the startup checklist →</a><a href="/document-previews" data-track="state_directory_related">Preview the 13-document packet →</a></div></section>
<div class="cta"><span class="tag">Founding customer offer</span><h2>Turn your state requirements into an organized filing plan</h2><p>Answer four questions for a personalized quick-start preview. Continue building the 13-document packet for $49 with code <strong>FOUNDERS49</strong>. One payment, 12 months of access, and no automatic renewal. Government fees are separate.</p><a class="btn" href="/?view=form&utm_source=state_directory&utm_medium=organic&utm_campaign=founding_offer" data-track="state_directory_quick_start">Create my free quick-start preview →</a></div>
<p class="small">Reviewed September 24, 2026. Start Your Cause provides templates and educational guidance; it does not submit filings or government fees.</p></div></main>
<footer><div class="inner"><strong>Start Your Cause</strong><p>Plain-language nonprofit formation tools for everyday founders.</p><p><a href="/privacy.html">Privacy</a> · <a href="/terms.html">Terms</a> · <a href="mailto:hello@startyourcause.org">hello@startyourcause.org</a></p></div></footer>
<script>const search=document.getElementById('state-search');const rows=[...document.querySelectorAll('tbody tr')];const count=document.getElementById('state-count');search.addEventListener('input',()=>{const q=search.value.trim().toLowerCase();let shown=0;rows.forEach(row=>{const visible=!q||row.dataset.state.includes(q);row.hidden=!visible;if(visible)shown+=1});count.textContent=q?\`Showing \${shown} matching state\${shown===1?'':'s'}\`:'Showing all 50 states';if(window.trackSycEvent&&q.length===2)window.trackSycEvent('state_directory_search',{search_length:q.length})});</script>
</body></html>`;

writeFileSync(new URL('../nonprofit-filing-fees-by-state.html', import.meta.url), html);
console.log(`Generated ${states.length}-state nonprofit filing directory.`);
