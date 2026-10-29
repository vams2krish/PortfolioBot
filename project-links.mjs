export function publicUrl(value){
 try{const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password||/^(localhost|127\.|10\.|192\.168\.|169\.254\.|\[|0\.)/i.test(u.hostname)||/\.local$/i.test(u.hostname)||/^172\.(1[6-9]|2\d|3[01])\./.test(u.hostname))return null;return u.href;}catch{return null;}
}
export function discoverProjectLinks(project){
 const text=(project.readme||'').replace(/<!--[\s\S]*?-->/g,'');
 const links=[];
 const privatePreview=/owner[- ](?:only|private)|private[- ]to[- ]owner|deployed privately|hosted privately|private hosted|private access policy|sign in with the owner/i.test(text);
 const add=(url,label)=>{const href=publicUrl(url);if(!href||links.some(l=>l.url===href))return;const u=new URL(href);if(/\.(png|jpe?g|gif|svg|wav|mp4|pdf)$/i.test(u.pathname)||/\/(docs|documentation|functions\/|api\/)/i.test(u.pathname))return;
  const notebook=u.hostname==='colab.research.google.com';
  const githubPage=u.hostname===`${project.owner||'vams2krish'}.github.io`;
  const hosted=/\.(vercel\.app|herokuapp\.com|netlify\.app|onrender\.com|railway\.app|streamlit\.app|chatgpt\.site|hf\.space)$/i.test(u.hostname);
  if(label!=='homepage'&&!notebook&&!hosted&&!githubPage)return;
  if(['github.com','localhost','vercel.com','supabase.com'].includes(u.hostname))return;
  links.push({url:href,type:notebook?'notebook':'app',access:privatePreview&&u.hostname.endsWith('.chatgpt.site')?'owner-private':'public'});
 };
 if(project.homepage)add(project.homepage,'homepage');
 for(const m of text.matchAll(/\[([^\]]+)\]\((https:\/\/[^\s)]+)\)/g))if(/live|demo|deploy|preview|open|try|app|website|product|visit|colab/i.test(m[1]))add(m[2],m[1]);
 // Include a hosted app URL written in bold or plain text as well as Markdown links.
 for(const m of text.matchAll(/https:\/\/[a-z\d][a-z\d.-]*\.(?:vercel\.app|herokuapp\.com|netlify\.app|onrender\.com|railway\.app|streamlit\.app|chatgpt\.site)(?:\/[^\s<>"'`)*|,]*)?/gi))add(m[0],'hosted');
 return links.slice(0,3);
}
export async function checkProjectLinks(links,fetchImpl=fetch){
 return Promise.all(links.map(async link=>{
  const host=new URL(link.url).hostname;
  if(link.type!=='app'||link.access!=='public'||!/(\.vercel\.app|\.herokuapp\.com|\.netlify\.app|\.onrender\.com|\.railway\.app|\.streamlit\.app|\.github\.io)$/.test(host))return link;
  try{const response=await fetchImpl(link.url,{method:'HEAD',signal:AbortSignal.timeout(8000)});return {...link,availability:response.ok?'available':[404,410].includes(response.status)||response.status>=500?'unavailable':'unverified'};}catch{return {...link,availability:'unverified'};}
 }));
}
