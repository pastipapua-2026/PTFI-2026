import {mkdir,cp,rm} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=new URL('../',import.meta.url), dist=new URL('dist/',root);
await rm(dist,{recursive:true,force:true});
await mkdir(dist,{recursive:true});
for(const f of ['index.html','assets','data','.nojekyll']) await cp(new URL(f,root),new URL(f,dist),{recursive:true});
console.log(`Situs siap di ${fileURLToPath(dist)}`);
