const allowedHosts=new Set(['raw.githubusercontent.com','github.com','user-images.githubusercontent.com','private-user-images.githubusercontent.com']);
export function projectImageCandidates(username,project){
 const markdown=(project.readme||'').replace(/<!--[\s\S]*?-->/g,'');
 const results=[];
 const pattern=/!\[([^\]]*)\]\(<?([^\s)>]+)>?(?:\s+[^)]*)?\)|<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi;
 const references=new Map([...markdown.matchAll(/^\s*\[([^\]]+)\]:\s*<?([^\s>]+)>?/gm)].map(m=>[m[1].toLowerCase(),m[2]]));
 const inline=[...markdown.matchAll(pattern)];
 for(const match of markdown.matchAll(/!\[([^\]]*)\]\[([^\]]*)\]/g)){
  const target=references.get((match[2]||match[1]).toLowerCase());
  if(target)inline.push([match[0],match[1],target]);
 }
 for(const match of inline){
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
export function repositoryScreenshotPaths(tree){
 return tree.filter(entry=>entry.type==='blob'&&/\.(png|jpe?g|webp|gif)$/i.test(entry.path)&&entry.size<=8000000)
  .map(({path})=>({path,score:/screenshots?|showcase/i.test(path)?3:/screen[-_ ]?shot|project[-_ ]?(preview|overview)|landing|dashboard|workbench|gallery|demo[-_ ]?(preview|screen)/i.test(path)?2:/^docs\/(?:.*\/)?(?:images|media)\//i.test(path)?1:0}))
  .filter(item=>item.score&&!/(?:^|[/_.-])(?:node_modules|vendor|logo|icon|favicon|badge|sprite|fixture)(?:[/_.-]|$)/i.test(item.path))
  .sort((a,b)=>b.score-a.score||a.path.localeCompare(b.path,'en')).slice(0,16).map(item=>item.path);
}
export async function findProjectImages(username,project,fetchImpl=fetch,paths=[]){
 const images=[];
 const candidates=projectImageCandidates(username,project);
 for(const path of paths){
  const url=`https://raw.githubusercontent.com/${username}/${encodeURIComponent(project.name)}/${encodeURIComponent(project.branch)}/${path.split('/').map(encodeURIComponent).join('/')}`;
  if(!candidates.some(image=>image.url===url))candidates.push({url,alt:path.split('/').at(-1).replace(/\.[^.]+$/,'').replace(/[-_]/g,' ')});
 }
 for(const image of candidates){
  try{const r=await fetchImpl(image.url,{method:'HEAD',redirect:'follow',signal:AbortSignal.timeout(8000)});if(r.ok&&r.headers.get('content-type')?.startsWith('image/'))images.push(image);}catch{}
  if(images.length===10)break;
 }
 return images;
}
