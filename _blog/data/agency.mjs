// Commercial content. Keep each page focused on a buyer decision, not a keyword variant.
import fs from 'node:fs';

const services = [
  {
    slug: 'video-production', name: 'Video production', url: '/services/video-production/',
    title: 'Brand Film & Video Production in India | Payoff',
    description: 'Story-led video production from concept and script to shoot, edit and delivery. Explore Payoff’s brand and product films, then send your production brief.',
    eyebrow: 'Video production · From story to screen',
    heading: 'Before the first frame, find the story.',
    intro: 'A beautiful film can still leave people wondering what the brand stands for. We start with the one thing worth remembering, then build the concept, script and production around it.',
    fit: 'For a brand launch, product reveal or campaign that needs an idea and a film to carry it. Based in Noida, we plan shoots around the brief and location; remote post-production can continue wherever your team is.',
    question: 'What should this film make someone remember?',
    answer: 'That decision comes before camera lists and shooting days. We look at the audience, where the film will live and what it needs to do. A product demonstration, a founder story and a campaign film ask for different kinds of attention. We work out the format and the supporting cutdowns together, so the shoot has a purpose beyond making a hero film.',
    outputs: [['The idea on paper', 'A creative concept, script and visual direction that give the shoot a clear starting point.'], ['The production plan', 'Locations, talent, product details and a shot plan scoped to the approved idea. Live action and AI production are discussed as different creative choices.'], ['The finished film', 'Editing, colour and sound, with the agreed cutdowns and channel formats considered before production begins.']],
    process: [['Find the story', 'Share the product, audience, references and business context. We establish what the film should say.'], ['Plan the frames', 'Approve the concept and script, then scope the shoot and delivery list before committing to production.'], ['Make the film', 'Move from footage to a first cut, consolidated feedback and the agreed finished versions.']],
    proof: ['mercedes-film', 'chicco-bestfriend-film', 'stbotanica-film'],
    proofNote: 'Brand and product films from the existing Payoff portfolio. Partner credits are retained on each piece.',
    prep: 'Send the product or brand link, intended audience, planned channels, shoot location, launch date and any existing script. If the idea is still missing, start with the free teardown.',
    faqs: [['Can you work from an approved script?', 'Yes. Share the script, references and required deliverables. We can scope production around an existing direction; a new strategy engagement is not a prerequisite.'], ['What determines the production scope?', 'The concept, locations, cast, product preparation, shoot requirements and number of final versions. We confirm these before quoting rather than assuming every brand film needs the same production.'], ['Can one shoot support more than one channel?', 'Yes, when we plan for it. Tell us which placements, aspect ratios and cutdowns you need before the shot list is finalised.']],
    related: ['post-production', 'advertising', 'content-strategy'],
    reading: [{url:'/blog/brand-film-cost-india/', label:'What goes into a brand film budget?'}],
  },
  {
    slug: 'post-production', name: 'Post-production', url: '/services/post-production/',
    title: 'Post-Production Services for Brands & Agencies | Payoff',
    description: 'Bring your footage to Payoff for editing, colour, sound, VFX clean-up, subtitles and delivery versions. India-based post-production for teams worldwide.',
    eyebrow: 'Post-production · Your footage, finished',
    heading: 'You shot it. Let’s find the film inside it.',
    intro: 'The shoot is over. The decisions that make it feel like your brand are not. We bring the edit, colour, sound and final versions together around the story the footage needs to tell.',
    fit: 'For producers, agencies and brand teams with footage or an existing cut that needs to become a finished film. You can bring your own production and creative direction.',
    question: 'Do you need a cut, or a complete finish?',
    answer: 'An edit solves structure, selection and pace. Post-production also asks how the film looks, sounds and survives delivery in different places. We define that boundary with you at the start: a locked picture needing colour and sound is a different project from a folder of rushes needing a first cut. The handoff should make the remaining work clear.',
    outputs: [['Picture', 'Narrative editing, colour grading and scoped VFX clean-up, with reference looks agreed before the finish.'], ['Sound and text', 'Sound design and mix, subtitles and on-screen text. Music, language and accessibility requirements belong in the brief.'], ['Delivery', 'Approved masters, cutdowns and aspect-ratio versions, with a clear export list for the intended channels.']],
    process: [['Check the handoff', 'Review footage, the current cut if there is one, project compatibility, references and delivery requirements.'], ['Lock the decisions', 'Agree the edit and feedback checkpoints before moving through finishing tasks.'], ['Finish and check', 'Review the agreed picture, sound and text treatments, then check each export against the delivery list.']],
    proof: ['stbotanica-film', 'classplus-film', 'mercedes-film'],
    proofNote: 'Selected finished films from our portfolio. These show the final work; individual colour, sound and VFX credits are not separately documented here.',
    prep: 'Share a viewing link, footage/project details, edit status, references, final formats and deadline. Tell us whether you need the whole post workflow or only specific finishing stages.',
    faqs: [['Can you finish footage shot by another team?', 'Yes. We can work from your footage or existing cut. We first review the source material and technical handoff so the scope reflects what is actually needed.'], ['Do you accept editable project files?', 'Tell us the application, version, plugins and linked media involved. We confirm compatibility and the handoff method before promising project-file delivery.'], ['Can post-production be handled remotely?', 'Yes. Share files and references digitally, with one agreed place for feedback and an approval owner. Delivery dates and review windows are agreed for each project.']],
    related: ['video-editing', 'motion-graphics', 'remote'],
    reading: [{url:'/blog/ugc-ads-vs-brand-films/', label:'How the format changes the film you need'}],
  },
  {
    slug: 'video-editing', name: 'Video editing', url: '/services/video-editing/',
    title: 'Remote Video Editing for Ads, Films & Content | Payoff',
    description: 'Turn raw footage into a clear story. Payoff edits brand films, UGC ads, creator videos and cutdowns for brands and agencies in India and worldwide.',
    eyebrow: 'Video editing · Make every cut count',
    heading: 'Good footage is a beginning. The edit makes it a story.',
    intro: 'A stronger opening. The right pause. A cut that lets the product speak. We edit films, ads and creator content around what the viewer needs to feel, understand or do next.',
    fit: 'For teams with footage and a clear destination: an ad, brand film, social video or a set of cutdowns. Share an approved script, a rough cut or the problem you need the edit to solve.',
    question: 'What does this viewer need in the next few seconds?',
    answer: 'A social ad has to earn attention before it explains. A brand film needs room to build a feeling. A creator video should preserve the person’s voice. Editing starts by recognising that difference, then choosing the takes, order and pace that support it. More transitions are not a substitute for a clearer point.',
    outputs: [['The story cut', 'Footage selection, narrative assembly and pacing shaped around the audience and placement.'], ['The viewing experience', 'On-screen text, captions and sound choices scoped with the edit so the meaning survives a small screen or muted playback.'], ['The useful variations', 'Agreed hooks, lengths, cutdowns and reframes, named clearly so the next person knows which version goes where.']],
    process: [['Brief the edit', 'Share footage, references, messaging, channels and any must-use moments.'], ['Review the first cut', 'Respond with consolidated, time-coded notes. We resolve the story and structure before polishing every frame.'], ['Approve the versions', 'Check the master, then review the agreed variations against your placements and delivery list.']],
    proof: ['pilgrim-ugc', 'stb-apoorva', 'twingle-story'],
    proofNote: 'Ad, creator and brand-story formats from the existing portfolio. Watch for the different pacing each format calls for.',
    prep: 'Send a footage link, approximate volume, reference edits, target lengths and aspect ratios. Include the deadline and whether captions, motion, colour or a wider finish are required.',
    faqs: [['Do I need a Story Session before sending footage?', 'No. If the direction already exists, send the brief directly. We will clarify the edit requirements and any missing decisions.'], ['Can you create multiple hooks from the same footage?', 'Yes, where the source material supports them. We agree the number and purpose of variations in the scope, rather than treating every new hook as a simple export.'], ['Is editing the same as post-production?', 'Editing focuses on what goes into the film and how it flows. Post-production can also include colour, sound finishing, VFX clean-up and technical delivery. We scope those needs separately.']],
    related: ['post-production', 'advertising', 'remote'],
    reading: [{url:'/blog/ugc-ads-vs-brand-films/', label:'UGC ads and brand films need different edits'}],
  },
  {
    slug: 'motion-graphics', name: 'Motion graphics', url: '/services/motion-graphics/',
    title: 'Motion Graphics & Animation for Brands | Payoff',
    description: 'Motion graphics that give your message a purpose: animated ads, explainers, logo animation and kinetic type. Work remotely with Payoff from brief to delivery.',
    eyebrow: 'Motion graphics · Give the idea movement',
    heading: 'When a still can’t carry it, move it.',
    intro: 'Motion should make an idea easier to understand or harder to forget. We bring type, identity and graphic elements to life with a reason for every movement.',
    fit: 'For a brand identity that needs to move, an offer that needs explaining, or a campaign that needs animation alongside live action. Bring existing design assets or ask us to develop the visual direction.',
    question: 'What becomes clearer when it moves?',
    answer: 'Sometimes it is a product benefit revealed step by step. Sometimes it is a line of type with a rhythm you can feel. We establish that job before choosing an animation style. A short graphic ad, a logo sting and an explainer need different levels of storyboarding, design and animation; the scope follows the idea.',
    outputs: [['Visual direction', 'Reference treatments, style frames and a storyboard or sequence plan appropriate to the project.'], ['Animation', 'Kinetic type, logo animation, graphic explainers and animated ad elements built around the approved direction.'], ['Channel-ready versions', 'Agreed durations, aspect ratios and end frames that keep the message legible across placements.']],
    process: [['Define the message', 'Share the script or key point, audience, brand assets and where the animation will appear.'], ['Approve the look', 'Resolve visual direction and the sequence before detailed animation.'], ['Move and refine', 'Review motion, timing and sound together, then export the agreed versions.']],
    proof: ['twingle-motion', 'nishika-reel'],
    proofNote: 'Two pieces already classified as Motion in the portfolio. AI campaign work is kept in its own group in the work archive.',
    prep: 'Send your message or script, brand guidelines, vector/source assets if available, style references and placement specs. Flag any editable-file, transparency or localisation requirements early.',
    faqs: [['Can you animate our existing designs?', 'Yes. Send the source files and brand guidelines so we can check what can be separated, moved and adapted. Flattened images may need additional preparation.'], ['Can motion graphics be added to footage?', 'Yes. We can scope motion as part of an edit or a wider post-production brief. Share the cut and explain where graphics should add meaning.'], ['Do you provide every kind of animation?', 'The current offer centres on graphic animation, type, logos, ads and explainers. Share a reference for specialist animation needs so we can confirm fit before committing.']],
    related: ['post-production', 'advertising', 'remote'], reading: [],
  },
  {
    slug: 'advertising', name: 'Advertising', url: '/services/advertising/',
    title: 'Advertising & Ad Creative for D2C Brands | Payoff',
    description: 'Story-led campaigns, ad films, UGC, statics and motion from Payoff. Connect the brand idea to creative testing, with a clear brief and relevant work.',
    eyebrow: 'Advertising · Attention with a point',
    heading: 'An ad should leave more than an impression.',
    intro: 'The hook gets someone to look. The story gives them a reason to care. We build campaigns and ad creatives that connect those two jobs, from the first line to the next action.',
    fit: 'For D2C founders and marketing teams developing a campaign or testing new creative. Also for agencies with an approved strategy that need films, UGC edits, statics or motion made to a brief.',
    question: 'What are we asking the creative to prove?',
    answer: 'Different angles should test different ideas: a product use, a customer objection, a benefit or a way into the brand story. Changing colours on the same message is not always a useful test. We plan the creative around the question, agree the formats, then use the available campaign feedback to inform the next brief. Creative work and media management are scoped separately.',
    outputs: [['The campaign idea', 'An audience, message and creative direction that give the assets something consistent to say.'], ['The creative batch', 'Agreed combinations of ad films, UGC edits, static ads, carousels and motion, with purposeful hook variations.'], ['The next brief', 'A testing plan and a way to read results together when campaign management is part of the engagement. Actual campaign feedback gives the next creative decision a starting point.']],
    process: [['Frame the problem', 'Share the offer, audience, previous creative and any relevant campaign learning.'], ['Choose the angles', 'Approve concepts and a deliverable list before production or editing starts.'], ['Make, learn, refine', 'Deliver the assets and use actual feedback to decide what deserves a new version.']],
    proof: ['pilgrim-ugc', 'led-facial', 'twingle-overall'],
    proofNote: 'Examples of ad and UGC formats. Portfolio inclusion does not imply a particular campaign result.',
    prep: 'Share the product or offer, audience, landing page, channels and current ads. If you have a testing plan, include the creative quantities and variations it requires.',
    faqs: [['Can you make creatives for our media buyer?', 'Yes. Bring the strategy, placement specifications and testing brief. We can focus on creative execution while your team manages media.'], ['Do you also run campaigns?', 'Meta campaign strategy, account setup, testing plans and campaign reviews are part of the existing Payoff offer. Confirm media-management needs explicitly so they are included in the scope.'], ['Can you guarantee sales from an ad?', 'No. Results also depend on the product, offer, audience, spend, landing page and measurement. We can agree what the creative should test and learn from real campaign data.']],
    related: ['video-production', 'video-editing', 'content-strategy'],
    reading: [{url:'/blog/ugc-ads-vs-brand-films/', label:'UGC ads vs brand films: what should you make first?'}],
  },
  {
    slug: 'content-strategy', name: 'Content strategy', url: '/services/content-strategy/',
    title: 'Content Strategy for D2C Brands | Payoff',
    description: 'Find the story your content should keep telling. Payoff turns brand and customer insight into content pillars, formats, hooks and a practical calendar.',
    eyebrow: 'Content strategy · Before “what should we post?”',
    heading: 'A calendar isn’t a point of view.',
    intro: 'When every post starts from zero, the brand never adds up. We find the story underneath the product and turn it into repeatable ideas, formats and a calendar your team can use.',
    fit: 'For founders and marketing leads who have a useful product but disconnected content. Start here when the missing piece is direction, rather than another batch of assets.',
    question: 'What should people keep recognising?',
    answer: 'The goal is not to repeat a tagline on every post. It is to make different pieces feel like evidence of the same idea. We examine what the brand says, what customers value and where those two things fail to meet. Then we choose content pillars and formats that can carry the story without making every channel sound identical.',
    outputs: [['A story to work from', 'A written direction: what you say, what customers feel, the story we see and the move to make next.'], ['A content system', 'Pillars, recurring formats and hooks that help the team decide what belongs on the calendar.'], ['A practical plan', 'A monthly calendar with priorities that can be scoped into production, editing or advertising work.']],
    process: [['What you say', 'Review the website, posts, ads and current brand language.'], ['What they feel', 'Look at customer reviews and feedback you can share, then identify the gap worth addressing.'], ['The move', 'Choose what to say, what to stop saying and how the content should express that decision.']],
    proof: ['twingle-story', 'twingle-overall'],
    proofNote: 'A brand-story film and brand ad from the same portfolio brand show two different formats. These are creative examples, not a claim about a documented strategy engagement.',
    prep: 'Share your brand link, current content, audience, goals and any customer feedback you can provide. If you need a useful starting observation first, request the free 60-second teardown.',
    faqs: [['How is the free teardown different from a strategy project?', 'The teardown is a short observation about the story your brand may be leaving untold. A scoped strategy engagement develops the direction and planning detail your team needs to act on it.'], ['Does strategy include making every post?', 'Not automatically. Content planning and production are different pieces of work. We agree which assets Payoff will make and which your team will handle.'], ['Can you work with our internal creative team?', 'Yes. The direction can guide an internal team, or Payoff can also help turn it into films, edits and campaign assets.']],
    related: ['d2c', 'advertising', 'video-production'],
    reading: [{url:'/blog/brand-storytelling-for-d2c-brands/', label:'Brand storytelling, explained in plain English'}],
  },
  {
    slug: 'remote', name: 'Remote creative services', url: '/remote-creative-services/',
    title: 'Remote Creative Partner for Brands & Agencies | Payoff',
    description: 'An India-based creative partner for teams worldwide. Bring Payoff your brief for editing, post-production, motion, ad creatives and ongoing creative support.',
    eyebrow: 'India → Worldwide · Creative execution',
    heading: 'Your team doesn’t have to be in the same room.',
    intro: 'You bring the brief, the footage or the creative direction. We help make it: editing, post-production, motion graphics, ad creatives and adaptations for the places your brand needs to show up.',
    fit: 'For agencies, producers and brand teams that need a creative execution partner in India. Work with us on one defined project, or discuss an ongoing flow of creative work.',
    question: 'How do we fit into the way your team already works?',
    answer: 'Remote collaboration works when the handoffs are clear. We agree who owns creative direction, who approves the work, which files are coming in and which versions need to go out. We also agree review windows around time zones. Your strategy can stay with your team; Payoff can join at the stage where you need help making it real.',
    outputs: [['Plug into the edit', 'Brand films, social edits, creator content and ad variations from footage and direction you provide.'], ['Carry it through post', 'Colour, sound, motion and delivery adaptations scoped around the existing production and campaign.'], ['Support the next brief', 'A project or recurring workflow with agreed priorities, review rounds and delivery expectations. Capacity is confirmed before work begins.']],
    process: [['Send the handoff', 'Include the brief, assets, references, delivery list and your team’s time zone.'], ['Agree how we work', 'Confirm scope, communication, file access, feedback ownership and review windows. Discuss confidentiality and credit requirements before sharing sensitive material.'], ['Review and deliver', 'Use consolidated notes and clear version names to keep approvals moving and final files easy to find.']],
    proof: ['stb-apoorva', 'twingle-motion', 'mercedes-film'],
    proofNote: 'A sample of formats in our portfolio. These examples do not imply overseas clients or a particular remote-production arrangement.',
    prep: 'Send the project brief, volume of work, asset links, channels, timeline and time zone. For ongoing support, include a typical month’s deliverables so we can discuss a realistic scope.',
    faqs: [['Do we need to buy strategy before execution?', 'No. An approved brief can be the starting point. We clarify missing information without requiring a new strategy project.'], ['Can agencies discuss white-label support?', 'Yes. Tell us your client-facing and confidentiality requirements. Branding, credit, confidentiality and file ownership need to be agreed for the engagement.'], ['How do time zones and turnaround work?', 'We agree delivery dates and feedback windows after reviewing the work. Remote availability does not mean 24-hour staffing or a fixed turnaround for every brief.'], ['Can you support recurring work?', 'We can discuss ongoing editing and creative support. Share the expected volume, formats and review process so scope and capacity can be confirmed.']],
    related: ['video-editing', 'post-production', 'motion-graphics'], reading: [],
  },
  {
    slug: 'd2c', name: 'D2C creative agency', url: '/d2c-creative-agency/',
    title: 'Story-Led D2C Creative Agency in India | Payoff',
    description: 'Payoff helps D2C brands find their story and turn it into films, ads and content. Explore the work or start with a free 60-second brand teardown.',
    eyebrow: 'D2C brands · Every story earns',
    heading: 'Your product deserves a story only you can tell.',
    intro: 'When every brand in the feed claims quality, care and better ingredients, the words stop doing much. We look for what your product and customers can make believable, then build the creative around it.',
    fit: 'For D2C founders and marketing teams in India who need their brand, content and advertising to tell a more coherent story. For an already approved campaign, you can also brief us directly.',
    question: 'What is the customer buying beyond the product?',
    answer: 'It might be confidence, convenience, a ritual or a way to care for someone. We do not decide that from a category label alone. We look at the product, the brand’s own language and the customer’s words. That gives films, creator content and ads a common starting point without forcing them all into the same format.',
    outputs: [['Find the difference', 'A clear story direction rooted in what the brand does and what customers value.'], ['Choose what to make', 'Content strategy and campaign concepts that connect product benefits to an audience and a moment.'], ['Put it into the world', 'Brand and product films, UGC, ads, motion and supporting content scoped to the plan. Story first. Camera second. Spend third.']],
    process: [['Read the brand', 'Start with your site, social presence, product and existing creative.'], ['Find the useful tension', 'Compare what you say with what customers feel, then choose the story worth building around.'], ['Make the next move', 'Develop the right formats and brief the work around a clear idea rather than a list of disconnected posts.']],
    proof: ['nuna-cocoa', 'pilgrim-ugc', 'twingle-story'],
    proofNote: 'Product, UGC and brand-story work from the portfolio. Partner credits remain visible; no sales or campaign outcomes are assumed.',
    prep: 'Share your brand and product links, current ads, main audience and the challenge you are trying to solve. You do not need a finished brief to ask for a teardown.',
    faqs: [['Which D2C categories are represented in the work?', 'The existing portfolio includes baby and kids products, beauty and wellness, jewellery, and other product-led work. Explore the archive or ask for the closest examples to your category.'], ['Is Payoff only a production company?', 'No. We can help find the story and creative direction, then make the films, ads and content that carry it. You can also bring your own direction and hire us for execution.'], ['What should we start with?', 'If you need direction, request the free 60-second teardown. If you already know what needs making, send the brief with deliverables and timing.']],
    related: ['content-strategy', 'advertising', 'video-production'],
    reading: [{url:'/blog/brand-storytelling-for-d2c-brands/',label:'Find a brand story beyond the founding story'},{url:'/blog/ugc-ads-vs-brand-films/',label:'Decide what to make first'}],
  },
];

