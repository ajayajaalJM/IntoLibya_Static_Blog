#!/usr/bin/env node
/**
 * Batch A: ingest heroes + write EN draft posts (writer compatible).
 * Grade 11 English. No hyphen characters in titles or body prose.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { dump as yamlDump } from 'js-yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
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
  ghat: 'ghat.webp',
  tour: 'tour.jpg',
  tour4: 'tour4.jpg',
  abstract: 'abstract.jpg',
  cdnA1: 'cdn-a1.jpg',
  cdnA7: 'cdn-a7.jpg',
  cdnA20: 'cdn-a20.jpg',
  cdnA32: 'cdn-a32.jpg',
  cairo: 'cairo.jpg',
  neighbor: 'ghadames.jpg', // Tunisia bridge visual (shared border town)
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
  // Allow hyphens only inside href/src URLs and HTML attributes we control separately.
  const prose = text
    .replace(/href="[^"]*"/g, 'href=""')
    .replace(/src="[^"]*"/g, 'src=""')
    .replace(/class="[^"]*"/g, 'class=""');
  if (prose.includes('-')) {
    const idx = prose.indexOf('-');
    const snip = prose.slice(Math.max(0, idx - 40), idx + 40);
    throw new Error(`Hyphen found in ${label}: ...${snip}...`);
  }
}

function p(html) {
  return `<p>${html}</p>`;
}

function h2(text) {
  return `<h2>${text}</h2>`;
}

function ul(items) {
  return `<ul>${items.map((i) => `<li>${i}</li>`).join('')}</ul>`;
}

function hr() {
  return `<hr />`;
}

function cta() {
  return [
    hr(),
    h2('Plan your Libya trip'),
    p(
      'Ready to go? Build your itinerary with IntoLibya TourBuilder, or message us on WhatsApp. We handle sponsorship, guides, and logistics so you can focus on the journey.',
    ),
    p(
      '<a href="/tourbuilder/booking">Build Your Trip</a> · <a href="/tourbuilder/tour-packages">Browse tour packages</a>',
    ),
  ].join('\n\n');
}

function article(sections) {
  return `${sections.join('\n\n')}\n\n${cta()}\n`;
}

/** @type {Array<{id:number,title:string,primary:string,secondaries:string[],pool:string,seoDesc:string,body:()=>string,cdn?:object}>} */
const POSTS = [];

function add(def) {
  POSTS.push(def);
}

// ——— 001–020 Access ———
add({
  id: 1,
  title: 'How to Visit Libya as a Tourist in 2026',
  primary: 'how to visit Libya',
  secondaries: ['visit Libya 2026', 'Libya tourist guide'],
  pool: 'cdnA1',
  seoDesc: 'Learn how to visit Libya as a tourist in 2026 with a licensed operator, eVisa steps, and what to expect on tour.',
  body: () =>
    article([
      p('Visiting Libya as a tourist is possible in 2026, but the path is different from a typical holiday. You book with a licensed tour operator, get sponsorship documents, apply for an eVisa, and travel with guides and tourist police as required.'),
      h2('Step 1: Choose a licensed operator'),
      p('Independent tourist travel is not allowed. Your operator sponsors your visit, plans the route, and prepares the paperwork immigration expects. IntoLibya offers packages and custom trips through TourBuilder.'),
      h2('Step 2: Confirm dates and pay a deposit'),
      p('Once dates are set and your deposit is in, sponsorship work can begin. Start early. Many travelers begin one to two months before departure.'),
      h2('Step 3: Apply for the eVisa'),
      p('You apply on the official eVisa portal with your passport details and sponsor documents. Processing times vary. Your operator will tell you when to submit.'),
      h2('Step 4: Fly in and meet your team'),
      p('Most guests arrive via Tripoli Mitiga or through hubs like Tunis. Your team meets you, handles transfers, and keeps the itinerary moving day by day.'),
      h2('What you will see'),
      p('Classic routes combine Tripoli, Roman sites such as Leptis Magna and Sabratha, desert towns like Ghadames, and deeper Sahara options on longer trips.'),
    ]),
});

add({
  id: 2,
  title: 'Libya eVisa Explained Step by Step',
  primary: 'Libya eVisa',
  secondaries: ['Libya e visa application', 'apply Libya visa online'],
  pool: 'abstract',
  seoDesc: 'A clear step by step guide to the Libya eVisa for tourists, including sponsorship and what to upload.',
  body: () =>
    article([
      p('The Libya eVisa is the online tourist visa most visitors use today. You still need a licensed sponsor before you apply. This guide walks through the process in plain language.'),
      h2('Who needs an eVisa'),
      p('Almost all foreign tourists need a visa. Your tour operator confirms the right category and prepares sponsor documents for your application.'),
      h2('What you need before you apply'),
      ul([
        'A passport valid for at least six months after travel',
        'A clear passport style photo',
        'Sponsor letter and supporting trip documents from your operator',
        'Payment method for the government fee',
      ]),
      h2('How to apply'),
      p('Create an account on the official portal, enter your details, upload files, and pay. Keep copies of every receipt and approval email.'),
      h2('After approval'),
      p('Save a digital and printed copy. Your operator will also keep records. On arrival, follow your guide through immigration with documents ready.'),
    ]),
});

