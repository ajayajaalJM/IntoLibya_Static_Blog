#!/usr/bin/env node
/**
 * Wave 2 Batch 1: first 12 P0 posts (2026-10-19 → 2026-10-22).
 * Grade 11 English. No hyphen characters in titles or body prose.
 * Target ~700–800 words. draft: false with schedule publishedAt.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { dump as yamlDump } from 'js-yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const HERO_SRC = '/tmp/il-heroes';

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
  cairo: 'cairo.jpg',
  neighbor: 'ghadames.jpg',
  abstract: 'abstract.jpg',
};

function assertNoHyphenProse(text, label) {
  const prose = text
    .replace(/href="[^"]*"/g, 'href=""')
    .replace(/src="[^"]*"/g, 'src=""')
    .replace(/class="[^"]*"/g, 'class=""')
    .replace(/<!--[\s\S]*?-->/g, '');
  if (prose.includes('-')) {
    const idx = prose.indexOf('-');
    const snip = prose.slice(Math.max(0, idx - 40), idx + 40);
    throw new Error(`Hyphen found in ${label}: ...${snip}...`);
  }
}

function wordCount(html) {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean).length;
}

const CTA = `
<hr />

<h2>Plan your Libya trip with IntoLibya</h2>

<p>IntoLibya handles licensed sponsorship, TourBuilder itineraries, guides, and on ground logistics. Tell us your dates and must see list. We will reply with a route that matches how tourism in Libya actually works.</p>

<p><a href="/tourbuilder/booking">Build Your Trip</a> · <a href="/tourbuilder/tour-packages">Browse tour packages</a> · <a href="/tourbuilder/search">Browse activities</a></p>
`.trim();

/** @type {Array<{id:number,title:string,slug:string,publishedAt:string,primary:string,secondaries:string[],pool:string,seoDesc:string,body:string}>} */
const POSTS = [];

function add(def) {
  POSTS.push(def);
}

add({
  id: 201,
  title: 'Is Libya Part of a North Africa Trip Plan',
  slug: 'is-libya-part-of-a-north-africa-trip-plan',
  publishedAt: '2026-10-19',
  primary: 'North Africa trip plan',
  secondaries: ['Libya North Africa itinerary', 'Maghreb travel'],
  pool: 'neighbor',
  seoDesc:
    'Is Libya part of a North Africa trip plan? How Maghreb and Egypt itineraries can include a licensed Libya chapter without confusing logistics.',
  body: `
<p>Is Libya part of a North Africa trip plan? Yes, when you give it a clear job instead of treating the Maghreb and Egypt as one interchangeable holiday. Morocco, Tunisia, Algeria, Egypt, and Libya each ask for different seasons, visas, and booking styles. Libya belongs as the low crowd, high structure chapter for travelers who already enjoy history or desert and are ready for a licensed tour.</p>

<p>IntoLibya sells Libya journeys only. Neighbor countries stay with their own specialists. This guide shows how Libya slots into a wider North Africa plan without pretending one company can package Tunis, Cairo, and Tripoli as a single freestyle ticket.</p>

<h2>Give each country a job</h2>

<p>Morocco often handles cities, mountains, and accessible desert edges with thick tourism services. Tunisia handles compact history, beaches, and short breaks. Algeria handles large Sahara expeditions for patient planners. Egypt handles pharaonic megasites and Nile logistics at global fame. Libya handles empty UNESCO Romans, oasis towns, and Sahara camping on sponsored tours.</p>

<p>When each place has a job, your calendar stops fighting itself. You stop asking Libya to replace Luxor. You stop asking Tunisia to replace the Acacus. You stop stacking three hard logistics weeks into one exhausted fortnight.</p>

<h2>Where Libya fits in a multi year map</h2>

<p>Many guests use a patient sequence. Year one might be Morocco or Tunisia for confidence. Year two might be Egypt for temples. Year three becomes Libya when you want silence at <a href="/en/destination/leptis-magna">Leptis Magna</a>, theatre light at <a href="/en/destination/sabratha">Sabratha</a>, and covered lanes in <a href="/en/destination/ghadames">Ghadames</a>. That pacing spreads visa work and keeps wonder fresh.</p>

<p>Travelers with less time can still place Libya after a Tunisia beach week or a Cairo stopover flight. Keep each segment’s booking reality separate. Libya needs sponsorship, eVisa timing, guides, and required tourist police coordination. Soft beach weeks do not.</p>

<h2>Season and energy rules that keep plans honest</h2>

<p>Libya shoulder seasons often favor spring and autumn for desert comfort. Summer Sahara heat is serious. Winter coast days can feel mild compared with northern Europe, while desert nights still need layers. Build buffers. Ask IntoLibya for route specific honesty when you enquire. Do not invent your own permit story or freestyle backpacking plan. Independent tourist travel is not the product model.</p>

<p>Energy matters as much as maps. Classical coast days and deep Fezzan circuits ask different fitness and patience. Tell us what you have already seen so TourBuilder aims at gaps instead of repeats.</p>

<h2>How to add Libya without logistics fog</h2>

<ol>
<li>Decide the job Libya will do: quiet Romans, oasis culture, Sahara camping, or a mix.</li>
<li>Lock approximate dates with enough lead time for sponsorship and eVisa steps.</li>
<li>Book neighbor holidays with their own specialists if you want a multi country year.</li>
<li>Open <a href="/tourbuilder/booking">TourBuilder</a> for the Libya chapter and send your must see list.</li>
<li>Keep flights flexible until the document story is solid.</li>
</ol>

<p>A North Africa trip plan that includes Libya is not a mashup. It is a sequence of clear chapters. Libya’s chapter rewards travelers who want space at world class sites and accept structure as the price of entry.</p>

<h2>Related reading</h2>

<ul>
<li><a href="/en/north-africa-holiday-planner-where-libya-fits">North Africa Holiday Planner Where Libya Fits</a></li>
<li><a href="/en/morocco-tunisia-egypt-algeria-or-libya-which-fits-you">Morocco Tunisia Egypt Algeria or Libya Which Fits You</a></li>
<li><a href="/en/how-to-build-a-maghreb-circuit-that-includes-libya">How to Build a Maghreb Circuit That Includes Libya</a></li>
<li><a href="/en/how-to-visit-libya-as-a-tourist-in-2026">How to Visit Libya as a Tourist in 2026</a></li>
<li><a href="/en/destination/tripoli">Tripoli destination guide</a></li>
<li><a href="/en/destination/leptis-magna">Leptis Magna destination guide</a></li>
</ul>
`.trim(),
});

