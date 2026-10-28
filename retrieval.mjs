export function documents(profile) {
  return [
    {source:'About',text:`${profile.name}. ${profile.role}. ${profile.bio} Location: ${profile.location}`},
    {source:'Skills and experience',text:`Skills: ${profile.skills.join(', ')}. Experience: ${profile.experience}`},
    {source:'Contact and booking',text:`Contact ${profile.name}: email ${profile.email||'not provided'}, phone ${profile.phone||'not provided'}. LinkedIn: ${profile.linkedinUrl||'not provided'}. GitHub: ${profile.githubUrl||'not provided'}. Discovery call: 30-minute introduction via Calendly.`,url:profile.calendlyUrl},
    {source:'All public GitHub projects',text:`All ${profile.projects.length} projects: ${profile.projects.map(p=>p.title).join(', ')}.`,url:profile.githubUrl},
    ...profile.projects.flatMap(p=>[
      {source:`Project: ${p.title}`,url:p.url,text:`${p.title}. ${p.category}. ${p.description}. ${p.tags.join(', ')}`},
      ...(p.readme?.replace(/<!--[\s\S]*?-->/g,'').match(/[\s\S]{1,1400}/g)||[]).map((text,i)=>({source:`${p.title} README · ${i+1}`,url:p.url,text:`Project ${p.title}. ${text}`}))
    ]),
    ...profile.testimonials.filter(t=>!t.demo).map(t=>({source:'Testimonial',text:`${t.quote} — ${t.name}, ${t.role}`})),
    {source:'Review disclosure',text:'The homepage reviews by fictional characters are playful demo content, not real client testimonials or endorsements.'}
  ];
}
export function retrieve(question, profile, projectTitle=null) {
  const stop=new Set(['the','are','about','what','your','you','can','tell','with','and','for','have','does','how','his','her','this','that']);
  const words = [...new Set(question.toLowerCase().match(/[a-z0-9]+/g)||[])].filter(w=>w.length>2&&!stop.has(w));
  const sources=documents(profile).filter(d=>!projectTitle||d.source===`Project: ${projectTitle}`||d.source.startsWith(`${projectTitle} README · `));
  const ranked=sources.map((d,i)=>({...d,score:words.reduce((n,w)=>n+(d.text.toLowerCase().includes(w)?1:0)+(d.source.toLowerCase().includes(w)?3:0),0),i})).sort((a,b)=>b.score-a.score||a.i-b.i);
  const summary=projectTitle?sources.find(d=>d.source===`Project: ${projectTitle}`):null;
  return (summary?[summary,...ranked.filter(d=>d.source!==summary.source)]:ranked).slice(0,5).map(({source,text,url})=>({source,text,url}));
}
export function bookingIntent(question) { return /\b(book|booking|call|meet|meeting|hire|collaborat\w*|discovery|availability|available|work together|contact)\b/i.test(question); }
export function validBooking(url) { try {const u=new URL(url);return u.protocol==='https:' && (u.hostname==='calendly.com'||u.hostname.endsWith('.calendly.com'));}catch{return false;} }
