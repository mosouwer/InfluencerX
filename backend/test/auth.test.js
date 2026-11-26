import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {generateKeyPair,exportJWK,SignJWT} from 'jose';
import {createTokenVerifier} from '../src/auth.js';
test('signed tokens verify against JWKS and reject invalid claims or signatures',async()=>{
 const {publicKey,privateKey}=await generateKeyPair('ES256');
 const jwk={...await exportJWK(publicKey),kid:'test',alg:'ES256',use:'sig'};
 const server=createServer((_req,res)=>{res.setHeader('content-type','application/json');res.end(JSON.stringify({keys:[jwk]}));});
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
 try{
  const issuer=`http://127.0.0.1:${server.address().port}`;
  const verify=createTokenVerifier({issuer,jwksUrl:issuer+'/jwks'});
  const sign=(claims={},key=privateKey)=>new SignJWT({sub:'11111111-1111-4111-8111-111111111111',iss:issuer,aud:'authenticated',iat:Math.floor(Date.now()/1000),exp:Math.floor(Date.now()/1000)+60,...claims}).setProtectedHeader({alg:'ES256',kid:'test'}).sign(key);
  assert.equal((await verify(await sign())).iss,issuer);
  for(const claims of [{iss:'wrong'},{aud:'wrong'},{exp:1},{exp:undefined}])await assert.rejects(()=>sign(claims).then(verify));
  const other=await generateKeyPair('ES256');
  await assert.rejects(()=>sign({},other.privateKey).then(verify));
 }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});