add({
  id: 202,
  title: 'North Africa Destinations Ranked for Empty UNESCO Sites',
  slug: 'north-africa-destinations-ranked-for-empty-unesco-sites',
  publishedAt: '2026-10-19',
  primary: 'empty UNESCO North Africa',
  secondaries: ['Libya UNESCO empty sites', 'quiet ruins North Africa'],
  pool: 'leptis',
  seoDesc:
    'North Africa destinations ranked for empty UNESCO sites. Why Libya’s quiet Romans and oasis towns stand out for travelers who hate crowds.',
  body: `
<p>North Africa destinations ranked for empty UNESCO sites start with a blunt truth. Fame and silence rarely travel together. Egypt’s headline temples can feel like moving corridors. Morocco’s medina icons draw dense evening flows. Tunisia’s best Romans sit in a practiced tourism network. Libya’s UNESCO grade Romans and oasis fabric still deliver days where your footsteps are the loudest sound in a forum.</p>

<p>This ranking is for travelers who prioritize space to look, not for travelers who want the fastest Instagram loop. IntoLibya sells Libya only. Neighbor countries stay with their own specialists. Use the comparison to decide whether quiet stone is worth a sponsored format.</p>

<h2>What empty means in practice</h2>

<p>Empty does not mean abandoned or unsafe to visit on a licensed tour. It means visitor density low enough that a theatre seat, a colonnade, or a covered oasis lane can feel like discovery. Guides still manage time, photography etiquette, and required coordination. You still follow dress and photo rules. You simply are not competing with tour bus waves every ten minutes.</p>

<p>Ask before you photograph people. Landscapes and ruins are generous. Communities deserve consent.</p>

<h2>How the region stacks for quiet UNESCO energy</h2>

<p><strong>Libya.</strong> <a href="/en/destination/leptis-magna">Leptis Magna</a> and <a href="/en/destination/sabratha">Sabratha</a> are complete Mediterranean Roman cities you can still walk with room to think. <a href="/en/destination/ghadames">Ghadames</a> adds a living oasis old town of covered lanes. East Libya Greek heritage around Shahat and related sites extends the quiet classical map when your circuit reaches Cyrenaica. Access is structured: sponsorship, eVisa, guides, tourist police as required.</p>

<p><strong>Tunisia.</strong> Dougga, El Djem, and Carthage fragments are outstanding, yet the tourism machine is mature. You gain convenience and lose some silence at peak hours. Independent travel is normal. Crowds are manageable compared with Luxor, but the emotional tone is still shared.</p>

<p><strong>Algeria.</strong> Roman depth and Saharan rock landscapes can feel vast. Logistics and permits reward patience. Remoteness is real. Choose Algeria specialists when Tassili style plateaus are the nonnegotiable dream.</p>

<p><strong>Morocco.</strong> UNESCO medinas and monuments are magnetic and busy. The magic is urban texture and mountain contrast, not empty Roman forums.</p>

<p><strong>Egypt.</strong> World defining sites with world defining queues. Unbeatable for pharaonic scale. Weak for travelers whose primary wish is solitude among ancient stone.</p>

<h2>A simple ranking for space seekers</h2>

<ol>
<li>Libya for empty classical cities plus oasis fabric on licensed tours</li>
<li>Algeria for remote desert drama when permits and time allow</li>
<li>Tunisia for excellent Romans with easier independent days</li>
<li>Morocco for living cities more than empty ruins</li>
<li>Egypt for iconic density, not silence</li>
</ol>

<p>Rankings are tools, not insults. Egypt is extraordinary. Libya is extraordinary in a different register. If your North Africa memory bank already holds crowds, Libya’s quiet UNESCO mornings may be the missing chapter.</p>

<h2>How to plan the Libya quiet chapter</h2>

<p>Choose length that matches leave and heat tolerance. Coast first itineraries suit first timers who want Tripoli plus Leptis and Sabratha. Longer journeys add Ghadames or Sahara nights. Open TourBuilder, list must see sites, and ask for route specific honesty. Do not chase freestyle independent entry. The structure is what keeps those empty mornings possible for visitors.</p>

<h2>Related reading</h2>

<ul>
<li><a href="/en/roman-ruins-without-the-crowds-in-north-africa">Roman Ruins Without the Crowds in North Africa</a></li>
<li><a href="/en/best-north-africa-trip-if-you-want-empty-unesco-sites">Best North Africa Trip If You Want Empty UNESCO Sites</a></li>
<li><a href="/en/why-libya-feels-less-crowded-than-egypt">Why Libya Feels Less Crowded Than Egypt</a></li>
<li><a href="/en/how-many-unesco-sites-does-libya-have">How Many UNESCO Sites Does Libya Have</a></li>
<li><a href="/en/destination/leptis-magna">Leptis Magna destination guide</a></li>
<li><a href="/en/destination/sabratha">Sabratha destination guide</a></li>
</ul>
`.trim(),
});

