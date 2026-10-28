import {readFile} from 'node:fs/promises';
const root=new URL('./',import.meta.url);
export async function githubSnapshot(){
 const data=JSON.parse(await readFile(new URL('data/github-projects.json',root),'utf8'));
 let readmes={};try{readmes=JSON.parse(await readFile(new URL('data/github-readmes.json',root),'utf8'));}catch{}
 return {...data,projects:data.projects.map(p=>({...p,readme:readmes[p.name]||''}))};
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
 return snapshot.projects.map((p,i)=>{const n=notes[p.name]||['Experiments',p.description||'Explore this public repository on GitHub.','✳'];return {title:p.name,category:n[0],description:n[1],image:`/assets/projects/${p.name}.svg`,imageLabel:'Illustrated project cover',tags:[p.language,...p.topics].filter(Boolean),url:p.url,readme:p.readme,stars:p.stars,fork:p.fork,archived:p.archived,symbol:n[2],order:featured.includes(p.name)?featured.indexOf(p.name):10+i};}).sort((a,b)=>a.order-b.order);
}
