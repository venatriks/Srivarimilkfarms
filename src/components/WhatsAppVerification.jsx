import React,{useState} from 'react';
import {supabase} from '../lib/supabase';
import {WHATSAPP_API_BASE_URL} from '../lib/apiConfig';
export default function WhatsAppVerification(){
 const [consent,setConsent]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[url,setUrl]=useState('');
 async function request(method){
  setBusy(true);setMessage('');if(method==='POST')setUrl('');
  try{
   const {data}=await supabase.auth.getSession();
   if(!data?.session)throw new Error('Please sign in');
   const response=await fetch(`${WHATSAPP_API_BASE_URL.replace(/\/$/,'')}/whatsapp/verification`,{method,headers:{Authorization:`Bearer ${data.session.access_token}`,...(method==='POST'?{'Content-Type':'application/json'}:{})},...(method==='POST'?{body:JSON.stringify({consent})}:{})});
   const result=await response.json();if(!response.ok)throw new Error(result.error||'Request failed');
   if(method==='POST'){setUrl(result.url);setMessage('Open WhatsApp and send the prefilled message within 10 minutes.');}else setMessage(result.verified?'WhatsApp verified':'Not verified yet');
  }catch(e){setMessage(e.message);}finally{setBusy(false);}
 }
 return <section className="bg-white border rounded-xl p-4 space-y-3 mb-6"><h2 className="font-bold">WhatsApp notifications</h2><label className="flex gap-2"><input type="checkbox" checked={consent} onChange={e=>{setConsent(e.target.checked);setUrl('');}}/>I agree to receive order, payment and subscription updates on WhatsApp.</label><div className="flex gap-3 flex-wrap"><button type="button" disabled={!consent||busy} onClick={()=>request('POST')} className="border rounded px-3 py-2 disabled:opacity-50">Verify WhatsApp</button><button type="button" disabled={busy} onClick={()=>request('GET')} className="border rounded px-3 py-2">Check status</button>{url&&<a href={url} target="_blank" rel="noopener noreferrer" className="underline text-green-700">Open WhatsApp</a>}</div><p role="status">{message}</p></section>;
}
