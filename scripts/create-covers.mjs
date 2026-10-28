import {mkdir,writeFile} from 'node:fs/promises';
import {githubSnapshot,portfolioProjects} from '../github.mjs';
const output=new URL('../public/assets/projects/',import.meta.url);await mkdir(output,{recursive:true});
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const colors=['#e7e9fb','#fae8b9','#e3edcb','#f6d7cb','#dceaf0'];
for(const [i,p] of portfolioProjects(await githubSnapshot()).entries()){
 const title=p.title.replace(/-/g,' ');const lines=title.match(/.{1,24}(?:\s|$)|.{1,24}/g)||[title];
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="560" viewBox="0 0 800 560"><rect width="800" height="560" rx="12" fill="${colors[i%colors.length]}"/><path d="M0 480Q400 400 800 480" stroke="#20231f" stroke-opacity=".08" fill="none"/><circle cx="665" cy="120" r="80" fill="none" stroke="#20231f" stroke-opacity=".08"/><g transform="translate(400 230) rotate(${i%2?8:-8})"><rect x="-145" y="-135" width="290" height="260" rx="45" fill="#fff" fill-opacity=".7" stroke="#252723" stroke-width="3"/><text y="20" text-anchor="middle" font-family="Arial,sans-serif" font-size="95" fill="#343c2d">${escape(p.symbol)}</text><circle cx="-40" cy="65" r="5" fill="#353a31"/><circle cx="40" cy="65" r="5" fill="#353a31"/><path d="M-16 78q16 13 32 0" fill="none" stroke="#353a31" stroke-width="3" stroke-linecap="round"/></g><text x="35" y="45" font-size="13" font-family="Arial,sans-serif" fill="#333b2e" letter-spacing="2">${escape(p.category.toUpperCase())}</text><text x="765" y="45" text-anchor="end" font-size="12" font-family="Arial,sans-serif" fill="#333b2e">${String(i+1).padStart(2,'0')} / VKA</text>${lines.slice(0,2).map((line,j)=>`<text x="400" y="${447+j*40}" text-anchor="middle" font-family="Arial,sans-serif" font-size="32" fill="#282f25">${escape(line.trim())}</text>`).join('')}<text x="400" y="535" text-anchor="middle" font-family="Arial,sans-serif" font-size="10" fill="#53604b" letter-spacing="2">ILLUSTRATED PROJECT COVER · EXPLORE THE CODE ↗</text></svg>`;
 await writeFile(new URL(`${p.title}.svg`,output),svg);
}
console.log('Project cover illustrations ready.');
