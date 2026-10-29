import {readFile} from 'node:fs/promises';
import {discoverProjectLinks} from './project-links.mjs';
const root=new URL('./',import.meta.url);
export async function githubSnapshot(){
 return JSON.parse(await readFile(new URL('data/github-snapshot.json',root),'utf8'));
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
 return snapshot.projects.map((p,i)=>{const n=notes[p.name]||['Experiments','Explore this public repository on GitHub.','✳'];const excerpt=(p.readme||'').replace(/<!--[\s\S]*?-->/g,'').split(/\n\s*\n/).find(s=>!/^\s*[#<\[!|`]/.test(s)&&s.trim().length>35)?.replace(/[*_`]/g,'').replace(/\s+/g,' ').trim().slice(0,240);return {title:p.name,category:n[0],description:p.description||excerpt||n[1],image:p.images?.[0]?.url||`/assets/projects/${p.name}.svg`,imageLabel:p.images?.[0]?.alt||'Illustrated project cover',images:p.images||[],fallbackImage:'/assets/projects/'+p.name+'.svg',tags:[p.language,...(p.topics||[])].filter(Boolean),url:p.url,liveLinks:p.liveLinks||discoverProjectLinks(p),readme:p.readme,stars:p.stars,fork:p.fork,archived:p.archived,pushedAt:p.pushedAt,symbol:n[2],order:featured.includes(p.name)?featured.indexOf(p.name):10+i};}).sort((a,b)=>a.order-b.order);
}
