#!/usr/bin/env python3
"""Expand Batch C 121-160 bodies to 450+ words while keeping no-hyphen rules."""
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from scripts.lib.update_post import update_post, POSTS, assert_no_hyphen

# Extra sections inserted before the CTA hr block
EXTRAS = {
    "best-time-to-visit-libya": """
<h2>Matching length to season</h2>
<p>A four day coastal sampler in mild weather feels complete. The same four days in deep summer can feel truncated because midday rest steals hours. A twelve day desert leaning trip in November can feel expansive. The same length in August can feel like endurance sport. Season and duration are a pair, not separate choices.</p>
<p>If your leave is short, protect it with autumn or spring. If your leave is long and flexible, you can absorb a cooler winter week or a carefully designed shoulder itinerary. IntoLibya will say when a proposed length fights the calendar.</p>
<h2>Events versus open season</h2>
<p>Fixed date products such as festivals, rally weeks, cohort desert trips, or the 2027 eclipse force the calendar. Comfort becomes secondary to presence. That is valid. Just name the trade clearly when you enquire, and still confirm live details in TourBuilder rather than rumor.</p>
""",
    "libya-weather-by-month-for-tourists": """
<h2>Microclimates travelers forget</h2>
<p>Altitude, wind corridors, and proximity to the sea change comfort inside a single week. A Tripoli morning and an afternoon arrival near inland dunes are not the same climate conversation. Guides plan clothing hints day by day for that reason.</p>
<p>Dust events and occasional rain also refuse to obey neat month labels. Keep a light shell and a dust scarf even when the forecast looks polite. Weather by month is a planning tool. The day’s sky is still the boss.</p>
<h2>How IntoLibya uses the calendar</h2>
<p>When you request dates in TourBuilder, the team reads season against route. A ruins heavy week gets different start times than a Sahara heavy week in the same month. That is the practical meaning of climate advice: not poetry about average temperatures, but day lists that respect heat, cold, and light.</p>
""",
    "visiting-libya-in-winter": """
<h2>Photography and winter light</h2>
<p>Low sun angles carve texture into stone and sand. Shadows lengthen earlier, which helps dramatic frames and shortens pure midday glare. Bring a lens cloth. Cold fingers make simple camera tasks annoying, so glove liners help more than pride.</p>
<h2>Health and comfort notes</h2>
<p>Dry air plus cold nights can irritate skin and sinuses. Moisturizer and lip balm earn their keep. If you are sensitive to temperature swings, ask for itineraries that mix hotel nights with fewer consecutive high camp nights. IntoLibya can balance adventure and recovery without emptying the trip of wonder.</p>
<p>Winter still rewards the traveler who treats Libya as a sponsored journey. The season changes the wardrobe. It does not change the need for guides, vehicles, and lawful entry.</p>
""",
    "visiting-libya-in-spring": """
<h2>Spring for mixed interest groups</h2>
<p>Couples, friends, and family style adult groups often want both Roman theatre seats and a night under stars. Spring is when that dual wish is easiest to honor without heat arguments. You can give archaeology fans a full Leptis day and still keep desert lovers happy later in the week.</p>
<p>If your group includes different fitness levels, spring’s milder afternoons make compromise walks realistic. Summer forces harder splits between who waits in shade and who pushes on.</p>
<h2>Booking behavior in spring</h2>
<p>Do not wait for perfect weather apps in February to decide a March trip. Sponsorship and eVisa clocks do not care about your indecision. Open TourBuilder, hold dates with IntoLibya, and refine the day list while documents move.</p>
""",
    "visiting-libya-in-autumn": """
<h2>Autumn packing without overthinking</h2>
<p>Think layers: sun shirt, insulating piece, wind shell. Evenings in oasis towns can cool quickly after warm afternoons. Desert camps need the same logic with more emphasis on sleep warmth. A compact packing list beats a suitcase of maybes.</p>
<h2>First timer advantage</h2>
<p>If this is your first Libya journey, autumn reduces the number of variables you must master at once. Heat is less tyrannical. Roads and camps feel welcoming. You can learn checkpoint rhythm and photo etiquette without also fighting extreme temperatures. That makes autumn a teaching season as much as a comfort season.</p>
<p>IntoLibya sees many first timers succeed in October and November for exactly this reason. Claim the season early in TourBuilder while beds and guide calendars still have room.</p>
""",
    "why-summer-desert-travel-in-libya-is-hard": """
<h2>Medical and insurance angles</h2>
<p>Heat illness is not a badge. Older travelers, guests on certain medications, and anyone with prior heat intolerance should treat summer desert plans as a clinical conversation, not a dare. Confirm insurance wording for remote areas and evacuation. Carry electrolytes and respect guide stop decisions.</p>
<h2>Vehicle and camp stress</h2>
<p>Engines, tires, and refrigeration all work harder in peak heat. Teams plan maintenance and water with that in mind. Guests help by packing light, staying hydrated, and not treating every pause as optional. Summer desert travel is a partnership with physics.</p>
<p>If your heart is set on dunes, move the dream to autumn or spring and use summer for coast if leave is inflexible. IntoLibya would rather redesign than pretend August is November.</p>
""",
    "festivals-in-libya-worth-planning-around": """
<h2>What “worth planning around” really means</h2>
<p>It means the event is interesting enough that you accept fixed dates, possible crowds relative to normal Libya quiet, and less itinerary ego. If you want maximum solitude, a flexible seasonal tour may serve you better than a festival week. If you want cultural peak energy, the festival is the point.</p>
<h2>Budget and inclusion clarity</h2>
<p>Event packages bundle different things year to year. Always read what lodging, meals, viewing access, and transfers include. Check the live TourBuilder event card for current terms. Do not paste old prices into your spreadsheet and call it research.</p>
<p>IntoLibya’s role is to translate festival curiosity into sponsorship, guiding, and a route that still feels like Libya before and after the main days.</p>
""",
    "ghat-international-tourism-festival-guide": """
<h2>Culture etiquette during festival days</h2>
<p>Dress modestly. Ask before close portraits. Follow your guide in crowded moments. Festival hospitality is generous; guest manners should match. Drones and aggressive filming can sour rooms that were welcoming thirty seconds earlier.</p>
<h2>How long to stay</h2>
<p>Some visitors come only for core festival days. Others add Acacus leaning exploration when season and permits align. Longer stays need earlier vehicle and camp planning. Tell IntoLibya your appetite for quiet desert time versus festival social time so the quote matches reality.</p>
<p>Ghat festival weeks are special because they braid place and people. Treat the live TourBuilder listing as the schedule of record, then let sponsorship make attendance possible.</p>
""",
    "rally-te-te-waddan-desert-rally-guide": """
<h2>Safety and spectator sense</h2>
<p>Rally environments involve moving vehicles, dust, and excitement. Stay where your guide places you. Do not chase shots into active zones. Ear protection can help on loud days. Sun discipline still matters even when your attention is on engines.</p>
<h2>Combining rally days with classic Libya</h2>
<p>A smart trip might use rally days as the adrenaline chapter, then recover with Tripoli and Roman coast time, or the reverse. That contrast is part of Libya’s strange richness: motorsport dust one week, Severan stone the next. Ask IntoLibya whether timing allows both in your window.</p>
<p>Confirm the live Rally Te Te product before emotional flight shopping. Event calendars move. Your sponsorship file should follow the real dates.</p>
""",
    "total-solar-eclipse-2027-in-libya-guide": """
<h2>Content creators and eclipse crowds</h2>
<p>Expect more visitors than a normal Libya week. “Empty site” energy may be different on peak viewing day. That is the trade for a cosmic appointment. Build extra nights so your trip is not only two minutes of totality and a long airport line.</p>
<h2>Family and group planning</h2>
<p>If several passports travel together, align names and dates early. Group sponsorship still needs clean lists. Assign one logistics lead. IntoLibya can host families and friend groups, but eclipse season will punish disorganized deposits.</p>
<p>Treat 2027 as a project with a sky deadline. TourBuilder holds the live package truth. Your calendar and your document folder must keep up.</p>
""",
    "double-shafra-sahara-trip-explained": """
<h2>Day rhythm on a desert cohort trip</h2>
<p>Expect early movement, long horizons, camp chores as shared rhythm, and evenings that belong to sky and conversation. Personal playlist isolation is less the point than being present with the group and the land. If that sounds joyful, you are the audience. If that sounds like a threat, choose private custom instead.</p>
<h2>Fitness and medical disclosure</h2>
<p>Desert days ask for steady mobility and heat awareness even in good seasons. Disclose conditions that matter. Guides can plan, but they cannot read minds. Bring prescribed medicines and a realistic sense of your hiking comfort on soft sand.</p>
<p>Double Shafra Sahara is a product with a personality. Read the live event page, then commit only if the personality fits.</p>
""",
    "double-shafra-ghadames-trip-explained": """
<h2>Town comfort versus camp romance</h2>
<p>Ghadames centered days often mean more built lodging texture than pure dune camping, depending on the year’s design. Ask what overnight pattern the event uses. Couples and first desert region visitors sometimes prefer town anchors. Hardcore sand seekers may prefer the Sahara sibling product.</p>
<h2>Social tone</h2>
<p>Cohort trips attract people who want company. That can mean shared jokes at dinner and help with group photos in the old town. It can also mean less solitude. Know which you are buying. IntoLibya can still advise on private alternatives if the event tone is wrong for you.</p>
<p>Keep booking official. Live TourBuilder details beat screenshots every time.</p>
""",
    "how-to-plan-a-libya-trip-around-fixed-event-dates": """
<h2>Communication habits that save trips</h2>
<p>Use one thread with IntoLibya for decisions. Save PDFs of approvals. Share passport changes immediately. If a flight shifts, tell the team before the shift becomes a camp no show. Event trips compress tolerance for silence.</p>
<h2>When to walk away</h2>
<p>If you cannot complete documents in time, or if insurance will not cover the plan, postpone rather than gamble. Another festival year may come. A refused entry story lasts longer than a deferred dream. IntoLibya would rather rebuild dates than force a broken sequence.</p>
<p>Fixed event planning is adult project management with sand and stone attached. Do the boring steps early so the memorable days can stay memorable.</p>
""",
    "what-to-pack-for-desert-nights-in-libya": """
<h2>Power, dust, and small tools</h2>
<p>A spare battery bank helps when camps are far from reliable outlets. A dry bag or zip pouch protects electronics from fine dust. Pack a tiny repair kit for glasses or sandal straps if you are the person those always fail. Guides carry team kit; personal spares still prevent mood collapses.</p>
<h2>Respect packing</h2>
<p>Long sleeves and long trousers are not only sun strategy. They support local expectations in towns and villages. Save beach minimalism for places that sell that fantasy. Libya packs better when you dress like a guest who planned to be outdoors all day.</p>
<p>Ask IntoLibya for a checklist tuned to your exact camps and hotels. Generic Sahara blogs miss local pattern details.</p>
""",
    "ramadan-travel-tips-for-visitors-to-libya": """
<h2>Family and couple dynamics in Ramadan</h2>
<p>Traveling with children or mixed belief groups needs extra meal planning honesty. IntoLibya can arrange appropriate dining windows. Guests should avoid loud snacking debates in public. Shared respect keeps the trip warm.</p>
<h2>Photography sensitivity</h2>
<p>Iftar and prayer moments can be beautiful and private at once. Ask. A refused photo is not a content emergency. Creators who want Ramadan atmosphere should build trust first, frames second.</p>
<p>Ramadan travel in Libya is a privilege of timing and manners. Sponsored tours make it workable. Your courtesy makes it welcome.</p>
""",
    "shoulder-season-booking-windows-for-libya": """
<h2>What late bookers usually lose</h2>
<p>Late shoulder season bookers may still go, but they lose choice: preferred camp nights, ideal room types, or the exact desert chapter they imagined. IntoLibya will be honest about what remains. Honesty feels better than a surprise downgrade after deposit dreams.</p>
<h2>Corporate leave and school calendars</h2>
<p>If your leave is glued to fixed holiday blocks, treat those blocks as peak. Start earlier than friends with flexible remote work. Shoulder season weather is kind. Shoulder season inventory is not infinite.</p>
<p>Use TourBuilder to lock a shape, then refine. The booking window is a runway. Airplanes need runway. So do visas.</p>
""",
    "best-month-for-roman-ruins-in-libya": """
<h2>Guided looking versus checklist tourism</h2>
<p>The best month still fails if you sprint. Leptis rewards guides who can explain civic space, imperial ego, and trade. Ask for interpretive time, not only drone free panoramas. IntoLibya can prioritize archaeology fans when you say so in TourBuilder.</p>
<h2>Eastern ambitions</h2>
<p>If your ruin appetite includes eastern Greek and Roman stories when routing is available, say that early. Season and access patterns matter. Western classics remain the reliable core for most first archaeology trips.</p>
<p>Pick walkable months, then pick depth over distance. Stone reads better when you are not dizzy from heat.</p>
""",
    "best-month-for-sahara-camping-in-libya": """
<h2>First camp expectations</h2>
<p>Your first Sahara night may be colder, quieter, and more logistically structured than social media implied. That is good. Structure is how remote beauty stays safe. Listen at the briefing. Help with simple camp manners. The stars handle spectacle.</p>
<h2>Combining camping with coast</h2>
<p>Many best month trips are hybrids: Roman days plus two or three camp nights. Pure desert expeditions exist for people who want immersion. Hybrids suit first timers. Tell IntoLibya which you are so the month advice matches the product.</p>
<p>Open TourBuilder when the season you want still has room. Sand is patient. Operator calendars are less so.</p>
""",
    "libya-in-october-and-november": """
<h2>Sample week thinking</h2>
<p>A strong autumn week might open in Tripoli, move to Sabratha and Leptis Magna, then swing toward Ghadames or a short desert chapter. Exact order depends on logistics and your priorities. The point is contrast without heat punishment.</p>
<p>Photographers should ask for late and early site access patterns where feasible. Food curious guests should mention hospitality experiences they hope for. Autumn gives the itinerary room to breathe.</p>
<h2>Avoiding autumn mistakes</h2>
<p>Mistake one: buying flights before sponsorship. Mistake two: packing only for warm days. Mistake three: treating October like a guaranteed empty private country if a festival week overlaps your dates. Read event listings if calendar nails matter.</p>
""",
    "libya-in-march-and-april": """
<h2>Spring itinerary shapes</h2>
<p>Coast first then desert, or desert first then coast, both can work. IntoLibya chooses based on flight arrivals, camp availability, and weather trends in your exact week. Your job is to name priorities: swimming hopes, ruin depth, photography, or easy pacing.</p>
<p>April can already feel warmer inland. Early starts remain wise. Do not assume spring means zero sun strategy. Hats still earn their keep.</p>
<h2>Students, teachers, and spring breaks</h2>
<p>Academic travelers often eye March and April. That increases demand in some weeks. Educational groups should start paperwork especially early. See tours for history teachers if that is your frame, and keep TourBuilder dates realistic.</p>
""",
    "how-to-travel-to-libya-from-the-united-states": """
<h2>Money, SIMs, and practical US habits</h2>
<p>Plan cash strategy with your operator’s advice. Do not assume US cards behave everywhere the way they do at home. WhatsApp remains a practical coordination channel once planning starts. Keep digital and paper copies of approvals offline.</p>
<p>US travelers sometimes over trust annual travel insurance policies. Verify Libya cover explicitly. Specialist policies may be needed. This is boring. It is also how adults travel to places advisories discuss at length.</p>
<h2>Mindset</h2>
<p>Come curious, not performative. Follow dress and photo guidance. Libya rewards visitors who treat structure as the price of access to extraordinary quiet sites.</p>
""",
    "how-to-travel-to-libya-from-the-united-kingdom": """
<h2>UK practical extras</h2>
<p>Check passport validity rules carefully. Keep EHIC style assumptions out of Libya planning; this is not an EU weekend. Arrange suitable insurance. Ask IntoLibya how payments and deposits work for your booking so finance does not become the late surprise.</p>
<p>If you are combining Tunisia beach days with Libya culture, design the join carefully rather than inventing a border fantasy. Licensed routing beats cleverness.</p>
<h2>Why UK travelers thrive here</h2>
<p>Many arrive already literate in advisory nuance and still choose guided adventure. That balance is healthy. Use it. Then let TourBuilder turn intention into a day list.</p>
""",
    "how-to-travel-to-libya-from-canada": """
<h2>Canadian planning extras</h2>
<p>Currency conversion and deposit timing should be clear before you commit. Ask what the package includes versus government visa fees. Long transit days argue for a gentle arrival afternoon in Tripoli with early sleep, not a midnight ruin march.</p>
<p>Winter departures from Canada into Libya’s milder coast season can feel like a gift. Summer departures into Sahara heat need extra honesty. Match leave to landscape.</p>
<h2>Community and communication</h2>
<p>Canadian groups of friends often book private tours successfully. Appoint one logistics lead so IntoLibya is not answering five contradictory threads. Clarity scales better than enthusiasm alone.</p>
""",
    "how-to-travel-to-libya-from-australia": """
<h2>Making the distance worth it</h2>
<p>After flying that far, shortchanging site time is painful. Consider nine to twelve days if desert is essential. A rushed four day coast sampler may not repay the jet lag for every Australian traveler, though some still prefer a focused first look.</p>
<p>Talk through length honestly with IntoLibya. TourBuilder packages exist at multiple durations. Pick the one that respects the airfare you already know is painful.</p>
<h2>Stopovers</h2>
<p>Some guests add a European or Middle Eastern stopover to break the haul. That can help bodies. Just keep Libya document dates aligned so stopovers do not collide with sponsorship windows.</p>
""",
    "how-to-travel-to-libya-from-germany": """
<h2>German traveler practical notes</h2>
<p>Card payments and cash mix should be confirmed. Photography rules deserve a pre trip read if you carry serious gear. Desert dust and fine cameras are a known pair of frenemies. Bring protection.</p>
<p>German school holiday peaks can overlap popular Libya months. Family groups should start earlier than the casual couple with flexible remote work.</p>
<h2>Language on tour</h2>
<p>English guiding is common on international itineraries. Ask if you need German language support. IntoLibya will say what is realistic rather than promise a fantasy guide pool.</p>
""",
    "how-to-travel-to-libya-from-france": """
<h2>French traveler practical notes</h2>
<p>If you speak French, you may find occasional local language bridges, but do not assume it replaces English tour briefing standards. Ask what language your guide will use. Pack modest clothing that still feels like travel wear, not beachwear relocated inland.</p>
<p>Travelers coming from Tunisian holidays should separate beach expectations from Libya’s sponsored culture and desert product. Different countries, different rules, related region.</p>
<h2>Why the jump is worth it</h2>
<p>Libya’s Roman emptiness after North African city tourism can feel like discovering volume control. That is the reward for doing paperwork like a grown up.</p>
""",
    "how-to-travel-to-libya-from-italy": """
<h2>Historical appetite, modern process</h2>
<p>Italian visitors often arrive with strong Roman reference points. Use that. Ask guides for comparative talk between imperial Italy’s story and Leptis as a hometown of Severan ambition. Curiosity makes the stones louder.</p>
<p>Still finish eVisa steps on time. Historical love does not stamp passports. IntoLibya sponsorship is the modern gate to ancient rooms.</p>
<h2>Short break temptation</h2>
<p>Relative proximity can tempt ultra short trips. Make sure the length still includes real site time after arrival logistics. A thin itinerary wastes the chance. TourBuilder can show honest day counts.</p>
""",
    "how-to-travel-to-libya-from-spain": """
<h2>Spanish traveler practical notes</h2>
<p>Summer leave from Spain into Libya summer heat is a common mismatch. If August is your only leave, favor coastal plans and accept limits on deep desert. If you can move leave to autumn, your Sahara chapter improves dramatically.</p>
<p>Friend groups from Spain often enjoy private tours. Align budgets early so the quote matches the group’s real appetite for camps versus hotels.</p>
<h2>After other Mediterranean trips</h2>
<p>If you know Roman remains around the wider Mediterranean, Libya still surprises with scale and quiet. That surprise is easier to enjoy when documents are done and guides lead the day.</p>
""",
    "libya-tours-for-photographers": """
<h2>Shot list thinking without killing spontaneity</h2>
<p>Bring a short must get list: theatre, arch detail, dune ridgeline, oasis palm edge, night sky if moon allows. Then leave room for chance light. Guides can often adjust fifteen minutes more easily than two unplanned hours. Communicate early.</p>
<p>Blue hour at Leptis and pale morning in Ghadames reward people who wake up. Adventure seekers chase dunes. Photographers chase edges of day. IntoLibya can schedule for both when you say which wins ties.</p>
<h2>Ethics as craft</h2>
<p>Blur faces when asked. Avoid turning checkpoints into content. The best Libya gallery is strong and kind. Book the tour like a production with permits, not like a raid.</p>
""",
    "libya-tours-for-archaeology-fans": """
<h2>Reading the stones</h2>
<p>Come with a little prep if you enjoy it: Severan dynasty basics, Roman urban planning vocabulary, Mediterranean trade routes. You do not need a degree. A page of context turns columns into sentences. Guides supply the rest on site.</p>
<p>Allow sit down time inside the site, not only walking laps. Archaeology fans remember the quiet pause in a basilica more than the tenth similar capital snapped in a hurry.</p>
<h2>Beyond the famous two</h2>
<p>Sabratha and Leptis are the gateway drug. Longer trips can add eastern stories or desert civilizations when available. Tell IntoLibya your depth appetite so TourBuilder quotes do not undersell your curiosity.</p>
""",
    "libya-tours-for-food-travelers": """
<h2>Taste as cultural map</h2>
<p>Coastal cooking and desert hospitality do not taste identical. Notice bread, spices, sweet tea, and how guests are welcomed. Food travel here is anthropology with napkins. Ask questions. Learn names of dishes. Write them down while you still remember.</p>
<p>Market mornings in Tripoli can be as memorable as a theatre facade if you give them time. Request that in your brief.</p>
<h2>Camp cuisine without snobbery</h2>
<p>Desert meals are about sustenance and shared atmosphere. Judge them in context. The best sauce is appetite after a dune day. IntoLibya plans reliable feeding so culinary curiosity does not become logistical risk.</p>
""",
    "libya-tours-for-adventure-seekers": """
<h2>Soft adventure definition</h2>
<p>Most Libya adventure days are vehicle supported. You are not expected to haul expedition sledges. You are expected to handle uneven ground, sand walks, early alarms, and remote toilets without theatrical despair. That is the contract.</p>
<p>If you want technical climbing or unsupported trekking fantasies, say so and hear an honest no when needed. The desert product on offer is already serious enough for most travelers seeking adrenaline with guiding.</p>
<h2>Risk partnership</h2>
<p>Follow seatbelt and convoy instructions. Heat decisions are not optional debates. Adventure seekers who listen get farther and come home with better stories. Book the season that matches the risk you actually want.</p>
""",
    "libya-for-digital-creators-and-travel-bloggers": """
<h2>Story angles that travel well</h2>
<p>Process stories perform: sponsorship reality, empty UNESCO scale sites, desert night audio, respectful festival coverage when dates align. Avoid recycled fear clickbait that ignores licensed tourism nuance. Audiences can smell laziness.</p>
<p>Credit guides and drivers when they make the work possible. Creators who treat local teams as props get worse second trips.</p>
<h2>Post trip workflow</h2>
<p>Build edit time after return. Jet lag plus dump of sand footage is a known trap. IntoLibya can help with place name accuracy if you ask. Just do not demand secret military GPS poetry for a blog.</p>
""",
    "libya-for-older-travelers-who-want-support": """
<h2>Companions and solo older travelers</h2>
<p>Couples can pace together. Solo older travelers should say whether they prefer private guiding energy or carefully chosen small groups. IntoLibya can advise which product feels less lonely and less exhausting.</p>
<p>Hearing and mobility aids should be packed with spares. Sites are large. A simple folding seat stick helps some guests more than a second fancy camera.</p>
<h2>Confidence without denial</h2>
<p>You can be adventurous and still request ground floor rooms when available. Support is not surrender. It is how you finish the week still glad you came. Start the conversation in TourBuilder with plain language about needs.</p>
""",
    "libya-for-small-friend-groups": """
<h2>Money and fairness</h2>
<p>Decide how you split deposits, visa fees, and extras before anyone pays. Friendship survives ruins. It suffers at opaque spreadsheets. Put the plan in writing in your group chat once.</p>
<p>If incomes differ, choose a package band everyone can actually enjoy. Resentful luxury helps nobody.</p>
<h2>Rooming and downtime</h2>
<p>Not every night must be a party. Build one quiet evening into the plan. Desert trips intensify personalities. IntoLibya handles roads and permits. You handle adult social design.</p>
""",
    "libya-after-you-have-already-seen-morocco": """
<h2>Desert comparison without trash talk</h2>
<p>Morocco’s desert tourism is mature and often beautiful. Libya’s desert days can feel more logistical and less staged. Neither sentence insults the other. They describe different industries and access models. Choose Libya when you want that difference.</p>
<p>If you loved Morocco’s cities most, lean your Libya plan toward Tripoli and Roman coast with a lighter desert postscript. If you loved dunes most, invert the emphasis.</p>
<h2>Emotional readiness</h2>
<p>Some travelers miss Morocco’s easy cafe culture. Libya offers other gifts. Arrive curious about what is here rather than angry about what is not. IntoLibya’s job is the real Libya, not a replica of your last holiday.</p>
""",
    "libya-tours-for-history-teachers-and-students": """
<h2>Assessment and reflection ideas</h2>
<p>Build quiet journaling time after major sites. Ask students to compare Leptis plan to a city they know. Discuss how tourism, heritage protection, and modern Libya intersect without turning the trip into only politics class. Balance awe and analysis.</p>
<p>Teachers should prep behavior norms: dress, photography, patience at checks. A class that travels well gets invited into better conversations.</p>
<h2>Budgeting learning travel</h2>
<p>Educational trips need clear inclusion lists for parents or institutions. Ask IntoLibya for transparent package scopes. Hidden assumptions sink school trips. TourBuilder quotes should be readable by non travelers on a committee.</p>
""",
    "libya-for-honeymoon-style-couples": """
<h2>Conflict proofing the romantic trip</h2>
<p>Agree on must see sites before deposit. If one partner needs a hotel night after camp, schedule it. If one partner fears heat, choose season wisely. Romance dies fastest when one person feels dragged.</p>
<p>Celebrate with shared tea and shared silence, not with banned assumptions about alcohol. The sky and the stones are the champagne.</p>
<h2>Privacy</h2>
<p>Private guiding helps couples who want space. Small group energy can still work if you both like new friends. Say which intimacy style you want. IntoLibya can match product to preference.</p>
""",
    "libya-for-repeat-north-africa-travelers": """
<h2>Leveling up the challenge</h2>
<p>Repeat travelers can handle longer desert chapters, early archaeology mornings, and less hand holding on cultural basics. That does not mean skipping briefings. It means your questions can go deeper. Ask for that depth.</p>
<p>If you have driven dunes elsewhere, still respect local convoy rules. Different country, different team habits.</p>
<h2>Collecting places responsibly</h2>
<p>Do not treat Libya as a checkbox to dominate a map. Treat it as a country with living communities and heritage under pressure. Creators and collectors alike owe better stories than conquest metaphors. IntoLibya hosts guests, not trophy hunters.</p>
""",
    "libya-for-people-who-hate-crowds": """
<h2>Solitude versus isolation</h2>
<p>Uncrowded is not the same as alone without support. You will have guides, drivers, and sometimes tourist police patterns. That human layer is how quiet sites stay reachable. Introverts can still recharge between conversations. Extreme loners who reject all structure will not fit the legal model.</p>
<p>Choose private tours if even small groups feel noisy. Choose shoulder seasons if you want comfort and quiet together.</p>
<h2>The payoff</h2>
<p>Hearing wind in a Roman street may be the memory that ruins other destinations for you afterward. That is a known side effect. Book anyway. TourBuilder and IntoLibya sponsorship are how crowd haters get the empty frame without getting lost.</p>
""",
}


