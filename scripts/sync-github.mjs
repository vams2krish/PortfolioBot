import {writeFile,mkdir} from 'node:fs/promises';
const base=new URL('../',import.meta.url);
const username=process.argv[2]||'vams2krish';
if(!/^[a-z\d-]+$/i.test(username))throw Error('Invalid GitHub username');
async function api(url){const r=await fetch(url,{headers:{'User-Agent':'PersonalPortfolio','Accept':'application/vnd.github+json'},signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error(`GitHub returned ${r.status}. Existing snapshot is unchanged.`);return r.json();}
const projects=[];
for(let page=1;;page++){const repos=await api(`https://api.github.com/users/${username}/repos?per_page=100&type=owner&sort=updated&page=${page}`);projects.push(...repos.filter(p=>!p.private).map(p=>({name:p.name,description:p.description,language:p.language,topics:p.topics||[],url:p.html_url,branch:p.default_branch,stars:p.stargazers_count,fork:p.fork,archived:p.archived})));if(repos.length<100)break;}
const readmes={};
for(const p of projects){for(const filename of ['README.md','readme.md','README.rst','README']){const r=await fetch(`https://raw.githubusercontent.com/${username}/${p.name}/${p.branch}/${filename}`,{signal:AbortSignal.timeout(15000)});if(r.ok){readmes[p.name]=(await r.text()).slice(0,16000);break;}if(r.status!==404)throw Error(`README sync returned ${r.status}; snapshot not replaced`);}}
await mkdir(new URL('data/',base),{recursive:true});
await writeFile(new URL('data/github-readmes.json',base),JSON.stringify(readmes,null,2)+'\n');
await writeFile(new URL('data/github-projects.json',base),JSON.stringify({syncedAt:new Date().toISOString(),owner:username,projects},null,2)+'\n');
console.log(`Saved all ${projects.length} public repositories and ${Object.keys(readmes).length} READMEs.`);
await import('./create-covers.mjs');