add({
  id: 3,
  title: 'What Is a Libya Sponsor Letter and Why You Need One',
  primary: 'Libya sponsor letter',
  secondaries: ['Libya letter of invitation', 'LOI Libya tour'],
  pool: 'tour',
  seoDesc: 'Understand the Libya sponsor letter, why tourists need one, and how operators issue it after you book.',
  body: () =>
    article([
      p('A sponsor letter is official support from a licensed Libyan tour company. Without it, tourist eVisa applications are not accepted. It proves a local company is responsible for your visit.'),
      h2('What the letter usually includes'),
      p('Expect your name, passport details, travel dates, outline of the itinerary, and the company registration details. Hotels and guide notes may be attached as supporting files.'),
      h2('When you receive it'),
      p('Operators issue sponsorship after you book and pay the required deposit. That timing protects both sides and lets logistics begin for real dates.'),
      h2('Why it matters'),
      p('Libya requires tourist police coordination and approved movement. Sponsorship is how the system tracks who is hosting you. It is not optional paperwork.'),
    ]),
});

add({
  id: 4,
  title: 'How Long Does a Libya Visa Take',
  primary: 'Libya visa processing time',
  secondaries: ['how long Libya eVisa', 'Libya visa timeline'],
  pool: 'abstract',
  seoDesc: 'Typical Libya eVisa timelines for tourists and how early you should start with your tour operator.',
  body: () =>
    article([
      p('Visa timing is one of the first questions travelers ask. The honest answer is that it varies, so you plan with buffer days rather than last minute bookings.'),
      h2('Typical ranges'),
      p('Many eVisa decisions arrive within about one to three weeks after a complete submission. Some are faster. Some need extra review. Your operator will give you a working window based on current patterns.'),
      h2('What slows applications'),
      ul([
        'Missing sponsor files',
        'Blurry passport scans or photos',
        'Name mismatches across documents',
        'Applying before sponsorship is ready',
      ]),
      h2('Practical timeline'),
      p('Book your tour first. Allow time for sponsorship. Then apply. Aim to finish the visa step well before you buy nonrefundable extras beyond the tour deposit rules your operator explains.'),
    ]),
});

add({
  id: 5,
  title: 'Libya Visa Cost for Tourists',
  primary: 'Libya visa cost',
  secondaries: ['Libya eVisa fee', 'tourist visa price Libya'],
  pool: 'abstract',
  seoDesc: 'What tourists pay for a Libya visa, how operator packages handle fees, and what is separate from tour price.',
  body: () =>
    article([
      p('Tourists pay a government eVisa fee when they apply online. Some nationalities face different amounts. US travelers often see a higher fee than many other passports. Always check the portal for the live amount.'),
      h2('Fee versus tour price'),
      p('The visa fee is a government charge. Your tour price covers guides, logistics, and sponsorship work. All inclusive packages may absorb the visa fee. Leaner options may ask you to pay it yourself. Ask before you book.'),
      h2('Other money to budget'),
      ul([
        'Tour deposit to start sponsorship',
        'Flights to Libya or a hub such as Tunis',
        'Travel insurance that covers the destination',
        'Personal spending for snacks and souvenirs',
      ]),
      h2('Stay current'),
      p('Fees can change. IntoLibya confirms the current process when you book so you are not guessing from an old blog post.'),
    ]),
});

add({
  id: 6,
  title: 'Can US Citizens Get a Visa for Libya',
  primary: 'Libya visa for US citizens',
  secondaries: ['American travel to Libya visa'],
  pool: 'tripoli',
  seoDesc: 'Yes, US citizens can visit Libya with a licensed tour and eVisa. Here is how the process works.',
  body: () =>
    article([
      p('US citizens can travel to Libya as tourists when they book with a licensed operator and complete the eVisa with sponsor documents. Independent tourist travel is not available.'),
      h2('What is different for US passports'),
      p('Expect a higher government visa fee than many other nationalities. Processing still follows the same sponsor first model. Start early and keep scans crisp.'),
      h2('Advisories and personal choice'),
      p('US government advisories remain strong. Many travelers still go with operators who run approved routes. Read the advisory, talk with your operator, and decide what risk you accept.'),
      h2('Next steps'),
      p('Pick dates, choose a package or custom plan, pay the deposit, receive sponsorship, then apply. IntoLibya walks US guests through each file upload.'),
    ]),
});

add({
  id: 7,
  title: 'Can UK Citizens Get a Visa for Libya',
  primary: 'Libya visa for UK citizens',
  secondaries: ['British tourists Libya visa'],
  pool: 'tripoli',
  seoDesc: 'UK citizens can visit Libya on a sponsored tour with an eVisa. See steps, timing, and advisory notes.',
  body: () =>
    article([
      p('British travelers can visit Libya through a licensed tour company. You need sponsorship and an approved eVisa. The FCDO advisory is serious, so read it and decide carefully.'),
      h2('Booking path'),
      p('Choose your itinerary, pay the deposit, receive sponsor documents, apply online, then fly once approved. Your guide team meets you on arrival.'),
      h2('Flights from the UK'),
      p('Many guests connect through Tunis or other regional hubs. Your operator can suggest current flight patterns when you book.'),
      h2('On the ground'),
      p('Movement follows approved plans with tourist police as required. That structure is normal for tourism in Libya today.'),
    ]),
});

