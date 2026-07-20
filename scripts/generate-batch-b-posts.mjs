#!/usr/bin/env node
/**
 * Batch B: commercial 051-060, itineraries 066-080, destinations 081-100, activities 101-120.
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
  cdnA1: 'cdn-a1.jpg',
  cdnA2: 'cdn-a2.jpg',
  cdnA3: 'cdn-a3.jpg',
  cdnA4: 'cdn-a4.jpg',
  cdnA7: 'cdn-a7.jpg',
  cdnA8: 'cdn-a8.jpg',
  cdnA11: 'cdn-a11.jpg',
  cdnA13: 'cdn-a13.jpg',
  cdnA16: 'cdn-a16.jpg',
  cdnA20: 'cdn-a20.jpg',
  cdnA29: 'cdn-a29.jpg',
  cdnA31: 'cdn-a31.jpg',
  cdnA32: 'cdn-a32.jpg',
  cdnA33: 'cdn-a33.jpg',
  cdnA34: 'cdn-a34.jpg',
  cdnA36: 'cdn-a36.jpg',
  cdnA37: 'cdn-a37.jpg',
  cdnA38: 'cdn-a38.jpg',
  cdnA39: 'cdn-a39.jpg',
  cdnA44: 'cdn-a44.jpg',
  cdnA45: 'cdn-a45.jpg',
  destWaw: 'dest-waw-an-namus.webp',
  destGerma: 'dest-germa.webp',
  destBenghazi: 'dest-benghazi.webp',
  destTobruk: 'dest-tobruk.webp',
  destAkhdar: 'dest-jebel-akhdar.webp',
  destMisrata: 'dest-misrata.webp',
  destGhat: 'dest-ghat.webp',
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
      '<a href="/tourbuilder/booking">Build Your Trip</a> · <a href="/tourbuilder/tour-packages">Browse tour packages</a> · <a href="/tourbuilder/search">Browse activities</a>',
    ),
  ].join('\n\n');

function article(sections) {
  return `${sections.join('\n\n')}\n\n${cta()}\n`;
}

function destLink(slug, label) {
  return `<a href="/en/destination/${slug}">${label}</a>`;
}

/** @type {Array<object>} */
const POSTS = [];
const add = (d) => POSTS.push(d);

