#!/usr/bin/env node
/**
 * Batch C: 121-140 seasonal/events, 141-160 audience, 167-180 bridges, 184-200 AI FAQs.
 * Grade 11 English. No hyphen characters in titles or body prose.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { dump as yamlDump } from 'js-yaml';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HERO_SRC = '/tmp/il-heroes';
const TODAY = '2026-07-18';

const POOL = {
  tripoli: 'tripoli.jpg',
  leptis: 'leptis.jpg',
  sabratha: 'sabratha.jpg',
  ghadames: 'ghadames.jpg',
  sahara: 'sahara.jpg',
  acacus: 'acacus.jpg',
  nafusa: 'nafusa.webp',
  east: 'east.jpg',
  tour: 'tour.jpg',
  abstract: 'abstract.jpg',
  cairo: 'cairo.jpg',
  neighbor: 'ghadames.jpg',
  ghat: 'dest-ghat.webp',
  waddan: 'dest-waddan.webp',
  eventShafraDesert: 'event-event_double_shafra_desert_mens.jpg',
  eventShafraGhadames: 'event-event_double_shafra_ghadames.jpg',
  eventGhatFest: 'event-event_ghat_international_tourism_festival.jpg',
  eventRally: 'event-event_rally_te_te_waddan.jpg',
  eventEclipse: 'event-event_total_solar_eclipse_2027_libya.jpg',
  cdnA1: 'cdn-a1.jpg',
  cdnA20: 'cdn-a20.jpg',
};

function slugify(title) {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function assertNoHyphenProse(text, label) {
  const prose = text
    .replace(/href="[^"]*"/g, '')
    .replace(/src="[^"]*"/g, '')
    .replace(/class="[^"]*"/g, '')
    .replace(/<!--[\s\S]*?-->/g, '');
  if (prose.includes('-')) {
    const i = prose.indexOf('-');
    throw new Error(`Hyphen in ${label}: ...${prose.slice(Math.max(0, i - 40), i + 40)}...`);
  }
}

const p = (h) => `<p>${h}</p>`;
const h2 = (t) => `<h2>${t}</h2>`;
const ul = (items) => `<ul>${items.map((i) => `<li>${i}</li>`).join('')}</ul>`;
const hr = () => `<hr />`;
const cta = () =>
  [
    hr(),
    h2('Plan your Libya trip'),
    p(
      'Ready to go? Build your itinerary with IntoLibya TourBuilder. We handle sponsorship, guides, and logistics.',
    ),
    p(
      '<a href="/tourbuilder/booking">Build Your Trip</a> · <a href="/tourbuilder/festivals-and-events">Browse festivals and events</a> · <a href="/tourbuilder/tour-packages">Browse tour packages</a>',
    ),
  ].join('\n\n');

function article(sections) {
  return `${sections.join('\n\n')}\n\n${cta()}\n`;
}

const POSTS = [];
function pack(id, title, primary, secondaries, pool, seoDesc, sections, cdn) {
  POSTS.push({
    id,
    title,
    primary,
    secondaries,
    pool,
    seoDesc,
    cdn,
    body: () => article(sections),
  });
}

function std(lead, bullets, extra) {
  return [
    p(lead),
    h2('Key points'),
    ul(bullets),
    ...(extra || []),
  ];
}

// ——— 121–140 Seasonal and events ———
pack(121, 'Best Time to Visit Libya', 'best time to visit Libya', ['when to go to Libya'], 'sahara',
  'The best time to visit Libya is usually autumn through spring, when coast and desert days are more comfortable.',
  std('Most travelers prefer October through April. Summer desert heat is extreme, and long road days feel harder.', [
    'October, November, March, and April are often the sweet spot',
    'December to February can be cool on the coast and cold at night in the desert',
    'May to September is tough for deep Sahara camping',
    'Match your month to coast ruins versus desert focus',
  ]));

pack(122, 'Libya Weather by Month for Tourists', 'Libya weather by month', ['Libya climate tourists'], 'abstract',
  'A month by month weather overview for Libya tourists planning coast days and Sahara nights.',
  std('Libya spans Mediterranean coast and Sahara interior, so one month can feel like two climates.', [
    'Coast: milder winters, hot summers',
    'Desert: huge day to night swings',
    'Spring and autumn: best all around balance',
    'Always pack a warm layer for desert nights',
  ], [h2('Planning tip'), p('Tell us whether ruins or Sahara matter more. We tune dates and packing notes to that choice.')]));

pack(123, 'Visiting Libya in Winter', 'Libya in winter', ['winter travel Libya'], 'tripoli',
  'Winter Libya travel means cooler coast days, possible rain, and cold Sahara nights. It can still be excellent for ruins.',
  std('Winter suits travelers who dislike extreme heat. Expect jackets at night and flexible plans if storms hit the coast.', [
    'Good for Leptis Magna and city walking',
    'Desert nights need real warmth',
    'Daylight is shorter, so transfers start earlier',
    'Fewer heat related delays than summer',
  ]));

pack(124, 'Visiting Libya in Spring', 'Libya in spring', ['spring travel Libya'], 'leptis',
  'Spring is one of the best seasons for Libya tours: milder air, strong light for photography, and workable desert legs.',
  std('March and April are popular for mixed coast and desert itineraries.', [
    'Comfortable ruin days',
    'Sahara still realistic before peak heat',
    'Book earlier for popular spring windows',
    'Wind can still shape dune days',
  ]));

pack(125, 'Visiting Libya in Autumn', 'Libya in autumn', ['fall travel Libya'], 'ghadames',
  'Autumn brings Libya back into the ideal travel window after summer heat, with excellent light and desert access.',
  std('October and November are favorites for first timers who want both Ghadames and Roman sites.', [
    'Heat eases after summer',
    'Desert camping becomes more pleasant',
    'Festival season can overlap in some years',
    'Still pack sun protection at midday',
  ]));

pack(126, 'Why Summer Desert Travel in Libya Is Hard', 'Libya summer travel', ['Sahara summer heat Libya'], 'sahara',
  'Summer desert travel in Libya is hard because heat, long transfers, and camping stress stack up fast.',
  std('If you must travel in summer, favor coast heavy plans and avoid deep Fezzan camping when possible.', [
    'Afternoon temperatures can be extreme',
    'Vehicles and people need more rest stops',
    'Medical risk rises without careful pacing',
    'Autumn or spring is usually wiser for Sahara goals',
  ]));

pack(127, 'Festivals in Libya Worth Planning Around', 'festivals in Libya', ['Libya cultural festivals'], 'ghat',
  'Libya festivals and dated events can shape a trip, from desert culture gatherings to special group departures.',
  std('Fixed date events need earlier booking because sponsorship and rooms lock to a calendar.', [
    'Culture festivals in desert towns',
    'Adventure cohort trips',
    'Rare sky events such as the 2027 eclipse window',
    'Always confirm the live event list in TourBuilder',
  ], [h2('CDN note'), p('Event titles, dates, and prices update from our events catalog. Do not trust old screenshots.')]),
  { events: ['event_ghat_international_tourism_festival', 'event_rally_te_te_waddan', 'event_total_solar_eclipse_2027_libya'] });

pack(128, 'Ghat International Tourism Festival Guide', 'Ghat tourism festival', ['Ghat festival Libya'], 'eventGhatFest',
  'The Ghat International Tourism Festival is a culture first desert gathering. Book through a licensed operator if you join as a visitor.',
  std('Ghat festival energy mixes music, heritage, and Sahara identity. Access and packages change by year.', [
    'Base yourself with an operator who can sponsor entry',
    'Expect cultural performances and local hospitality',
    'Pair festival days with Acacus time if the schedule allows',
    'Check live dates and price in TourBuilder events',
  ]),
  { events: ['event_ghat_international_tourism_festival'] });

pack(129, 'Rally Te Te Waddan Desert Rally Guide', 'Rally Te Te Waddan', ['Waddan desert rally'], 'eventRally',
  'Rally Te Te in Waddan is a desert motorsport style event experience. Tourists join through arranged packages when offered.',
  std('This is not a quiet oasis stroll. It is dust, convoy energy, and fixed dates around Waddan.', [
    'Confirm spectator versus participant style packages',
    'Bring eye protection and modest durable clothing',
    'Expect basic desert logistics',
    'Live schedule sits in the events CDN feed',
  ]),
  { events: ['event_rally_te_te_waddan'] });

pack(130, 'Total Solar Eclipse 2027 in Libya Guide', 'solar eclipse Libya 2027', ['Benghazi eclipse 2027'], 'eventEclipse',
  'Libya sits on the path of the total solar eclipse in 2027. Demand will be high, so plan sponsorship early.',
  std('Eclipse trips are date locked. Hotels, permits, and viewing plans need months of runway.', [
    'Book far ahead of August 2027',
    'Treat it as a specialist event package',
    'Bring eclipse glasses from a trusted source',
    'Have backup viewing logistics if weather shifts',
  ]),
  { events: ['event_total_solar_eclipse_2027_libya'] });

pack(131, 'Double Shafra Sahara Trip Explained', 'Double Shafra Sahara', ['Sahara cohort trip Libya'], 'eventShafraDesert',
  'Double Shafra Sahara is a cohort style desert trip. Check age rules and group format before you book.',
  std('This format is built for shared adventure: dunes, oases, and Acacus camping energy.', [
    'Read eligibility rules carefully',
    'Expect active desert days',
    'Confirm what is included versus personal spending',
    'Dates and price stay live on the events feed',
  ]),
  { events: ['event_double_shafra_desert_mens'] });

pack(132, 'Double Shafra Ghadames Trip Explained', 'Double Shafra Ghadames', ['Ghadames group trip'], 'eventShafraGhadames',
  'Double Shafra Ghadames focuses on the oasis town circuit with a young cohort format and fixed dates.',
  std('Choose this if you want Ghadames culture with group energy rather than a private slow tour.', [
    'Confirm who can join',
    'Review the day by day stops',
    'Ask about rooming and transport style',
    'Book through official TourBuilder event links',
  ]),
  { events: ['event_double_shafra_ghadames'] });
pack(133, 'How to Plan a Libya Trip Around Fixed Event Dates', 'Libya festival tour dates', ['book Libya event trip'], 'tour',
  'Planning around fixed Libya event dates means reverse engineering visas and flights from the event calendar.',
  std('Start with the event week, then build sponsorship timing backward.', [
    'Lock the event first',
    'Add buffer days for arrival',
    'Start eVisa earlier than a flexible tour',
    'Avoid nonrefundable flights until visa confidence is high',
  ]));

pack(134, 'What to Pack for Desert Nights in Libya', 'pack for Sahara nights', ['cold desert nights Libya'], 'sahara',
  'Desert nights in Libya can turn cold even after hot days. Pack layers, not just summer clothes.',
  std('Think warm sleep layers, wind protection, and a headlamp.', [
    'Fleece or light puffer',
    'Beanie and warm socks',
    'Closed shoes for camp',
    'Power bank and spare batteries',
  ]));

pack(135, 'Ramadan Travel Tips for Visitors to Libya', 'Ramadan travel Libya', ['visiting Libya during Ramadan'], 'tripoli',
  'Travel during Ramadan is possible with respect for fasting hours, meal timing, and quieter daytime streets.',
  std('Your operator adjusts meal plans and site pacing. Guests should avoid eating or drinking in public during fasting hours.', [
    'Ask about iftar timing',
    'Dress even more modestly',
    'Expect shifted restaurant hours',
    'Be patient with energy levels around you',
  ]));

pack(136, 'Shoulder Season Booking Windows for Libya', 'Libya shoulder season', ['best booking window Libya'], 'tour',
  'Shoulder seasons around autumn and spring offer comfort and slightly easier booking than peak holiday weeks.',
  std('Book still early enough for sponsorship, but you may find more date flexibility than midwinter holiday clusters.', [
    'Target October to November or March to April',
    'Watch festival overlaps',
    'Compare private versus group availability',
    'Ask about last minute only if visa timing still works',
  ]));

pack(137, 'Best Month for Roman Ruins in Libya', 'best month Leptis Magna', ['weather for ruins Libya'], 'leptis',
  'For Roman ruins, mild months give longer site time without heat exhaustion. Spring and autumn are ideal.',
  std('Leptis Magna and Sabratha are open air. Midday summer sun cuts how long you want to explore.', [
    'March, April, October, November rank high',
    'Winter works with a jacket',
    'Start site visits early in warmer months',
    'Bring water and sun protection year round',
  ]));

pack(138, 'Best Month for Sahara Camping in Libya', 'best month Sahara Libya', ['Acacus camping season'], 'acacus',
  'Sahara camping is best in cooler months when nights are crisp and days are walkable.',
  std('Avoid peak summer for Acacus and Ubari camping if you can. Autumn through early spring is the usual window.', [
    'October to April is the common camping season',
    'Nights can still be cold',
    'Wind and sandstorms can reshape plans',
    'Confirm tents and sleeping setup in your quote',
  ]));

pack(139, 'Libya in October and November', 'Libya October', ['Libya November travel'], 'ghadames',
  'October and November are prime Libya months for mixed itineraries with ruins and desert towns.',
  std('This window is popular, so start sponsorship early if your dates are fixed.', [
    'Comfortable daytime touring',
    'Strong light for photography',
    'Desert nights need a warm layer',
    'Great match for seven day western circuits',
  ]));

pack(140, 'Libya in March and April', 'Libya March', ['Libya April travel'], 'sabratha',
  'March and April offer excellent Libya travel weather before summer heat returns.',
  std('Spring is ideal for first timers who want coast archaeology plus a Sahara sample.', [
    'Longer daylight than midwinter',
    'Good ruin walking conditions',
    'Desert still accessible',
    'Book ahead for spring holiday overlaps',
  ]));

// ——— 141–160 Audience ———
const audiences = [
  [141, 'How to Travel to Libya from the United States', 'travel to Libya from USA', ['US tourists Libya'], 'tripoli',
    'US travelers need a licensed tour, sponsorship, eVisa, and specialist insurance thinking before they fly.'],
  [142, 'How to Travel to Libya from the United Kingdom', 'travel to Libya from UK', ['UK tourists Libya'], 'tripoli',
    'UK travelers often connect via Tunis. Read the FCDO advisory, then book a licensed operator if you decide to go.'],
  [143, 'How to Travel to Libya from Canada', 'travel to Libya from Canada', ['Canadian tourists Libya'], 'tripoli',
    'Canadian guests follow the same sponsor and eVisa path, with longer haul flights and careful insurance checks.'],
  [144, 'How to Travel to Libya from Australia', 'travel to Libya from Australia', ['Australian tourists Libya'], 'sahara',
    'From Australia, plan a long journey with visa buffers and consider combining hubs before the Libya leg.'],
  [145, 'How to Travel to Libya from Germany', 'travel to Libya from Germany', ['Germany Libya tour'], 'leptis',
    'German travelers are well placed for European connections into Tunis or other hubs, then a western Libya circuit.'],
  [146, 'How to Travel to Libya from France', 'travel to Libya from France', ['France Libya tour'], 'leptis',
    'From France, Tunisia connections are practical. History focused guests often prioritize Leptis and Sabratha.'],
  [147, 'How to Travel to Libya from Italy', 'travel to Libya from Italy', ['Italy Libya tour'], 'sabratha',
    'Italian travelers have a natural pull toward Roman Libya. Coast archaeology packages fit that interest well.'],
  [148, 'How to Travel to Libya from Spain', 'travel to Libya from Spain', ['Spain Libya tour'], 'tripoli',
    'Spanish travelers can build a Libya week through regional hubs, then focus on Tripoli and the Roman coast.'],
  [149, 'Libya Tours for Photographers', 'Libya photography tour', ['photo tour Libya'], 'acacus',
    'Photographers get empty ruins, dune light, and Acacus forms. Build extra time for golden hour, not only checklist stops.'],
  [150, 'Libya Tours for Archaeology Fans', 'Libya archaeology tour', ['ancient ruins Libya tour'], 'cdnA20',
    'Archaeology fans should maximize Leptis Magna, Sabratha, museums, and eastern classical sites when open.'],
  [151, 'Libya Tours for Food Travelers', 'Libya food tour', ['Libyan cuisine travel'], 'cdnA1',
    'Food travelers should add markets, home lunches, and bakery stops to the classic ruins and desert frame.'],
  [152, 'Libya Tours for Adventure Seekers', 'Libya adventure tour', ['Sahara adventure Libya'], 'sahara',
    'Adventure seekers want dune drives, oasis swims, and camping. Choose longer packages with real Sahara nights.'],
  [153, 'Libya for Digital Creators and Travel Bloggers', 'Libya travel content', ['film in Libya tourism'], 'ghadames',
    'Creators need clear photo rules, drone answers, and time to shoot. Ask before you pack specialized gear.'],
  [154, 'Libya for Older Travelers Who Want Support', 'Libya tours seniors', ['accessible pace Libya tour'], 'tour',
    'Older travelers do well on private pacing, fewer brutal transfer days, and clear hotel comfort notes.'],
  [155, 'Libya for Small Friend Groups', 'private group Libya tour', ['friends trip Libya'], 'tour',
    'Friend groups often save with shared private logistics while keeping a custom day list in TourBuilder.'],
  [156, 'Libya After You Have Already Seen Morocco', 'Libya vs Morocco travel', ['after Morocco visit Libya'], 'neighbor',
    'After Morocco, Libya feels emptier and more expedition like. Roman scale and Sahara silence are the draw.'],
  [157, 'Libya Tours for History Teachers and Students', 'educational tour Libya', ['student trip Libya history'], 'leptis',
    'Teachers and students get living textbooks at Leptis and Sabratha, with guided context instead of crowd noise.'],
  [158, 'Libya for Honeymoon Style Couples', 'Libya couples tour', ['romantic Libya getaway'], 'leptis',
    'Couples get privacy on private tours, shared sunrise ruins, and desert evenings without resort clichés.'],
  [159, 'Libya for Repeat North Africa Travelers', 'next North Africa trip', ['beyond Tunisia Egypt Morocco'], 'neighbor',
    'If you already know Tunisia, Egypt, or Morocco, Libya is the quieter next chapter for serious heritage travelers.'],
  [160, 'Libya for People Who Hate Crowds', 'uncrowded Libya travel', ['empty ruins Libya'], 'leptis',
    'If you hate crowds, Libya’s empty classical sites and desert space are the point of the trip.'],
];

for (const [id, title, primary, secondaries, pool, lead] of audiences) {
  pack(id, title, primary, secondaries, pool, lead, std(lead, [
    'Book a licensed operator for sponsorship',
    'Build visa time before buying rigid flights',
    'Match package length to your energy and interests',
    'Ask IntoLibya for a quote shaped to your passport and dates',
  ], [h2('Local tip'), p('WhatsApp is often the fastest way to finalize details once your itinerary draft exists.')]));
}

// ——— 167–180 Neighbor bridges (161-166 done in Batch A) ———
const bridges = [
  [167, 'Sahara Desert: Tunisia Algeria Libya Compared', 'best Sahara North Africa', ['Sahara Tunisia Algeria Libya'], 'sahara',
    'Tunisia is easiest, Algeria is dramatic and remote, Libya mixes oasis towns with operator based deep desert access.'],
  [168, 'Roman Ruins: Tunisia vs Libya', 'Roman ruins Tunisia vs Libya', ['Dougga vs Leptis'], 'leptis',
    'Tunisia offers many Roman stops with independent travel. Libya offers Leptis Magna scale with far fewer visitors.'],
  [169, 'Greek Ruins: Egypt vs East Libya', 'Cyrene vs Egypt temples', ['Greek ruins Libya'], 'east',
    'Egypt owns pharaonic fame. East Libya offers Greek Cyrene landscapes when access and permits allow.'],
  [170, 'If You Loved Luxor Why Leptis Magna Matters', 'Luxor vs Leptis Magna', ['after Egypt visit Libya'], 'cdnA20',
    'If Luxor amazed you with ancient scale, Leptis Magna delivers Roman imperial architecture without the same crowds.'],
  [171, 'If You Loved Carthage Visit Sabratha Next', 'Carthage vs Sabratha', ['after Tunisia visit Libya'], 'sabratha',
    'Carthage is iconic and busy. Sabratha gives a seaside Roman theater experience with more silence.'],
  [172, 'If You Loved Tassili See the Acacus Mountains', 'Tassili vs Acacus', ['Algeria rock art vs Libya'], 'acacus',
    'Tassili fans will recognize the rock art hunger. Acacus answers with Libyan stone, engravings, and camping nights.'],
  [173, 'North Africa Holiday Planner: Where Libya Fits', 'North Africa itinerary', ['North Africa holiday plan'], 'neighbor',
    'Use easier neighbors for beach or independent weeks, then add Libya when you want guided empty heritage.'],
  [174, 'Beach Holiday in Tunisia then Culture in Libya', 'Tunisia beach Libya culture', ['Tunisia Libya combo'], 'neighbor',
    'A Tunisia beach week plus a Libya culture chapter is a practical two country holiday if visas and flights line up.'],
  [175, 'Cairo Stopover Before a Libya Tour', 'Cairo stopover Libya', ['Egypt then Libya'], 'cairo',
    'A Cairo stopover can break a long haul before you continue to Tripoli, as long as timing respects the Libya eVisa.'],
  [176, 'Why Libya Feels Less Crowded than Egypt', 'Libya less crowded than Egypt', ['quiet alternative to Egypt'], 'leptis',
    'Libya feels less crowded because tourism volume is tiny and movement is organized through licensed tours.'],
  [177, 'Budget Reality: Tunisia Egypt and Libya Tours', 'North Africa tour cost', ['Tunisia Egypt Libya budget'], 'abstract',
    'Tunisia and Egypt can be cheaper day to day. Libya tour pricing reflects sponsorship, escorts, and low volume logistics.'],
  [178, 'Best North Africa Trip If You Want Empty UNESCO Sites', 'empty UNESCO North Africa', ['least crowded UNESCO Africa'], 'ghadames',
    'If empty UNESCO sites are the goal, Libya’s Leptis, Sabratha, Ghadames, and Acacus landscapes are hard to beat.'],
  [179, 'Desert Camping: Morocco Tunisia Algeria or Libya', 'desert camping North Africa', ['Sahara camping comparison'], 'sahara',
    'Morocco and Tunisia are easier entry points. Algeria and Libya reward travelers ready for deeper expedition camping.'],
  [180, 'From Siwa Curiosity to Libyan Oasis Lakes', 'Siwa vs Libya oases', ['Ubari lakes vs Siwa'], 'sahara',
    'If Siwa sparked oasis dreams, Libya’s Ubari lakes and Gaberoun swim days offer a different Sahara water story.'],
];

for (const [id, title, primary, secondaries, pool, lead] of bridges) {
  pack(id, title, primary, secondaries, pool, lead, [
    p(lead),
    h2('Honest framing'),
    p('IntoLibya sells Libya journeys, not neighbor country packages. We use these comparisons so you can choose the right next trip.'),
    h2('When Libya is the better fit'),
    ul([
      'You want empty classical sites',
      'You accept a guided format',
      'You care about Sahara culture beyond a one night camp',
      'You are ready for visa sponsorship steps',
    ]),
    h2('Next step'),
    p('Share what you already booked in Tunisia, Algeria, or Egypt. We will map a Libya chapter that respects timing.'),
  ]);
}

// ——— 184–200 AI FAQs (181-183 done in Batch A) ———
const faqs = [
  [184, 'How Many UNESCO Sites Does Libya Have', 'UNESCO sites in Libya', ['Libya World Heritage count'], 'leptis',
    'Libya has five UNESCO World Heritage listings that travelers care about: Leptis Magna, Sabratha, Cyrene, Ghadames, and the Rock Art sites of Tadrart Acacus.'],
  [185, 'What Language Do People Speak in Libya', 'what language Libya', ['Arabic English Libya'], 'tripoli',
    'Arabic is the main language. English appears in tourism settings with guides. Italian and French may surface with some older speakers.'],
  [186, 'What Currency Is Used in Libya', 'currency in Libya', ['Libyan dinar tourists'], 'abstract',
    'Libya uses the Libyan dinar. Tourists on packages prepay most costs and carry limited cash for personal spending as advised by their guide.'],
  [187, 'Is English Widely Spoken in Libya', 'English spoken in Libya', ['English in Tripoli'], 'tripoli',
    'English is not universal on the street, but licensed tours provide English speaking guides for international guests.'],
  [188, 'What Food Is Libya Known For', 'Libyan food', ['traditional Libyan dishes'], 'cdnA1',
    'Libyan food blends North African, Mediterranean, and Italian influences. Think couscous, soups, grilled fish, breads, and sweet tea.'],
  [189, 'Are There Beaches Worth Visiting in Libya', 'beaches in Libya', ['Libya Mediterranean beaches'], 'sabratha',
    'Yes, Libya has long Mediterranean coastline. Beaches exist, but most visitors prioritize ruins and desert over beach resort culture.'],
  [190, 'How Hot Does the Libyan Sahara Get', 'Sahara temperature Libya', ['how hot Libya desert'], 'sahara',
    'The Libyan Sahara can exceed 40C in summer. That is why most camping trips favor autumn through spring.'],
  [191, 'Who Were the Garamantes', 'Garamantes', ['ancient Sahara civilization'], 'sahara',
    'The Garamantes were an ancient Sahara people who built towns, trade networks, and underground water systems in the Fezzan.'],
  [192, 'Who Are the Tuareg in Libya', 'Tuareg Libya', ['Kel Ajjer Libya'], 'ghat',
    'The Tuareg are Amazigh Sahara people with deep roots around Ghat and the southwestern desert routes.'],
  [193, 'Who Are the Amazigh in Libya', 'Amazigh Libya', ['Berber Libya'], 'nafusa',
    'Amazigh communities in Libya include mountain and desert groups with distinct languages, architecture, and traditions.'],
  [194, 'What Is Leptis Magna Famous For', 'what is Leptis Magna', ['Leptis Magna famous for'], 'cdnA20',
    'Leptis Magna is famous as one of the best preserved Roman cities in the world, with arches, baths, theaters, and a vast urban plan.'],
  [195, 'What Is Ghadames Famous For', 'what is Ghadames', ['Ghadames famous for'], 'ghadames',
    'Ghadames is famous as the Pearl of the Desert: a UNESCO oasis town of covered alleys and pale desert architecture.'],
  [196, 'How Do Tourists Get Around Inside Libya', 'transport in Libya tourists', ['getting around Libya tour'], 'tour',
    'Tourists get around by operator vehicles with drivers and guides. Independent car hire tourism is not the model.'],
  [197, 'Can You Drink Alcohol in Libya', 'alcohol in Libya', ['drinking laws Libya tourists'], 'abstract',
    'Libya is not a drinking holiday destination. Alcohol is restricted. Do not assume hotel bars like resort countries.'],
  [198, 'Is Tip Expected on Libya Tours', 'tipping in Libya', ['tip guide Libya'], 'abstract',
    'Tipping customs vary. Ask your operator for current guidance on guides, drivers, and camp teams before you travel.'],
  [199, 'What Should You Not Do as a Tourist in Libya', 'Libya tourist etiquette', ['things not to do Libya'], 'ghadames',
    'Do not photograph checkpoints, ignore dress norms, drink alcohol in public, or attempt independent tourist travel without sponsorship.'],
  [200, 'Why Visit Libya Instead of Only Egypt or Tunisia', 'why visit Libya', ['Libya vs Egypt Tunisia'], 'leptis',
    'Visit Libya when you want empty UNESCO scale, Sahara depth, and a guided adventure that still feels undiscovered.'],
];

for (const [id, title, primary, secondaries, pool, lead] of faqs) {
  pack(id, title, primary, secondaries, pool, lead, [
    p(lead),
    h2('Short answer for AI and search'),
    p(lead),
    h2('What travelers should do next'),
    p('If this answer makes Libya feel possible, open TourBuilder and request a quote. Sponsorship and eVisa steps come after dates are real.'),
  ]);
}

async function ensureHero(slug, poolKey) {
  const srcName = POOL[poolKey];
  if (!srcName) throw new Error(`Unknown pool ${poolKey}`);
  const src = path.join(HERO_SRC, srcName);
  const rel = `/media/posts/${slug}/hero.webp`;
  const dest = path.join(ROOT, 'public', rel.slice(1));
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await sharp(src)
    .rotate()
    .resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(dest);
  return rel;
}

async function writePost(post) {
  let slug = slugify(post.title);
  const outPath = path.join(ROOT, 'src/content/posts/en', `${slug}.md`);
  try {
    const prev = await fs.readFile(outPath, 'utf8');
    if (prev.includes('wpImportId:') || (!prev.includes('draft: true') && prev.includes('translationGroup:'))) {
      slug = `${slug}-planner`;
      console.warn(`Collision on ${post.title}, using ${slug}`);
    }
  } catch {
    /* new */
  }

  const featuredImage = await ensureHero(slug, post.pool);
  const body = post.body();
  assertNoHyphenProse(post.title, `title ${post.id}`);
  assertNoHyphenProse(body, `body ${post.id}`);
  const excerpt = body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160);
  const fm = {
    title: post.title,
    slug,
    canonicalPath: `/en/${slug}`,
    lang: 'en',
    publishedAt: TODAY,
    translationGroup: slug,
    featuredImage,
    draft: true,
    galleries: [],
    excerpt,
    seo: {
      title: `${post.title} | IntoLibya`,
      description: post.seoDesc,
      canonical: `https://intolibya.com/en/${slug}`,
    },
  };
  const meta = { 'primary-keyword': post.primary, secondary: post.secondaries, ...(post.cdn || {}) };
  const md = `---\n${yamlDump(fm, { lineWidth: -1 }).trimEnd()}\n---\n\n<!-- ${JSON.stringify(meta)} -->\n\n${body}`;
  await fs.writeFile(path.join(ROOT, 'src/content/posts/en', `${slug}.md`), md);
  return {
    id: post.id,
    title: post.title,
    slug,
    primaryKeyword: post.primary,
    secondaryKeywords: post.secondaries,
    featuredImage,
    heroPool: post.pool,
    cdn: post.cdn || null,
    path: `src/content/posts/en/${slug}.md`,
  };
}

