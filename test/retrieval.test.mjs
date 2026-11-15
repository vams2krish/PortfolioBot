import test from 'node:test';
import assert from 'node:assert/strict';
import {retrieve,bookingIntent,validBooking,documents} from '../retrieval.mjs';
const p={name:'Ada',role:'Engineer',bio:'Builds tools',location:'London',skills:['Rust'],experience:'Compiler work',projects:[{title:'Nebula',category:'Science',description:'Astronomy maps',tags:['Space']}]};
test('retrieval ranks relevant project above bio',()=>assert.equal(retrieve('Tell me about astronomy',p)[0].source,'Project: Nebula'));
test('booking intents match natural questions',()=>{for(const q of ['Can we collaborate?','Book a discovery call','Are you available?','Let us work together'])assert.ok(bookingIntent(q));assert.equal(bookingIntent('What skills do you have?'),false);});
test('booking links must use real Calendly HTTPS domain',()=>{assert.ok(validBooking('https://calendly.com/person/intro'));for(const u of ['javascript:alert(1)','https://calendly.com.evil.com/x','http://calendly.com/x',''])assert.equal(validBooking(u),false);});
test('README details are retrievable with their source repository',()=>{const profile={...p,projects:[{...p.projects[0],url:'https://github.com/ada/nebula',readme:'The telescope engine supports adaptive optics and star maps.'}]};const found=retrieve('adaptive optics',profile)[0];assert.match(found.source,/README/);assert.equal(found.url,'https://github.com/ada/nebula');assert.match(found.text,/adaptive optics/);});
test('all-project overview includes every repository',()=>{const profile={...p,projects:Array.from({length:11},(_,i)=>({...p.projects[0],title:`Repo${i}`}))};const result=retrieve('List all public GitHub projects',profile)[0];assert.equal(result.source,'All public GitHub projects');for(let i=0;i<11;i++)assert.ok(result.text.includes(`Repo${i}`));});
