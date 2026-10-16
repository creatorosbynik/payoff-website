export function agencySchema(page, site) {
  const url = site.url + page.url;
  const org = site.url + '/#org';
  const graph = [
    {'@type':'Organization','@id':org,name:'Payoff',url:site.url+'/',logo:site.url+site.logo,email:site.email,telephone:'+91-88267-74234',sameAs:[site.instagram,site.linkedin]},
    {'@type':page.kind==='about'?'AboutPage':page.kind==='contact'?'ContactPage':page.kind==='work'?'CollectionPage':'WebPage','@id':url,name:page.title,description:page.description,url,inLanguage:'en',isPartOf:{'@id':site.url+'/#website'},about:{'@id':org}},
    {'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Home',item:site.url+'/'},{'@type':'ListItem',position:2,name:page.name,item:url}]},
  ];
  if(page.kind==='service') graph.push({'@type':'Service','@id':url+'#service',name:page.name,serviceType:page.name,description:page.description,url,provider:{'@id':org},areaServed:page.slug==='video-production'?'India':'Worldwide'});
  // Visible FAQ content is the single source of truth. No rich-result eligibility is assumed.
  if(page.faqs?.length) graph.push({'@type':'FAQPage','@id':url+'#questions',mainEntity:page.faqs.map(([q,a])=>({'@type':'Question',name:q,acceptedAnswer:{'@type':'Answer',text:a}}))});
  return {'@context':'https://schema.org','@graph':graph};
}