def strip_cta(body: str) -> str:
    # Remove trailing CTA starting at <hr /> before Plan your Libya trip
    m = re.search(r"\n<hr />\s*\n\s*<h2>Plan your Libya trip</h2>[\s\S]*$", body)
    if m:
        return body[: m.start()].rstrip()
    return body.rstrip()


def extract_excerpt_seo(slug: str) -> tuple[str, str]:
    raw = (POSTS / f"{slug}.md").read_text()
    fm = raw.split("---", 2)[1]
    ex = re.search(r"excerpt: '((?:''|[^'])*)'", fm).group(1).replace("''", "'")
    seo = re.search(r"  description: '((?:''|[^'])*)'", fm).group(1).replace("''", "'")
    return ex, seo


def extract_body(slug: str) -> str:
    raw = (POSTS / f"{slug}.md").read_text()
    rest = raw.split("---", 2)[2]
    # drop leading html comment block for rebuild; update_post preserves existing comment from file...
    # Actually update_post reads file and preserves comment from current file when writing.
    # We pass only body_html without the comment.
    body = re.sub(r"^\s*<!--.*?-->\s*", "", rest, count=1, flags=re.S)
    return body.strip()


CTA_SEASONAL = """
<hr />

<h2>Plan your Libya trip</h2>

<p>Ready when you are. Build a route in TourBuilder or talk to IntoLibya about dates, sponsorship, and the season that fits your energy.</p>

<p><a href="/tourbuilder/booking">Build Your Trip</a> · <a href="/tourbuilder/tour-packages">Browse tour packages</a></p>
"""