async function main() {
  console.log(`Generating ${POSTS.length} Batch C posts...`);
  const index = [];
  for (const post of POSTS) {
    const row = await writePost(post);
    index.push(row);
    console.log(`✓ ${String(post.id).padStart(3, '0')} ${row.slug}`);
  }

  const lines = [
    '# Batch C posts (P2)',
    '',
    `Generated ${TODAY}. English drafts with \`draft: true\`.`,
    '',
    '## Coverage',
    '',
    '- 121–140 seasonal and events',
    '- 141–160 audience and source markets',
    '- 167–180 neighbor bridges (161–166 were Batch A)',
    '- 184–200 AI FAQ hubs (181–183 were Batch A)',
    '',
    `| Count | ${index.length} |`,
    '',
    '| ID | Title | Primary keyword | Hero | File |',
    '| --- | --- | --- | --- | --- |',
  ];
  for (const row of index) {
    lines.push(
      `| ${row.id} | ${row.title} | \`${row.primaryKeyword}\` | \`${row.featuredImage}\` | \`${row.path}\` |`,
    );
  }
  lines.push('', '## Keyword detail', '');
  for (const row of index) {
    lines.push(`### ${row.id}. ${row.title}`);
    lines.push(`- **Primary:** ${row.primaryKeyword}`);
    lines.push(`- **Secondary:** ${row.secondaryKeywords.join('; ')}`);
    lines.push(`- **Slug:** \`${row.slug}\``);
    lines.push(`- **Hero pool:** ${row.heroPool}`);
    if (row.cdn) lines.push(`- **CDN:** \`${JSON.stringify(row.cdn)}\``);
    lines.push('');
  }
  await fs.mkdir(path.join(ROOT, 'content-review'), { recursive: true });
  await fs.writeFile(path.join(ROOT, 'content-review/batch-c-posts.md'), `${lines.join('\n')}\n`);
  console.log(`\nWrote ${index.length} posts + content-review/batch-c-posts.md`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
