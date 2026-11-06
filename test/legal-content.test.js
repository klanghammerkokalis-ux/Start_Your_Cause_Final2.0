const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
function load(file,names){const c={Date,console};vm.createContext(c);vm.runInContext(fs.readFileSync(file,'utf8')+';this.result={'+names.join(',')+'};',c);return c.result;}
const a={orgName:'Legal QA',fundingSources:[],specialCircumstances:[],state:'Illinois',fiscal:'July 1 – June 30',orgType:'Public Charity'};
const sd={name:'Illinois',agency:'Secretary of State',agencyUrl:'https://example.test',solicitationReg:true,solicitationFee:15,minBoardMembers:3,fee:50,unique:[]};

test('annual-return planning follows selected fiscal year and qualifies statutory dates',()=>{
 const {annualTaxPeriod,generateYearlyDocs}=load('yearly-docs.js',['annualTaxPeriod','generateYearlyDocs']);
 for(const [fiscal,due]of [['January 1 – December 31 (Calendar Year)','May 15, 2026'],['July 1 – June 30','November 15, 2026'],['October 1 – September 30','February 15, 2027']]){
  assert.equal(annualTaxPeriod({fiscal},2025).due,due);
  const docs=generateYearlyDocs({...a,fiscal},sd,2025);
  for(const key of ['form990','stateReport','annualMinutes'])assert.ok(docs[key].includes(due),key);
  assert.match(docs.form990,/weekend or legal holiday/);
 }
 const docs=generateYearlyDocs({...a,fiscal:'Other (specify in notes)'},sd,2025);
 assert.match(docs.form990,/confirm start and end dates/);
 assert.match(docs.form990,/15th day of the fifth month/);
});

test('annual guidance distinguishes e-filing, 990-N extensions, classification and renewal fees',()=>{
 const {generateYearlyDocs}=load('yearly-docs.js',['generateYearlyDocs']);
 const docs=generateYearlyDocs(a,sd,2025);
 assert.doesNotMatch(docs.form990,/via mail or e-file|at least 33\.3%/);
 assert.match(docs.form990,/10%-plus facts-and-circumstances/);
 assert.match(docs.form990,/cannot extend Form 990-N/);
 assert.match(docs.form990,/electronic filing is generally required/);
 assert.doesNotMatch(docs.stateReport,/Renewal fee<\/td><td><strong>\$15/);
 assert.match(docs.stateReport,/renewal fees may depend on revenue/);
});

test('IRS application prep preserves inclusive thresholds and distinguishes full/EZ attachments',()=>{
 const {generateAllDocs}=load('docgen.js',['generateAllDocs']);
 const docs=generateAllDocs(a,sd);
 assert.match(docs.irs_prep,/not over \$50,000/);
 assert.match(docs.irs_prep,/not over \$250,000/);
 assert.match(docs.irs_prep,/Part VI — Financial Data/);
 assert.match(docs.irs_prep,/four or five years/);
 assert.match(docs.irs_prep,/Form 1023-EZ generally does not take these attachments/);
 assert.match(docs.irs_prep,/Eligibility Worksheet/);
});

test('specialist and jurisdiction-specific limitations remain visible in generated legal drafts',()=>{
 const {generateAllDocs}=load('docgen.js',['generateAllDocs']);
 assert.match(generateAllDocs({...a,orgType:'Private Foundation'},sd).articles,/IRC section 508\(e\)/);
 assert.match(generateAllDocs(a,{...sd,name:'New Hampshire'}).articles,/New Hampshire draft is incomplete/);
 assert.match(generateAllDocs(a,sd).bylaws,/without voting members/);
});

test('state reference corrections retain registration distinctions and updated fees',()=>{
 const {STATE_DATA:s}=load('states.js',['STATE_DATA']);
 assert.equal(s.AK.solicitationReg,true);assert.equal(s.AK.solicitationFee,40);
 assert.equal(s.DE.solicitationReg,false);assert.equal(s.CA.solicitationFee,50);assert.equal(s.CA.minBoardMembers,1);
 assert.equal(s.NJ.fee,50);assert.equal(s.GA.fee,110);assert.match(s.GA.notes,/24 months/);
 assert.equal(s.DC.solicitationFee,99);assert.match(s.DC.charityAgency,/Licensing/);
 assert.equal(s.UT.solicitationReg,false);assert.match(s.UT.notes,/January 1, 2025/);
 assert.match(s.NC.notes,/\$50,000/);assert.equal(s.OR.solicitationFee,0);
 assert.match(s.OH.notes,/annual.*fees/);
 assert.doesNotMatch(s.IL.unique.join(' '),/\$25,000 small org exemption/);
});

test('officer assignments follow selected officers rather than assuming founder and director positions',()=>{
 const {generateAllDocs}=load('docgen.js',['generateAllDocs']);
 const {generateYearlyDocs}=load('yearly-docs.js',['generateYearlyDocs']);
 const data={...a,founderName:'Founder A',board2:'Director B',board3:'Director C',president:'President P',secretary:'Secretary S',treasurer:'Treasurer T'};
 const docs=generateAllDocs(data,sd), annual=generateYearlyDocs(data,sd,2025);
 for(const html of [docs.boardMinutes,annual.annualMinutes]){
  assert.match(html,/<td[^>]*>President<\/td><td>President P/);
  assert.match(html,/<td[^>]*>Secretary<\/td><td>Secretary S/);
  assert.match(html,/<td[^>]*>Treasurer<\/td><td>Treasurer T/);
  assert.doesNotMatch(html,/<td>Vice President<\/td><td>Director B/);
 }
 assert.match(docs.ein_checklist,/Confirm the qualified principal officer/);
 assert.match(docs.bylaws,/Treasurer\/CFO cannot concurrently serve as President/);
});
