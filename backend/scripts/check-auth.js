import 'dotenv/config';
import {createTokenVerifier} from '../src/auth.js';
const issuer=process.env.AUTH_ISSUER;
if(!issuer)throw new Error('AUTH_ISSUER is required');
const key=process.env.SUPABASE_PUBLISHABLE_KEY;
if(!key?.startsWith('sb_publishable_'))throw new Error('Set SUPABASE_PUBLISHABLE_KEY in backend/.env');
const response=await fetch(issuer+'/settings',{headers:{apikey:key},signal:AbortSignal.timeout(15000)});
if(!response.ok)throw new Error(`Supabase settings check failed (${response.status})`);
const settings=await response.json();
console.log('Supabase public key accepted. Email authentication enabled:',settings.external?.email===true);
// Use a user token only when explicitly supplied locally. Never log tokens.
const token=process.env.AUTH_TEST_ACCESS_TOKEN;
if(token){
 const verify=createTokenVerifier({issuer,jwksUrl:process.env.AUTH_JWKS_URL});
 await verify(token);
 const user=await fetch(issuer+'/user',{headers:{apikey:key,authorization:`Bearer ${token}`},signal:AbortSignal.timeout(15000)});
 if(!user.ok)throw new Error(`Live user session check failed (${user.status})`);
 console.log('Live user session and JWT signature verified.');
}else console.log('Live user session check pending: set AUTH_TEST_ACCESS_TOKEN locally after signing in.');
