import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {githubSnapshot,portfolioProjects} from '../github.mjs';
import {retrieve} from '../retrieval.mjs';
test('every imported public repository has a cover and knowledge entry',async()=>{const snapshot=await githubSnapshot();const projects=portfolioProjects(snapshot);assert.equal(projects.length,snapshot.projects.length);assert.equal(new Set(projects.map(p=>p.url)).size,projects.length);const profile={...JSON.parse(await readFile(new URL('../profile.json',import.meta.url))),projects};for(const p of projects){await access(new URL('../public'+p.image,import.meta.url));assert.ok(retrieve(p.title,profile).some(d=>d.source.includes(p.title)));}});
