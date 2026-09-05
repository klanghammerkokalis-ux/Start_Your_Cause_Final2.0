window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());
window.sycAnalyticsDisabled=new URLSearchParams(location.search).get('syc_test')==='1';
if(!window.sycAnalyticsDisabled)gtag('config','G-BE983T68NN');
function trackSycResourceEvent(name,params){if(window.sycAnalyticsDisabled)return;gtag('event',name,params||{});}
document.addEventListener('click',function(e){const a=e.target.closest('[data-track]');if(!a)return;trackSycResourceEvent(a.dataset.track,{resource_slug:document.body.dataset.slug||'',link_url:a.href||'',link_text:(a.textContent||'').trim().slice(0,80)});});
document.addEventListener('DOMContentLoaded',function(){
  trackSycResourceEvent('resource_view',{resource_slug:document.body.dataset.slug||location.pathname});
  const updatesForm=document.querySelector('form[name="nonprofit-startup-updates"]');
  if(updatesForm)updatesForm.addEventListener('submit',function(){trackSycResourceEvent('generate_lead',{lead_source:'resource_updates',form_id:'nonprofit-startup-updates'});});
  const slug=document.body.dataset.slug||'';
  if(slug==='start-a-nonprofit-illinois'){
    const snapshot=document.querySelector('article .notice.good');
    if(snapshot){
      const next=document.createElement('section');
      next.className='card';
      next.style.cssText='margin:18px 0;background:var(--glight);border-color:var(--gmid)';
      next.innerHTML='<h2 style="margin-top:0">Plan your Illinois filing before you pay</h2><p>Estimate government fees, screen for 1023-EZ indicators, and organize the information needed for your document packet.</p><div class="related"><a href="/nonprofit-startup-cost-calculator" data-track="illinois_next_calculator">Estimate my costs →</a><a href="/1023-ez-eligibility-quiz" data-track="illinois_next_quiz">Check 1023-EZ indicators →</a><a href="/?view=form" data-track="illinois_next_intake">Start my questionnaire →</a><a href="/document-previews" data-track="illinois_next_previews">Preview the documents →</a></div>';
      snapshot.insertAdjacentElement('afterend',next);
    }
  }
  if(slug==='1023-vs-1023-ez'){
    const hero=document.querySelector('.hero-inner');
    if(hero&&!hero.querySelector('[data-track="quiz_start"]')){
      const start=document.createElement('a');
      start.className='btn secondary';
      start.href='#screener';
      start.dataset.track='quiz_start';
      start.textContent='Use the free screener →';
      hero.append(' ',start);
    }
  }
  const offer=document.createElement('aside');
  offer.className='founding-offer';
  offer.setAttribute('aria-label','Founding customer offer');
  offer.style.cssText='margin:0;background:#1d6b52;color:#fff;padding:10px 22px;text-align:center;font-size:14px;line-height:1.5';
  offer.innerHTML='<strong>Founding 10:</strong> Get the 12-month Formation Package for <strong>$49</strong> instead of $79 with code <strong>FOUNDERS49</strong>. Limited to 10 first-time customers; one payment with no automatic renewal. <a href="/?view=pricing" data-track="resource_founding_offer" style="display:inline-block;margin-left:8px;color:#fff;font-weight:700">See the package →</a>';
  document.body.insertBefore(offer,document.body.firstChild);
  let sent=false;
  addEventListener('scroll',function(){if(!sent&&(scrollY+innerHeight)>=document.documentElement.scrollHeight*.75){sent=true;trackSycResourceEvent('resource_75_percent',{resource_slug:document.body.dataset.slug||location.pathname})}},{passive:true});
});