CTA_EVENT = """
<hr />

<h2>Plan your Libya trip</h2>

<p>Ready when you are. Confirm live event dates in TourBuilder, then ask IntoLibya to wrap sponsorship, guides, and logistics around the days that matter.</p>

<p><a href="/tourbuilder/booking">Build Your Trip</a> · <a href="/tourbuilder/festivals-and-events">Browse festivals and events</a> · <a href="/tourbuilder/tour-packages">Browse tour packages</a></p>
"""

CTA_AUDIENCE = """
<hr />

<h2>Plan your Libya trip</h2>

<p>Ready when you are. Build a route in TourBuilder or talk to IntoLibya about visas, sponsorship, and the itinerary that fits your passport and pace.</p>

<p><a href="/tourbuilder/booking">Build Your Trip</a> · <a href="/tourbuilder/tour-packages">Browse tour packages</a></p>
"""

EVENT_SLUGS = {
    "festivals-in-libya-worth-planning-around",
    "ghat-international-tourism-festival-guide",
    "rally-te-te-waddan-desert-rally-guide",
    "total-solar-eclipse-2027-in-libya-guide",
    "double-shafra-sahara-trip-explained",
    "double-shafra-ghadames-trip-explained",
    "how-to-plan-a-libya-trip-around-fixed-event-dates",
}