add({
  id: 203,
  title: 'Morocco Tunisia Egypt Algeria or Libya Which Fits You',
  slug: 'morocco-tunisia-egypt-algeria-or-libya-which-fits-you',
  publishedAt: '2026-10-19',
  primary: 'Morocco Tunisia Egypt Algeria Libya',
  secondaries: ['which North Africa country to visit'],
  pool: 'tour',
  seoDesc:
    'Morocco, Tunisia, Egypt, Algeria, or Libya: which fits you? A clear decision guide for history, desert, beaches, crowds, and guided access.',
  body: `
<p>Morocco, Tunisia, Egypt, Algeria, or Libya: which fits you? The honest answer depends on the job you want this trip to do. Crowds, visas, beaches, desert depth, and independent freedom are not evenly distributed across North Africa. Treat the region as a menu of traveler jobs, not a single brand of sand and spice.</p>

<p>IntoLibya operates licensed Libya tours only. We do not sell Morocco, Tunisia, Egypt, or Algeria packages. This decision guide exists so you choose the right specialist for the right chapter, then come to us when Libya is the fit.</p>

<h2>Choose Morocco if</h2>

<p>You want cities, mountains, riads, and accessible desert edges with a thick tourism industry. You like flexible independent days, food markets, and a wide hotel menu. You accept that headline medinas feel busy. Morocco is a strong first Maghreb trip for many travelers.</p>

<h2>Choose Tunisia if</h2>

<p>You want compact history, Mediterranean beaches, and short break energy. Independent travel is normal. Romans such as El Djem sit beside resort recovery. Tunisia is excellent when leave is limited and you want soft logistics. It is also a natural beach week before a later Libya culture week.</p>

<h2>Choose Egypt if</h2>

<p>Pharaonic scale is nonnegotiable. Nile logistics, temples, and global fame define the trip. You accept queues as part of the deal. Egypt is not the quiet alternative. It is the iconic one. History lovers often do Egypt and Libya across different years rather than forcing one country to imitate the other.</p>

<h2>Choose Algeria if</h2>

<p>Your dream is specifically Algerian Sahara drama, stone plateaus, and rock art expeditions that match Tassili style landscapes. You accept longer permit patience and a more expedition mindset. Book Algeria with Algeria specialists. Do not ask Libya to copy that exact geology.</p>

<h2>Choose Libya if</h2>

<p>You want empty UNESCO Romans, oasis towns such as <a href="/en/destination/ghadames">Ghadames</a>, and Sahara camping that can sit on the same journey as classical coast days. You accept sponsored, guided travel with eVisa steps and required coordination. You prefer space over souvenir corridors. Sites like <a href="/en/destination/leptis-magna">Leptis Magna</a>, <a href="/en/destination/sabratha">Sabratha</a>, and deeper desert options around <a href="/en/destination/acacus-mountains">Acacus</a> reward that trade.</p>

<h2>Quick decision shortcuts</h2>

<ul>
<li>Hate crowds at ruins: lean Libya (or remote Algeria), not peak Egypt.</li>
<li>Need beaches plus easy booking: lean Tunisia.</li>
<li>Want cities and mountains first: lean Morocco.</li>
<li>Need Luxor energy: choose Egypt on its own terms.</li>
<li>Want guided access as a feature: Libya’s licensed model is designed for that.</li>
</ul>

<p>You can love more than one answer across a decade of travel. The mistake is asking one fortnight to be Morocco’s cities, Egypt’s temples, Tunisia’s beaches, and Libya’s empty forums at once. Pick the fit. Sequence the rest.</p>

<h2>Related reading</h2>

<ul>
<li><a href="/en/is-libya-part-of-a-north-africa-trip-plan">Is Libya Part of a North Africa Trip Plan</a></li>
<li><a href="/en/egypt-vs-libya-for-ancient-ruins">Egypt vs Libya for Ancient Ruins</a></li>
<li><a href="/en/tunisia-vs-libya-for-history-travelers">Tunisia vs Libya for History Travelers</a></li>
<li><a href="/en/algeria-vs-libya-for-sahara-expeditions">Algeria vs Libya for Sahara Expeditions</a></li>
<li><a href="/en/libya-after-you-have-already-seen-morocco">Libya After You Have Already Seen Morocco</a></li>
<li><a href="/en/destination/tripoli">Tripoli destination guide</a></li>
</ul>
`.trim(),
});

add({
  id: 205,
  title: 'After Egypt Crowds Where Do History Travelers Go',
  slug: 'after-egypt-crowds-where-do-history-travelers-go',
  publishedAt: '2026-10-20',
  primary: 'after Egypt crowds',
  secondaries: ['quiet ancient sites North Africa', 'Libya after Egypt'],
  pool: 'leptis',
  seoDesc:
    'After Egypt crowds, where do history travelers go? How Libya’s quiet Romans and Greek east offer a calmer classical chapter.',
  body: `
<p>After Egypt crowds, where do history travelers go? Many keep chasing bigger icons and find bigger queues. Others change the job of the next trip. They stop asking for the most famous stone in the world and start asking for stone they can hear. That is where Libya enters the North Africa story for classical travelers.</p>

<p>IntoLibya does not sell Egypt packages. If Luxor and Giza still call you, keep booking Egypt with Egypt specialists. Use this guide when your memory of temples includes elbows, audio guides overlapping, and photo wars at every relief.</p>

<h2>What crowd fatigue usually means</h2>

<p>Crowd fatigue is not dislike of Egypt. Egypt remains unmatched for pharaonic narrative. Fatigue means your nervous system wants a different register: longer looks, fewer negotiations for viewing angles, guides who can pause without blocking a convoy. It means you want Roman urbanism or Greek Cyrenaica with space around the columns.</p>

<p>Libya offers that register on licensed tours. <a href="/en/destination/leptis-magna">Leptis Magna</a> is a city, not a single postcard monument. <a href="/en/destination/sabratha">Sabratha</a> sets theatre seats against the sea. East circuits can add Shahat and related sites when your plan reaches Cyrenaica. Visitor density is low enough that discovery still feels plausible.</p>

<h2>What you trade to get the quiet</h2>

<p>You trade freestyle independent wandering for sponsorship, eVisa timing, guides, and required tourist police coordination. That is not a punishment. It is the operating system that makes visitor days workable. Travelers who fought Egypt’s logistics sometimes find Libya’s clearer tour framework oddly calming, because the path is explicit.</p>

<p>You also trade Nile scale for Mediterranean classical scale. Do not expect pyramids. Expect forums, arches, harbours, and theatres that still read as civic space.</p>

<h2>A smart sequence after Egypt</h2>

<ol>
<li>Rest at home long enough that Egypt stays a highlight, not a blur.</li>
<li>Decide whether your next hunger is more Egypt or a quieter classical chapter.</li>
<li>If quieter, shortlist western Libya coast days first: Tripoli, Leptis, Sabratha.</li>
<li>Add <a href="/en/destination/ghadames">Ghadames</a> or Sahara nights only if desert culture is part of the craving.</li>
<li>Start documents early and keep flights flexible until sponsorship is solid.</li>
</ol>

<p>Some guests reverse the order and do Libya before Egypt. Both sequences work. The point is not rivalry. The point is matching crowd tolerance to site character.</p>

<h2>How IntoLibya frames the after Egypt traveler</h2>

<p>Tell us what you already saw and what tired you. TourBuilder can emphasize empty morning light at Leptis, photography etiquette that protects local dignity, and pacing that does not recreate queue stress. Ask for route specific honesty. Read advisories fully. Book only if you accept the sponsored model.</p>

<p>History travel after Egypt can still feel like wonder. It just may sound quieter under your shoes.</p>

<h2>Related reading</h2>

<ul>
<li><a href="/en/if-you-loved-luxor-why-leptis-magna-matters">If You Loved Luxor Why Leptis Magna Matters</a></li>
<li><a href="/en/egypt-vs-libya-for-ancient-ruins">Egypt vs Libya for Ancient Ruins</a></li>
<li><a href="/en/egypt-nile-cruise-alternatives-for-ruin-lovers">Egypt Nile Cruise Alternatives for Ruin Lovers</a></li>
<li><a href="/en/why-libya-feels-less-crowded-than-egypt">Why Libya Feels Less Crowded Than Egypt</a></li>
<li><a href="/en/destination/leptis-magna">Leptis Magna destination guide</a></li>
<li><a href="/en/destination/sabratha">Sabratha destination guide</a></li>
</ul>
`.trim(),
});

