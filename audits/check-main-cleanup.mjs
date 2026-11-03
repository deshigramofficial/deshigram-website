// Read-only regression checks for MAIN website cleanup.
// Run: node audits/check-main-cleanup.mjs
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const home=read('index.html'), shell=read('js/site-shell.js'), slider=read('js/premium-final.js');
const admin=read('admin.html'), banners=read('js/website-customization.js');
const checks=[
 ['Homepage still loads cart',home.includes('js/cart.js')],
 ['Homepage still loads admin banner customization',home.includes('js/website-customization.js')],
 ['Homepage still loads shared site shell',home.includes('js/site-shell.js')],
 ['Homepage still loads carousel controller',home.includes('js/premium-final.js')],
 ['Shared shell still renders header',shell.includes('data-common-header')],
 ['Shared shell readiness signal',shell.includes('dg-shell-ready')],
 ['Admin banner update event preserved',banners.includes('dg:banners-updated')],
 ['Banner initial readiness listener',home.includes("addEventListener('dg:banners-updated'")],
 ['Mobile frame matches active artwork',slider.includes('img.naturalWidth')],
 ['Admin still loads commerce stylesheet',admin.includes('css/product-commerce-v3.css')],
 ['Admin still loads customization stylesheet',admin.includes('css/website-customization-admin.css')],
 ['DeshiGram NOW navigation still present',shell.includes('quick-delivery.html')],
 ['No fixed 3.5s-only mobile ratio dependency',slider.includes('syncMobileFrame')],
];
let failed=0;
for(const [name,ok] of checks){console.log((ok?'PASS':'FAIL')+' '+name);if(!ok)failed++;}
assert.equal(failed,0,failed+' regression checks failed');
console.log('All '+checks.length+' source integrity checks passed. Browser and payment tests remain required.');
