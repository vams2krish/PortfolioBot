import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {collectGitHub,createGitHubSync,saveSnapshot} from '../github-sync.mjs';
import {portfolioProjects} from '../github.mjs';
const repo=(name,extra={})=>({name,private:false,owner:{login:'vam'},description:`${name} description`,language:'JavaScript',topics:[],html_url:`https://github.com/vam/${name}`,default_branch:'main',stargazers_count:0,fork:false,archived:false,pushed_at:'2026-10-28T10:00:00Z',...extra});
function fake(repos,readmes={}){return async url=>{if(url.includes('api.github.com'))return Response.json(repos);const name=decodeURIComponent(new URL(url).pathname.split('/')[2]);return readmes[name]?new Response(readmes[name]):new Response('',{status:404});};}
test('new public repos and changed descriptions and README content are reflected',async()=>{
 const initial=(await collectGitHub('vam',{fetchImpl:fake([repo('A')],{A:'Old README'})})).snapshot;
 const result=await collectGitHub('vam',{previous:initial,fetchImpl:fake([repo('A',{description:'New description'}),repo('B')],{A:'Updated README',B:'New project README'})});
 assert.ok(result.changed);assert.equal(result.snapshot.projects.length,2);assert.equal(result.snapshot.projects[0].readme,'Updated README');assert.equal(portfolioProjects(result.snapshot).find(p=>p.title==='A').description,'New description');
});
test('all repository pages are followed and non-public or removed repositories are excluded',async()=>{
 let pages=0;const fetchImpl=async url=>{if(url.includes('api.github.com')){pages++;return Response.json(pages===1?Array.from({length:100},(_,i)=>repo(`Repo${i}`)):[repo('Hidden',{private:true}),repo('Outside',{owner:{login:'another'}}),repo('Last')]);}return new Response('',{status:404});};
 const {snapshot}=await collectGitHub('vam',{fetchImpl,previous:{owner:'vam',projects:[repo('Removed')]}});
 assert.equal(pages,2);assert.equal(snapshot.projects.length,101);assert.ok(!snapshot.projects.some(p=>['Hidden','Outside','Removed'].includes(p.name)));
});
test('no changes preserve timestamp; own bot pushes do not cause endless commits',async()=>{
 const {snapshot}=await collectGitHub('vam',{fetchImpl:fake([repo('PortfolioBot')])});
 const next=await collectGitHub('vam',{previous:snapshot,fetchImpl:fake([repo('PortfolioBot',{pushed_at:'2026-10-29T00:00:00Z'})])});
 assert.equal(next.changed,false);assert.equal(next.snapshot.syncedAt,snapshot.syncedAt);
});
test('failed README imports keep the complete last successful snapshot intact',async t=>{
 const folder=await mkdtemp(join(tmpdir(),'portfolio-sync-'));const base=pathToFileURL(folder+'/');t.after(()=>rm(folder,{recursive:true,force:true}));
 const {snapshot}=await collectGitHub('vam',{fetchImpl:fake([repo('A')],{A:'Saved README'})});await saveSnapshot(snapshot,{base});
 const sync=createGitHubSync({username:'vam',base,logger:{warn(){},info(){}},fetchImpl:async url=>url.includes('api.github.com')?Response.json([repo('B')]):new Response('',{status:503})});
 const result=await sync.refresh();assert.ok(result.error);assert.ok(sync.status().lastError);assert.deepEqual(JSON.parse(await readFile(new URL('data/github-snapshot.json',base))),snapshot);
});
test('overlapping refresh requests share one import',async t=>{
 const folder=await mkdtemp(join(tmpdir(),'portfolio-sync-'));const base=pathToFileURL(folder+'/');t.after(()=>rm(folder,{recursive:true,force:true}));let count=0;
 const sync=createGitHubSync({username:'vam',base,logger:{warn(){},info(){}},fetchImpl:async url=>{if(url.includes('api.github.com')){count++;return Response.json([repo('A')]);}return new Response('',{status:404});}});
 const [a,b]=await Promise.all([sync.refresh(),sync.refresh()]);assert.equal(count,1);assert.deepEqual(a,b);assert.ok(sync.status().lastSuccessAt);assert.equal(sync.status().lastError,null);
});
test('rate-limit failures respect GitHub reset time and retain saved data',async t=>{
 const folder=await mkdtemp(join(tmpdir(),'portfolio-sync-'));const base=pathToFileURL(folder+'/');t.after(()=>rm(folder,{recursive:true,force:true}));let count=0;
 const sync=createGitHubSync({username:'vam',base,logger:{warn(){},info(){}},fetchImpl:async()=>{count++;return new Response('',{status:403,headers:{'x-ratelimit-reset':String(Math.ceil(Date.now()/1000)+3600)}});}});
 await sync.refresh();assert.equal((await sync.refresh()).skipped,true);assert.equal(count,1);assert.ok(Date.parse(sync.status().nextCheckAt)>Date.now()+3500000);
});