add({
  id: 8,
  title: 'Can EU Citizens Travel to Libya',
  primary: 'Libya visa EU citizens',
  secondaries: ['travel to Libya from Europe visa'],
  pool: 'leptis',
  seoDesc: 'EU citizens can travel to Libya with a licensed operator and eVisa. Learn the shared steps across Europe.',
  body: () =>
    article([
      p('Travelers from EU countries visit Libya the same way as other tourists: book a licensed operator, get sponsorship, apply for the eVisa, and travel on an approved itinerary.'),
      h2('Why Europe is a natural market'),
      p('Short connections through Tunis and strong interest in Roman archaeology make Libya appealing for European history travelers. Leptis Magna and Sabratha reward that interest.'),
      h2('Documents'),
      p('Use a passport with enough validity, a clear photo, and complete sponsor files. Keep names identical across every upload.'),
      h2('Language on tour'),
      p('English speaking guides are common on international tours. Ask if you need another language when you request a quote.'),
    ]),
});

add({
  id: 9,
  title: 'Flights to Tripoli: How Travelers Arrive',
  primary: 'flights to Tripoli',
  secondaries: ['Tripoli airport flights', 'fly to Libya'],
  pool: 'tripoli',
  seoDesc: 'How tourists fly into Tripoli for Libya tours, including hub cities and airport arrival tips.',
  body: () =>
    article([
      p('Most international visitors enter Libya through Tripoli. Flight options change more often than in busier tourist countries, so your operator helps you pick workable routes when dates are firm.'),
      h2('Common patterns'),
      p('Connections via Tunis are popular. Other hubs appear depending on airline schedules. Avoid locking nonrefundable fares before visa timing is clear.'),
      h2('Airport basics'),
      p('Mitiga is the usual Tripoli gateway for many visitors. Keep your eVisa and passport ready. Your driver and guide coordinate pickup.'),
      h2('After landing'),
      p('Expect introductions, a transfer, and a briefing on the days ahead. The first evening is often an easy city start before longer road days.'),
    ]),
});

add({
  id: 10,
  title: 'Flying to Libya via Tunis',
  primary: 'Tunis to Tripoli flights',
  secondaries: ['Libya Wings Tunis', 'fly Libya via Tunisia'],
  pool: 'neighbor',
  seoDesc: 'Use Tunis as a hub for Libya tours. Flight tips, stopover ideas, and how to connect into Tripoli.',
  body: () =>
    article([
      p('Tunis is one of the most practical hubs for reaching Libya. Many travelers overnight in Tunisia, then take a short hop to Tripoli once the eVisa is ready.'),
      h2('Why Tunis works'),
      p('Schedules are relatively workable, the city is easy for a short stay, and the flight time to Tripoli is short compared with longer African detours.'),
      h2('Stopover ideas'),
      p('If you have an extra day, explore Tunis medina or nearby heritage sites. Keep the focus light. Your main trip is Libya.'),
      h2('Booking tip'),
      p('Confirm visa status before you buy the Tunis to Tripoli leg when possible. Your IntoLibya planner can sync timing with sponsorship.'),
    ]),
});

add({
  id: 11,
  title: 'Flying to Libya via Cairo',
  primary: 'Cairo to Tripoli flights',
  secondaries: ['fly to Libya via Egypt'],
  pool: 'cairo',
  seoDesc: 'Flying to Libya via Cairo: when the hub makes sense and how to plan the connection with your tour.',
  body: () =>
    article([
      p('Cairo can work as a gateway for some Libya itineraries, especially if you are already in Egypt or find a strong connection. It is less common than Tunis for many western Libya trips, but it remains useful.'),
      h2('When to choose Cairo'),
      p('Choose it if fares fit, if you want an Egypt stop before Libya, or if Tunis seats are scarce on your dates.'),
      h2('Timing caution'),
      p('Build buffer between landing in Cairo and the onward flight. Immigration and airport transfers take time.'),
      h2('After you reach Libya'),
      p('Your Libya operator takes over logistics inside the country. Keep both trip segments documented and share flight numbers early.'),
    ]),
});

add({
  id: 12,
  title: 'Mitiga Airport Arrival Guide for Tourists',
  primary: 'Mitiga Airport',
  secondaries: ['Tripoli Mitiga arrival', 'MJI airport Libya'],
  pool: 'tripoli',
  seoDesc: 'What tourists should expect arriving at Mitiga Airport in Tripoli, from immigration to tour pickup.',
  body: () =>
    article([
      p('Mitiga Airport is the main arrival point many tourists use for Tripoli. Knowing the flow reduces stress after a long journey.'),
      h2('Before you land'),
      p('Have your passport, eVisa approval, and operator contacts offline. Charge your phone. Note your pickup name.'),
      h2('Immigration and bags'),
      p('Follow staff directions, present documents calmly, and collect luggage. Your guide can advise on current steps the week you travel.'),
      h2('Meeting your team'),
      p('Pickup is arranged. If you cannot spot the driver, use the WhatsApp number from your booking confirmation rather than wandering outside alone.'),
    ]),
});

add({
  id: 13,
  title: 'Travel Insurance for Libya: What Actually Works',
  primary: 'travel insurance Libya',
  secondaries: ['Libya trip insurance', 'high risk travel insurance'],
  pool: 'abstract',
  seoDesc: 'Standard policies often exclude Libya. Learn what kind of travel insurance tourists actually need.',
  body: () =>
    article([
      p('Many standard travel policies exclude Libya or treat it as a high risk destination. Buying the wrong policy is a common mistake.'),
      h2('Read the exclusion list'),
      p('Search the policy wording for Libya, sanctioned regions, or advisory based exclusions. If Libya is excluded, the policy will not help when you need it.'),
      h2('Specialist cover'),
      p('Ask insurers who cover adventure or higher risk destinations. Confirm medical evacuation and trip interruption rules in writing.'),
      h2('Share details with your operator'),
      p('Keep policy numbers with your travel docs. IntoLibya can tell you what past guests typically arrange, but you choose and buy the policy.'),
    ]),
});

