const $=s=>document.querySelector(s);
let profile;
let category='All';
let activeProject=null,selectedProject=null,activeRequest=null,chatOrigin=null;
const safeLink=url=>{try{const u=new URL(url);return ['https:','http:'].includes(u.protocol)?u.href:null;}catch{return null;}};
function el(tag,text,className){const n=document.createElement(tag);if(text)n.textContent=text;if(className)n.className=className;return n;}
function projectLinks(project,container){
 for(const live of project.liveLinks||[]){const href=safeLink(live.url);if(!href)continue;const a=el('a',live.type==='notebook'?'Open notebook ↗':live.access==='owner-private'?'Open preview ↗':live.availability==='unavailable'?'Deployment link ↗':'Open app ↗','live-project');a.href=href;a.target='_blank';a.rel='noopener noreferrer';a.setAttribute('aria-label',`${a.textContent.replace(' ↗','')} — ${project.title}`);if(live.access==='owner-private'){a.title='Owner sign-in required';a.append(el('span','Owner sign-in required','access-note'));}else if(live.availability==='unavailable')a.append(el('span','Currently unavailable','access-note'));container.append(a);}
 if(!project.liveLinks?.length)container.append(el('span','No hosted demo listed','source-only'));
}
function renderProjects(){
 const query=$('#project-search').value.toLowerCase().trim();
 const filtered=profile.projects.filter(p=>(category==='All'||p.category===category)&&`${p.title} ${p.description} ${p.tags.join(' ')}`.toLowerCase().includes(query));
 $('#projects').replaceChildren();$('#project-count').textContent=`${filtered.length} of ${profile.projects.length} projects`;$('#empty-projects').hidden=filtered.length!==0;
 filtered.forEach(p=>{
  const article=el('article',null,'project');const button=el('button');button.setAttribute('aria-label',`Explore ${p.title}`);
  const imageWrap=el('div',null,'project-image');const img=el('img');img.src=safeLink(p.image)||(p.image?.startsWith('/')?p.image:'/assets/orbit.svg');img.alt=p.imageLabel||`${p.title} project preview`;img.loading='lazy';img.referrerPolicy='no-referrer';img.onerror=()=>{img.onerror=null;img.src=p.fallbackImage||'/assets/orbit.svg';img.alt=`${p.title} illustrated cover`;imageType.textContent='Illustrated cover';};
  const imageType=el('span',p.images?.length?'From GitHub':'Illustrated cover','image-type');
  imageWrap.append(img,imageType,el('span','↗','project-arrow'));button.append(imageWrap,el('div',p.category,'eyebrow'),el('h3',p.title.replace(/-/g,' ')));article.append(button,el('p',p.description));
  const tags=el('div',null,'tags');p.tags.forEach(t=>tags.append(el('span',t)));if(p.fork)tags.append(el('span','Fork'));if(p.archived)tags.append(el('span','Archived'));article.append(tags);$('#projects').append(article);
  const destinations=el('div',null,'project-destinations');projectLinks(p,destinations);article.append(destinations);const actions=el('div',null,'project-actions');const ask=el('button','☺ Ask my AI Avatar','ask-project');ask.setAttribute('aria-label',`Ask my AI Avatar about ${p.title}`);ask.onclick=()=>explainProject(p);actions.append(ask);const href=safeLink(p.url);if(href){const link=el('a','Open project on GitHub ↗','project-source');link.href=href;link.target='_blank';link.rel='noopener noreferrer';actions.append(link);}article.append(actions);
  button.onclick=()=>{selectedProject=p;$('#detail-image').src=img.src;$('#detail-image').alt=img.alt;$('#detail-image').onerror=()=>{$('#detail-image').onerror=null;$('#detail-image').src=p.fallbackImage||'/assets/orbit.svg';};$('#detail-title').textContent=p.title.replace(/-/g,' ');$('#detail-category').textContent=p.category;$('#detail-description').textContent=p.description;const link=safeLink(p.url);$('#detail-link').hidden=!link;if(link){$('#detail-link').href=link;$('#detail-link').textContent='Explore on GitHub ↗';}$('#detail-images').replaceChildren();for(const image of p.images||[]){if(!safeLink(image.url))continue;const thumb=el('button');thumb.setAttribute('aria-label',`View ${image.alt}`);const photo=el('img');photo.src=image.url;photo.alt=image.alt;photo.referrerPolicy='no-referrer';thumb.append(photo);thumb.onclick=()=>{$('#detail-image').src=image.url;$('#detail-image').alt=image.alt;};$('#detail-images').append(thumb);}$('#project-dialog').showModal();};
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
function openChat(project=null){chatOrigin=document.activeElement;if($('#project-dialog').open)$('#project-dialog').close();activeProject=project?.title||null;$('#chat-project').hidden=!activeProject;$('#chat-project-name').textContent=activeProject||'';$('#chat').hidden=false;$('#question').focus();}
function explainProject(project){openChat(project);send(`Explain ${project.title} in at most 100 words: its purpose, 2–3 main features, and technologies supported by its README. If technologies are not documented, say so.`,{replace:true});}
document.querySelectorAll('.open-chat').forEach(b=>b.addEventListener('click',()=>openChat()));
$('#close-chat').onclick=()=>{$('#chat').hidden=true;(chatOrigin?.isConnected?chatOrigin:$('.chat-launch')).focus();};
$('#clear-project').onclick=()=>{activeProject=null;$('#chat-project').hidden=true;$('#question').focus();};
$('#detail-ask').onclick=()=>{if(selectedProject)explainProject(selectedProject);};
$('#year').textContent=new Date().getFullYear();
$('#close-project').onclick=()=>$('#project-dialog').close();
$('#project-dialog').addEventListener('toggle',()=>{if($('#project-dialog').open&&selectedProject){$('#detail-live-links').replaceChildren();projectLinks(selectedProject,$('#detail-live-links'));}});
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
async function send(text,{replace=false}={}){if($('#send').disabled&&!replace)return;activeRequest?.abort();const controller=new AbortController();activeRequest=controller;$('#question').value='';message(text,'user');$('#send').disabled=true;const pending=message('Consulting the brain noodles…','assistant');try{const r=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:text,project:activeProject}),signal:controller.signal});const data=await r.json();pending.textContent=data.reply||data.error||'Please try again.';if(data.sources?.length)pending.append(el('small',`${data.mode==='retrieval'?'Direct portfolio excerpts · ':''}Sources: ${data.sources.join(' · ')}`));for(const source of data.sourceLinks||[]){if(!safeLink(source.url))continue;const a=el('a',`${source.label} ↗`);a.href=source.url;a.target='_blank';a.rel='noopener noreferrer';pending.append(a);}if(data.bookingUrl&&safeLink(data.bookingUrl)){const a=el('a','Book a 30-minute discovery call ↗');a.href=data.bookingUrl;a.target='_blank';a.rel='noopener noreferrer';pending.append(a);}if(data.bookingMissing)pending.append(el('small','The owner hasn’t added their Calendly link yet.'));}catch{pending.textContent=controller.signal.aborted?'Switched projects. Asking about the new one below.':'The local server could not be reached. Please try again.';}finally{if(activeRequest===controller){activeRequest=null;$('#send').disabled=false;}$('#messages').scrollTop=$('#messages').scrollHeight;}}
$('#chat-form').onsubmit=e=>{e.preventDefault();const q=$('#question').value.trim();if(q)send(q);};
document.querySelectorAll('.suggestions button').forEach(b=>b.onclick=()=>send(b.textContent));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#chat').hidden)$('#close-chat').click();});
load().catch(()=>{$('#bio').textContent='Could not load the portfolio. Please refresh.';});
setInterval(refreshPortfolio,60000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)void refreshPortfolio();});
fetch('/api/status').then(r=>r.json()).then(s=>{$('#model-status').textContent=s.ollama?'Powered by local Ollama':'Local AI offline';}).catch(()=>$('#model-status').textContent='Local AI offline');
if($('#avatar-art')){const generated=new Image();generated.onload=()=>{generated.className='generated-avatar';generated.alt='Locally generated abstract AI avatar';$('#avatar-art').replaceChildren(generated);};generated.src='/generated/avatar.png';}
