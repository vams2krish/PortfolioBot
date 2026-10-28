import {readFile} from 'node:fs/promises';
import {githubSnapshot} from '../github.mjs';
import {collectGitHub,saveSnapshot} from '../github-sync.mjs';
const profile=JSON.parse(await readFile(new URL('../profile.json',import.meta.url),'utf8'));
const username=process.argv[2]||profile.githubUsername;
const previous=await githubSnapshot().catch(()=>null);
const result=await collectGitHub(username,{previous});
if(result.changed)await saveSnapshot(result.snapshot);
console.log(`${result.changed?'Refreshed':'Already current:'} ${result.snapshot.projects.length} public repositories; ${result.snapshot.projects.filter(p=>p.readme).length} READMEs.`);