add({
  id: 14,
  title: 'Money in Libya: Cash Cards and ATMs',
  primary: 'money in Libya',
  secondaries: ['Libya currency tourists', 'ATMs Tripoli'],
  pool: 'tripoli',
  seoDesc: 'How tourists handle money in Libya: cash habits, cards, and what your tour usually covers.',
  body: () =>
    article([
      p('On an organized tour, most big costs are prepaid. You still want a simple plan for personal spending.'),
      h2('Currency basics'),
      p('The local currency is the Libyan dinar. Rates and cash access can be awkward for visitors, so your guide helps with practical exchange advice.'),
      h2('Cards and ATMs'),
      p('Do not assume every card works everywhere. Carry a backup amount of widely accepted foreign cash if your operator recommends it for your dates.'),
      h2('What you pay day to day'),
      p('Souvenirs, extra drinks, and small personal purchases are the usual extras. Meals on all inclusive plans are covered as described in your package.'),
    ]),
});

add({
  id: 15,
  title: 'SIM Cards and Internet for Tourists in Libya',
  primary: 'SIM card Libya',
  secondaries: ['internet in Libya tourists', 'Libya mobile data'],
  pool: 'tripoli',
  seoDesc: 'Tourist tips for mobile data and WiFi in Libya, including desert days with weak signal.',
  body: () =>
    article([
      p('Connectivity in Libya is improving in cities and can disappear in the deep desert. Plan for both.'),
      h2('City days'),
      p('Hotels and cafes may offer WiFi. A local SIM can help if your operator or fixer can assist with a tourist friendly option.'),
      h2('Desert days'),
      p('Expect limited or no signal on Sahara camping nights. Download maps offline, tell family you may go quiet, and enjoy the break.'),
      h2('Practical tip'),
      p('Keep WhatsApp installed for operator contact when signal returns. It is the usual channel for quick updates.'),
    ]),
});

add({
  id: 16,
  title: 'What to Pack for a Libya Tour',
  primary: 'what to pack Libya',
  secondaries: ['Libya packing list', 'desert packing Libya'],
  pool: 'sahara',
  seoDesc: 'A practical Libya packing list for coast days and Sahara nights, including clothing and documents.',
  body: () =>
    article([
      p('Pack for Mediterranean cities and desert camps in the same suitcase. Layers win.'),
      h2('Clothing'),
      ul([
        'Modest outfits that cover shoulders and knees',
        'Light long sleeves for sun',
        'A warm layer for desert nights',
        'Closed shoes for ruins and dunes',
      ]),
      h2('Documents and health'),
      ul([
        'Passport and eVisa copies',
        'Insurance details',
        'Personal medicines',
        'Sunscreen, hat, sunglasses',
      ]),
      h2('Nice to have'),
      p('A power bank, a small dry bag, and a scarf for wind and sun make long road days easier.'),
    ]),
});

add({
  id: 17,
  title: 'Dress Code for Travelers in Libya',
  primary: 'dress code Libya',
  secondaries: ['what to wear in Libya', 'modest clothing Libya'],
  pool: 'ghadames',
  seoDesc: 'What travelers should wear in Libya for respect and comfort in cities and desert towns.',
  body: () =>
    article([
      p('Libya is conservative compared with beach resort destinations. Modest clothing shows respect and helps you feel comfortable in local spaces.'),
      h2('Simple rules'),
      p('Cover shoulders and knees. Avoid tight athletic wear in old towns and mosques. Loose fabrics handle heat better anyway.'),
      h2('Women travelers'),
      p('Long sleeves and longer skirts or trousers work well. A light scarf is useful for sun and for sites where covering hair is requested.'),
      h2('Men travelers'),
      p('Skip sleeveless shirts in city centers. Trousers or longer shorts that reach the knee are safer choices than short sports shorts.'),
    ]),
});

add({
  id: 18,
  title: 'Photography Rules for Tourists in Libya',
  primary: 'photography rules Libya',
  secondaries: ['can you take photos in Libya'],
  pool: 'leptis',
  seoDesc: 'Where tourists can photograph in Libya and what to avoid, from ruins to checkpoints and people.',
  body: () =>
    article([
      p('Libya is stunning on camera, but not every scene is fair game. Follow your guide. Local rules protect people and sensitive sites.'),
      h2('Usually fine'),
      p('Landscapes, dunes, and many archaeological areas are popular photo stops. Ask before photographing people at close range.'),
      h2('Ask first or avoid'),
      ul([
        'Military or police sites',
        'Checkpoints and official buildings',
        'Airports and secure facilities',
        'Private homes without invitation',
      ]),
      h2('Drones'),
      p('Do not assume drones are allowed. Get clear permission through your operator before packing one.'),
    ]),
});

add({
  id: 19,
  title: 'Libya Entry Requirements Checklist',
  primary: 'Libya entry requirements',
  secondaries: ['documents needed Libya tourist'],
  pool: 'abstract',
  seoDesc: 'A tourist checklist for Libya entry: passport, eVisa, sponsorship, insurance, and arrival tips.',
  body: () =>
    article([
      p('Use this checklist before you fly. Tick each item so immigration day feels calm.'),
      h2('Must have'),
      ul([
        'Passport with enough validity',
        'Approved eVisa',
        'Sponsor documents from your operator',
        'Return or onward flight details',
        'Operator emergency contacts',
      ]),
      h2('Strongly recommended'),
      ul([
        'Travel insurance that covers Libya',
        'Printed and digital document copies',
        'Enough personal medication for the full trip',
      ]),
      h2('Final check'),
      p('Message your IntoLibya coordinator 48 hours before departure to confirm pickup and any last document notes.'),
    ]),
});