AUDIENCE_SLUGS = {
    "how-to-travel-to-libya-from-the-united-states",
    "how-to-travel-to-libya-from-the-united-kingdom",
    "how-to-travel-to-libya-from-canada",
    "how-to-travel-to-libya-from-australia",
    "how-to-travel-to-libya-from-germany",
    "how-to-travel-to-libya-from-france",
    "how-to-travel-to-libya-from-italy",
    "how-to-travel-to-libya-from-spain",
    "libya-tours-for-photographers",
    "libya-tours-for-archaeology-fans",
    "libya-tours-for-food-travelers",
    "libya-tours-for-adventure-seekers",
    "libya-for-digital-creators-and-travel-bloggers",
    "libya-for-older-travelers-who-want-support",
    "libya-for-small-friend-groups",
    "libya-after-you-have-already-seen-morocco",
    "libya-tours-for-history-teachers-and-students",
    "libya-for-honeymoon-style-couples",
    "libya-for-repeat-north-africa-travelers",
    "libya-for-people-who-hate-crowds",
}


def cta_for(slug: str) -> str:
    if slug in EVENT_SLUGS:
        return CTA_EVENT
    if slug in AUDIENCE_SLUGS:
        return CTA_AUDIENCE
    return CTA_SEASONAL


def main():
    for slug, extra in EXTRAS.items():
        body = extract_body(slug)
        core = strip_cta(body)
        new_body = f"{core}\n{extra.strip()}\n{cta_for(slug)}"
        excerpt, seo = extract_excerpt_seo(slug)
        # hyphen check extras early
        assert_no_hyphen(extra, f"{slug} extra")
        update_post(slug, new_body, excerpt, seo)
    print(f"Expanded {len(EXTRAS)} posts.")


if __name__ == "__main__":
    main()
