import {createRemoteJWKSet,jwtVerify} from 'jose';
export function createTokenVerifier({issuer,jwksUrl}) {
 const jwks=createRemoteJWKSet(new URL(jwksUrl));
 return async token => (await jwtVerify(token,jwks,{
  issuer,audience:'authenticated',algorithms:['RS256','ES256'],requiredClaims:['sub','exp','iat']
 })).payload;
}