add({
  id: 208,
  title: 'Sahara Trips Compared Across North Africa Borders',
  slug: 'sahara-trips-compared-across-north-africa-borders',
  publishedAt: '2026-10-20',
  primary: 'Sahara trip North Africa comparison',
  secondaries: ['Libya Sahara vs Morocco Tunisia Algeria'],
  pool: 'sahara',
  seoDesc:
    'Sahara trips compared across North Africa borders. Tunisia ease, Algeria drama, Morocco edges, and Libya oasis plus deep desert tours.',
  body: `
<p>Sahara trips compared across North Africa borders fail when marketers pretend all sand is equal. Tunisia sells easy overnight camps near the desert edge. Morocco sells accessible dune evenings after city weeks. Algeria sells vast stone plateaus and famous rock art expeditions. Libya sells oasis towns, deep dune systems, and operator based access that can pair desert nights with classical coast days.</p>

<p>IntoLibya does not sell Tunisia, Morocco, or Algeria packages. We write this comparison so you choose honestly, then book the Libya chapter with a licensed local operator when that is the right fit.</p>

<h2>Tunisia: easiest entry to desert atmosphere</h2>

<p>Tunisia works when you want a short Sahara taste after beach or Medina days. Camps near the fringe are reachable, photogenic, and designed for first timers. You can book quickly, ride at sunset, and sleep under stars without a heavy expedition mindset.</p>

<p>The tradeoff is depth. Many Tunisia desert nights sit on the edge of the true empty Sahara. They are lovely. They are not days of remote dune driving and rock art walks far from paved roads.</p>

<h2>Morocco: desert as a chapter inside a wider holiday</h2>

<p>Morocco’s dune camps often sit inside a polished multi city itinerary. Logistics are practiced. Crowds and camp styles vary by season and operator quality abroad. The Sahara feeling is real at sunset. The remoteness is usually bounded. Choose Morocco when cities and mountains matter as much as sand.</p>

<h2>Algeria: drama and remoteness</h2>

<p>Algeria’s Tassili and other Saharan parks reward travelers who accept permits, longer transfers, and expedition patience. Rock art density and landscape scale are legendary. If your dream is specifically that geology, go with Algeria specialists. Do not ask Libya to imitate it.</p>

<h2>Libya: oasis culture plus deep desert access</h2>

<p>Libya’s Sahara story mixes lived oasis towns with serious dune and rock country. <a href="/en/destination/ghadames">Ghadames</a> is a UNESCO old town of covered lanes and desert trade memory. Further south, <a href="/en/destination/ghat">Ghat</a> opens toward the <a href="/en/destination/acacus-mountains">Acacus Mountains</a>, where prehistoric engravings sit in wild stone. Fezzan routes can add lakes such as <a href="/en/destination/gaberoun">Gaberoun</a> when conditions allow.</p>

<p>Tourists visit on licensed tours with sponsorship, eVisa steps, guides, and required tourist police coordination. That structure is the price of entry. In return you often get empty classical sites on the same trip as desert camping, which few neighbor itineraries combine so cleanly.</p>

<h2>How to choose without marketing fog</h2>

<ul>
<li>Choose Tunisia or Morocco if you want a short, easier Sahara night and soft logistics.</li>
<li>Choose Algeria if Tassili style rock plateaus are the nonnegotiable priority.</li>
<li>Choose Libya if you want oasis towns, Acacus rock art, Ubari lakes, and quiet Roman ruins in one sponsored journey.</li>
</ul>

<p>Many travelers do Tunisia or Morocco first, then come to Libya when they want fewer crowds and a fuller desert culture chapter. Ask IntoLibya for fitness expectations and season honesty before you romanticize midday summer dunes.</p>

<h2>Related reading</h2>

<ul>
<li><a href="/en/sahara-desert-tunisia-algeria-libya-compared">Sahara Desert Tunisia Algeria Libya Compared</a></li>
<li><a href="/en/desert-camping-morocco-tunisia-algeria-or-libya">Desert Camping Morocco Tunisia Algeria or Libya</a></li>
<li><a href="/en/algeria-vs-libya-for-sahara-expeditions">Algeria vs Libya for Sahara Expeditions</a></li>
<li><a href="/en/if-you-loved-tassili-see-the-acacus-mountains">If You Loved Tassili See the Acacus Mountains</a></li>
<li><a href="/en/destination/ghadames">Ghadames destination guide</a></li>
<li><a href="/en/destination/acacus-mountains">Acacus Mountains destination guide</a></li>
</ul>
`.trim(),
});

add({
  id: 210,
  title: 'Roman Ruins Without the Crowds in North Africa',
  slug: 'roman-ruins-without-the-crowds-in-north-africa',
  publishedAt: '2026-10-20',
  primary: 'Roman ruins without crowds',
  secondaries: ['Leptis Magna empty', 'Sabratha quiet'],
  pool: 'sabratha',
  seoDesc:
    'Roman ruins without the crowds in North Africa. Why Libya’s Leptis Magna and Sabratha deliver quiet classical days on licensed tours.',
  body: `
<p>Roman ruins without the crowds in North Africa still exist, but they sit behind a different door than freestyle Mediterranean city breaks. Tunisia and parts of Algeria hold extraordinary classical sites inside more familiar tourism patterns. Libya holds two of the most complete Roman cities on the Mediterranean, often with space enough to hear your own footsteps between columns.</p>

<p>IntoLibya sells licensed Libya journeys. Neighbor Romans stay with their own specialists. This guide is for travelers whose dream is theatre seats facing the sea without a souvenir gauntlet at their backs.</p>

<h2>Why crowds gather at some Romans and not others</h2>

<p>Crowds follow cruise schedules, coach circuits, and countries with thick independent travel infrastructure. That is not a moral failing. It is logistics. Sites that are easy to bolt onto beach holidays fill first. Sites that require sponsorship, eVisa timing, and guided coordination stay quieter for visitors, even when the archaeology is world class.</p>

<p>Libya’s western classical pair, <a href="/en/destination/leptis-magna">Leptis Magna</a> and <a href="/en/destination/sabratha">Sabratha</a>, sits in that second category for international tourists. The stone is generous. The visitor density is not.</p>

<h2>What quiet Roman days feel like</h2>

<p>At Leptis you walk a civic landscape: forum, markets, arches, harbour traces, and a theatre that still feels public. At Sabratha the theatre’s sea backdrop photographs cleanly because people are not stacked on every step. Guides still set pace. Photography rules still matter. You still ask before photographing people. The difference is emotional oxygen.</p>

<p>Quiet does not mean casual. You travel inside a licensed plan with guides and required tourist police coordination. Checkpoints and document checks can appear as routine parts of the day. Guests who accept structure usually find the ruins more memorable, not less.</p>

<h2>How Libya compares with easier Roman holidays</h2>

<p>Tunisia offers Dougga, El Djem, and related sites with independent flexibility and resort recovery. That mix is excellent when you want soft logistics. Algeria offers deep classical and Saharan combinations for patient planners. Libya’s edge for many history travelers is the combination of urban Roman completeness and emptiness on the same sponsored trip, sometimes with oasis or desert chapters added.</p>

<p>Do not rank countries as better or worse in the abstract. Rank them against your crowd tolerance and booking patience.</p>

<h2>Practical path to a quiet Roman week</h2>

<ol>
<li>Start with a western coast outline: Tripoli plus Leptis and Sabratha.</li>
<li>Choose shoulder seasons when heat is kinder on long site days.</li>
<li>Begin sponsorship and eVisa steps early through IntoLibya.</li>
<li>Tell us if photography, accessibility, or pacing needs shape the day list.</li>
<li>Keep flights flexible until documents are solid.</li>
</ol>

<p>Roman ruins without crowds are not a myth in North Africa. In Libya they are a product of careful access. If that trade feels fair, open TourBuilder and ask for a classical first outline.</p>

<h2>Related reading</h2>

<ul>
<li><a href="/en/roman-ruins-tunisia-vs-libya">Roman Ruins Tunisia vs Libya</a></li>
<li><a href="/en/north-africa-destinations-ranked-for-empty-unesco-sites">North Africa Destinations Ranked for Empty UNESCO Sites</a></li>
<li><a href="/en/what-is-leptis-magna-famous-for">What Is Leptis Magna Famous For</a></li>
<li><a href="/en/sabratha-roman-ruins-tour-tips">Sabratha Roman Ruins Tour Tips</a></li>
<li><a href="/en/destination/leptis-magna">Leptis Magna destination guide</a></li>
<li><a href="/en/destination/sabratha">Sabratha destination guide</a></li>
</ul>
`.trim(),
});

