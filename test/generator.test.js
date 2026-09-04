const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function load(file, names) {
  const source = fs.readFileSync(file, 'utf8') + `\nthis.__exports = {${names.join(',')}};`;
  const context = { console, Date };
  vm.createContext(context);
  vm.runInContext(source, context);
  return context.__exports;
}

const answers = {
  orgName: 'Bright River Youth Center', problem: 'Students lack safe after-school support.',
  activities: 'Provide tutoring and meals.', missionStatement: 'Support students through tutoring and meals.',
  whoHelp: 'Students ages 8–14', howMany: '120', location: 'Kane County, Illinois',
  orgType: 'Public Charity', state: 'IL', address: '100 Test Street, St. Charles, IL 60174',
  agentName: 'Taylor Agent', agentAddress: '200 Agent Street, St. Charles, IL 60174',
  founderName: 'Jordan Founder', founderEmail: 'jordan@example.test', founderAddress: '100 Test Street, St. Charles, IL 60174', board2: 'Avery Director',
  board3: 'Morgan Treasurer', board4: '', board5: '', fundingSources: ['Individual donations'],
  president: 'Jordan Founder', secretary: 'Avery Director', treasurer: 'Morgan Treasurer',
  budget: '$15,000', expenses: 'Tutoring supplies and meals', employees: 'No — all volunteers',
  lawyer: 'No — doing it myself', filingFee: 'Yes', specialCircumstances: ['None of the above'],
  notes: '', fiscal: 'January 1 – December 31 (Calendar Year)',
  meetFreq: 'Quarterly (4 times per year)', spendLimit: '$500', comp: 'No — all volunteer board'
};
const state = { name: 'Illinois', form: 'Articles of Incorporation', fee: 50, agency: 'Illinois Secretary of State', agencyUrl: 'https://www.ilsos.gov/', processingDays: '10', solicitationReg: true, solicitationFee: 15, unique: [], notes: '' };

test('all nine formation packet documents render customer data', () => {
  const { generateAllDocs } = load('docgen.js', ['generateAllDocs']);
  const docs = generateAllDocs(answers, state);
  assert.equal(Object.keys(docs).length, 9);
  for (const [name, html] of Object.entries(docs)) {
    assert.ok(html.length > 500, `${name} should render substantive content`);
    assert.match(html, /Bright River|Jordan Founder|Illinois/);
    assert.doesNotMatch(html, /undefined|null/);
  }
});

test('articles render registered-agent and incorporator details', () => {
  const { generateAllDocs } = load('docgen.js', ['generateAllDocs']);
  const articles = generateAllDocs(answers, state).articles;
  assert.match(articles, /Taylor Agent/);
  assert.match(articles, /200 Agent Street/);
  assert.match(articles, /100 Test Street/);
});

test('annual documents do not claim StartYourCause.org is the customer website', () => {
  const { generateYearlyDocs } = load('yearly-docs.js', ['generateYearlyDocs']);
  const docs = generateYearlyDocs(answers, state, 2025);
  assert.equal(Object.keys(docs).length, 4);
  assert.doesNotMatch(docs.form990, /<td>Website<\/td><td>\s*StartYourCause\.org/i);
  assert.match(docs.form990, /<td>Website<\/td><td><span class="blank"/);
});

test('generated documents escape customer-supplied HTML', () => {
  const { generateAllDocs } = load('docgen.js', ['generateAllDocs']);
  const docs = generateAllDocs({...answers, orgName: '<script>alert(1)</script>'}, state);
  assert.doesNotMatch(Object.values(docs).join(''), /<script>alert\(1\)<\/script>/);
});

test('visitors can begin the questionnaire without an account', () => {
  const home = fs.readFileSync('index.html', 'utf8');
  const goFunction = home.match(/function go\(id\) \{[\s\S]*?\n\}/)?.[0] || '';
  assert.doesNotMatch(goFunction, /id === 'form'.*hasAccountSession/);
  assert.match(home, /No account or payment required to begin/);
  assert.match(home, /No account is required to begin/);
});

test('organic acquisition pages are indexable and linked', () => {
  const expected = [
    'nonprofit-startup-cost-calculator', 'resource-partners',
    'start-a-nonprofit-california', 'start-a-nonprofit-texas',
    'start-a-nonprofit-florida', 'start-a-nonprofit-new-york',
    'start-a-nonprofit-pennsylvania', 'start-a-nonprofit-georgia',
    'start-a-nonprofit-north-carolina', 'start-a-nonprofit-michigan',
    'start-a-nonprofit-ohio', 'start-a-nonprofit-new-jersey',
    'nonprofit-board-meeting-agenda-template',
    'nonprofit-organizational-meeting-minutes-template'
  ];
  const sitemap = fs.readFileSync('sitemap.xml', 'utf8');
  const redirects = fs.readFileSync('netlify.toml', 'utf8');
  const resources = fs.readFileSync('resources.html', 'utf8');
  for (const slug of expected) {
    const page = fs.readFileSync(`${slug}.html`, 'utf8');
    assert.match(page, new RegExp(`<link rel="canonical" href="https://startyourcause\\.org/${slug}"`));
    assert.match(page, /<meta name="description"/);
    assert.match(sitemap, new RegExp(`https://startyourcause\\.org/${slug}`));
    assert.match(redirects, new RegExp(`from = "/${slug}"`));
    assert.match(resources, new RegExp(`href="/${slug}"`));
  }
});

test('resource email signup has consent, spam protection, and a noindex confirmation page', () => {
  const resources = fs.readFileSync('resources.html', 'utf8');
  const confirmation = fs.readFileSync('email-signup-confirmed.html', 'utf8');
  assert.match(resources, /data-netlify="true"/);
  assert.match(resources, /netlify-honeypot="company"/);
  assert.match(resources, /name="consent" value="yes" required/);
  assert.match(confirmation, /name="robots" content="noindex"/);
});

test('homepage founder checklist signup requires consent and blocks bots', () => {
  const homepage = fs.readFileSync('index.html', 'utf8');
  assert.match(homepage, /name="founder-checklist"/);
  assert.match(homepage, /netlify-honeypot="company"/);
  assert.match(homepage, /name="consent" value="yes" required/);
});