add({
  id: 20,
  title: 'How Early Should You Book a Libya Tour',
  primary: 'when to book Libya tour',
  secondaries: ['Libya tour booking timeline'],
  pool: 'tour',
  seoDesc: 'How many weeks before travel you should book a Libya tour for visas, flights, and peak season dates.',
  body: () =>
    article([
      p('Libya is not a last minute destination. Sponsorship and visas need runway.'),
      h2('A solid window'),
      p('Many guests book about six to eight weeks ahead. Peak months from autumn through spring may need more time for popular dates.'),
      h2('What the lead time covers'),
      ul([
        'Itinerary design',
        'Deposit and sponsorship',
        'eVisa submission and approval',
        'Flights and insurance',
      ]),
      h2('Rush requests'),
      p('Sometimes faster paths work. Sometimes they do not. Ask early if your dates are tight rather than assuming a miracle timeline.'),
    ]),
});

// ——— 021–040 Safety ———
const safetyPosts = [
  [21, 'Is It Safe to Travel to Libya Right Now', 'is it safe to travel to Libya', ['Libya safety 2026', 'Libya safe for tourists'], 'tripoli',
    'Safety in Libya is managed through licensed tours, approved routes, and tourist police. Here is a clear picture for 2026.',
    ['Government advisories remain cautious.', 'Tourists travel with licensed operators on planned routes.', 'Conditions can change, so flexibility matters.', 'Western highlight routes are the usual tourist circuit.']],
  [22, 'How Government Travel Advisories Affect Libya Trips', 'Libya travel advisory', ['FCDO Libya', 'State Department Libya travel'], 'abstract',
    'How to read Libya travel advisories and still decide if a licensed tour fits your risk comfort.',
    ['Advisories are risk communications, not entry bans by themselves.', 'Insurers often follow advisory language.', 'Operators run only routes that are currently workable.', 'You must make a personal decision after reading official text.']],
  [23, 'Is Western Libya Safe for Tourists', 'western Libya safety', ['Tripoli safe for tourists', 'Ghadames safety'], 'ghadames',
    'Western Libya hosts most tourist routes today, including Tripoli, Leptis, Sabratha, and Ghadames.',
    ['Most international tours focus west.', 'Checkpoints and escorts are normal.', 'Your guide updates daily plans if needed.', 'Desert legs still need experienced logistics.']],
  [24, 'Is Eastern Libya Open for Tourists', 'eastern Libya tourism', ['Benghazi tourism', 'Cyrenaica travel'], 'east',
    'Eastern Libya access depends on permits, timing, and operator capability. It is not the same as the western circuit.',
    ['Some history sites sit in the east.', 'Extra clearances can apply.', 'Ask IntoLibya what is open for your dates.', 'Do not assume every eastern site is available.']],
  [25, 'Solo Travel in Libya: What Is Allowed', 'solo travel Libya', ['independent travel Libya', 'solo tourist Libya'], 'tour',
    'You can visit Libya as a solo person, but not as an independent backpacker. You join a licensed tour structure.',
    ['Solo guests join group or private departures.', 'Free roaming without a sponsor is not allowed.', 'TourBuilder can shape a private pace.', 'Even solo, you are never without the tour framework.']],
  [26, 'Is Libya Safe for Women Travelers', 'is Libya safe for women', ['women traveling to Libya'], 'tripoli',
    'Women visit Libya on guided tours. Modest dress, guide support, and clear boundaries make the experience workable.',
    ['Many women travel in mixed or private groups.', 'Dress modestly and follow guide advice.', 'Street harassment risk exists as in many places; guides help navigate.', 'Ask for women specific concerns when you book.']],
  [27, 'Safety for Couples Visiting Libya', 'Libya for couples', ['couple travel Libya safety'], 'leptis',
    'Couples often love Libya for empty ruins and shared adventure. The safety model is the same licensed tour framework.',
    ['Private tours suit couples who want their own pace.', 'PDA norms are conservative in public.', 'Hotels and camps are arranged by the operator.', 'Focus on shared experiences rather than nightlife.']],
  [28, 'What Tourist Police Escorts Mean on a Libya Tour', 'Libya tourist police', ['tourist police escort Libya'], 'tour',
    'Tourist police escorts are part of the legal tourism system. They are not a sign your trip failed.',
    ['Escorts help with checkpoints and permissions.', 'They travel with tourist groups as required.', 'Be polite and follow instructions.', 'Your guide handles coordination so you can explore.']],
  [29, 'Checkpoints in Libya: How Tours Handle Them', 'Libya checkpoints tourists', ['road checkpoints Libya tour'], 'sahara',
    'Checkpoints are routine on Libyan roads. Tours plan time and documents so stops stay orderly.',
    ['Keep passport access easy on road days.', 'Stay in the vehicle until asked.', 'Photography at checkpoints is a bad idea.', 'Delays happen; patience is part of travel here.']],
  [30, 'Common Safety Myths About Traveling to Libya', 'Libya travel myths', ['misconceptions about Libya travel'], 'tripoli',
    'Myths stop people from asking good questions. Here are common ones and clearer realities.',
    ['Myth: nobody can visit. Reality: tourists visit with operators.', 'Myth: every road is open. Reality: routes are curated.', 'Myth: escorts mean constant danger. Reality: they are required structure.', 'Myth: Libya has no history left. Reality: sites like Leptis are world class.']],
  [31, 'How Licensed Operators Keep Guests Safe in Libya', 'licensed Libya tour operator', ['safe Libya tour company'], 'tour',
    'Licensing, local teams, approved itineraries, and real time judgment are how operators manage guest safety.',
    ['Only book licensed sponsors.', 'Itineraries adapt when conditions shift.', 'Vehicles and hotels are prearranged.', 'Ask how an operator handles cancellations for security reasons.']],
  [32, 'Libya vs Travel Warnings: How to Read the Risk', 'Libya travel risk', ['understanding Libya advisories'], 'abstract',
    'Travel warnings describe national risk. Your tour operates inside a narrower, managed corridor. Learn to separate the two.',
    ['Countrywide language can sound absolute.', 'Tourism uses approved pockets and escorts.', 'Your comfort level still matters.', 'Compare advisory text with operator briefings.']],
  [33, 'Night Travel and Road Safety on Libya Tours', 'road safety Libya', ['night driving Libya tourists'], 'sahara',
    'Most tourist road moves happen in daylight. Night driving is limited for comfort and control.',
    ['Long transfers start early.', 'Desert tracks need daylight.', 'Fatigue management matters for drivers.', 'Trust the schedule even if it feels strict.']],
  [34, 'Health and Medical Care for Visitors to Libya', 'medical care Libya tourists', ['hospitals Tripoli travelers'], 'tripoli',
    'Bring personal medicines and insurance. Cities have clinics and hospitals; remote desert days need prevention first.',
    ['Pack prescriptions in original packaging.', 'Tell guides about allergies and conditions.', 'Evacuation cover matters for remote legs.', 'Drink bottled water when advised.']],
  [35, 'Is Libya Safe for First Time Visitors to North Africa', 'first time Libya travel', ['Libya for beginners'], 'leptis',
    'First timers can visit Libya if they accept a guided format and do basic cultural homework.',
    ['Start with a shorter western circuit.', 'Learn dress and photo norms.', 'Choose autumn or spring weather.', 'Lean on your guide rather than improvising.']],
  [36, 'Family Travel Safety Questions for Libya', 'family travel Libya', ['kids Libya tour safety'], 'tripoli',
    'Families sometimes travel, but Libya is a serious trip. Discuss ages, pace, and desert fitness with your operator first.',
    ['Not every itinerary suits young children.', 'Heat and long drives are real factors.', 'Private tours allow nap friendly pacing.', 'Ask about seat belts and room setups early.']],
  [37, 'What Happens If Plans Change for Security Reasons', 'Libya tour itinerary changes', ['security delays Libya tour'], 'tour',
    'Itineraries can change when authorities update access. Good operators communicate fast and offer alternatives.',
    ['Safety overrides a photo stop.', 'You may swap sites or days.', 'Refund and change rules should be clear in writing.', 'Flexibility is part of traveling here.']],
  [38, 'How to Choose a Trusted Libya Tour Company', 'best Libya tour company', ['trusted Libya operator'], 'tour',
    'Trust comes from licensing, clear inclusions, honest safety talk, and responsive planning.',
    ['Confirm licensing and sponsorship ability.', 'Ask what is included versus extra.', 'Read how they handle visas.', 'Prefer clear communication over flashy promises.']],
  [39, 'Real Guest Experiences: Feeling Safe in Libya', 'Libya tour reviews safety', ['guest experience Libya'], 'ghadames',
    'Guests often say they felt looked after day to day even when advisories sounded alarming before departure.',
    ['Structure reduces uncertainty.', 'Local hospitality stands out.', 'Empty sites feel peaceful, not abandoned.', 'Talk to recent guests when you can.']],
  [40, 'Scams and Tourist Risks to Know Before Libya', 'Libya tourist scams', ['travel risks Libya'], 'abstract',
    'The bigger risk is booking the wrong operator, not classic street scams. Still, stay sharp with money and documents.',
    ['Avoid unofficial visa sellers.', 'Do not hand over passports to strangers.', 'Use operator recommended money advice.', 'Keep digital copies of key documents.']],
];

