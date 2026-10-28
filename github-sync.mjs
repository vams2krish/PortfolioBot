import {readFile,writeFile,mkdir,rename,rm} from 'node:fs/promises';
import {createCovers} from './scripts/create-covers.mjs';

const root=new URL('./',import.meta.url);
const headers={'User-Agent':'PortfolioBot','Accept':'application/vnd.github+json'};
export async function collectGitHub(username,{fetchImpl=fetch,previous=null}={}){
 if(!/^[a-z\d-]+$/i.test(username))throw Error('Invalid GitHub username');
 const request=async url=>{
  const r=await fetchImpl(url,{headers,signal:AbortSignal.timeout(20000)});
  if(!r.ok){const error=new Error(`GitHub refresh failed (${r.status}); keeping the last successful snapshot.`);error.retryAt=Number(r.headers?.get('x-ratelimit-reset')||0)*1000;throw error;}
  return r;
 };
 const projects=[];
 for(let page=1;;page++){
  const repos=await (await request(`https://api.github.com/users/${username}/repos?per_page=100&type=owner&sort=full_name&page=${page}`)).json();
  if(!Array.isArray(repos))throw Error('Unexpected GitHub repository response');
  for(const p of repos.filter(p=>p.private===false&&p.owner?.login?.toLowerCase()===username.toLowerCase())){
   if(!/^[a-z\d_.-]+$/i.test(p.name))throw Error('Unexpected repository name');
   const project={name:p.name,description:p.description,language:p.language,topics:p.topics||[],url:p.html_url,branch:p.default_branch,stars:p.stargazers_count,fork:p.fork,archived:p.archived};
   // Excluding this portfolio's own push time prevents an endless bot-commit cycle.
   if(p.name.toLowerCase()!=='portfoliobot')project.pushedAt=p.pushed_at;
   let readme='';
   for(const filename of ['README.md','readme.md','README.rst','README']){
    const r=await fetchImpl(`https://raw.githubusercontent.com/${username}/${encodeURIComponent(p.name)}/${encodeURIComponent(p.default_branch)}/${filename}`,{signal:AbortSignal.timeout(15000)});
    if(r.ok){readme=(await r.text()).slice(0,16000);break;}
    if(r.status!==404)throw Error(`README refresh failed (${r.status}); keeping the last successful snapshot.`);
   }
   projects.push({...project,readme});
  }
  if(repos.length<100)break;
 }
 projects.sort((a,b)=>a.name.localeCompare(b.name,'en'));
 const changed=!previous||previous.owner!==username||JSON.stringify(previous.projects)!==JSON.stringify(projects);
 return {changed,snapshot:changed?{syncedAt:new Date().toISOString(),owner:username,projects}:previous};
}

export async function saveSnapshot(snapshot,{base=root}={}){
 await mkdir(new URL('data/',base),{recursive:true});
 // Covers must exist before any request can see the new project list.
 await createCovers(snapshot,new URL('public/assets/projects/',base));
 const target=new URL('data/github-snapshot.json',base);
 const temp=new URL(`data/github-snapshot.${process.pid}.${Date.now()}.tmp`,base);
 try{await writeFile(temp,JSON.stringify(snapshot,null,2)+'\n');await rename(temp,target);}
 finally{await rm(temp,{force:true});}
}

export function createGitHubSync({username,intervalMs=300000,base=root,fetchImpl=fetch,logger=console}={}){
 let pending=null,timer=null,retryAt=0;
 const state={lastCheckedAt:null,lastSuccessAt:null,lastError:null,nextCheckAt:null};
 async function refresh(){
  if(pending)return pending;
  if(Date.now()<retryAt)return {skipped:true};
  pending=(async()=>{
   state.lastCheckedAt=new Date().toISOString();
   try{
    let previous=null;try{previous=JSON.parse(await readFile(new URL('data/github-snapshot.json',base),'utf8'));}catch{}
    const result=await collectGitHub(username,{fetchImpl,previous});
    if(result.changed)await saveSnapshot(result.snapshot,{base});
    state.lastSuccessAt=new Date().toISOString();state.lastError=null;retryAt=0;
    if(result.changed)logger.info(`GitHub refreshed: ${result.snapshot.projects.length} public projects.`);
    return result;
   }catch(error){state.lastError=error.message;retryAt=Math.max(Date.now()+intervalMs,error.retryAt||0);logger.warn(error.message);return {error:error.message};}
   finally{state.nextCheckAt=new Date(Math.max(Date.now()+intervalMs,retryAt)).toISOString();pending=null;}
  })();return pending;
 }
 return {refresh,status:()=>({...state,refreshing:!!pending,intervalMs}),start(){if(timer)return;void refresh();timer=setInterval(()=>void refresh(),intervalMs);timer.unref();},stop(){clearInterval(timer);timer=null;}};
}
