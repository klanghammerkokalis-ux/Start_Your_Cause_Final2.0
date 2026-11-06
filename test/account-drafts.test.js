const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const token = id => 'test.' + Buffer.from(JSON.stringify({sub:id})).toString('base64url') + '.test';
function accountContext() {
  const stored=new Map();
  const timers=[];
  const listeners={};
  const events=[];
  const context={
    console, Date, atob, clearTimeout(){},setTimeout:fn=>{timers.push(fn);return timers.length;},
    localStorage:{getItem:key=>stored.get(key)||null,setItem:(key,value)=>stored.set(key,value),removeItem:key=>stored.delete(key)},
    window:{addEventListener:(name,fn)=>listeners[name]=fn,location:{reload:()=>events.push('reload')}},
    document:{querySelectorAll:()=>[],getElementById:()=>null},
    resetFormFields:()=>events.push('reset'),restoreFormData:()=>events.push('restore'),
    fetch:async()=>{events.push('fetch');return {ok:true,json:async()=>[]};},
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync('account.js','utf8'),context);
  return {context,stored,timers,listeners,events};
}
const session = id => ({access_token:token(id),refresh_token:'test-refresh',user:{id,email:id+'@example.test'}});

test('drafts are scoped by account, account switches reset fields, and logout restores guest context', () => {
  const {context:c,events}=accountContext();
  const guest=c.draftKey();
  c.storeAccountSession(session('account-a'));
  const first=c.draftKey();
  c.storeAccountSession(session('account-b'));
  const second=c.draftKey();
  assert.notEqual(guest,first);
  assert.notEqual(first,second);
  assert.ok(events.filter(e=>e==='reset').length===2);
  c.clearAccountSession();
  assert.equal(c.draftKey(),guest);
});

test('a queued save cannot write an earlier account draft into the next account', async () => {
  const {context:c,timers,events}=accountContext();
  c.storeAccountSession(session('account-a'));
  await c.saveAccountProject({fields:{f_orgName:'Only account A'},step:3});
  c.storeAccountSession(session('account-b'));
  await timers[0]();
  assert.equal(events.filter(e=>e==='fetch').length,0);
});

test('an account change in another tab invalidates the stale tab draft context', () => {
  const {context:c,stored,listeners,events}=accountContext();
  c.storeAccountSession(session('account-a'));
  stored.set('syc_auth_access_token',token('account-b'));
  assert.equal(c.draftKey(),null);
  listeners.storage({key:'syc_auth_access_token'});
  assert.ok(events.includes('reload'));
});
