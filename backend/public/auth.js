import {createSession} from './session.js';
import {mountWorkspace} from './workspace.js';
let unmount;
const $=id=>document.getElementById(id);
const config=await fetch('/auth-config').then(r=>r.json());
const credentials=createSession(refreshToken=>auth('/token?grant_type=refresh_token',{refresh_token:refreshToken}));
async function auth(path,body){
 const r=await fetch(config.issuer+path,{method:'POST',headers:{apikey:config.publishableKey,'content-type':'application/json'},body:JSON.stringify(body)});
 const data=await r.json();
 if(data.code==='over_email_send_rate_limit')throw new Error('Confirmation email limit reached. If you already confirmed your account, use Sign in. Otherwise wait for the email allowance to reset; repeated signup attempts will not help.');
 if(!r.ok)throw new Error(data.msg || data.error_description || data.message || 'Sign-in failed');return data;
}
async function api(path,method='GET',body){
 const token=await credentials.access();
 const r=await fetch('/api/v2'+path,{method,headers:{authorization:'Bearer '+token,'content-type':'application/json'},body:body?JSON.stringify(body):undefined});
 const data=await r.json();if(!r.ok){const e=new Error(data.error);e.status=r.status;throw e;}return data;
}
async function busy(fn){
 document.querySelectorAll('button').forEach(b=>b.disabled=true);$('status').textContent='Connecting…';
 try{await fn();}catch(e){$('status').textContent=e.message;}finally{document.querySelectorAll('button').forEach(b=>b.disabled=false);}
}
function showAccount(user){unmount?.();unmount=mountWorkspace({api,user});$('login').hidden=true;$('profile').hidden=true;$('account').hidden=false;$('greeting').textContent='Welcome, '+user.display_name;$('details').textContent='Your '+(user.role==='influencer'?'creator':user.role)+' profile is ready.';$('status').textContent='Live sign-in and backend profile verified.';}
async function session(data){
 if(!data.access_token){$('status').textContent='Check your email to confirm your account, then return here to sign in.';return;}
 credentials.set(data);$('password').value='';
 try{showAccount(await api('/me'));}catch(e){if(e.status!==403)throw e;$('login').hidden=true;$('profile').hidden=false;$('status').textContent='Signed in. Choose your role and display name to continue.';}
}
$('login').onsubmit=e=>{e.preventDefault();busy(()=>auth('/token?grant_type=password',{email:$('email').value,password:$('password').value}).then(session));};
$('signup').onclick=()=>{if(!$('login').reportValidity())return;busy(()=>auth('/signup',{email:$('email').value,password:$('password').value}).then(session));};
$('profile').onsubmit=e=>{e.preventDefault();busy(async()=>showAccount(await api('/profile','PUT',{role:$('role').value,display_name:$('name').value})));};
$('logout').onclick=()=>busy(async()=>{
 try{const token=await credentials.access();await fetch(config.issuer+'/logout',{method:'POST',headers:{apikey:config.publishableKey,authorization:'Bearer '+token}});}finally{unmount?.();unmount=undefined;credentials.clear();$('account').hidden=true;$('profile').hidden=true;$('login').hidden=false;$('status').textContent='Signed out.';}
});
if(!config.publishableKey){$('status').textContent='Authentication configuration is missing.';document.querySelectorAll('button').forEach(b=>b.disabled=true);}