add({
  id: 216,
  title: 'Best North Africa Trip If You Want Guided Access Only',
  slug: 'best-north-africa-trip-if-you-want-guided-access-only',
  publishedAt: '2026-10-21',
  primary: 'guided only North Africa trip',
  secondaries: ['licensed tour Maghreb Libya'],
  pool: 'tour',
  seoDesc:
    'Best North Africa trip if you want guided access only. Why Libya’s licensed tour model fits travelers who prefer structure over freestyle.',
  body: `
<p>Best North Africa trip if you want guided access only is a different question from best North Africa trip for backpackers. Some travelers want independence as the product. Others want a clear sponsorship path, professional guides, and days where logistics are handled so attention can stay on stone, sand, and hospitality. Libya is built for the second group.</p>

<p>IntoLibya is a licensed Libyan tour operator. We do not claim every Maghreb country requires the same model. Morocco and Tunisia support rich independent travel. Egypt supports many styles. Algeria has its own expedition rules. Libya’s visitor tourism for international guests runs through licensed operators, sponsorship documents, eVisa steps, and guided itineraries with required coordination.</p>

<h2>Why guided only can be a feature</h2>

<p>Guided only removes the fantasy that you can freestyle a tourist entry and invent roadside plans. That clarity reduces anxiety for many guests. Airport meetings, document checks, drivers who know sensible roads, and guides who redesign when needed become the method. You still make choices about pace, interests, and private versus small group energy through TourBuilder. You do not pretend the country is a rental car free for all.</p>

<p>Travelers who felt lost in denser tourism markets sometimes prefer this explicitness. The guide is not an optional upgrade. The guide is part of how visiting works.</p>

<h2>What a guided Libya week can include</h2>

<p>Classic first timer outlines combine <a href="/en/destination/tripoli">Tripoli</a> with <a href="/en/destination/leptis-magna">Leptis Magna</a> and <a href="/en/destination/sabratha">Sabratha</a>. Longer plans add <a href="/en/destination/ghadames">Ghadames</a>, Nafusa highland stops, or Sahara camping toward Ghat and Acacus. East Libya Greek heritage is reachable on circuits designed for Cyrenaica when that is your goal. Across these routes, the constant is licensed structure rather than freestyle wandering.</p>

<h2>Who this trip style fits</h2>

<ul>
<li>Travelers who want empty UNESCO mornings more than nightlife districts</li>
<li>Guests who prefer one accountable operator for documents and on ground days</li>
<li>Families and friend groups who want shared pacing without DIY risk</li>
<li>History and photography travelers willing to follow local photo etiquette</li>
<li>Anyone who reads advisories carefully and still wants a concrete holiday method</li>
</ul>

<h2>Who should choose a different North Africa chapter first</h2>

<p>If your joy is changing hostels daily without paperwork, start with Morocco or Tunisia. If Nile icons are the only hunger, choose Egypt on its terms. If Tassili is the nonnegotiable desert, choose Algeria specialists. Come to Libya when guided access and quiet classical or oasis days are the point.</p>

<h2>How to start the guided path</h2>

<p>Send dates, nationality, must see list, and fitness notes. Ask what documents guests usually send first. Keep flights flexible until sponsorship timing is clear. Read our safety and booking explainers, then open TourBuilder. Guided access only is not a lesser North Africa trip. For Libya, it is the real one.</p>

<h2>Related reading</h2>

<ul>
<li><a href="/en/do-you-need-a-tour-to-visit-libya">Do You Need a Tour to Visit Libya</a></li>
<li><a href="/en/how-to-book-a-libya-tour-with-intolibya">How to Book a Libya Tour with IntoLibya</a></li>
<li><a href="/en/how-tourbuilder-works-for-custom-libya-trips">How TourBuilder Works for Custom Libya Trips</a></li>
<li><a href="/en/how-to-choose-a-trusted-libya-tour-company">How to Choose a Trusted Libya Tour Company</a></li>
<li><a href="/en/destination/tripoli">Tripoli destination guide</a></li>
</ul>
`.trim(),
});

