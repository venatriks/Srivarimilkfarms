'use strict';
const crypto = require('node:crypto');
const {createClient} = require('@supabase/supabase-js');
const hash = code => crypto.createHash('sha256').update(code).digest('hex');
function phone(value) {
  let p = String(value || '').replace(/[\s()-]/g, '');
  if (/^[6-9]\d{9}$/.test(p)) p = '+91' + p;
  return /^\+[1-9]\d{7,14}$/.test(p) ? p : null;
}
async function handleWhatsAppVerification(event, headers) {
 const reply = (statusCode, body) => ({statusCode, headers:{...headers,'Cache-Control':'no-store'},body:JSON.stringify(body)});
 try {
  const token = Object.entries(event.headers || {}).find(([k]) => k.toLowerCase()==='authorization')?.[1]?.match(/^Bearer (\S+)$/i)?.[1];
  if (!token) return reply(401,{error:'Sign in required'});
  const db = createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:auth,error:ae} = await db.auth.getUser(token);
  if (ae || !auth?.user) return reply(401,{error:'Sign in required'});
  const id=auth.user.id;
  const {data:profile,error:pe}=await db.from('profiles').select('phone,role').eq('id',id).single();
  if(pe || profile?.role !== 'customer') return reply(403,{error:'Customer account required'});
  const p=phone(profile.phone);
  if(!p) return reply(400,{error:'Update your profile phone first'});
  const method=event.requestContext?.http?.method || event.httpMethod;
  if(method==='GET') {
   const {data,error}=await db.rpc('whatsapp_has_verified_consent',{p_phone_number:p,p_customer_id:id,p_guest_order_id:null});
   if(error) throw error;
   return reply(200,{verified:data===true});
  }
  if(method!=='POST') return reply(405,{error:'Method not allowed'});
  let body; try {body=JSON.parse(event.body||'{}');} catch {return reply(400,{error:'Invalid request'});}
  if(body.consent!==true) return reply(400,{error:'Consent required'});
  const business=process.env.WHATSAPP_PUBLIC_NUMBER;
  if(!/^[1-9]\d{7,14}$/.test(business||'')) return reply(503,{error:'WhatsApp unavailable'});
  const code=crypto.randomBytes(16).toString('hex');
  const {error}=await db.rpc('whatsapp_start_customer_verification',{p_customer_id:id,p_phone:p,p_hash:hash(code)});
  if(error) return reply(error.code==='P0001'?429:503,{error:'Unable to start verification. Try again shortly.'});
  return reply(200,{url:`https://wa.me/${business}?text=${encodeURIComponent('VERIFY '+code)}`});
 } catch {return reply(503,{error:'WhatsApp unavailable'});}
}
module.exports={handleWhatsAppVerification,hash};