for (const [id, title, primary, secondaries, pool, seoDesc, points] of safetyPosts) {
  add({
    id,
    title,
    primary,
    secondaries,
    pool,
    seoDesc,
    body: () =>
      article([
        p(seoDesc.replace(/\.$/, '') + '.'),
        h2('Key points'),
        ul(points),
        h2('How IntoLibya approaches this'),
        p('We only run routes we can support with sponsorship, guides, and current local coordination. If a plan is not safe enough for a given week, we say so and adjust.'),
        h2('Your decision'),
        p('Read official advisories, ask direct questions, and book only when the answers feel clear. A good tour reduces chaos. It cannot remove every risk from a complex country.'),
      ]),
  });
}

// ——— 041–050 Commercial ———
const commercial = [
  [41, 'Libya Tour Packages Explained', 'Libya tour packages', ['Libya tours 2026', 'Libya package holidays'], 'tour', 'tour_4day,tour_7day,tour_15day,tour_all_libya',
    'IntoLibya packages range from short coastal trips to deep country expeditions. Each one is built from real activities in TourBuilder.'],
  [42, 'How to Book a Libya Tour with IntoLibya', 'book Libya tour', ['IntoLibya booking', 'TourBuilder Libya'], 'tour', null,
    'Booking starts in TourBuilder or with a package selection, then deposit, sponsorship, eVisa, and travel.'],
  [43, 'What Is Included in an All Inclusive Libya Tour', 'all inclusive Libya tour', ['Libya tour inclusions'], 'tour', null,
    'All inclusive usually means visa support, hotels or desert camps, meals, transport, guides, fees, and escorts as required.'],
  [44, 'All Inclusive vs Lean Libya Tours', 'Libya tour options', ['inclusive vs basic Libya tour'], 'tour', null,
    'Leaner trips may leave visa fees or meals to you. All inclusive reduces surprise costs. Choose based on how much you want handled.'],
  [45, 'How Much Does a Libya Tour Cost', 'Libya tour cost', ['price of Libya tour', 'Libya trip cost'], 'tour', null,
    'Costs vary by length, season, private versus group format, and how remote the desert legs are. Request a quote for live numbers.'],
  [46, 'Libya Tour Deposit and Payment Timeline', 'Libya tour deposit', ['pay for Libya tour'], 'abstract', null,
    'A deposit starts sponsorship. Balance timing depends on the package. Never pay random personal accounts outside official channels.'],
  [47, 'Private Libya Tour vs Group Tour', 'private Libya tour', ['group tour Libya'], 'tour', null,
    'Private tours cost more and move on your clock. Group tours share logistics and often feel social. Both still use licensed structure.'],
  [48, 'How TourBuilder Works for Custom Libya Trips', 'Libya TourBuilder', ['custom Libya itinerary builder'], 'tour', null,
    'TourBuilder lets you pick days and activities, then submit for a quote. It turns curiosity into a priced, sponsor ready plan.'],
  [49, 'Best Libya Tour for First Timers', 'best Libya tour first time', ['beginner Libya package'], 'tour', 'tour_7day',
    'First timers usually love a one week western circuit with Tripoli, Roman sites, and a desert town highlight.'],
  [50, 'Best Libya Tour for History Lovers', 'Libya archaeology tour', ['Roman ruins Libya tour'], 'leptis', 'tour_7day,tour_15day',
    'History lovers should prioritize Leptis Magna, Sabratha, museums, and optional eastern classical sites when open.'],
];