function pack(id, title, primary, secondaries, pool, seoDesc, sections, cdn) {
  add({
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

// ——— 051–060 Commercial ———
pack(
  51,
  'Best Libya Tour for Sahara Travelers',
  'Libya Sahara tour',
  ['desert tour Libya', 'Sahara expedition Libya'],
  'sahara',
  'The best Libya tours for Sahara lovers balance dune days, oasis stops, and enough buffer for desert logistics.',
  [
    p('If the Sahara is your main reason to visit Libya, choose length and remoteness with care. Short trips skim the desert edge. Longer ones reach oases, rock art, and camping nights.'),
    h2('What Sahara travelers usually want'),
    ul([
      'Dune driving and wide sand seas',
      'Oasis swims such as Gaberoun',
      'Acacus landscapes and prehistoric art',
      'Time offline under a dark sky',
    ]),
    h2('How to choose a package'),
    p('Look at day counts and how many nights are truly in the desert. Ask which activities are locked in versus optional. Live package and activity lists update from our TourBuilder catalog.'),
  ],
  { tours: ['tour_15day', 'tour_all_libya'], activities: ['a32', 'a34', 'a39'] },
);

pack(
  52,
  'Quick Trip 4 Day Libya Package Guide',
  '4 day Libya tour',
  ['Quick Trip Libya', 'short Libya package'],
  'tour',
  'A four day Libya package is a coastal introduction built for first visitors with limited time.',
  [
    p('A four day plan is for travelers who want Tripoli culture and major Roman sites without a deep Sahara chapter.'),
    h2('Who it suits'),
    p('Weekend extenders, first timers testing Libya, and guests connecting through Tunis with tight calendars.'),
    h2('What to expect'),
    p('City walking, museum or market time, and guided ruins days. Driving still happens, but the map stays closer to the coast.'),
    h2('Build or book'),
    p('Open the Quick Trip package in TourBuilder or customize the day list. Names and activity IDs stay synced with our CDN.'),
  ],
  { tours: ['tour_4day'] },
);

pack(
  53,
  'Lets Explore 7 Day Libya Package Guide',
  '7 day Libya tour',
  ['Lets Explore Libya', 'western Libya week'],
  'tour',
  'The seven day western Libya package links coast, mountains, and a Sahara gateway town in one week.',
  [
    p('Seven days is the sweet spot for many first time guests. You see Tripoli, Roman coast highlights, mountain stops, and Ghadames without rushing every sunrise.'),
    h2('Typical arc'),
    ul([
      'Capital orientation and food stops',
      'Leptis Magna and Sabratha site days',
      'Nafusa mountain viewpoints and qasrs',
      'Ghadames old town and dune evening',
    ]),
    h2('Why people choose it'),
    p('It balances archaeology and desert culture. It also maps cleanly to a one week holiday from Europe.'),
  ],
  { tours: ['tour_7day'] },
);

pack(
  54,
  'Adventure Time Libya Package Guide',
  '12 day Libya tour',
  ['Adventure Time Libya', 'Libya adventure package'],
  'acacus',
  'Adventure Time stretches into a deeper Libya journey with more Sahara and richer site time.',
  [
    p('When one week feels too short, a longer adventure package adds desert nights and slower archaeology days.'),
    h2('What changes versus seven days'),
    p('More Fezzan time, more camping or oasis circuits, and less pressure to compress highlights into a sprint.'),
    h2('Fitness note'),
    p('Expect longer transfers and basic desert camping on some nights. Tell us about mobility needs when you request a quote.'),
  ],
  { tours: ['tour_15day'] },
);

pack(
  55,
  'Seasoned Expeditioner 18 Day Libya Package Guide',
  '18 day Libya tour',
  ['full Libya tour', 'Seasoned Expeditioner'],
  'tour',
  'Eighteen days aim at a full country style journey across north, south, east, and west when access allows.',
  [
    p('This is the deep end: Tuareg regions, Amazigh mountains, classical east, and long Sahara chapters when conditions allow.'),
    h2('Who should book it'),
    p('Travelers who already love remote trips, photographers who need time, and guests who hate leaving a region half seen.'),
    h2('Planning reality'),
    p('Access can shift by region. We confirm what is open for your dates before you lock flights.'),
  ],
  { tours: ['tour_all_libya'] },
);

pack(
  56,
  'How to Customize a Libya Itinerary Before You Book',
  'custom Libya itinerary',
  ['build Libya trip', 'customize Libya tour'],
  'tour',
  'Customize a Libya itinerary in TourBuilder by picking days and activities, then submit for a sponsor ready quote.',
  [
    p('You do not need a perfect PDF before you talk to us. Start with must see places, then add pace and comfort preferences.'),
    h2('A simple method'),
    ul([
      'List three must see places',
      'Choose a day count you can travel',
      'Mark desert nights yes or no',
      'Submit through TourBuilder for pricing',
    ]),
    h2('What we adjust'),
    p('We tune driving loads, hotel versus camp nights, and site order so sponsorship documents match a real route.'),
  ],
);

pack(
  57,
  'Booking a Libya Tour from Abroad: Timeline',
  'book Libya tour from abroad',
  ['overseas Libya booking', 'Libya tour from Europe'],
  'abstract',
  'A clear timeline for booking a Libya tour from abroad, from first inquiry to eVisa approval.',
  [
    p('Booking from another country adds flight and insurance steps. Build time for each stage.'),
    h2('Suggested sequence'),
    ul([
      'Inquiry and itinerary draft',
      'Deposit and sponsorship start',
      'eVisa submission',
      'Flights after visa confidence',
      'Final briefing and arrival details',
    ]),
    h2('Buffer tip'),
    p('Avoid stacking nonrefundable flights against an optimistic visa date. Ask us for a working window on your passport type.'),
  ],
);

pack(
  58,
  'What Happens After You Request a Quote',
  'Libya tour quote process',
  ['after booking Libya tour', 'IntoLibya quote'],
  'tour',
  'After you request a Libya tour quote, expect itinerary review, pricing, deposit instructions, then sponsorship work.',
  [
    p('A quote is the start of a conversation, not a mystery invoice. We confirm dates, group size, and inclusions first.'),
    h2('Usual next messages'),
    ul([
      'Revised day plan if needed',
      'Price and what is included',
      'Deposit instructions on official channels',
      'Document checklist for the eVisa',
    ]),
    h2('Your job'),
    p('Reply with passport names exactly as printed, preferred airports, and any medical notes that affect desert days.'),
  ],
);

pack(
  59,
  'Libya Activities You Can Add to Any Tour',
  'Libya activities',
  ['things to do Libya tour add ons', 'TourBuilder activities'],
  'cdnA1',
  'Add Libya activities in TourBuilder: city walks, Roman tours, oasis swims, dune drives, and cultural meals.',
  [
    p('Packages are starting points. Activities let you personalize without inventing logistics from scratch.'),
    h2('Popular add ons'),
    ul([
      'Tripoli walking and food stops',
      'Extra time at Leptis Magna or Sabratha',
      'Ghadames home lunch or dune sunset',
      'Oasis swim and three oasis circuits',
      'Acacus camping when the season fits',
    ]),
    h2('Pricing note'),
    p('Activity prices and titles stay live in our CDN catalog. Your quote uses current figures rather than old screenshots.'),
  ],
  { activities: ['a1', 'a20', 'a16', 'a32', 'a39'] },
);

pack(
  60,
  'Questions to Ask Before You Pay a Deposit',
  'questions before booking Libya tour',
  ['Libya tour checklist', 'before deposit Libya'],
  'abstract',
  'Ask these questions before you pay a Libya tour deposit so sponsorship, safety, and inclusions are clear.',
  [
    p('A deposit starts real work on your visa path. Ask clear questions first.'),
    h2('Checklist'),
    ul([
      'Is the company licensed to sponsor tourists?',
      'What exactly is included in the price?',
      'How are security related changes handled?',
      'When do I apply for the eVisa?',
      'Which regions are confirmed for my dates?',
    ]),
    h2('Payment hygiene'),
    p('Use official payment channels only. If anything feels unclear, pause and ask for written answers.'),
  ],
);

// ——— 066–080 Itineraries ———
const itineraries = [
  [66, 'Tripoli and Roman Ruins Short Plan', 'Tripoli itinerary', ['Tripoli and Leptis itinerary'], 'leptis',
    'A short Tripoli and Roman ruins plan for travelers who want the capital plus Leptis Magna and Sabratha.'],
  [67, 'Tripoli Ghadames and Leptis Circuit', 'Tripoli Ghadames Leptis', ['classic Libya circuit'], 'ghadames',
    'The classic western circuit linking Tripoli, Leptis Magna, and the desert town of Ghadames.'],
  [68, 'Sahara Focused Libya Itinerary', 'Libya Sahara itinerary', ['Fezzan itinerary'], 'sahara',
    'A Sahara focused Libya itinerary built around oases, dunes, and deep desert nights.'],
  [69, 'Archaeology Focused Libya Itinerary', 'Libya archaeology itinerary', ['Roman Greek Libya route'], 'leptis',
    'An archaeology focused route for travelers who want maximum time among Roman and Greek sites.'],
  [70, 'Photography Focused Libya Itinerary', 'Libya photography tour', ['best photo spots Libya'], 'acacus',
    'A photography focused Libya itinerary with golden hour stops, empty ruins, and Sahara camps.'],
  [71, 'Food and Culture Libya Itinerary', 'Libya food tour itinerary', ['culinary Libya trip'], 'cdnA3',
    'A food and culture itinerary with markets, home meals, and city walks that explain daily life.'],
  [72, 'East Libya History Itinerary', 'east Libya itinerary', ['Cyrene Benghazi itinerary'], 'east',
    'An east Libya history itinerary for Cyrene, coastal heritage, and green mountain landscapes when access allows.'],
  [73, 'Fezzan Desert Lakes Itinerary', 'Fezzan itinerary', ['Ubari lakes Libya'], 'cdnA32',
    'A Fezzan desert lakes itinerary featuring oasis swims, dune drives, and Germa heritage.'],
  [74, 'Ghat and Acacus Expedition Outline', 'Ghat Acacus itinerary', ['Acacus expedition'], 'destGhat',
    'A Ghat and Acacus expedition outline for Tuareg culture, rock art, and mountain camping.'],
  [75, 'Jebel Nafusa and Coast Combo Plan', 'Jebel Nafusa itinerary', ['Nafusa and Tripoli trip'], 'nafusa',
    'Combine Jebel Nafusa mountain villages with Mediterranean coast ruins in one western plan.'],
  [76, 'How to Choose Between 7 Days and 12 Days in Libya', '7 vs 12 days Libya', ['how many days in Libya'], 'tour',
    'Choose seven days for a western highlights loop or about twelve days when you want real Sahara depth.'],
  [77, 'Sample Day by Day: Coastal Libya', 'coastal Libya itinerary', ['Mediterranean Libya days'], 'sabratha',
    'A sample coastal Libya rhythm with Tripoli, Sabratha, and Leptis Magna paced for heat and site time.'],
  [78, 'Sample Day by Day: Sahara Libya', 'Sahara day by day Libya', ['desert days Libya'], 'sahara',
    'A sample Sahara day by day rhythm with early starts, oasis breaks, and camping nights.'],
  [79, 'Libya Itinerary for Couples', 'Libya honeymoon itinerary', ['romantic Libya trip'], 'leptis',
    'A couples friendly Libya itinerary with private pacing, shared ruin mornings, and quieter desert evenings.'],
  [80, 'One Week in Libya If You Love UNESCO Sites', 'UNESCO Libya itinerary', ['Libya UNESCO one week'], 'ghadames',
    'One week aimed at Libya UNESCO highlights: Tripoli gateway, Leptis, Sabratha, and Ghadames.'],
];

for (const [id, title, primary, secondaries, pool, lead] of itineraries) {
  pack(id, title, primary, secondaries, pool, lead, [
    p(lead),
    h2('Suggested flow'),
    ul([
      'Arrive and settle in Tripoli or your gateway hotel',
      'Site days with guided interpretation',
      'One longer transfer day if the desert is included',
      'A lighter final day before departure',
    ]),
    h2('Customize it'),
    p('Treat this as a sketch. In TourBuilder you attach live activities to each day so timing and inclusions stay current.'),
  ]);
}

// ——— 081–100 Destinations ———
const destinations = [
  [81, 'Why Visit Tripoli', 'visit Tripoli', ['things to do Tripoli Libya'], 'cdnA1', 'tripoli',
    'Tripoli is Libya’s capital gateway: Ottoman lanes, markets, museums, and the jump off for coast and desert routes.'],
  [82, 'Things to Do in Tripoli Old Town', 'Tripoli old town', ['Medina Tripoli guide'], 'cdnA1', 'tripoli',
    'Tripoli old town rewards slow walking: arches, workshops, cafes, and layered Mediterranean history.'],
  [83, 'Leptis Magna Travel Guide', 'Leptis Magna', ['visit Leptis Magna'], 'cdnA20', 'leptis-magna',
    'Leptis Magna is one of the greatest Roman cities still standing, often nearly empty for modern visitors.'],
  [84, 'Why Leptis Magna Beats Crowded Roman Sites', 'best preserved Roman city Africa', ['Leptis vs Rome ruins'], 'cdnA20', 'leptis-magna',
    'Compared with crowded European ruins, Leptis Magna offers scale, preservation, and room to breathe.'],
  [85, 'Sabratha Travel Guide', 'Sabratha', ['visit Sabratha Libya'], 'cdnA16', 'sabratha',
    'Sabratha pairs a seaside Roman theater with temples and mosaics on Libya’s Mediterranean edge.'],
  [86, 'Ghadames Pearl of the Desert Guide', 'Ghadames', ['visit Ghadames'], 'cdnA7', 'ghadames',
    'Ghadames is the desert pearl: covered alleys, pale architecture, and Amazigh oasis culture near three borders.'],
  [87, 'What to See in Ghadames Old Town', 'Ghadames old town', ['Ghadames medina'], 'cdnA7', 'ghadames',
    'In Ghadames old town, follow shaded passages, rooftop edges, and community spaces designed for desert life.'],
  [88, 'Ghat Travel Guide for Sahara Culture', 'visit Ghat Libya', ['Ghat Tuareg town'], 'destGhat', 'ghat',
    'Ghat is a Tuareg cultural base and a gateway toward the Acacus Mountains in southwest Libya.'],
  [89, 'Acacus Mountains Travel Guide', 'Acacus Mountains', ['Tadrart Acacus'], 'cdnA39', 'acacus-mountains',
    'The Acacus Mountains hold prehistoric rock art, stone arches, and some of Libya’s most dramatic desert camping.'],
  [90, 'Waw an Namus: Libya Volcanic Crater Guide', 'Waw an Namus', ['Waw an Namus Libya'], 'destWaw', 'waw-an-namus',
    'Waw an Namus is a remote volcanic crater with dark ash plains and oasis lakes in the deep Sahara.'],
  [91, 'Germa and the Garamantes', 'Germa Libya', ['Garama Garamantes'], 'destGerma', 'germa',
    'Germa marks the heartland of the Garamantes, an ancient Sahara civilization of towns and foggaras.'],
  [92, 'Gaberoun Oasis Guide', 'Gaberoun', ['Gaberoun oasis Libya'], 'cdnA32', 'gaberoun',
    'Gaberoun is a classic Ubari oasis stop: palm fringe, mineral water, and a swim after dune roads.'],
  [93, 'Jebel Nafusa Mountain Villages Guide', 'Jebel Nafusa', ['Nafusa Mountains Libya'], 'nafusa', 'jebel-nafusa',
    'Jebel Nafusa offers Amazigh mountain villages, fortified qasrs, and cooler air west of Tripoli.'],
  [94, 'Benghazi Travel Guide for Tourists', 'visit Benghazi', ['Benghazi tourism'], 'destBenghazi', 'benghazi',
    'Benghazi is eastern Libya’s major city. Tourist access depends on timing, permits, and operator routing.'],
  [95, 'Shahat and Ancient Cyrene Guide', 'Cyrene Libya', ['Shahat Cyrene'], 'cdnA31', 'shahat',
    'Shahat is the modern door to ancient Cyrene, a Greek heritage landscape in the green mountains.'],
  [96, 'Tobruk History Travel Guide', 'Tobruk', ['visit Tobruk'], 'destTobruk', 'tobruk',
    'Tobruk is known for World War history and a strategic eastern harbor. Visits need current access advice.'],
  [97, 'Jebel Akhdar Travel Guide', 'Jebel Akhdar Libya', ['Green Mountain Libya'], 'destAkhdar', 'jebel-akhdar',
    'Jebel Akhdar, the Green Mountain, brings forests, valleys, and highland air uncommon in desert stereotypes of Libya.'],
  [98, 'Misrata Stopover Guide', 'Misrata', ['visit Misrata Libya'], 'destMisrata', 'misrata',
    'Misrata is a major coastal city and a possible logistics stop on longer western or central routes.'],
  [99, 'UNESCO Sites in Libya: A Traveler Map', 'UNESCO sites Libya', ['Libya World Heritage sites'], 'leptis', null,
    'Libya’s UNESCO list includes Leptis Magna, Sabratha, Cyrene, Ghadames, and the Acacus rock art landscapes.'],
  [100, 'Best Desert Towns to Visit in Libya', 'desert towns Libya', ['Sahara towns Libya'], 'ghadames', null,
    'The best desert towns for visitors include Ghadames, Ghat, and oasis gateways that stage deeper Sahara travel.'],
];

for (const [id, title, primary, secondaries, pool, destSlug, lead] of destinations) {
  const links = destSlug
    ? p(`Read the destination page for ${destLink(destSlug, title.includes(':') ? primary : title.replace(/ Travel Guide.*/, '').replace(/Why Visit /, '').replace(/ Guide.*/, '') || primary)}.`)
    : p('Use our destination guides and TourBuilder activities to turn this map into a bookable week.');
  pack(id, title, primary, secondaries, pool, lead, [
    p(lead),
    h2('Why it matters'),
    p('This place shows a different face of Libya than headlines suggest: heritage, landscape, and living culture.'),
    h2('How visitors usually see it'),
    p('You arrive on a licensed itinerary with a guide. That structure is how tourism works here, and it keeps logistics simple.'),
    links,
    h2('Pair it with'),
    p('Ask us which nearby sites fit the same road day so you do not waste daylight on thin transfers.'),
  ], destSlug ? { destinations: [destSlug] } : undefined);
}

// ——— 101–120 Activity guides ———
const activities = [
  [101, 'Tripoli Walking Tour: What You Will See', 'Tripoli walking tour', ['Tripoli guided walk'], 'cdnA1', ['a1'],
    'A Tripoli walking tour moves through old town lanes, workshops, cafes, and layered Mediterranean stories.'],
  [102, 'Tripoli Museum Tour Guide', 'Tripoli museum tour', ['Red Castle museum Tripoli'], 'cdnA2', ['a2'],
    'A Tripoli museum tour helps you read artifacts and city history before you head to open air ruins.'],
  [103, 'Tripoli Fish Market Experience', 'Tripoli fish market', ['Tripoli food tour'], 'cdnA3', ['a3'],
    'The Tripoli fish market experience is a sensory food stop that shows coastal daily life up close.'],
  [104, 'Mosques of Tripoli Tour Etiquette', 'Tripoli mosques tour', ['visit mosques Tripoli'], 'cdnA4', ['a4'],
    'Visit Tripoli mosques with modest dress, quiet voices, and guide led timing around prayer needs.'],
  [105, 'Leptis Magna Guided Tour Tips', 'Leptis Magna tour', ['guided tour Leptis'], 'cdnA20', ['a20'],
    'A guided Leptis Magna tour unlocks arches, baths, and forum stories you would miss alone.'],
  [106, 'Sabratha Roman Ruins Tour Tips', 'Sabratha tour', ['Sabratha guided tour'], 'cdnA16', ['a16'],
    'At Sabratha, a guide helps you pace the theater, temples, and coastal photo stops without rushing.'],
  [107, 'Scuba Diving on the Libya Coast', 'scuba diving Libya', ['diving Sabratha Leptis'], 'sabratha', ['a18', 'a23', 'a25'],
    'Scuba diving on the Libya coast is an adventure add on when sea conditions and operator scheduling allow.'],
  [108, 'Ghadames Old Town Walking Tour', 'Ghadames walking tour', ['Ghadames guided tour'], 'cdnA7', ['a7'],
    'A Ghadames walking tour explains covered streets, cooling design, and oasis social life.'],
  [109, 'Sunset in the Sand Dunes near Ghadames', 'Ghadames sand dunes', ['sunset dunes Ghadames'], 'cdnA8', ['a8'],
    'Sunset in the dunes near Ghadames is a short desert chapter with soft light and wide silence.'],
  [110, 'Three Countries Border Point at Ghadames', 'Algeria Tunisia Libya border', ['three points Ghadames'], 'ghadames', ['a10'],
    'Near Ghadames you can stand at the meeting point of Algeria, Tunisia, and Libya on a guided stop.'],
  [111, 'Lunch in a Traditional Home in Ghadames', 'Ghadames home lunch', ['traditional lunch Ghadames'], 'cdnA11', ['a11'],
    'A traditional home lunch in Ghadames turns hospitality into the highlight of the oasis day.'],
  [112, 'Tuareg Bread and Tea Experience', 'Tuareg tea Libya', ['Tourag bread tea'], 'cdnA45', ['a45'],
    'Tuareg bread and tea is a hands on cultural stop: fire, dough, and the pace of desert hospitality.'],
  [113, 'Qaser Nalut and Qaser El Haj Visits', 'Qaser Nalut', ['Qaser El Haj'], 'cdnA13', ['a13', 'a44'],
    'Qaser Nalut and Qaser El Haj show fortified storage architecture on the mountain road west of Tripoli.'],
  [114, 'Oasis Swim at Gaberoun', 'Gaberoun swim', ['swim Ubari lakes'], 'cdnA32', ['a32'],
    'An oasis swim at Gaberoun is the cool reward after dune tracks in the Ubari sand sea.'],
  [115, 'Three Oasis Tour in the Libyan Sahara', 'three oasis tour Libya', ['Ubari oasis tour'], 'cdnA34', ['a34'],
    'A three oasis tour links desert lakes and palm fringes into one of Fezzan’s classic day circuits.'],
  [116, 'Sand Dune Driving and Sandboarding', 'sandboarding Libya', ['dune bashing Libya'], 'cdnA33', ['a33', 'a35'],
    'Sand dune driving and sandboarding bring play into a Sahara day between cultural and archaeology stops.'],
  [117, 'Acacus Mountains Camping Night', 'Acacus camping', ['camp Acacus Mountains'], 'cdnA39', ['a39'],
    'An Acacus camping night means stone silhouettes, stars, and a rare offline quiet in the Sahara.'],
  [118, 'Prehistoric Engravings in the Sahara', 'Acacus rock art', ['prehistoric engravings Libya'], 'cdnA38', ['a38'],
    'Prehistoric engravings in the Acacus record animals, people, and climates from deep time.'],
  [119, 'Germa Ruins Day Visit', 'Germa ruins tour', ['visit Germa'], 'cdnA36', ['a36'],
    'A Germa ruins day visit connects travelers to Garamantian history beyond Roman coastal fame.'],
  [120, 'Shahat and Temple of Zeus Tour', 'Temple of Zeus Cyrene', ['Shahat tour'], 'cdnA31', ['a26', 'a31'],
    'Shahat and the Temple of Zeus tour explores Greek heritage in the green mountains of east Libya.'],
];

for (const [id, title, primary, secondaries, pool, actIds, lead] of activities) {
  pack(
    id,
    title,
    primary,
    secondaries,
    pool,
    lead,
    [
      p(lead),
      h2('What the day feels like'),
      p('Your guide sets the pace, explains etiquette, and handles tickets or permissions where needed. You focus on looking and asking questions.'),
      h2('Good to know'),
      ul([
        'Wear closed shoes and sun protection',
        'Follow photo guidance at sensitive stops',
        'Bring water even on short desert add ons',
        'Tell us about mobility limits before booking',
      ]),
      h2('Add it in TourBuilder'),
      p('Find this activity in TourBuilder search. Title, duration, and price stay synced with our live CDN catalog so quotes stay accurate.'),
    ],
    { activities: actIds },
  );
}

async function ensureHero(slug, poolKey) {
  const srcName = POOL[poolKey];
  if (!srcName) throw new Error(`Unknown pool ${poolKey} for ${slug}`);
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

function buildMarkdown(post, featuredImage) {
  const slug = slugify(post.title);
  assertNoHyphenProse(post.title, `title ${post.id}`);
  const body = post.body();
  assertNoHyphenProse(body, `body ${post.id}`);
  const excerpt = body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160);
  const canonicalPath = `/en/${slug}`;
  const fm = {
    title: post.title,
    slug,
    canonicalPath,
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
      canonical: `https://intolibya.com${canonicalPath}`,
    },
  };
  const meta = {
    'primary-keyword': post.primary,
    secondary: post.secondaries,
    ...(post.cdn || {}),
  };
  const comment = `<!-- ${JSON.stringify(meta)} -->\n\n`;
  return {
    slug,
    path: path.join(ROOT, 'src/content/posts/en', `${slug}.md`),
    md: `---\n${yamlDump(fm, { lineWidth: -1 }).trimEnd()}\n---\n\n${comment}${body}`,
    primary: post.primary,
    secondaries: post.secondaries,
    featuredImage,
    pool: post.pool,
    id: post.id,
    cdn: post.cdn || null,
  };
}

async function main() {
  // Avoid overwriting existing published posts if slug collides
  const existing = new Set(
    (await fs.readdir(path.join(ROOT, 'src/content/posts/en')))
      .filter((f) => f.endsWith('.md'))
      .map((f) => f.replace(/\.md$/, '')),
  );

  console.log(`Generating ${POSTS.length} Batch B posts...`);
  const index = [];

  for (const post of POSTS) {
    let slug = slugify(post.title);
    const candidatePath = path.join(ROOT, 'src/content/posts/en', `${slug}.md`);
    let skipWrite = false;
    try {
      const prev = await fs.readFile(candidatePath, 'utf8');
      if (prev.includes('wpImportId:') || (prev.includes("publishedAt:") && !prev.includes('draft: true'))) {
        // published legacy: rename new draft
        slug = `${slug}-guide-2026`;
        post.title = `${post.title} Guide 2026`.replace(' Guide Guide', ' Guide');
        // if title now has issue, keep slug only change
        slug = slugify(post.title.includes('Guide 2026') ? post.title : `${post.title}`);
        // simpler: force unique slug suffix without changing display title oddly
      }
    } catch {
      // new file
    }

    // Recompute with possible collision handling
    slug = slugify(post.title);
    const outPath = path.join(ROOT, 'src/content/posts/en', `${slug}.md`);
    try {
      const prev = await fs.readFile(outPath, 'utf8');
      if (prev.includes('wpImportId:') || (!prev.includes('draft: true') && prev.includes('translationGroup:'))) {
        const newSlug = `${slug}-planner`;
        console.warn(`Collision on ${slug}, writing as ${newSlug}`);
        post._forceSlug = newSlug;
      }
    } catch {
      /* new */
    }

    const finalSlug = post._forceSlug || slugify(post.title);
    const featuredImage = await ensureHero(finalSlug, post.pool);

    // build with forced slug if needed
    const originalSlugify = slugify;
    let file;
    if (post._forceSlug) {
      const body = post.body();
      assertNoHyphenProse(post.title, `title ${post.id}`);
      assertNoHyphenProse(body, `body ${post.id}`);
      const excerpt = body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160);
      const fm = {
        title: post.title,
        slug: finalSlug,
        canonicalPath: `/en/${finalSlug}`,
        lang: 'en',
        publishedAt: TODAY,
        translationGroup: finalSlug,
        featuredImage,
        draft: true,
        galleries: [],
        excerpt,
        seo: {
          title: `${post.title} | IntoLibya`,
          description: post.seoDesc,
          canonical: `https://intolibya.com/en/${finalSlug}`,
        },
      };
      const meta = { 'primary-keyword': post.primary, secondary: post.secondaries, ...(post.cdn || {}) };
      file = {
        slug: finalSlug,
        path: path.join(ROOT, 'src/content/posts/en', `${finalSlug}.md`),
        md: `---\n${yamlDump(fm, { lineWidth: -1 }).trimEnd()}\n---\n\n<!-- ${JSON.stringify(meta)} -->\n\n${body}`,
        primary: post.primary,
        secondaries: post.secondaries,
        featuredImage,
        pool: post.pool,
        id: post.id,
        cdn: post.cdn || null,
      };
    } else {
      file = buildMarkdown(post, featuredImage);
    }

    await fs.writeFile(file.path, file.md, 'utf8');
    index.push({
      id: post.id,
      title: post.title,
      slug: file.slug,
      primaryKeyword: post.primary,
      secondaryKeywords: post.secondaries,
      featuredImage: file.featuredImage,
      heroPool: post.pool,
      cdn: post.cdn || null,
      path: `src/content/posts/en/${file.slug}.md`,
    });
    console.log(`✓ ${String(post.id).padStart(3, '0')} ${file.slug}`);
  }

  const lines = [
    '# Batch B posts (P1)',
    '',
    `Generated ${TODAY}. English drafts with \`draft: true\`.`,
    '',
    '## Coverage',
    '',
    '- 051–060 commercial',
    '- 066–080 itineraries',
    '- 081–100 destinations',
    '- 101–120 CDN activity guides',
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
  await fs.writeFile(path.join(ROOT, 'content-review/batch-b-posts.md'), `${lines.join('\n')}\n`);
  console.log(`\nWrote ${index.length} posts + content-review/batch-b-posts.md`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
