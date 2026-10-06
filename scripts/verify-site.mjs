import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import getAgency from '../_blog/data/agency.mjs';
import {agencySchema} from '../_blog/lib/agency-schema.mjs';

const agency = getAgency();
const site = JSON.parse(fs.readFileSync('_blog/data/site.json','utf8'));
const serviceUrls = new Set(agency.services.map(p=>p.url));
assert.equal(agency.services.length, 8);
assert.equal(agency.pages.length, 11);
assert.equal(new Set(agency.pages.map(p=>p.url)).size, agency.pages.length);
assert.equal(new Set(agency.pages.map(p=>p.title)).size, agency.pages.length);
for(const page of agency.pages) {
  assert.ok(page.description.length>80, `Useful metadata: ${page.url}`);
  const schema = agencySchema(page,site);
  assert.ok(schema['@graph'].some(x=>x['@id']===site.url+page.url));
  if(page.kind==='service') {
    assert.ok(page.work.length>=2, `Real proof: ${page.url}`);
    assert.ok(page.faqs.length>=3, `Specific answers: ${page.url}`);
    for(const link of page.related) assert.ok(serviceUrls.has(link.url), `Related route: ${link.url}`);
    assert.deepEqual(schema['@graph'].find(x=>x['@type']==='FAQPage').mainEntity.map(x=>[x.name,x.acceptedAnswer.text]),page.faqs);
  }
}
assert.equal(agency.groups.flatMap(g=>g.items).length,agency.work.length, 'All work assigned once');
assert.equal(new Set(agency.groups.flatMap(g=>g.items).map(w=>w.id)).size,agency.work.length);
if(process.argv.includes('--source-only')) {
  console.log('Source checks passed: 11 new pages, 8 distinct services, valid references and schema, complete portfolio.');
  process.exit(0);
}
const output = path.resolve('_site');
assert.ok(fs.existsSync(output),'Run npm run build before npm test');
const decode = value => value.replace(/&amp;/g,'&').replace(/&#39;/g,"'").replace(/&quot;/g,'"');
const pageFile = url => path.join(output,url==='/'?'index.html':url.replace(/^\//,'')+'index.html');
const core = ['/',...agency.pages.map(p=>p.url)];
const sitemap = fs.readFileSync(path.join(output,'sitemap.xml'),'utf8');
const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>decode(m[1]));
assert.equal(new Set(urls).size,urls.length,'No duplicate sitemap entries');
assert.ok(!urls.some(u=>/brief-received|thank-you|\/admin\/|\/go\//.test(u)),'Utility pages excluded from sitemap');
const allHtml = [];
function walk(dir){ for(const e of fs.readdirSync(dir,{withFileTypes:true})){const f=path.join(dir,e.name);if(e.isDirectory())walk(f);else if(e.name.endsWith('.html'))allHtml.push(f);} }
walk(output);
for(const url of core) {
  const html = fs.readFileSync(pageFile(url),'utf8');
  assert.equal((html.match(/<h1\b/g)||[]).length,1,`One H1: ${url}`);
  assert.equal((html.match(/rel="canonical"/g)||[]).length,1,`One canonical: ${url}`);
  assert.ok(html.includes(`rel="canonical" href="${site.url+url}"`),`Self canonical: ${url}`);
  assert.ok(!/name="robots"[^>]+noindex/.test(html),`Production indexability: ${url}`);
  assert.ok(urls.includes(site.url+url),`In sitemap: ${url}`);
  assert.ok(html.includes('href="/contact/'),`Brief path: ${url}`);
  if(url!=='/') {
    const footer=html.split('<footer')[1];
    for(const service of agency.services) assert.equal(footer.split(`href="${service.url}"`).length-1,1,`One footer link per service: ${url} ${service.url}`);
  }
  assert.ok(/href="\/?#teardown"/.test(html),`Teardown path: ${url}`);
  assert.ok(!/\bTNP\b/.test(html),`No unwanted brand references: ${url}`);
  const text = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'').replace(/<[^>]+>/g,' ');
  assert.ok(text.trim().split(/\s+/).length>200,`Substantive page: ${url}`);
}
for(const file of allHtml.filter(f=>!f.includes(`${path.sep}admin${path.sep}`))) {
  const html=fs.readFileSync(file,'utf8');
  for(const m of html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
    try{JSON.parse(m[1]);}catch(error){throw new Error(`Malformed JSON-LD in ${file}: ${error.message}`);}
  }
}
for(const url of core.filter(u=>u!=='/')) {
  const html=fs.readFileSync(pageFile(url),'utf8');
  for(const m of html.matchAll(/\b(?:href|src|data-src|poster)="([^"<>]+)"/g)) {
    const raw=decode(m[1]); if(!raw.startsWith('/')) continue;
    const target=new URL(raw,site.url); const pathname=decodeURIComponent(target.pathname);
    const exact=path.join(output,pathname);
    const options=[exact,path.join(exact,'index.html'),exact+'.html'];
    const found=options.find(p=>fs.existsSync(p)&&fs.statSync(p).isFile());
    assert.ok(found,`Broken internal URL ${raw} from ${url}`);
    if(target.hash && found.endsWith('.html')) {
      const fragment=decodeURIComponent(target.hash.slice(1));
      assert.ok(fs.readFileSync(found,'utf8').includes(`id="${fragment}"`),`Missing anchor ${raw} from ${url}`);
    }
  }
}
const contact=fs.readFileSync(pageFile('/contact/'),'utf8');
assert.match(contact,/<form[^>]+name="brief"[^>]+method="post"[^>]+action="\/brief-received\/"[^>]+data-netlify="true"/);
for(const field of ['form-name','name','email','company','service','project','budget','timeline','reference','company_website']) assert.ok(contact.includes(`name="${field}"`),`Detected form field ${field}`);
assert.ok(fs.readFileSync(pageFile('/brief-received/'),'utf8').includes('noindex, follow'));
assert.ok(fs.readFileSync('netlify.toml','utf8').includes('for = "/work/*.mp4"'));
assert.ok(!fs.readFileSync('netlify.toml','utf8').includes('for = "/work/*"'),'Never cache work HTML for a year');
for(const url of urls) {
  const relative=new URL(url).pathname;
  const file=relative.endsWith('/')?pageFile(relative):path.join(output,relative+'.html');
  assert.ok(fs.existsSync(file),`Sitemap target exists: ${url}`);
  assert.ok(!/name="robots"[^>]+noindex/.test(fs.readFileSync(file,'utf8')),`No noindex URL in sitemap: ${url}`);
}
console.log(`Passed: ${core.length} commercial/core pages, ${agency.work.length} portfolio items, internal links/media, JSON-LD, sitemap and brief form.`);