add({
  id: 218,
  title: 'Why Some North Africa Trips Feel Overcrowded',
  slug: 'why-some-north-africa-trips-feel-overcrowded',
  publishedAt: '2026-10-21',
  primary: 'overcrowded North Africa tourism',
  secondaries: ['quiet travel Maghreb'],
  pool: 'cairo',
  seoDesc:
    'Why some North Africa trips feel overcrowded, and how to choose quieter chapters such as licensed Libya classical and desert routes.',
  body: `
<p>Why some North Africa trips feel overcrowded is less mysterious than travel forums suggest. Crowds follow fame, cruise calendars, short flight networks, and countries that perfected high volume tourism. When your holiday recipe is headline sites plus peak season plus midday arrivals, elbows appear. The region is not uniformly packed. The popular scripts are.</p>

<p>IntoLibya sells Libya tours, not anti crowd slogans. We explain overcrowding so you can redesign the script instead of blaming an entire continent sized coast.</p>

<h2>The scripts that create density</h2>

<p>Egypt’s most famous temples and tombs sit on global bucket lists. Morocco’s medina icons absorb evening floods of day visitors. Tunisia’s easiest Romans and beach belts fill when European short breaks peak. None of that makes those countries unworthy. It makes certain days loud.</p>

<p>Overcrowding also rises when itineraries stack too many icons into too few hours. Exhausted travelers experience crowds more harshly because patience is gone. Logistics stress amplifies noise.</p>

<h2>What quieter chapters look like</h2>

<p>Quieter does not always mean undiscovered by locals. It means international visitor density low enough for looking. Libya’s classical coast and oasis towns often deliver that register on licensed tours. Standing in <a href="/en/destination/leptis-magna">Leptis Magna</a> or <a href="/en/destination/sabratha">Sabratha</a> with room to breathe is a different nervous system event than shuffling through a peak corridor. <a href="/en/destination/ghadames">Ghadames</a> and deeper Sahara nights extend the quiet if desert culture is part of your hunger.</p>

<p>You accept sponsorship, eVisa timing, guides, and required coordination. That is the trade. Guests who want freestyle hostel hopping will feel constrained. Guests who want space at world class ruins often feel relieved.</p>

<h2>Design moves that reduce crowd pain anywhere</h2>

<ul>
<li>Travel in shoulder seasons when heat and holidays allow.</li>
<li>Arrive early at famous sites even in busier countries.</li>
<li>Stop stacking five icons into one bleary day.</li>
<li>Choose at least one chapter defined by silence, not fame alone.</li>
<li>Match booking style to country rules instead of forcing one method everywhere.</li>
</ul>

<h2>When Libya is the overcrowding antidote</h2>

<p>Choose Libya when your last North Africa memory was mostly queues, and your next wish is classical stone or oasis lanes with oxygen. Do not choose Libya as a cheap substitute for Luxor. Choose it as a different product: guided access, lower visitor density, and itineraries that can still include Sahara camping on longer plans.</p>

<p>Tell IntoLibya what felt overcrowded before. TourBuilder can aim at empty morning light, honest pacing, and photography etiquette that respects people. Read advisories. Book only if structure feels acceptable. Overcrowding is often a script problem. Libya offers another script.</p>

<h2>Related reading</h2>

<ul>
<li><a href="/en/why-libya-feels-less-crowded-than-egypt">Why Libya Feels Less Crowded Than Egypt</a></li>
<li><a href="/en/libya-for-people-who-hate-crowds">Libya for People Who Hate Crowds</a></li>
<li><a href="/en/north-africa-destinations-ranked-for-empty-unesco-sites">North Africa Destinations Ranked for Empty UNESCO Sites</a></li>
<li><a href="/en/after-egypt-crowds-where-do-history-travelers-go">After Egypt Crowds Where Do History Travelers Go</a></li>
<li><a href="/en/destination/leptis-magna">Leptis Magna destination guide</a></li>
</ul>
`.trim(),
});

add({
  id: 220,
  title: 'Egypt Nile Cruise Alternatives for Ruin Lovers',
  slug: 'egypt-nile-cruise-alternatives-for-ruin-lovers',
  publishedAt: '2026-10-21',
  primary: 'Nile cruise alternative',
  secondaries: ['Libya ruins instead of Nile cruise'],
  pool: 'leptis',
  seoDesc:
    'Egypt Nile cruise alternatives for ruin lovers. When a licensed Libya classical journey is a smarter next chapter than another river week.',
  body: `
<p>Egypt Nile cruise alternatives for ruin lovers should start with respect. A Nile cruise can be magical: temples in sequence, river light, and a floating hotel rhythm that removes daily transfer stress. Many travelers should take that trip exactly once, or twice. The alternative question appears when you want more ruins without repeating the same river corridor and the same crowd patterns.</p>

<p>IntoLibya does not sell Egypt cruises. If the Nile is still your unfinished dream, book it with Egypt specialists. This guide is for guests whose ruin hunger remains after the cruise, or whose crowd tolerance does not.</p>

<h2>What a Nile cruise does uniquely well</h2>

<p>It packages distance. You wake near new stone without rebuilding logistics each morning. It socializes easily. It delivers pharaonic narrative with professional guiding. Those strengths are real. Alternatives should not pretend to copy them.</p>

<h2>What Libya offers instead</h2>

<p>Libya offers Mediterranean classical urbanism with far lower international visitor density. <a href="/en/destination/leptis-magna">Leptis Magna</a> is a Roman city you walk as civic space. <a href="/en/destination/sabratha">Sabratha</a> sets theatre against sea. Tripoli layers museums and old town texture. Longer trips can add oasis towns and Sahara nights, which no Nile boat will provide.</p>

<p>The format is a land based licensed tour with sponsorship, eVisa steps, guides, and required tourist police coordination. You change hotels or camps as the route requires. Lodging stays practical and operator arranged rather than a floating resort brand story. The emotional payoff is silence among columns, not cabin buffet variety.</p>

<h2>Who should pick the Libya alternative</h2>

<ul>
<li>Ruin lovers who already did Luxor and still want classical stone</li>
<li>Travelers who found cruise corridors loud and want empty mornings</li>
<li>Guests curious about Roman Africa rather than another Nile temple loop</li>
<li>People willing to accept guided access as the visitor method</li>
</ul>

<h2>Who should stay with the Nile</h2>

<p>First timers whose only North Africa dream is pharaonic Egypt. Travelers who need the floating hotel comfort model. Guests who dislike land transfer days. There is no shame in that preference. Match the product to the wish.</p>

<h2>A practical way to compare without bitterness</h2>

<p>Write two columns: “what I loved on the Nile” and “what I still want.” If the second column says quiet Roman cities, oasis lanes, or Sahara camping, Libya belongs on the shortlist. If it says more Karnak light and river evenings, book Egypt again. IntoLibya TourBuilder can shape a classical first Libya outline once you know your dates and crowd limits.</p>

<p>Ruin love does not have only one geography. After a Nile cruise, Libya can be the chapter where the stones feel like yours for an hour at a time.</p>

<h2>Related reading</h2>

<ul>
<li><a href="/en/if-you-loved-luxor-why-leptis-magna-matters">If You Loved Luxor Why Leptis Magna Matters</a></li>
<li><a href="/en/egypt-vs-libya-for-ancient-ruins">Egypt vs Libya for Ancient Ruins</a></li>
<li><a href="/en/after-egypt-crowds-where-do-history-travelers-go">After Egypt Crowds Where Do History Travelers Go</a></li>
<li><a href="/en/roman-ruins-without-the-crowds-in-north-africa">Roman Ruins Without the Crowds in North Africa</a></li>
<li><a href="/en/destination/leptis-magna">Leptis Magna destination guide</a></li>
</ul>
`.trim(),
});

