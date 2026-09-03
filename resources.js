window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-BE983T68NN');
document.addEventListener('click',function(e){const a=e.target.closest('[data-track]');if(!a)return;gtag('event',a.dataset.track,{resource_slug:document.body.dataset.slug||'',link_url:a.href||'',link_text:(a.textContent||'').trim().slice(0,80)});});
document.addEventListener('DOMContentLoaded',function(){
  gtag('event','resource_view',{resource_slug:document.body.dataset.slug||location.pathname});
  const offer=document.createElement('aside');
  offer.className='founding-offer';
  offer.setAttribute('aria-label','Founding customer offer');
  offer.style.cssText='margin:0;background:#1d6b52;color:#fff;padding:10px 22px;text-align:center;font-size:14px;line-height:1.5';
  offer.innerHTML='<strong>Founding 10:</strong> Get the 12-month Formation Package for <strong>$49</strong> instead of $79 with code <strong>FOUNDERS49</strong>. Limited to 10 first-time customers; one payment with no automatic renewal. <a href="/?view=pricing" data-track="resource_founding_offer" style="display:inline-block;margin-left:8px;color:#fff;font-weight:700">See the package →</a>';
  document.body.insertBefore(offer,document.body.firstChild);
  let sent=false;
  addEventListener('scroll',function(){if(!sent&&(scrollY+innerHeight)>=document.documentElement.scrollHeight*.75){sent=true;gtag('event','resource_75_percent',{resource_slug:document.body.dataset.slug||location.pathname})}},{passive:true});
});