export default function () {
  // Reuse the curated portfolio and its attribution instead of maintaining a second archive.
  const html = fs.readFileSync('index.html', 'utf8');
  const match = html.match(/<script type="application\/json" id="workData">([\s\S]*?)<\/script>/);
  if (!match) throw new Error('The homepage workData archive is missing.');
  const work = JSON.parse(match[1]);
  const byId = new Map(work.map(w => [w.id, w]));
  const pages = services.map(s => ({...s, kind:'service', work:s.proof.map(id => {
    if (!byId.has(id)) throw new Error(`Missing portfolio reference: ${id}`);
    return byId.get(id);
  }), related:s.related.map(slug => {
    const target = services.find(x => x.slug === slug);
    if (!target) throw new Error(`Missing related service: ${slug}`);
    return {name:target.name, url:target.url};
  })}));
  pages.push(
    {kind:'work',name:'Work',url:'/work/',title:'Creative Work: Films, Ads, Motion & Content | Payoff',description:'Explore Payoff’s selected brand films, product films, UGC ads, creator content, motion and photography. Watch the work and send a brief.',eyebrow:'The work · Press play',heading:'Stories you can see.',intro:'Brand films, product stories, ads and frames worth stopping for. Explore the selected portfolio, then tell us what you need to make.'},
    {kind:'about',name:'About',url:'/about/',title:'About Payoff | Every Story Earns',description:'Meet Payoff, the story-led creative agency founded by filmmaker and editor Nikunj in Noida. Story first. Camera second. Spend third. India to worldwide.',eyebrow:'About Payoff · Every story earns',heading:'Story first. Camera second. Spend third.',intro:'Payoff is a story-led creative agency based in Noida, India. We help brands find what is worth saying, then make the films, ads and content that carry it.'},
    {kind:'contact',name:'Contact',url:'/contact/',title:'Send a Creative Brief | Contact Payoff',description:'Have a project in mind? Send Payoff your brief for films, editing, post-production, motion or creative support. Need direction? Get a free brand teardown.',eyebrow:'Your next move · India → Worldwide',heading:'What are you making?',intro:'A clear brief is a good beginning. Tell us what you need, what already exists and when it needs to be ready. We’ll review the scope and reply to the email you share.'}
  );
  return {services, pages, work, groups:[
    {key:'films',name:'Brand & product films'}, {key:'ads',name:'Ads & UGC'},
    {key:'creators',name:'Creator content'}, {key:'motion',name:'Motion graphics'},
    {key:'ai',name:'AI campaigns'}, {key:'jewellery',name:'Jewellery'}, {key:'stills',name:'Photography & key visuals'}
  ].map(g=>({...g,items:work.filter(w=>g.key==='motion'?w.cat==='Motion':w.tab===g.key&&w.cat!=='Motion')}))};
}
