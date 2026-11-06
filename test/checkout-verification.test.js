const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { isPaidFormationSession } = require('../netlify/functions/_stripe-access');

function verificationHandler(session, email = 'qa@example.test') {
  const context = {
    exports: {}, process: { env: {} }, console, Date, URL,
    fetch: async () => ({ ok: true, json: async () => ({email}) }),
    require: name => name === 'stripe'
      ? () => ({checkout: {sessions: {retrieve: async () => session}}})
      : {isPaidFormationSession},
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync('netlify/functions/verify-checkout.js','utf8'), context);
  return context.exports.handler;
}

const session = {
  id: 'cs_test_verification', status: 'complete', mode: 'payment', currency: 'usd',
  payment_status: 'paid', amount_subtotal: 7900, amount_total: 4900,
  metadata: {planId: 'annual'}, customer_details: {email: 'qa@example.test'},
  created: Math.floor(Date.now()/1000),
};
const event = { httpMethod: 'POST', headers: {authorization: 'Bearer test-token'}, body: JSON.stringify({sessionId: session.id}) };

test('checkout verification enforces account ownership and twelve-month expiry', async () => {
  for (const [candidate, email, expected] of [
    [session, 'qa@example.test', 200],
    [{...session, amount_total: 0, payment_status:'no_payment_required'}, 'qa@example.test', 200],
    [{...session, created: session.created - 366*86400}, 'qa@example.test', 403],
    [session, 'different@example.test', 403],
    [{...session, payment_status: 'unpaid'}, 'qa@example.test', 403],
    [{...session, amount_subtotal: 100}, 'qa@example.test', 403],
  ]) {
    const response = await verificationHandler(candidate, email)(event);
    assert.equal(response.statusCode, expected);
    assert.equal(Boolean(JSON.parse(response.body).verified), expected === 200);
  }
  const unsigned = await verificationHandler(session)({...event, headers:{}});
  assert.equal(unsigned.statusCode, 401);
});

function summaryContext(access) {
  const elements = Object.fromEntries(['f_stateSelect','completion-offer','sumTable','docsGrid','stateNextSteps'].map(id => [id, {value:'IL',style:{},innerHTML:''}]));
  const context = {
    document: {getElementById: id => elements[id]},
    STATE_DATA: {IL:{name:'Illinois',form:'Articles',agency:'Test agency',agencyUrl:'https://example.test',fee:50,unique:[]}},
    getAnswers: () => ({orgName:'<img src=x onerror=alert(1)>',fundingSources:[]}),
    hasAccess: () => access,
    escapeGeneratedHtml: value => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'),
  };
  vm.createContext(context);
  const source = fs.readFileSync('index.html','utf8');
  const fn = source.slice(source.indexOf('function buildSummary(){'), source.indexOf('// ── ANNUAL FILING PAGE'));
  vm.runInContext(fn,context);
  context.buildSummary();
  return elements;
}

test('review displays untrusted answers as text and hides checkout for paid customers', () => {
  for (const access of [true,false]) {
    const elements = summaryContext(access);
    assert.doesNotMatch(elements.sumTable.innerHTML, /<img/);
    assert.match(elements.sumTable.innerHTML, /&lt;img/);
    assert.equal(elements['completion-offer'].style.display, access ? 'none' : '');
  }
});

test('navigation saves the destination step and restoring the final step rebuilds documents', () => {
  const source = fs.readFileSync('index.html','utf8');
  const elements = {};
  const element = id => elements[id] ||= {style:{},classList:{remove(){},add(){}},value:''};
  const saves = [];
  let summaries = 0;
  const context = {
    fCur:5, F_TOTAL:8,
    document:{getElementById:element},
    window:{trackSycEvent(){},scrollTo(){}},
    validateCurrentStep:()=>true,
    saveFormData:()=>saves.push(context.fCur),
    buildDots(){}, buildSummary(){ summaries++; }, buildQuickStartPreview(){},
    localStorage:{getItem:()=>JSON.stringify({step:7})}, draftKey:()=> 'qa', console,
  };
  vm.createContext(context);
  vm.runInContext(source.slice(source.indexOf('function fNav(dir){'),source.indexOf('const REQUIRED_BY_STEP')),context);
  context.fNav(1);
  assert.equal(saves.at(-1),6);
  vm.runInContext(source.slice(source.indexOf('function restoreFormData() {'),source.indexOf('function clearFormData()')),context);
  context.restoreFormData();
  assert.equal(context.fCur,7);
  assert.equal(summaries,1);
});

test('quick-start preview displays organization and mission HTML safely', () => {
  const preview = {innerHTML:''};
  const context = {
    document:{getElementById:id=>id==='quick-start-preview'?preview:{value:'IL'}},
    STATE_DATA:{IL:{name:'Illinois'}},
    fv:()=>'<img src=x onerror=alert(1)>',
    escapeGeneratedHtml:value=>String(value).replaceAll('<','&lt;').replaceAll('>','&gt;'),
    window:{trackSycEvent(){}},
  };
  vm.createContext(context);
  const source=fs.readFileSync('index.html','utf8');
  vm.runInContext(source.slice(source.indexOf('function buildQuickStartPreview(){'),source.indexOf('function submitRecoveryConsent(){')),context);
  context.buildQuickStartPreview();
  assert.doesNotMatch(preview.innerHTML, /<img/);
  assert.equal(preview.innerHTML.match(/&lt;img/g).length,2);
});

test('legacy annual subscribers can manage billing while one-time purchasers are not sent to cancel', async () => {
  for (const [status, existingSubscription] of [['active',true],['formation_access',false],['formation_access',true]]) {
    const calls=[];
    const context={
      console,URLSearchParams,
      window:{location:{href:''},addEventListener(){}},document:{addEventListener(){}},
      localStorage:{getItem:()=> 'test-only'},
      alert:()=>calls.push('notice'),
      fetch:async()=>{calls.push('portal');return {ok:existingSubscription,status:existingSubscription?200:403,json:async()=>existingSubscription?({url:'https://billing.example.test/'}):({error:'Verified customer access is required'})};},
    };
    vm.createContext(context);
    vm.runInContext(fs.readFileSync('paywall.js','utf8')+`\nverifiedAccess = {verified:true,planId:'annual',subscriptionStatus:${JSON.stringify(status)}};`,context);
    await context.openBillingPortal({textContent:'Manage billing'});
    assert.deepEqual(calls,existingSubscription?['portal']:['portal','notice']);
    assert.equal(context.window.location.href,existingSubscription?'https://billing.example.test/':'');
  }
});

test('pricing-page checkout does not repurchase when access is already verified', async () => {
  const source=fs.readFileSync('index.html','utf8');
  let destination;
  const context={hasAccess:()=>true,go:id=>destination=id};
  vm.createContext(context);
  vm.runInContext(source.slice(source.indexOf('async function doCheckout(planId, btn) {'),source.indexOf('</script>',source.indexOf('async function doCheckout(planId, btn) {'))),context);
  await context.doCheckout('annual',null);
  assert.equal(destination,'form');
});
