import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {once} from 'node:events';
import {handle} from '../server.mjs';

test('hosted product serves the gallery, scoped sources, and booking without local inference', async t=>{
 const original=process.env.VERCEL;
 process.env.VERCEL='1';
 const server=createServer(handle).listen(0,'127.0.0.1');
 t.after(()=>{server.close();if(original===undefined)delete process.env.VERCEL;else process.env.VERCEL=original;});
 await once(server,'listening');
 const base='http://127.0.0.1:'+server.address().port;
 const get=path=>fetch(base+path);
 const chat=body=>fetch(base+'/api/chat',{method:'POST',body});
 const gallery=await (await get('/api/profile')).json();
 const project=gallery.projects.find(p=>p.title==='ResearchPal');
 assert.ok(project.image&&project.url);
 assert.equal(project.readme,undefined);
 assert.match((await get('/assets/vamshi-headshot.jpg')).headers.get('content-type'),/^image\/jpeg/);
 const answer=await (await chat(JSON.stringify({message:'Explain this project',project:project.title}))).json();
 assert.equal(answer.mode,'retrieval');
 assert.ok(answer.sources.every(source=>source.includes(project.title)));
 assert.ok(answer.sourceLinks.some(source=>source.url===project.url));
 const booking=await (await chat(JSON.stringify({message:'Book a call'}))).json();
 assert.equal(new URL(booking.bookingUrl).hostname,'calendly.com');
 assert.equal((await chat('{')).status,400);
 assert.equal((await chat('x'.repeat(21000))).status,413);
});
