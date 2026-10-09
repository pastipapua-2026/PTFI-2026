import {mkdir,cp,rm,access} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root = new URL('../', import.meta.url);
const dist = new URL('dist/',root);
await rm(dist,{recursive:true,force:true});
await mkdir(dist,{recursive:true});
for(const file of ['index.html','assets','.nojekyll']) await cp(new URL(file,root),new URL(file,dist),{recursive:true});
try { await access(new URL('data/',root)); await cp(new URL('data/',root),new URL('data/',dist),{recursive:true}); } catch(error) { if(error.code !== 'ENOENT') throw error; }
console.log(`Dashboard siap di ${fileURLToPath(dist)}`);
