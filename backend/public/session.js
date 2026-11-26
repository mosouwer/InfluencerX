// Session credentials stay in memory. A page reload requires signing in again.
export function createSession(refresh,now=()=>Date.now()) {
 let current,renewal;
 let generation=0;
 return {
  set(data){generation++;current={...data,expires_at:data.expires_at || Math.floor(now()/1000)+(data.expires_in || 3600)};},
  clear(){generation++;current=undefined;},
  async access(){
   if(!current)throw new Error('Please sign in to continue.');
   if(current.expires_at*1000-now()>60000)return current.access_token;
   if(!renewal){
    const version=generation,refreshToken=current.refresh_token;
    renewal=(async()=>{
     try{
      const data=await refresh(refreshToken);
      if(generation!==version)throw new Error('Session changed. Please sign in again.');
      current={...data,expires_at:data.expires_at || Math.floor(now()/1000)+data.expires_in};
      return current.access_token;
     }catch(e){if(generation===version)current=undefined;throw e;}
     finally{renewal=undefined;}
    })();
   }
   return renewal;
  }
 };
}
