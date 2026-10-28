const $=s=>document.querySelector(s);
let profile;
let category='All';
const safeLink=url=>{try{const u=new URL(url);return ['https:','http:'].includes(u.protocol)?u.href:null;}catch{return null;}};
function el(tag,text,className){const n=document.createElement(tag);if(text)n.textContent=text;if(className)n.className=className;return n;}
function renderProjects(){
 const query=$('#project-search').value.toLowerCase().trim();
 const filtered=profile.projects.filter(p=>(category==='All'||p.category===category)&&`${p.title} ${p.description} ${p.tags.join(' ')}`.toLowerCase().includes(query));
 $('#projects').replaceChildren();$('#project-count').textContent=`${filtered.length} of ${profile.projects.length} projects`;$('#empty-projects').hidden=filtered.length!==0;
 filtered.forEach(p=>{
  const article=el('article',null,'project');const button=el('button');button.setAttribute('aria-label',`Explore ${p.title}`);
  const imageWrap=el('div',null,'project-image');const img=el('img');img.src=safeLink(p.image)||(p.image?.startsWith('/')?p.image:'/assets/orbit.svg');img.alt=`${p.title} — illustrated project cover`;img.loading='lazy';
  imageWrap.append(img,el('span','↗','project-arrow'));button.append(imageWrap,el('div',p.category,'eyebrow'),el('h3',p.title.replace(/-/g,' ')));article.append(button,el('p',p.description));
  const tags=el('div',null,'tags');p.tags.forEach(t=>tags.append(el('span',t)));if(p.fork)tags.append(el('span','Fork'));if(p.archived)tags.append(el('span','Archived'));article.append(tags);$('#projects').append(article);
  button.onclick=()=>{$('#detail-image').src=img.src;$('#detail-image').alt=img.alt;$('#detail-title').textContent=p.title.replace(/-/g,' ');$('#detail-category').textContent=p.category;$('#detail-description').textContent=p.description;const link=safeLink(p.url);$('#detail-link').hidden=!link;if(link){$('#detail-link').href=link;$('#detail-link').textContent='Explore on GitHub ↗';}$('#project-dialog').showModal();};
 });
}
function renderGitHub(){
 const categories=['All',...new Set(profile.projects.map(p=>p.category))];
 if(!categories.includes(category))category='All';
 $('#project-filters').replaceChildren();
 for(const label of categories){const b=el('button',label);b.setAttribute('aria-pressed',String(label===category));b.onclick=()=>{category=label;$('#project-filters').querySelectorAll('button').forEach(n=>n.setAttribute('aria-pressed',String(n===b)));renderProjects();};$('#project-filters').append(b);}
 renderProjects();
 updateSyncLabel();
}
function updateSyncLabel(){
 const date=new Intl.DateTimeFormat('en-US',{dateStyle:'medium',timeStyle:'short',timeZone:'America/Los_Angeles'}).format(new Date(profile.githubSync?.lastSuccessAt||profile.githubSyncedAt));
 $('#github-summary').textContent=`${profile.projects.length} public projects · ${profile.githubSync?.lastError?'showing last saved projects':`checked ${date} PT`}`;
}
let refreshingPortfolio=false;
async function refreshPortfolio(){
 if(refreshingPortfolio||document.hidden||!profile)return;
 refreshingPortfolio=true;
 try{
  const r=await fetch('/api/profile',{cache:'no-store'});if(!r.ok)throw Error('Profile refresh failed');const next=await r.json();
  const changed=JSON.stringify(next.projects)!==JSON.stringify(profile.projects);
  profile=next;if(changed)renderGitHub();else updateSyncLabel();
 }catch{ /* Keep the currently visible gallery when the local server is unavailable. */ }
 finally{refreshingPortfolio=false;}
}
function openChat(){$('#chat').hidden=false;$('#question').focus();}
document.querySelectorAll('.open-chat').forEach(b=>b.addEventListener('click',openChat));
$('#close-chat').onclick=()=>{$('#chat').hidden=true;$('.chat-launch').focus();};
$('#year').textContent=new Date().getFullYear();
$('#close-project').onclick=()=>$('#project-dialog').close();
$('#project-dialog').addEventListener('click',e=>{if(e.target===$('#project-dialog'))$('#project-dialog').close();});
async function load(){
 profile=await fetch('/api/profile').then(r=>r.json());
 document.title=`${profile.name} — Portfolio`;
 document.querySelectorAll('[data-name]').forEach(n=>n.textContent=profile.name);$('[data-role]').textContent=profile.role.toLowerCase();
 $('#bio').textContent=profile.bio;$('#experience').textContent=profile.experience;
 profile.skills.forEach(s=>$('#skills').append(el('span',s)));
 $('#project-search').addEventListener('input',renderProjects);renderGitHub();
 if(profile.testimonials.length){profile.testimonials.forEach(t=>{const item=el('article',null,'review-card');const rating=Math.min(5,Math.max(1,Math.round(t.rating||5)));const stars=el('div','★'.repeat(rating)+'☆'.repeat(5-rating),'review-stars');stars.setAttribute('aria-label',`${rating} out of 5 stars`);item.append(el('span',t.demo?'FICTIONAL DEMO REVIEW':'COLLABORATOR REVIEW','review-label'),stars,el('blockquote',`“${t.quote}”`),el('p',`${t.name} · ${t.role}`,'quote-credit'));$('#testimonials').append(item);});}else{$('#testimonials').append(el('p','Real collaborator quotes will appear here.'));}
 for(const [label,url] of [['GitHub',profile.githubUrl],['LinkedIn',profile.linkedinUrl]]){const href=safeLink(url);if(href){const a=el('a',`${label} ↗`);a.href=href;a.target='_blank';a.rel='noopener noreferrer';$('#social-links').append(a);}}
 if(profile.phone){const a=el('a',`${profile.phone} (USA)`);a.href=`tel:${profile.phone.replace(/[^+\d]/g,'')}`;$('#social-links').append(a);}
 let valid=false;try{const u=new URL(profile.calendlyUrl);valid=u.protocol==='https:'&&(u.hostname==='calendly.com'||u.hostname.endsWith('.calendly.com'));}catch{}
 if(valid){$('#book-call').href=profile.calendlyUrl;$('#book-call').target='_blank';$('#book-call').rel='noopener noreferrer';}else{$('#book-call').onclick=e=>{e.preventDefault();openChat();send('How can I book a discovery call?');};}
 if(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)){$('#email-link').href=`mailto:${profile.email}`;}else{$('#email-link').hidden=true;}
 if(!valid||!profile.email)$('#contact-note').textContent='Portfolio setup: add your Calendly URL and contact email in profile.json.';
}
function message(text,role){const m=el('div',text,`message ${role}`);$('#messages').append(m);$('#messages').scrollTop=$('#messages').scrollHeight;return m;}
async function send(text){if($('#send').disabled)return;$('#question').value='';message(text,'user');$('#send').disabled=true;const pending=message('Consulting the brain noodles…','assistant');try{const r=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:text})});const data=await r.json();pending.textContent=data.reply||data.error||'Please try again.';if(data.sources?.length)pending.append(el('small',`${data.mode==='retrieval'?'Direct portfolio excerpts · ':''}Sources: ${data.sources.join(' · ')}`));for(const source of data.sourceLinks||[]){if(!safeLink(source.url))continue;const a=el('a',`${source.label} ↗`);a.href=source.url;a.target='_blank';a.rel='noopener noreferrer';pending.append(a);}if(data.bookingUrl&&safeLink(data.bookingUrl)){const a=el('a','Book a 30-minute discovery call ↗');a.href=data.bookingUrl;a.target='_blank';a.rel='noopener noreferrer';pending.append(a);}if(data.bookingMissing)pending.append(el('small','The owner hasn’t added their Calendly link yet.'));}catch{pending.textContent='The local server could not be reached. Please try again.';}finally{$('#send').disabled=false;$('#messages').scrollTop=$('#messages').scrollHeight;}}
$('#chat-form').onsubmit=e=>{e.preventDefault();const q=$('#question').value.trim();if(q)send(q);};
document.querySelectorAll('.suggestions button').forEach(b=>b.onclick=()=>send(b.textContent));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#chat').hidden)$('#close-chat').click();});
load().catch(()=>{$('#bio').textContent='Could not load the portfolio. Please refresh.';});
setInterval(refreshPortfolio,60000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)void refreshPortfolio();});
fetch('/api/status').then(r=>r.json()).then(s=>{$('#model-status').textContent=s.ollama?'Powered by local Ollama':'Local AI offline';}).catch(()=>$('#model-status').textContent='Local AI offline');
const generated=new Image();generated.onload=()=>{generated.className='generated-avatar';generated.alt='Locally generated abstract AI avatar';$('#avatar-art').replaceChildren(generated);};generated.src='/generated/avatar.png';