for (const [id, title, primary, secondaries, pool, cdn, lead] of commercial) {
  add({
    id,
    title,
    primary,
    secondaries,
    pool,
    cdn: cdn ? { tours: cdn.split(',') } : undefined,
    seoDesc: lead,
    body: () =>
      article([
        p(lead),
        h2('What to compare'),
        ul([
          'Trip length and driving load',
          'Coast focus versus Sahara focus',
          'All inclusive versus lean inclusions',
          'Fixed package versus custom TourBuilder plan',
        ]),
        h2('How to move forward'),
        p('Open TourBuilder, pick a package or build a custom list of days, and submit for a quote. Live package names, lengths, and activity lists come from our CDN catalog so details stay current.'),
        h2('After you book'),
        p('Deposit, sponsorship, eVisa, flights, then arrival. Your coordinator keeps the checklist moving.'),
      ]),
  });
}

// ——— 061–065 Itineraries ———
const itineraries = [
  [61, '4 Day Libya Itinerary for First Visitors', '4 day Libya itinerary', ['short Libya trip plan'], 'tour4', 'tour_4day',
    'Four days suit a focused coastal introduction: Tripoli plus major Roman sites without a deep desert push.'],
  [62, '7 Day Western Libya Itinerary', '7 day Libya itinerary', ['western Libya itinerary'], 'tour', 'tour_7day',
    'Seven days can link Tripoli, Roman coast highlights, mountain stops, and Ghadames on a classic western arc.'],
  [63, '10 Day Libya Itinerary: Coast and Desert', '10 day Libya itinerary', ['coast and desert Libya'], 'sahara', 'tour_15day',
    'Ten days give room for coast culture and a meaningful Sahara chapter without sprinting every sunrise.'],
  [64, '12 Day Libya Adventure Itinerary', '12 day Libya itinerary', ['Libya adventure itinerary'], 'acacus', 'tour_15day',
    'Twelve days support deeper Sahara time, oasis swims, and richer archaeology beyond a highlight reel.'],
  [65, '18 Day Full Country Libya Itinerary', '18 day Libya itinerary', ['full country Libya trip'], 'tour', 'tour_all_libya',
    'Eighteen days aim at north, south, east, and west when access allows, including Tuareg and Amazigh regions.'],
];

for (const [id, title, primary, secondaries, pool, tourId, lead] of itineraries) {
  add({
    id,
    title,
    primary,
    secondaries,
    pool,
    cdn: { tours: [tourId] },
    seoDesc: lead,
    body: () =>
      article([
        p(lead),
        h2('Who this length suits'),
        p('Match days to energy and interests. Shorter trips favor ruins and cities. Longer trips reward desert silence and flexible pacing.'),
        h2('Sample rhythm'),
        ul([
          'Arrival and Tripoli orientation',
          'Roman coast days with guided site time',
          'Road transfer to desert or mountain regions on longer plans',
          'Buffer time for checkpoints and weather',
        ]),
        h2('Build the real version'),
        p('Use TourBuilder to attach live activities to each day. Package lengths and inclusions update from our CDN so you are not planning from outdated PDFs.'),
      ]),
  });
}

