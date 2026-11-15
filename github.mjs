import {readFile} from 'node:fs/promises';
import {discoverProjectLinks} from './project-links.mjs';
const root=new URL('./',import.meta.url);
let hostedSnapshot;
let expires=0;
let refresh;
export async function githubSnapshot(){
 if(process.env.VERCEL){
  if(Date.now()>=expires&&!refresh){
   refresh=(async()=>{
    try{
     const response=await fetch('https://raw.githubusercontent.com/vams2krish/PortfolioBot/main/data/github-snapshot.json',{signal:AbortSignal.timeout(3500)});
     if(response.ok){
      const snapshot=await response.json();
      if(snapshot.owner==='vams2krish'&&Array.isArray(snapshot.projects)&&snapshot.projects.length)hostedSnapshot=snapshot;
     }
    }catch{ /* Keep the last working catalog during a network outage. */ }
    finally{expires=Date.now()+300000;refresh=null;}
   })();
  }
  await refresh;
  if(hostedSnapshot)return hostedSnapshot;
 }
 return JSON.parse(await readFile(new URL('data/github-snapshot.json',root),'utf8'));
}
function projectCategory(project){
 const text=[project.name,...(project.topics||[]),project.description].join(' ').toLowerCase();
 if(/computer.vision|\bocr\b|image.classification|pose.estimation|gesture|spatial|3d|signbridge/.test(text))return 'Computer vision';
 if(/genai|ollama|llm|assistant|chatbot|generative|agent|researchpal/.test(text))return 'AI & tools';
 if(/machine.learning|deep.learning|regression|recommendation|notebook|segmentation|^ml-/.test(text))return 'Machine learning';
 if(/game|gameplay/.test(text))return 'Games';
 if(/network|websocket|sync|sharing/.test(text))return 'Networking';
 if(/app|platform|dashboard|website|browser/.test(text))return 'Applications';
 return 'Experiments';
}
const notes={
 'ResearchPal':['AI & tools','A local research-paper companion with section breakdowns, paper chat, cross-paper synthesis, and spaced-repetition flashcards.','📚'],
 'MathBlitz':['Web apps','Daily-life math practice, five difficulty levels, twelve scenario categories, and a FastAPI-powered browser interface.','✳'],
 'ClariSEE':['AI & tools','A Flutter app for turning text into diagrams, quizzes, summaries, and NLP insights.','👀'],
 'PDRides':['Web apps','A community carpooling platform connecting drivers and passengers through WhatsApp and Telegram bots.','↗'],
 'OCR':['AI & tools','A Python and Streamlit app that extracts English text from images and PDF documents using Tesseract.','Aa'],
 'Books-Recommendation-system':['Machine learning','A book recommender using collaborative filtering, nearest neighbors, and a Streamlit interface.','▤'],
 'Zoo-Animal-Classification-ML':['Machine learning','Classifying zoo animals from their characteristics with Python, scikit-learn, and exploratory data analysis.','🦒'],
 'Kidney-prediction-deep-learning':['Machine learning','A kidney CT image classification project using deep learning, MLflow, DVC, and a Flask application.','◎'],
 'Image-Classification':['Machine learning','Deep-learning image classification with neural networks and TensorFlow data pipelines.','▧'],
 'Boston-Housing-Price-Linear-Regression':['Machine learning','A linear-regression learning project with a Jupyter notebook and interactive Streamlit predictions.','⌂'],
 'simple-browser':['Experiments','A public repository with no published description or README yet. Peek at the source for its current state.',': )']
};
export function portfolioProjects(snapshot){
 const featured=['ResearchPal','MathBlitz','ClariSEE','PDRides'];
 return snapshot.projects.map((p,i)=>{const n=notes[p.name]||['Experiments','Explore this public repository on GitHub.','✳'];const excerpt=(p.readme||'').replace(/<!--[\s\S]*?-->/g,'').split(/\n\s*\n/).find(s=>!/^\s*[#<\[!|`]/.test(s)&&s.trim().length>35)?.replace(/[*_`]/g,'').replace(/\s+/g,' ').trim().slice(0,240);return {title:p.name,category:notes[p.name]?.[0]||projectCategory(p),description:p.description||excerpt||n[1],image:p.images?.[0]?.url||`/assets/projects/${p.name}.svg`,imageLabel:p.images?.[0]?.alt||'Illustrated project cover',images:p.images||[],fallbackImage:'/assets/projects/'+p.name+'.svg',language:p.language||null,tags:[...new Set([p.language,...(p.topics||[])].filter(Boolean))],url:p.url,liveLinks:p.liveLinks||discoverProjectLinks(p),readme:p.readme,stars:p.stars,fork:p.fork,archived:p.archived,pushedAt:p.pushedAt,details:excerpt&&excerpt!==p.description?excerpt:null,symbol:n[2],order:featured.includes(p.name)?featured.indexOf(p.name):10+i};}).sort((a,b)=>a.order-b.order);
}