add({
  id: 230,
  title: 'How to Build a Maghreb Circuit That Includes Libya',
  slug: 'how-to-build-a-maghreb-circuit-that-includes-libya',
  publishedAt: '2026-10-22',
  primary: 'Maghreb circuit including Libya',
  secondaries: ['multi country Maghreb itinerary'],
  pool: 'neighbor',
  seoDesc:
    'How to build a Maghreb circuit that includes Libya. Sequence Morocco, Tunisia, Algeria, and a licensed Libya chapter without stacking chaos.',
  body: `
<p>How to build a Maghreb circuit that includes Libya starts with humility about paperwork and patience. Morocco, Tunisia, Algeria, and Libya do not share one visa story, one booking style, or one heat calendar. A good circuit is a sequence of clear chapters with buffers, not a daredevil stamp race.</p>

<p>IntoLibya handles the Libya chapter only. Neighbor segments need their own specialists. We will not invent multi country permit shortcuts. When stacking rules are unclear, ask each operator and confirm before you buy nonrefundable flights.</p>

<h2>Principle one: one job per country</h2>

<p>Give Morocco cities and mountains. Give Tunisia beaches and compact Romans. Give Algeria a specific Sahara or deep classical goal if you include it. Give Libya quiet UNESCO Romans, oasis towns, and optional desert camping on a licensed tour. When jobs blur, travelers get angry at the wrong country.</p>

<h2>Principle two: sequence by logistics energy</h2>

<p>Many guests place easier independent chapters first and Libya later, once they are ready for sponsorship and guided days. Others place Libya first when empty ruins are the emotional priority. Either order can work. What fails is sandwiching Libya between two exhausted red eye connections with zero document buffer.</p>

<p>Build at least a rest day between heavy chapters when leave allows. Keep Libya flights flexible until sponsorship and eVisa timing are solid.</p>

<h2>Principle three: seasons are not copy paste</h2>

<p>Summer Sahara heat in Libya is serious. Winter coast days can feel mild compared with northern Europe, while desert nights need layers. Tunisia beach weeks and Morocco city weeks have their own peak crowds. Map heat and crowd seasons separately, then look for overlap that does not punish you.</p>

<h2>A sample multi year Maghreb map</h2>

<ol>
<li>Year one: Morocco or Tunisia for confidence and softer logistics.</li>
<li>Year two: Libya western classics, Tripoli, Leptis, Sabratha, optional Ghadames.</li>
<li>Year three: deeper Libya Sahara or an Algeria expedition with Algeria specialists, depending on the desert dream.</li>
</ol>

<p>Compressing that into one month is possible only for travelers who love airports. Most people enjoy the region more when memory has room to breathe.</p>

<h2>What to send IntoLibya for the Libya chapter</h2>

<p>Dates, nationality, must see list, fitness notes, and which neighbor countries you already booked or plan to book. Ask what documents guests usually send first. Do not assume border overland ideas without confirmation. Many visitors fly hubs such as Tunis or Cairo into Tripoli rather than inventing road narratives.</p>

<p>TourBuilder turns the Libya chapter into a concrete route. The Maghreb circuit around it stays honest when each country keeps its own operator and its own job.</p>

<h2>Related reading</h2>

<ul>
<li><a href="/en/is-libya-part-of-a-north-africa-trip-plan">Is Libya Part of a North Africa Trip Plan</a></li>
<li><a href="/en/can-you-combine-tunis-and-tripoli-in-one-journey">Can You Combine Tunis and Tripoli in One Journey</a></li>
<li><a href="/en/beach-holiday-in-tunisia-then-culture-in-libya">Beach Holiday in Tunisia then Culture in Libya</a></li>
<li><a href="/en/how-to-visit-libya-as-a-tourist-in-2026">How to Visit Libya as a Tourist in 2026</a></li>
<li><a href="/en/destination/tripoli">Tripoli destination guide</a></li>
<li><a href="/en/destination/ghadames">Ghadames destination guide</a></li>
</ul>
`.trim(),
});

add({
  id: 231,
  title: 'North Africa Winter Sun Without Only Going to Egypt',
  slug: 'north-africa-winter-sun-without-only-going-to-egypt',
  publishedAt: '2026-10-22',
  primary: 'North Africa winter sun',
  secondaries: ['Libya winter weather travel'],
  pool: 'tripoli',
  seoDesc:
    'North Africa winter sun without only going to Egypt. How mild Libya coast days and licensed tours fit travelers escaping cold weather.',
  body: `
<p>North Africa winter sun without only going to Egypt is a planning idea more travelers need. Egypt earns its winter fame with dry light and iconic sites. It also earns peak season density. If your goal is milder air than Europe or North America, plus history or desert culture, Libya belongs on the shortlist for a licensed winter chapter.</p>

<p>IntoLibya does not sell Egypt winter packages. We explain how Libya’s coast and desert seasons feel so you can choose with climate honesty, not brochure glow.</p>

<h2>What winter feels like on the Libyan coast</h2>

<p>Coastal days around Tripoli and other Mediterranean stops are often mild compared with northern winters. You may still want a jacket for evenings and wind. Rain chances exist. Pack layers rather than only linen fantasies. The point is not tropical heat. The point is usable outdoor days when home feels frozen.</p>

<p>Site days at <a href="/en/destination/leptis-magna">Leptis Magna</a> and <a href="/en/destination/sabratha">Sabratha</a> can be kinder than peak summer blaze. That matters when you walk for hours among stone.</p>

<h2>What winter means in the desert</h2>

<p>Desert days can stay pleasant while nights turn cold. Camps need serious layers, hats, and realistic expectations. Guests who romanticize Sahara sleeping bags without warmth planning have unhappy three am stories. Ask IntoLibya for packing guidance when your outline includes Ghadames dunes or deeper Fezzan nights.</p>

<p>Late autumn and winter also overlap event windows in some years, such as desert rally dates or December cultural trips. Those are fixed date products with their own booking clocks. Flexible TourBuilder trips remain available around them.</p>

<h2>Why people default only to Egypt</h2>

<p>Habit and marketing. Egypt’s winter sun story is loud and true enough. Alternatives stay quieter because Libya’s visitor path uses sponsorship and guides. Travelers who accept that structure gain classical ruins and oasis towns without assuming the Nile is the only warm stone available.</p>

<h2>A simple winter decision tree</h2>

<ul>
<li>Need pharaonic icons: choose Egypt on its terms.</li>
<li>Need mild coast plus empty Romans: shortlist western Libya.</li>
<li>Need desert culture with cold night honesty: Libya oasis and Sahara outlines.</li>
<li>Need beach resort softness: Tunisia may fit better than either.</li>
</ul>

<p>Winter sun is a climate goal. Match it to the cultural job you also want. Then book the operator that actually runs that country. For Libya, start early enough for documents, keep flights flexible, and tell us whether coast, desert, or both define your escape.</p>

<h2>Related reading</h2>

<ul>
<li><a href="/en/why-summer-desert-travel-in-libya-is-hard">Why Summer Desert Travel in Libya Is Hard</a></li>
<li><a href="/en/visiting-libya-in-winter">Visiting Libya in Winter</a></li>
<li><a href="/en/best-time-to-visit-libya">Best Time to Visit Libya</a></li>
<li><a href="/en/libya-in-october-and-november">Libya in October and November</a></li>
<li><a href="/en/destination/tripoli">Tripoli destination guide</a></li>
</ul>
`.trim(),
});