// ——— 161–166 Neighbor bridges ———
const bridges = [
  [161, 'Tunisia vs Libya for History Travelers', 'Tunisia vs Libya', ['Libya or Tunisia history'], 'neighbor',
    'Tunisia is easier for independent travel. Libya offers emptier Roman stages and a sponsored adventure format.'],
  [162, 'Egypt vs Libya for Ancient Ruins', 'Egypt vs Libya ruins', ['Libya or Egypt archaeology'], 'cdnA20',
    'Egypt has iconic density and crowds. Libya offers extraordinary Roman preservation with far fewer visitors.'],
  [163, 'Algeria vs Libya for Sahara Expeditions', 'Algeria vs Libya Sahara', ['Libya or Algeria desert'], 'sahara',
    'Algeria’s deep south is legendary. Libya’s Acacus, oases, and Ghat region deliver a different Sahara story with operator based access.'],
  [164, 'Tunisia Holiday Ideas That Lead to a Libya Trip', 'Tunisia holiday then Libya', ['add Libya to Tunisia trip'], 'neighbor',
    'Use a Tunisia holiday as a warm up, then continue to Tripoli for ruins and desert culture few beach trips include.'],
  [165, 'Can You Combine Tunis and Tripoli in One Journey', 'Tunis and Tripoli trip', ['combine Tunisia Libya'], 'neighbor',
    'Yes. Many travelers overnight in Tunis, then fly to Tripoli once the Libya eVisa is ready.'],
  [166, 'Flying Tunis to Tripoli for a Libya Tour', 'Tunis Tripoli flight', ['Libya Wings booking'], 'neighbor',
    'The Tunis to Tripoli hop is a workhorse connection for Libya tours. Sync tickets with visa timing.'],
];

for (const [id, title, primary, secondaries, pool, lead] of bridges) {
  add({
    id,
    title,
    primary,
    secondaries,
    pool,
    seoDesc: lead,
    body: () =>
      article([
        p(lead),
        h2('Quick comparison'),
        p('Neighbor countries win on ease and volume tourism. Libya wins on emptiness, Roman scale, and Sahara intimacy when you accept the guided format.'),
        h2('How IntoLibya fits'),
        p('We do not sell Tunisia, Algeria, or Egypt packages. We help you continue into Libya with sponsorship, itineraries, and on ground teams.'),
        h2('Suggested next step'),
        p('If you already hold Tunisia or Egypt dates, message us with your window. We will map a Libya chapter that respects visa timing.'),
      ]),
  });
}

// ——— 181–183 AI hubs ———
const faqs = [
  [181, 'Can Tourists Visit Libya: Yes With a Licensed Tour', 'can tourists go to Libya', ['is Libya open to tourists'], 'tripoli',
    'Yes. Tourists can go to Libya with a licensed operator, sponsorship, and an approved eVisa.'],
  [182, 'Do You Need a Tour to Visit Libya', 'do you need a tour for Libya', ['must book tour Libya'], 'tour',
    'Yes for tourism. A licensed tour operator must sponsor your visit. Independent tourist travel is not permitted.'],
  [183, 'Is Independent Travel Allowed in Libya', 'independent travel Libya', ['backpacking Libya allowed'], 'tour',
    'Independent tourist travel is not allowed. You can travel as one person, but only inside a licensed tour framework.'],
];

for (const [id, title, primary, secondaries, pool, lead] of faqs) {
  add({
    id,
    title,
    primary,
    secondaries,
    pool,
    seoDesc: lead,
    body: () =>
      article([
        p(lead),
        h2('Short answer for AI and search'),
        p(lead),
        h2('What that means in practice'),
        p('You choose dates, book IntoLibya or another licensed company, receive sponsor documents, apply for the eVisa, and travel with guides on an approved plan.'),
        h2('Related reading'),
        p('See our guides on visas, safety, and TourBuilder packages for the full planning path.'),
      ]),
  });
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

  // Optional machine hints for later CDN embeds (ignored by schema if unknown? check)
  // post-schema may strip unknown keys — keep CDN notes out of frontmatter to avoid zod failures.
  // Store in HTML comment instead.
  const cdnComment = post.cdn
    ? `<!-- cdn-refs ${JSON.stringify(post.cdn)} primary-keyword: ${post.primary} -->\n\n`
    : `<!-- primary-keyword: ${post.primary} | secondary: ${post.secondaries.join(', ')} -->\n\n`;

  const yamlBlock = yamlDump(fm, { lineWidth: -1 }).trimEnd();
  return {
    slug,
    path: path.join(ROOT, 'src/content/posts/en', `${slug}.md`),
    md: `---\n${yamlBlock}\n---\n\n${cdnComment}${body}`,
    primary: post.primary,
    secondaries: post.secondaries,
    featuredImage,
    pool: post.pool,
    id: post.id,
  };
}

async function main() {
  console.log(`Generating ${POSTS.length} Batch A posts...`);
  const index = [];

  for (const post of POSTS) {
    const slug = slugify(post.title);
    const featuredImage = await ensureHero(slug, post.pool);
    const file = buildMarkdown(post, featuredImage);
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

  const strategyDir = path.join(ROOT, 'content-review');
  await fs.mkdir(strategyDir, { recursive: true });
  const strategyPath = path.join(strategyDir, 'batch-a-posts.md');
  const lines = [
    '# Batch A posts (P0)',
    '',
    `Generated ${TODAY}. English drafts with \`draft: true\`. Writer compatible for later Translate & save all.`,
    '',
    '## Rules used',
    '',
    '- Grade 11 English',
    '- No hyphen characters in titles or body prose',
    '- Heroes ingested to `/media/posts/{slug}/hero.webp`',
    '- Product facts point to TourBuilder; CDN IDs noted in HTML comments where relevant',
    '',
    '## Post index',
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
  await fs.writeFile(strategyPath, `${lines.join('\n')}\n`, 'utf8');
  console.log(`\nWrote ${index.length} posts + ${strategyPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
