const allowedHosts=new Set(['raw.githubusercontent.com','github.com','user-images.githubusercontent.com','private-user-images.githubusercontent.com']);
export function projectImageCandidates(username,project){
 const markdown=(project.readme||'').replace(/<!--[\s\S]*?-->/g,'');
 const results=[];
 const pattern=/!\[([^\]]*)\]\(<?([^\s)>]+)>?(?:\s+[^)]*)?\)|<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi;
 for(const match of markdown.matchAll(pattern)){
  const alt=match[1]||match[0].match(/\balt=["']([^"']*)["']/i)?.[1]||`${project.name} project image`;
  let src=match[2]||match[3];
  if(/badge|shields\.io|(?:^|\/)logo(?:[./_-]|$)|favicon/i.test(src+' '+alt))continue;
  try{
   const base=`https://raw.githubusercontent.com/${username}/${encodeURIComponent(project.name)}/${encodeURIComponent(project.branch)}/`;
   const url=new URL(src,base);if(url.protocol!=='https:'||!allowedHosts.has(url.hostname))continue;
   if(url.hostname==='github.com'){
    if(url.pathname.includes('/blob/')){url.hostname='raw.githubusercontent.com';url.pathname=url.pathname.replace('/blob/','/');url.search='';}
    else if(!url.pathname.startsWith('/user-attachments/assets/'))continue;
   }
   if(!results.some(r=>r.url===url.href))results.push({url:url.href,alt});
  }catch{}
 }
 return results.slice(0,8);
}
export async function findProjectImages(username,project,fetchImpl=fetch){
 const images=[];
 for(const image of projectImageCandidates(username,project)){
  try{const r=await fetchImpl(image.url,{method:'HEAD',redirect:'follow',signal:AbortSignal.timeout(8000)});if(r.ok&&r.headers.get('content-type')?.startsWith('image/'))images.push(image);}catch{}
  if(images.length===4)break;
 }
 return images;
}
