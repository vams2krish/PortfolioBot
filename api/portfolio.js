import {handle} from '../server.mjs';

export default function handler(req,res){
 const route=new URL(req.url,'http://localhost').searchParams.get('endpoint');
 if(!['profile','status','chat','avatar'].includes(route))return res.status(404).json({error:'Not found'});
 req.url='/api/'+route;
 return handle(req,res);
}