add({
  id: 232,
  title: 'UNESCO World Heritage Across North Africa a Traveler Map',
  slug: 'unesco-world-heritage-across-north-africa-a-traveler-map',
  publishedAt: '2026-10-22',
  primary: 'UNESCO North Africa map',
  secondaries: ['Libya UNESCO sites list travel'],
  pool: 'ghadames',
  seoDesc:
    'UNESCO World Heritage across North Africa: a traveler map of how Libya’s sites sit beside Morocco, Tunisia, Algeria, and Egypt for trip planning.',
  body: `
<p>UNESCO World Heritage across North Africa is a traveler map, not a stamp album. The designation marks outstanding places. It does not mark equal crowds, equal seasons, or equal booking styles. Reading the region as a map of experiences helps you sequence trips without pretending every blue shield site feels the same under your feet.</p>

<p>IntoLibya focuses on Libya’s visitor routes. Official UNESCO listings change through committee decisions over time, so treat counts as something to verify on UNESCO’s site when you need a precise number. What follows is planning geography for guests, not a legal inventory.</p>

<h2>Libya’s UNESCO flavor for visitors</h2>

<p>Travelers on licensed tours often meet Libya’s heritage through Roman cities such as <a href="/en/destination/leptis-magna">Leptis Magna</a> and <a href="/en/destination/sabratha">Sabratha</a>, oasis fabric in <a href="/en/destination/ghadames">Ghadames</a>, and rock art landscapes tied to the <a href="/en/destination/acacus-mountains">Acacus</a> story. The visitor experience stands out for low international density. You come for outstanding stone and leave remembering silence as much as scholarship.</p>

<p>Access remains structured. Sponsorship, eVisa steps, guides, and required coordination are part of how tourists reach these places. That is the practical map legend.</p>

<h2>How neighbors sit on the same mental map</h2>

<p>Morocco’s UNESCO story often centers living medinas and monuments inside busy city flows. Tunisia mixes archaeological sites with beach holiday infrastructure. Algeria pairs Roman depth and Saharan landscapes for expedition minded travelers. Egypt’s inscribed and globally famous sites attract volume that can overwhelm ruin lovers seeking quiet.</p>

<p>None of these are lesser. They are different map colors. Your job is to pick the color that matches this year’s hunger.</p>

<h2>Using the map to build years, not days</h2>

<ol>
<li>List the heritage feelings you want: empty Romans, living medinas, pharaonic scale, desert rock art, oasis towns.</li>
<li>Assign each feeling to the country that does it best.</li>
<li>Sequence years so visa and heat loads stay human.</li>
<li>Book each country with operators who actually run it.</li>
<li>Verify current UNESCO pages when you need exact site names for study travel.</li>
</ol>

<p>Teachers and archaeology fans can turn this map into reading lists before departure. Photographers can plan light and etiquette. Families can avoid stacking too many heavy sites into one bleary week.</p>

<h2>Libya chapter next steps</h2>

<p>If empty classical cities and oasis lanes are the squares you circled, open TourBuilder and tell IntoLibya your dates and must see list. Read our short explainer on how many UNESCO sites travelers ask about, then confirm details against official listings when precision matters. A traveler map is a decision tool. Libya’s square rewards people who want outstanding heritage with room to look.</p>

<h2>Related reading</h2>

<ul>
<li><a href="/en/how-many-unesco-sites-does-libya-have">How Many UNESCO Sites Does Libya Have</a></li>
<li><a href="/en/north-africa-destinations-ranked-for-empty-unesco-sites">North Africa Destinations Ranked for Empty UNESCO Sites</a></li>
<li><a href="/en/best-north-africa-trip-if-you-want-empty-unesco-sites">Best North Africa Trip If You Want Empty UNESCO Sites</a></li>
<li><a href="/en/what-is-ghadames-famous-for">What Is Ghadames Famous For</a></li>
<li><a href="/en/destination/ghadames">Ghadames destination guide</a></li>
<li><a href="/en/destination/leptis-magna">Leptis Magna destination guide</a></li>
</ul>
`.trim(),
});

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
  assertNoHyphenProse(post.title, `title ${post.id}`);
  const body = `${post.body}\n\n${CTA}\n`;
  assertNoHyphenProse(body, `body ${post.id}`);

  const excerpt = body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160);
  const canonicalPath = `/en/${post.slug}`;
  const fm = {
    title: post.title,
    slug: post.slug,
    canonicalPath,
    lang: 'en',
    publishedAt: post.publishedAt,
    translationGroup: post.slug,
    featuredImage,
    draft: false,
    galleries: [],
    excerpt,
    seo: {
      title: `${post.title} | IntoLibya`,
      description: post.seoDesc,
      canonical: `https://intolibya.com${canonicalPath}`,
    },
  };

  const cdnComment = `<!-- primary-keyword: ${post.primary} | secondary: ${post.secondaries.join(', ')} -->\n\n`;
  const yamlBlock = yamlDump(fm, { lineWidth: -1 }).trimEnd();
  const words = wordCount(body);
  return {
    path: path.join(ROOT, 'src/content/posts/en', `${post.slug}.md`),
    md: `---\n${yamlBlock}\n---\n\n${cdnComment}${body}`,
    words,
    id: post.id,
    slug: post.slug,
  };
}

async function main() {
  console.log(`Generating Wave 2 Batch 1 (${POSTS.length} posts)...`);
  const report = [];

  for (const post of POSTS) {
    const featuredImage = await ensureHero(post.slug, post.pool);
    const file = buildMarkdown(post, featuredImage);
    await fs.writeFile(file.path, file.md, 'utf8');
    const status = file.words < 650 ? 'LOW' : file.words > 900 ? 'HIGH' : 'OK';
    report.push({ id: post.id, slug: post.slug, words: file.words, status });
    console.log(`✓ ${post.id} ${post.slug} (${file.words} words, ${status})`);
  }

  console.log('\nWord count summary:');
  for (const r of report) {
    console.log(`  ${r.id} ${r.words} ${r.status}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
