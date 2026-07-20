#!/usr/bin/env python3
"""Rewrite Cluster B visit funnel posts to Wave 1 editorial quality."""
from __future__ import annotations

import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from scripts.lib.update_post import update_post

CTA = """
<hr />

<h2>Plan your Libya trip with IntoLibya</h2>

<p>IntoLibya handles licensed sponsorship, TourBuilder itineraries, guides, and on ground logistics. Open TourBuilder with your dates and must see list, then shape a route that matches how tourism in Libya actually works.</p>

<p><a href="/tourbuilder/booking">Build Your Trip</a> · <a href="/tourbuilder/tour-packages">Browse tour packages</a> · <a href="/tourbuilder/search">Browse activities</a></p>
"""

RELATED_BOOK = """
<h2>Related reading</h2>

<ul>
<li><a href="/en/how-to-book-a-libya-tour-with-intolibya">How to Book a Libya Tour with IntoLibya</a></li>
<li><a href="/en/how-to-visit-libya-as-a-tourist-in-2026">How to Visit Libya as a Tourist in 2026</a></li>
<li><a href="/en/libya-evisa-explained-step-by-step">Libya eVisa Explained Step by Step</a></li>
<li><a href="/en/how-tourbuilder-works-for-custom-libya-trips">How TourBuilder Works for Custom Libya Trips</a></li>
<li><a href="/en/libya-tour-packages-explained">Libya Tour Packages Explained</a></li>
<li><a href="/en/destination/tripoli">Tripoli destination guide</a></li>
</ul>
"""

RELATED_ROUTE = """
<h2>Related reading</h2>

<ul>
<li><a href="/en/where-should-first-timers-go-in-libya-first">Where Should First Timers Go in Libya First</a></li>
<li><a href="/en/coast-first-or-desert-first-how-guests-decide">Coast First or Desert First How Guests Decide</a></li>
<li><a href="/en/east-libya-or-west-libya-how-to-choose-your-first-region">East Libya or West Libya How to Choose Your First Region</a></li>
<li><a href="/en/how-weather-windows-shape-where-you-should-go">How Weather Windows Shape Where You Should Go</a></li>
<li><a href="/en/7-day-western-libya-itinerary">7 Day Western Libya Itinerary</a></li>
<li><a href="/en/destination/leptis-magna">Leptis Magna destination guide</a></li>
</ul>
"""

RELATED_EVENT = """
<h2>Related reading</h2>

<ul>
<li><a href="/en/how-fixed-event-dates-change-your-libya-booking-timeline">How Fixed Event Dates Change Your Libya Booking Timeline</a></li>
<li><a href="/en/event-travel-versus-flexible-tourbuilder-libya-trips">Event Travel Versus Flexible TourBuilder Libya Trips</a></li>
<li><a href="/en/double-shafra-december-dates-what-guests-should-know">Double Shafra December Dates What Guests Should Know</a></li>
<li><a href="/en/how-to-book-a-libya-tour-with-intolibya">How to Book a Libya Tour with IntoLibya</a></li>
<li><a href="/en/how-tourbuilder-works-for-custom-libya-trips">How TourBuilder Works for Custom Libya Trips</a></li>
<li><a href="/en/destination/tripoli">Tripoli destination guide</a></li>
</ul>
"""

RELATED_GUEST = """
<h2>Related reading</h2>

<ul>
<li><a href="/en/what-guests-ask-most-before-paying-a-libya-tour-deposit">What Guests Ask Most Before Paying a Libya Tour Deposit</a></li>
<li><a href="/en/fitness-level-what-libya-tours-expect-from-guests">Fitness Level What Libya Tours Expect From Guests</a></li>
<li><a href="/en/dietary-needs-how-to-tell-us-before-a-libya-tour">Dietary Needs How to Tell Us Before a Libya Tour</a></li>
<li><a href="/en/how-to-book-a-libya-tour-with-intolibya">How to Book a Libya Tour with IntoLibya</a></li>
<li><a href="/en/do-you-need-a-tour-to-visit-libya">Do You Need a Tour to Visit Libya</a></li>
<li><a href="/en/destination/ghadames">Ghadames destination guide</a></li>
</ul>
"""


def wc(html: str) -> int:
    text = re.sub(r"<[^>]+>", " ", html)
    return len([w for w in text.split() if w])


def verify_links(html: str, posts_dir: Path) -> list[str]:
    dests_dir = posts_dir.parent.parent / "destinations/en"
    missing = []
    for href in re.findall(r'href="(/en/[^"]+)"', html):
        slug = href.removeprefix("/en/")
        if slug.startswith("destination/"):
            dest = slug.removeprefix("destination/")
            if not (dests_dir / f"{dest}.md").exists():
                missing.append(href)
        elif not (posts_dir / f"{slug}.md").exists():
            missing.append(href)
    return missing


POSTS: list[tuple[str, str, str, str]] = [
    (
        "what-do-you-need-from-me-to-start-a-libya-tour-booking",
        f"""
<p><strong>What do you need from me to start a Libya tour booking?</strong> Less than you fear, more than a single passport photo. IntoLibya needs enough detail to draft a licensed route, enough documents to begin sponsorship, and enough honesty about pace and limits that the week on the ground matches the week in your head.</p>

<p>Start in TourBuilder or send a clear brief through the booking flow. Either path works. What slows good trips is missing dates, hidden mobility issues, or vague must see lists that turn into last minute rewrites.</p>

<h2>The first message that actually helps</h2>

<p>Tell us travel month or fixed dates, trip length, group size, and passport nationalities. Name must see places such as <a href="/en/destination/leptis-magna">Leptis Magna</a>, <a href="/en/destination/ghadames">Ghadames</a>, or an east eclipse window if that is the point. Mention camping tolerance, kids or older relatives, and dietary needs early.</p>

<p>Lean versus all inclusive style preferences matter too. Ask what each quote includes before you compare day counts alone.</p>

<h2>Documents we usually request first</h2>

<p>After you accept a quote direction, expect passport scans with readable expiry dates, visa style photos, and sometimes short forms for sponsor files. Names must match tickets. Blurry phone photos cause delays nobody enjoys.</p>

<p>We send the sponsor pack for your eVisa step once deposit timing allows. Keep digital copies of everything you upload to the government portal.</p>

<h2>What you do not need to solve alone</h2>

<p>Hotels, desert camps, drivers, guides, and tourist police coordination sit inside the tour plan. You do not hunt brand names across booking sites. You do tell us if you need ground floor rooms, extra buffer nights, or a slower ruin day.</p>

<p>Flights are yours to buy, yet we advise on workable hubs and arrival times once visa timing looks solid. Mitiga in <a href="/en/destination/tripoli">Tripoli</a> is the usual front door for western circuits.</p>

<h2>Timeline expectations that keep calm</h2>

<p>Six to eight weeks before travel is comfortable for many guests. Peak autumn and spring windows can need more lead time. Fixed event dates shrink that cushion fast.</p>

<h2>When you are ready to move</h2>

<p>Open TourBuilder with dates and must sees, request a quote, read inclusions, pay the deposit that starts sponsorship, then complete the eVisa steps. That sequence is the whole booking spine.</p>
{RELATED_BOOK}
{CTA}
""",
        "What IntoLibya needs to start your Libya tour booking: dates, group details, passport files, and honest pace notes for TourBuilder.",
        "What do you need to start a Libya tour booking? Dates, documents, must sees, and what IntoLibya handles inside the licensed plan.",
    ),
    (
        "libya-tour-booking-steps-from-first-email-to-arrival",
        f"""
<p><strong>Libya tour booking steps</strong> run from first enquiry to arrival at Mitiga like a small project with a clear checklist. You are not buying a mystery voucher. You are confirming a licensed route, starting sponsorship, finishing the eVisa, and landing to a team that already knows your names.</p>

<p>IntoLibya keeps the path visible in TourBuilder so quotes, packages, and custom days stay tied to real catalog data.</p>

<h2>Step 1: Shape the trip you want</h2>

<p>Pick coastal Roman sampler, western week with <a href="/en/destination/ghadames">Ghadames</a>, Sahara leaning adventure, or an event anchored date. Note constraints: leave dates, camping comfort, walking stamina, mixed ages, and must see sites. Browse packages or build day by day before you request a quote.</p>

<h2>Step 2: Quote and inclusions</h2>

<p>A serious quote names sponsorship support, guiding, transport, lodging or camps, meals if included, tourist police patterns, and whether government eVisa fees sit inside the package or on your card. Lean and all inclusive styles differ. Ask until the answer is boringly clear.</p>

<h2>Step 3: Deposit and sponsor files</h2>

<p>When the plan feels right, pay the deposit on the timeline in your quote. That green light lets licensed staff prepare invitation and supporting documents. Send sharp passport scans. Names and nationalities must match future tickets.</p>

<h2>Step 4: eVisa on the official portal</h2>

<p>Apply with the sponsor pack we provide. Approvals can arrive in about a week or stretch if files need fixes. Keep copies of approval screens. Do not lock the least flexible flights on earth until visa logic looks solid.</p>

<h2>Step 5: Final balance and arrival</h2>

<p>Clear remaining balances by due dates. Share flight details so airport meeting plans stay accurate. Pack modest clothes, sensible shoes, and patience for checkpoints. Land at Mitiga ready to meet your coordinator and start day one inside the tour frame.</p>

<h2>Common mistakes we see early</h2>

<p>Waiting until two weeks before peak season. Hiding mobility limits until day two. Assuming independent wandering will appear for an afternoon. Comparing quotes without matching inclusions. All fixable if caught in TourBuilder before deposits.</p>
{RELATED_BOOK}
{CTA}
""",
        "Libya tour booking steps from first enquiry to Mitiga arrival: quote, deposit, sponsorship, eVisa, and what to expect on landing day.",
        "Libya tour booking steps from first enquiry to arrival: TourBuilder quote, deposit, sponsorship, eVisa, and Mitiga meetup.",
    ),
    (
        "passport-photos-and-forms-guests-usually-send-first",
        f"""
<p><strong>Passport photos and forms</strong> are the first paperwork guests send after a Libya tour quote starts moving. The task sounds dull until a blurry scan adds two weeks. Clean files keep sponsorship and eVisa steps on rhythm.</p>

<p>IntoLibya asks for standard tourist documents, not a scavenger hunt. This page lists what usually comes first and how to avoid the fixes that stall portals.</p>

<h2>Passport scans that immigration actually accepts</h2>

<p>Send full photo page scans, not cropped corners. Expiry date must be readable six months beyond travel or per your nationality rules. Every traveler in the group sends their own file. Names must match future airline tickets exactly.</p>

<p>Phone photos often fail when glare hides numbers. Flatbed scans or good scanning apps win.</p>

<h2>Visa style photos and biographic forms</h2>

<p>Many guests send a recent passport style photo with plain background and neutral expression, plus short biographic forms the sponsor pack requires. Requirements mirror the government eVisa portal more than random internet advice.</p>

<p>Children need the same discipline as adults. Family bookings stall when one teen passport scan is missing.</p>

<h2>What we do with your files</h2>

<p>Licensed staff prepare sponsor invitation and supporting documents tied to your confirmed itinerary. You then upload to the official eVisa system with our pack. We do not ask for unnecessary banking details in chat.</p>

<h2>Timing: when to send what</h2>

<p>Send passport scans soon after you commit to a quote direction so sponsor work can start with deposit timing. Do not wait until flights are bought if visa approval still floats. Six to eight weeks before travel is a comfortable window for many nationalities.</p>

<h2>After approval</h2>

<p>Keep digital and printed copies of eVisa approval. Share arrival flight details through TourBuilder so Mitiga pickup plans stay accurate. Good paperwork is how you reach <a href="/en/destination/leptis-magna">Leptis Magna</a> without desk drama.</p>
{RELATED_BOOK}
{CTA}
""",
        "Passport photos and forms for Libya tour booking: scan quality, visa photos, sponsor files, and timing before the eVisa step.",
        "Passport photos and forms guests send first for a Libya tour: scans, visa photos, sponsor pack timing, and common delays.",
    ),
    (
        "how-flights-work-when-a-tour-company-guides-your-libya-entry",
        f"""
<p><strong>Flights for a guided Libya entry</strong> are yours to purchase, yet they should follow visa timing and operator advice. IntoLibya does not replace airlines. We help guests choose workable hubs, sane arrival days, and tickets that survive sponsorship delays.</p>

<p>Most western circuits start at Mitiga in <a href="/en/destination/tripoli">Tripoli</a>. East itineraries may use Benghazi when routes and access allow. Your coordinator confirms the right airport for your plan.</p>

<h2>Why flexible tickets matter early</h2>

<p>Sponsor documents and eVisa approval set the real green light. Buying non refundable tickets before that logic is solid creates stress nobody needs. Hold flexible fares or wait until approval looks likely.</p>

<p>Peak autumn and spring weeks fill quickly. Balance caution with calendar reality once paperwork firms.</p>

<h2>Hub patterns guests actually use</h2>

<p>Many Europeans connect through Tunis on a short hop to Mitiga. Others use Istanbul, Cairo, or regional links that change by season. Direct options shift. Tell us your home airport and leave window in TourBuilder so advice matches your dates.</p>

<h2>Arrival and departure coordination</h2>

<p>Share flight numbers and landing times after you book. Airport pickup on guided trips is part of the licensed plan, not a guess at the curb. Departure days need similar clarity when checkpoints and drive times matter.</p>

<h2>East versus west entry</h2>

<p>Eclipse or Cyrenaica plans may favor Benghazi entry when itineraries support it. Do not assume Mitiga automatically. Route design and access decide the right door.</p>

<h2>What we do not book for you</h2>

<p>IntoLibya plans Libya ground logistics and sponsorship. Tunis hotels before the hop, Cairo side trips, or post tour beach days elsewhere stay your separate bookings unless a custom note explicitly covers operational buffer nights.</p>

<h2>Practical booking order</h2>

<p>Shape the tour, accept quote direction, pay deposit, advance eVisa, then buy flights with operator confirmed arrival day. That order keeps money and sanity aligned.</p>
{RELATED_BOOK}
{CTA}
""",
        "How flights work on a guided Libya tour: Mitiga and Benghazi entry, flexible tickets, hub routes, and when to buy after eVisa approval.",
        "How flights work when a tour company guides your Libya entry: hubs, Mitiga timing, flexible tickets, and arrival coordination.",
    ),
    (
        "who-arranges-hotels-on-a-guided-libya-tour",
        f"""
<p><strong>Who arranges hotels on a guided Libya tour?</strong> IntoLibya does, inside your licensed quote. You are not expected to phone properties in Arabic at midnight or guess which towns allow tourist stays this month. You do tell us comfort needs, pacing, and family constraints so nights match the route.</p>

<p>Hotel names in quotes refer to confirmed categories and locations, not a promise you must research every brand online before you trust the week.</p>

<h2>What lodging means inside a tour plan</h2>

<p>Coastal cities use business style hotels near practical driving routes. Oasis towns such as <a href="/en/destination/ghadames">Ghadames</a> use guesthouse or hotel nights that fit guided access. Sahara chapters use camps with mattresses, blankets, and shared or private tent setups depending on package style.</p>

<p>All inclusive quotes fold more meals and camp gear into one line. Lean quotes may leave some meals open yet still confirm safe lodging each night.</p>

<h2>What guests should flag early</h2>

<p>Ground floor requests, twin versus double beds, snoring roommates, extra buffer night in <a href="/en/destination/tripoli">Tripoli</a>, or no desert camping for grandparents. Put notes in TourBuilder during quoting so days and nights align before deposits.</p>

<h2>Why DIY hotel booking fails tourists here</h2>

<p>Tourist stays expect sponsor linkage and coordinated movement. Random independent bookings break the legal and practical frame that lets you reach sites with guides and required escorts. The tour container is the product.</p>

<h2>Camps versus hotels on mixed routes</h2>

<p>Western weeks often mix hotel nights with one or two camp experiences when season supports them. Rushing Sahara without honest camp expectations produces unhappy mornings. Say yes or no early.</p>

<h2>Changes on the ground</h2>

<p>Security or access shifts sometimes force hotel swaps. Good operators rebook equivalent comfort rather than shrugging. That flexibility is part of licensed travel.</p>

<h2>How to start the conversation</h2>

<p>Pick a package shape or custom days in TourBuilder, list lodging comfort in your brief, read what the quote includes, then let IntoLibya hold the calendar while you focus on sites.</p>
{RELATED_BOOK}
{CTA}
""",
        "Who arranges hotels on a guided Libya tour: IntoLibya confirms coastal hotels, oasis stays, and desert camps inside your licensed quote.",
        "Who arranges hotels on a guided Libya tour? How IntoLibya books nights, camps, and comfort notes inside the licensed plan.",
    ),
    (
        "where-should-first-timers-go-in-libya-first",
        f"""
<p><strong>Where should first timers go in Libya first?</strong> Most honest operators start western guests on the coast: <a href="/en/destination/tripoli">Tripoli</a> for medina context, <a href="/en/destination/leptis-magna">Leptis Magna</a> for Roman scale, and <a href="/en/destination/sabratha">Sabratha</a> for theatre above the sea. Add <a href="/en/destination/ghadames">Ghadames</a> when leave allows a full week. Save deep Sahara or full east circuits for longer calendars unless one site is your only reason to fly.</p>

<p>IntoLibya builds licensed routes that match first timer stamina and sponsorship time, not fantasy maps.</p>

<h2>Why the coast wins first visits</h2>

<p>Roman cities deliver the emotional proof that Libya is worth the paperwork. Driving hours stay manageable. Heat and camp logistics stay milder than Fezzan summer or winter desert nights. You learn checkpoint rhythm without remote pressure on day three.</p>

<h2>When to add Ghadames or the Sahara</h2>

<p>Seven to ten days opens oasis old town walks and optional dune or lake chapters south. Season matters. Autumn through spring fits mixed coast and desert better than midsummer slog.</p>

<h2>East Libya as a second trip or special reason</h2>

<p>Greek Cyrenaica around <a href="/en/destination/shahat">Shahat</a> and green mountain towns reward guests with ten plus days or eclipse dates that anchor the east. First timers with one week should not pretend they can taste everything.</p>

<h2>How pace changes the map</h2>

<p>Families with mixed ages need shorter walking blocks. Ruin lovers want two mornings at Leptis, not one rushed pass. Photographers want golden hour timing. Tell TourBuilder which hunger is yours.</p>

<h2>Weather windows matter</h2>

<p>Coastal winter can feel pleasant when Europe freezes. Sahara nights turn cold in December. Summer punishes southern drives. Match region to month before you lock flights.</p>

<h2>Turn the map into a bookable week</h2>

<p>Browse a western package, adjust days, note must sees, and request a quote. First timer success is a coherent week, not a country checklist.</p>
{RELATED_ROUTE}
{CTA}
""",
        "Where first timers should go in Libya first: Tripoli, Leptis Magna, Sabratha, and when to add Ghadames or the Sahara.",
        "Where should first timers go in Libya first? Coast classics, Ghadames timing, and when east Libya fits a second trip.",
    ),
    (
        "what-happens-on-day-one-after-you-land-in-libya",
        f"""
<p><strong>What happens on day one after you land in Libya?</strong> Expect paperwork, a warm meetup, and a pace that respects jet lag. Day one is rarely your hardest ruin march. It is orientation inside the tour frame that will carry you to <a href="/en/destination/leptis-magna">Leptis Magna</a>, medina alleys, or desert roads later in the week.</p>

<p>IntoLibya coordinates Mitiga or Benghazi arrivals with licensed drivers and guides who already know your flight details from TourBuilder.</p>

<h2>Airport meetup and first checks</h2>

<p>Your coordinator or driver meets you after immigration with a name sign or agreed contact point. eVisa printouts, passport, and sponsor awareness matter at the desk. Answer questions calmly. Photography rules start here.</p>

<h2>Transfer to hotel and short briefing</h2>

<p>Most western weeks drop bags at a Tripoli hotel before any big sightseeing. Briefings cover dress, checkpoint behavior, tomorrow timing, and WhatsApp or phone contact patterns. Ask every small question now.</p>

<h2>Soft sightseeing or rest</h2>

<p>Some guests walk medina edges or enjoy a calm meal. Others sleep off Tunis hub nights. Operators adjust to arrival hour and energy. Fighting exhaustion to cram Leptis on landing day usually backfires.</p>

<h2>Tourist police and guide presence</h2>

<p>Escorts appear when routes require them. That is normal, not a personal suspicion story. Guides translate context at sites and meals. Let them lead movement.</p>

<h2>What day one is not</h2>

<p>Independent wandering without coordination. Secret side trips. Ignoring modest dress in town. The frame exists so day two can be magnificent.</p>

<h2>How to arrive prepared</h2>

<p>Share final flight numbers early, carry printed visa approval, pack one modest outfit in carry on, and trust the slow start. The week opens quickly enough.</p>
{RELATED_BOOK}
{CTA}
""",
        "What happens on day one after you land in Libya: airport meetup, hotel briefing, soft pacing, and what tourist escorts mean.",
        "What happens on day one after you land in Libya? Mitiga meetup, briefing, gentle pacing, and how guided days begin.",
    ),
    (
        "how-long-before-travel-should-guests-send-documents",
        f"""
<p><strong>How long before travel should guests send documents?</strong> Sooner than Instagram courage suggests. Sponsor files and eVisa portals need lead time. A comfortable target for many guests is six to eight weeks before departure. Peak October through April windows and fixed event dates need more cushion, not less.</p>

<p>IntoLibya cannot rush government systems with charm alone. Clean scans and early deposits protect your calendar.</p>

<h2>Ideal timeline in plain order</h2>

<p>Four to eight weeks out: finalize quote direction, pay deposit, send passport scans and forms. Three to six weeks out: complete eVisa upload with sponsor pack. Two to four weeks out: buy flights with flexible change options if approval still pending. One week out: share final flight numbers and emergency contacts in TourBuilder.</p>

<h2>When late is still possible</h2>

<p>Some nationalities see faster approvals with perfect files. Shoulder season has more operator breathing room. Last minute miracles happen. Banking on them is how trips die.</p>

<h2>Family and group document batches</h2>

<p>One missing child passport blocks the whole sponsor batch. Send every traveler together with consistent file naming. Mixed nationalities may face different portal fees. Flag that early.</p>

<h2>Fixed events shrink margins</h2>

<p>Rally weekends, December desert trips, festival windows, and eclipse totality do not slide for your delayed scan. Event listings in TourBuilder show why buffers exist.</p>

<h2>What delays look like</h2>

<p>Blurry scans, name typos, expired passports, and deposit timing that lags quote acceptance. Fix those and most stalls shorten.</p>

<h2>Start the clock now</h2>

<p>Open TourBuilder with dates, request a quote, and send documents the week you say yes. Paperwork weather clears faster when you face it early.</p>
{RELATED_BOOK}
{CTA}
""",
        "How long before travel to send Libya tour documents: six to eight week comfort zone, eVisa timing, and event date pressure.",
        "How long before travel should guests send documents for a Libya tour? Timeline for scans, deposit, eVisa, and flights.",
    ),
    (
        "what-guests-ask-most-before-paying-a-libya-tour-deposit",
        f"""
<p><strong>What guests ask most before paying a Libya tour deposit</strong> repeats across nationalities: Is it safe? What does the deposit start? What is included? Can we travel privately? What if the visa fails? Honest answers matter more than glossy photos when you are about to fund sponsorship work.</p>

<p>IntoLibya answers inside quotes and TourBuilder flows, not vague promises.</p>

<h2>Safety and the tour frame</h2>

<p>Licensed operators plan permitted routes, use vetted drivers, and coordinate tourist police when required. Conditions change. Good teams rewrite days instead of forcing bad roads. Read <a href="/en/is-it-safe-to-travel-to-libya-right-now">current safety context</a> yet trust on ground judgment during the week.</p>

<h2>What the deposit actually triggers</h2>

<p>It is not a random hold. It starts sponsor document preparation tied to your confirmed itinerary. Without that step, ordinary tourist eVisa paths stall. Deposits also lock dates with guides and vehicles in busy seasons.</p>

<h2>Inclusions and style differences</h2>

<p>Ask whether sponsorship, guiding, transport, hotels or camps, meals, entrance patterns, and government eVisa fees sit inside your package line. Lean versus all inclusive quotes look similar on day count yet feel different on the ground.</p>

<h2>Private groups and mixed ages</h2>

<p>Couples, families, and friend teams travel privately all the time. You need not join strangers. Pace adjusts when grandparents or teens share the same van.</p>

<h2>Visa fear</h2>

<p>Approvals usually arrive with clean files. Delays happen. Flexible flights and early starts reduce pain. We guide portal steps; government decisions stay government decisions.</p>

<h2>Cancellation and change language</h2>

<p>Read change terms before deposit. Event weeks often carry stricter windows. Ask in writing through the booking thread so expectations match.</p>

<h2>Ready to commit</h2>

<p>When answers feel boringly clear, pay the deposit, send scans, and open the eVisa step. Clarity is the product.</p>
{RELATED_GUEST}
{CTA}
""",
        "What guests ask before paying a Libya tour deposit: safety, inclusions, sponsorship, private travel, visas, and cancellation clarity.",
        "What guests ask most before paying a Libya tour deposit: safety, visa timing, inclusions, and what the deposit starts.",
    ),
    (
        "what-intolibya-tripadvisor-guests-mention-most",
        f"""
<p><strong>What IntoLibya TripAdvisor guests mention most</strong> clusters around a few themes: emptiness at major ruins, calm logistics despite paperwork, guide quality, and the feeling that Libya still rewards curiosity. Reviews are individual voices, yet patterns repeat enough to help new guests set expectations.</p>

<p>TripAdvisor is one mirror. Your week still depends on season, route, group pace, and weather. Use reviews for tone, not as a contract.</p>

<h2>Space at sites that elsewhere feel crowded</h2>

<p>Guests often compare <a href="/en/destination/leptis-magna">Leptis Magna</a> and <a href="/en/destination/sabratha">Sabratha</a> with busier Mediterranean ruins. Quiet mornings come up again and again. Licensed access and driving time filter casual crowds.</p>

<h2>Guides who translate context, not just dates</h2>

<p>Names differ by trip, yet praise for patient storytelling and checkpoint calm is common. Good guiding turns mandatory structure into discovery rather than supervision anxiety.</p>

<h2>Logistics that feel handled</h2>

<p>Airport pickups, hotel keys, camp nights, and visa stress relief appear frequently. Sponsorship sounds abstract until you are standing inside a theatre with no desk drama behind you.</p>

<h2>Desert and oasis surprises</h2>

<p><a href="/en/destination/ghadames">Ghadames</a> old town walks, lake swims, and cold star nights show up in longer itineraries. Guests mention packing layers more than luxury trim.</p>

<h2>Honest limits guests also note</h2>

<p>Checkpoints, photography rules, modest dress, and no freelance wandering. Structure is the trade for access. Reviews rarely pretend Libya is Tunisia with fewer hotels.</p>

<h2>How to use reviews while booking</h2>

<p>Read recent notes, then tell TourBuilder your must sees and fears. IntoLibya shapes routes inside the same licensed frame successful guests describe.</p>
{RELATED_GUEST}
{CTA}
""",
        "What IntoLibya TripAdvisor guests mention most: quiet ruins, guide quality, handled logistics, and honest structure tradeoffs.",
        "What IntoLibya TripAdvisor guests mention most: Leptis quiet, guides, logistics, Ghadames, and realistic Libya expectations.",
    ),
    (
        "how-to-describe-your-dream-libya-trip-in-one-message",
        f"""
<p><strong>How to describe your dream Libya trip in one message?</strong> Think brief, not novel. IntoLibya coordinators need dates, length, group size, passport countries, must see sites, and hard limits. One clear paragraph in TourBuilder beats ten inspirational links without a calendar.</p>

<p>Dream language is welcome. Structure turns dreams into quotes.</p>

<h2>Line one: when and how long</h2>

<p>Example: Two adults, UK passports, ten days in March, flexible plus or minus two days. Fixed event weeks should name the event first.</p>

<h2>Line two: must sees and maybes</h2>

<p>Example: Must Leptis and Ghadames. Maybe one Sahara camp night if season fits. No east this time. That honesty saves rework.</p>

<h2>Line three: pace and people</h2>

<p>Example: Moderate walking, one slow day per three active days, vegetarian meals, no cold camp for my parent. Mobility notes belong here, not after deposit.</p>

<h2>Line four: style and budget band</h2>

<p>Example: Prefer all inclusive simplicity. Mid range lodging fine. Or: Lean quote with meals open. We do not need exact currency figures to start, yet bracket helps.</p>

<h2>What to skip in message one</h2>

<p>Do not ask us to compare unrelated countries. Do not paste competitor itineraries. Do not assume secret independent days. Keep Libya inside the licensed frame.</p>

<h2>TourBuilder beats blank email anxiety</h2>

<p>Browse packages, add activities, then attach your paragraph in the booking flow. Catalog titles keep durations honest.</p>

<h2>After you send</h2>

<p>Expect human follow up questions. Answer quickly. The brief is the first draft of your real week.</p>
{RELATED_BOOK}
{CTA}
""",
        "How to describe your dream Libya trip in one message: dates, must sees, pace, diet, and style notes for TourBuilder quotes.",
        "How to describe your dream Libya trip in one clear brief: dates, must sees, pace limits, and TourBuilder next steps.",
    ),
    (
        "where-to-go-map-ideas-before-you-open-tourbuilder",
        f"""
<p><strong>Where to go map ideas before TourBuilder</strong> helps you arrive with curiosity sorted into regions, not paralysis. Libya splits cleanly in the traveler imagination: Tripolitania coast, Jebel Nafusa highlands, Fezzan Sahara, and Cyrenaica east. You will not taste all four in one short week. Pick a chapter.</p>

<p>Use this map sketch, then let TourBuilder turn names into licensed days.</p>

<h2>Western coast Roman belt</h2>

<p><a href="/en/destination/tripoli">Tripoli</a>, <a href="/en/destination/leptis-magna">Leptis Magna</a>, <a href="/en/destination/sabratha">Sabratha</a>. Best first timer proof. Mild logistics. UNESCO scale without desert camp pressure.</p>

<h2>Oasis and highland west</h2>

<p><a href="/en/destination/ghadames">Ghadames</a>, Nafusa towns, optional <a href="/en/destination/germa">Germa</a> or Ubari lakes when season and days allow. Needs more driving and camp honesty.</p>

<h2>Deep Sahara art and dunes</h2>

<p><a href="/en/destination/acacus-mountains">Acacus Mountains</a>, <a href="/en/destination/ghat">Ghat</a>, Wadi Mathendous contexts. Expedition flavor. Winter and shoulder seasons win.</p>

<h2>Eastern Greek and green mountain arc</h2>

<p><a href="/en/destination/shahat">Shahat</a>, Susa, Jebel Akhdar towns, Benghazi region planning for eclipse guests. Deserves dedicated time, not a coast afterthought.</p>

<h2>Match map to month</h2>

<p>Summer coast still works with heat plans. Deep south punishes midsummer afternoons. December desert nights need layers. Eclipse dates lock east maps regardless of preference.</p>

<h2>How many pins is enough</h2>

<p>Three must sees and two nice if time pins beat twenty flags. Operators trim sensibly when you open TourBuilder with honest leave dates.</p>
{RELATED_ROUTE}
{CTA}
""",
        "Map ideas before TourBuilder: western Roman coast, Ghadames, Sahara south, and east Cyrenaica with season notes.",
        "Where to go map ideas before you open TourBuilder: Libya regions, first timer coast, Sahara depth, and east Cyrenaica.",
    ),
    (
        "how-fixed-event-dates-change-your-libya-booking-timeline",
        f"""
<p><strong>Fixed event dates change your Libya booking timeline</strong> because rallies, festivals, December desert departures, and eclipse totality refuse to slide for your late passport scan. Flexible coast weeks can shift a day. Event weeks cannot.</p>

<p>IntoLibya lists event shaped products in TourBuilder so you lock the real calendar first, then build buffers around it.</p>

<h2>Why events compress lead time</h2>

<p>Vehicle pools, guides, camps, and sponsor batches fill early. Flights cluster around the same hubs. Waiting until six weeks before a rally or eclipse is gambling, not planning.</p>

<h2>Buffers are part of the product</h2>

<p>Weather, sandstorms, flight delays, and visa fixes need spare days around totality or festival gates. Skimping buffers to save leave often wastes the event itself.</p>

<h2>Deposit timing gets stricter</h2>

<p>Event quotes often require earlier deposits to hold seats. Cancellation windows may tighten. Read terms before you assume flexible leisure rules.</p>

<h2>Pack and pace differently</h2>

<p>Festival weeks feel social and busy. Eclipse mornings demand sleep discipline and cold layers. Rally days mean dust and noise tolerance. Same country, different rhythm.</p>

<h2>Combining events with classics</h2>

<p>Some guests add <a href="/en/destination/shahat">Shahat</a> or coast ruins around an east eclipse trip. Others pair Ghat culture days with Acacus camps. Ask early so driving math is honest.</p>

<h2>Start from the event listing</h2>

<p>Pick the event package shape in TourBuilder, note buffer days, send documents immediately, then buy flights only when visa logic aligns with the fixed window.</p>
{RELATED_EVENT}
{CTA}
""",
        "How fixed event dates change Libya booking timelines: rallies, festivals, desert weeks, eclipses, buffers, and earlier deposits.",
        "How fixed event dates change your Libya booking timeline: rallies, festivals, eclipses, buffers, and deposit timing.",
    ),
    (
        "coast-first-or-desert-first-how-guests-decide",
        f"""
<p><strong>Coast first or desert first?</strong> Most first timers choose coast first because Roman proof arrives with gentler logistics. Desert first suits repeat guests, photographers chasing empty dunes, or travelers with strong camp tolerance and longer leave.</p>

<p>IntoLibya can build either order inside licensed routes. The right choice depends on season, fitness, and how much driving you enjoy before breakfast.</p>

<h2>Why coast first wins newcomers</h2>

<p><a href="/en/destination/leptis-magna">Leptis Magna</a> and <a href="/en/destination/sabratha">Sabratha</a> deliver emotional payoff near Mitiga. Hotels beat tents for jet lag. You learn guide rhythm before remote roads.</p>

<h2>When desert first makes sense</h2>

<p>You already saw the coast. Your trip is winter shoulder with crisp camp nights. Your brief is Acacus art or Ubari lakes, not medina shopping. You accept long drives early in the week.</p>

<h2>Season changes the answer</h2>

<p>Midsummer pushes sensible plans toward coast mornings and air conditioning. Autumn through spring opens Sahara chapters without heroic suffering. December desert events assume cold night gear regardless of order.</p>

<h2>Pacing and age</h2>

<p>Mixed age families often prefer coast buffering before camps. Adventure athletes may want dunes while legs are fresh. Say which group you are in TourBuilder.</p>

<h2>Hybrid weeks without heroics</h2>

<p>Many seven day western routes do coast midweek and one or two desert nights without pretending to cross the entire Sahara. Quality beats sequence machismo.</p>

<h2>Decide, then book</h2>

<p>Name coast first or desert first in your brief. Operators align hotels, camps, and flight arrival days accordingly.</p>
{RELATED_ROUTE}
{CTA}
""",
        "Coast first or desert first in Libya: how first timers, seasons, fitness, and camp tolerance shape route order.",
        "Coast first or desert first how guests decide: Leptis coast proof versus Sahara first for repeat travelers.",
    ),
    (
        "east-libya-or-west-libya-how-to-choose-your-first-region",
        f"""
<p><strong>East Libya or west Libya for your first region?</strong> West wins for most first trips because Mitiga access, Leptis class ruins, Sabratha theatre, and Ghadames oasis fit one coherent week. East wins when Greek Cyrenaica, green mountain air, or eclipse totality is the reason you fly.</p>

<p>IntoLibya plans both when access supports them. One short vacation rarely covers both well.</p>

<h2>Western Libya strengths</h2>

<p>Roman Tripolitania, medina context in <a href="/en/destination/tripoli">Tripoli</a>, optional Fezzan push toward lakes or dunes. Mature tourist routes with predictable logistics for newcomers.</p>

<h2>Eastern Libya strengths</h2>

<p><a href="/en/destination/shahat">Shahat</a>, Susa, Apollonia harbor moods, Jebel Akhdar towns, World War heritage near Tobruk when routes allow. Eclipse paths anchor here in 2027.</p>

<h2>Time and flight reality</h2>

<p>Crossing the country mid trip costs days. Domestic links and security patterns shift. Treat east and west as separate trip ideas unless you carry two weeks plus buffer.</p>

<h2>Personality match</h2>

<p>West suits Roman Africa lovers and oasis first timers. East suits Greek archaeology fans, highland walkers, and event travelers who accept narrower season windows.</p>

<h2>Combining later, not now</h2>

<p>Many guests do west first, east second after they trust the licensed frame. Reverse works if Cyrene is your lifelong dream.</p>

<h2>Tell TourBuilder your anchor</h2>

<p>Pick one region for this leave window. Operators build depth instead of checklist fatigue.</p>
{RELATED_ROUTE}
{CTA}
""",
        "East Libya or west Libya for first trips: Roman west versus Cyrenaica east, time math, and eclipse anchors.",
        "East Libya or west Libya how to choose your first region: west coast classics versus Cyrenaica and eclipse east.",
    ),
    (
        "can-families-book-libya-tours-with-mixed-ages",
        f"""
<p><strong>Yes.</strong> Families book Libya tours with mixed ages regularly. Grandparents, teens, and toddlers share vans when pacing is honest. IntoLibya adjusts walking blocks, meal timing, camp choices, and hotel nights in TourBuilder so nobody treats day four like a marathon.</p>

<p>Libya is not a theme park. It is guided culture and ruins with real heat and checkpoints. Families succeed when expectations match that truth.</p>

<h2>What mixed age pacing looks like</h2>

<p>Shorter ruin mornings, afternoon rest or pool time, earlier dinners, and fewer consecutive camp nights. One Sahara night may delight teens yet exhaust grandparents. Say who needs which.</p>

<h2>Coast first still helps families</h2>

<p><a href="/en/destination/leptis-magna">Leptis Magna</a> wows every age when heat is managed. <a href="/en/destination/ghadames">Ghadames</a> feels like a living maze kids remember. Deep desert can wait for a second trip.</p>

<h2>Rooms and beds</h2>

<p>Request adjoining rooms, triples, or ground floor access in your brief. Sponsorship batches need every passport, including infants.</p>

<h2>Language and safety comfort</h2>

<p>English speaking guides help multigenerational groups. Tourist police patterns feel less scary when explained calmly to teens beforehand.</p>

<h2>When to skip a week</h2>

<p>Non walking toddlers and very frail elders may be happier waiting until mobility matches uneven ruin stones. Honesty beats heroic booking.</p>

<h2>Build the family week</h2>

<p>Open TourBuilder, name ages and stamina, pick coast heavy days, optional one camp, and request a quote with rest built in.</p>
{RELATED_GUEST}
{CTA}
""",
        "Yes, families with mixed ages book Libya tours: pacing, coast first routes, rooms, passports, and honest camp limits.",
        "Can families book Libya tours with mixed ages? Yes, with paced routes, coast classics, and clear mobility notes in TourBuilder.",
    ),
    (
        "how-custom-quotes-differ-from-fixed-libya-packages",
        f"""
<p><strong>How custom quotes differ from fixed Libya packages</strong> comes down to flexibility versus speed. Fixed packages in TourBuilder ship with named day counts, standard routes, and event dates already aligned. Custom quotes rearrange nights, add buffer days, swap camp for hotel, or chase special interests inside the same licensed frame.</p>

<p>Both require sponsorship, guides, and honest inclusions. Neither means independent travel.</p>

<h2>What fixed packages give you</h2>

<p>Faster decisions, published shapes, clear event calendars, and pricing logic tied to catalog bones. Great when your leave matches a listed week and your must sees align with a western sampler or Double Shafra style product.</p>

<h2>What custom quotes add</h2>

<p>Private pacing, extra Tripoli nights, second Leptis morning, dietary driven meal plans, photography light timing, or mixed age rest days. Operators rebuild driving math and hotel chains manually.</p>

<h2>Price and lead time differences</h2>

<p>Custom work needs human review. Quotes arrive after questions, not instantly. Totals shift with camp choices, group size, and season. Compare inclusions, not headline day counts alone.</p>

<h2>Lean versus all inclusive in both styles</h2>

<p>Either package or custom can be lean or all inclusive. Ask where eVisa fees, meals, entrances, and camp gear sit.</p>

<h2>When to start fixed then extend</h2>

<p>Many guests anchor on a package, then add nights in TourBuilder once the spine feels right. See our note on extra days after fixed packages.</p>

<h2>Pick your path</h2>

<p>Browse packages if speed helps. Switch to custom notes when your brief diverges. IntoLibya keeps one licensed plan either way.</p>
{RELATED_BOOK}
{CTA}
""",
        "How custom Libya tour quotes differ from fixed packages: flexibility, review time, inclusions, and when to extend a package spine.",
        "How custom quotes differ from fixed Libya packages: TourBuilder speed versus tailored pacing and inclusions.",
    ),
    (
        "airport-pickup-and-dropoff-on-guided-libya-trips",
        f"""
<p><strong>Airport pickup and dropoff on guided Libya trips</strong> are standard parts of licensed quotes, not optional extras you negotiate at the curb. IntoLibya aligns drivers with your flight details so day one starts with a name sign and a clear transfer, not a taxi guess in Arabic.</p>

<p>Share final flight numbers through TourBuilder once tickets are firm.</p>

<h2>Arrival at Mitiga or Benghazi</h2>

<p>Western weeks usually land at Mitiga serving <a href="/en/destination/tripoli">Tripoli</a>. East or eclipse routes may use Benghazi when itineraries support them. Your quote assumes the correct airport for the route you booked.</p>

<h2>What pickup includes</h2>

<p>Meet after immigration, help with bags, transfer to hotel or briefing point. Some arrivals jump straight into soft orientation. Red eye flights may go hotel first by design.</p>

<h2>Departure day timing</h2>

<p>Checkout, drive time, and checkpoint buffers matter. Operators schedule pickup from hotel to airport with margin. Tell us if you need early checkout for morning flights.</p>

<h2>When plans change</h2>

<p>Delayed flights happen. Keep coordinator contact handy. Licensed teams adjust when possible without abandoning guests.</p>

<h2>What pickup is not</h2>

<p>Independent rides without sponsor linkage. Random family pickups outside the plan. Extra city errands on arrival day unless pre agreed.</p>

<h2>International hubs remain yours</h2>

<p>Tunis or Istanbul connections are your booking. Ground pickup starts inside Libya on the licensed segment.</p>

<h2>Confirm in your quote</h2>

<p>Read arrival and departure transfers in inclusions before deposit. Then send tickets early.</p>
{RELATED_BOOK}
{CTA}
""",
        "Airport pickup and dropoff on guided Libya trips: Mitiga and Benghazi transfers, flight details, and departure buffers.",
        "Airport pickup and dropoff on guided Libya trips: Mitiga meetups, Benghazi east entry, and flight sharing in TourBuilder.",
    ),
    (
        "what-language-support-guests-get-on-libya-tours",
        f"""
<p><strong>What language support guests get on Libya tours</strong> depends on guide assignment and group needs. IntoLibya serves international travelers with English speaking guides on standard tourist routes. Arabic remains the national language on signs, checkpoints, and many menus. Your guide bridges gaps you cannot Google mid checkpoint.</p>

<p>Request language needs in TourBuilder when quoting so staffing is confirmed before deposit, not hoped for on landing day.</p>

<h2>English on coast and desert routes</h2>

<p>Western circuits to <a href="/en/destination/leptis-magna">Leptis Magna</a>, <a href="/en/destination/ghadames">Ghadames</a>, and common Sahara products use guides comfortable explaining history, logistics, and meal context in English.</p>

<h2>Other languages</h2>

<p>French or Italian support may be possible on some dates with advance notice. Rare languages need longer lead time. Do not assume multilingual staff without confirmation in writing.</p>

<h2>What guides translate beyond ruins</h2>

<p>Checkpoint interactions, hotel check in, camp rules, photography restrictions, and modest dress reminders. That invisible work keeps days smooth.</p>

<h2>What guests should still carry</h2>

<p>Offline phrase politeness helps. Translation apps struggle with dialect and poor signal. Respect beats perfect grammar.</p>

<h2>Family groups</h2>

<p>Kids and grandparents benefit when one guide speaks clearly and slowly. Note that preference early.</p>

<h2>Confirm before you fly</h2>

<p>Language support belongs in your quote inclusions thread. Ask once, get it on record, then enjoy sites instead of worrying about words.</p>
{RELATED_GUEST}
{CTA}
""",
        "Language support on Libya tours: English guides, other languages on request, and what guides translate beyond archaeology.",
        "What language support guests get on Libya tours: English guiding, advance requests, and checkpoint help.",
    ),
    (
        "dietary-needs-how-to-tell-us-before-a-libya-tour",
        f"""
<p><strong>Dietary needs on a Libya tour</strong> work best when you flag them in TourBuilder before deposits, not at the first group lunch. Libyan hospitality is generous. Remote camps and small town restaurants need advance notice to prepare alternatives without panic.</p>

<p>IntoLibya passes clear notes to guides and kitchens. Specific beats polite vagueness.</p>

<h2>What to write in your brief</h2>

<p>Vegetarian, vegan, no pork, gluten avoidance, allergies with severity, kid friendly plain foods, or medical diets. Say whether cross contact is dangerous or merely unpleasant.</p>

<h2>Realistic expectations on route</h2>

<p>Coastal cities offer more variety. Desert camps rely on planned menus. Bread, rice, lentils, grilled vegetables, and lamb dishes dominate many tables. Vegan strictness needs honest camp planning.</p>

<h2>All inclusive versus lean quotes</h2>

<p>Meal inclusion levels change who shops for fixes. Ask which meals the operator owns before you assume every dinner is controlled.</p>

<h2>Medications and store stops</h2>

<p>Bring backup snacks if you are picky. Pharmacies exist in cities yet not beside every dune. Snack packing is self care, not insult.</p>

<h2>Religious and cultural respect</h2>

<p>Ramadan timing shifts lunch rhythm. Modest behavior at meals matters. Guides explain local custom without shaming questions.</p>

<h2>Update us if things change</h2>

<p>New allergy between quote and travel? Message immediately so camp orders adjust.</p>

<h2>Book with clarity</h2>

<p>Diet fields in TourBuilder exist for a reason. Use them.</p>
{RELATED_GUEST}
{CTA}
""",
        "How to tell IntoLibya your dietary needs before a Libya tour: allergies, vegetarian travel, camp menus, and meal inclusions.",
        "Dietary needs how to tell us before a Libya tour: vegan, vegetarian, allergies, and realistic camp expectations.",
    ),
    (
        "fitness-level-what-libya-tours-expect-from-guests",
        f"""
<p><strong>What fitness level Libya tours expect</strong> varies by route more than by mystery athletic tests. Coastal ruin weeks need moderate walking on uneven stone. Sahara products add sandy climbs, long van hours, and cold camp mornings. Nobody needs elite marathon form. Honesty about knees, heat, and stair tolerance matters more than gym selfies.</p>

<p>Tell TourBuilder the truth so days are paced correctly before deposits.</p>

<h2>Coast and city days</h2>

<p>Expect one to three hours total walking split across a site with breaks. Leptis Magna covers large ground. Sabratha uses theatre stairs. Tripoli medina lanes are flat yet crowded.</p>

<h2>Highland and east routes</h2>

<p>Jebel Akhdar viewpoints and Cyrenaica sites add slope and wind. Eclipse trips may include odd hours and standing waits.</p>

<h2>Desert fitness reality</h2>

<p>Dune walks, camp setup help, and bumpy roads fatigue guests who only trained for gym treadmills. Core stability and flexible ankles help more than sprint speed.</p>

<h2>Heat and age</h2>

<p>Summer coast still punishes midday sun. Elders and teens need shade plans. Operators can start early when you flag limits.</p>

<h2>Wheelchair and mobility limits</h2>

<p>Many ruins are not wheelchair friendly. Some hotel rooms offer ground floor access. Be explicit. We adjust expectations rather than promise impossible paths.</p>

<h2>Match package to body</h2>

<p>Choose coast heavy or camp light itineraries if fitness is modest. Adventure athletes can request longer desert legs separately.</p>
{RELATED_GUEST}
{CTA}
""",
        "Fitness level for Libya tours: walking on ruins, desert camps, heat, mobility limits, and honest pacing in TourBuilder.",
        "Fitness level what Libya tours expect from guests: coast walking, desert days, heat, and mobility honesty.",
    ),
    (
        "how-weather-windows-shape-where-you-should-go",
        f"""
<p><strong>How weather windows shape where you should go in Libya</strong> is the difference between a glorious ruin morning and a sandblasted regret. Coast, highlands, and Sahara obey different calendars. Match region to month before you worship a map pin.</p>

<p>IntoLibya adjusts routes when conditions demand. Starting with honest season choice beats forcing a desert camp because it photographed well on social media in winter.</p>

<h2>Autumn and spring sweet spots</h2>

<p>October through April suits most mixed coast and desert plans. Days stay workable. Sahara nights need layers yet remain camp friendly.</p>

<h2>Summer coast versus summer south</h2>

<p>Tripolitania ruins remain possible with early starts and midday rest. Deep Fezzan drives in July test even enthusiastic guests. Consider coast only short weeks in peak heat.</p>

<h2>Winter coast appeal</h2>

<p>Mediterranean mild days attract Europeans fleeing cold. Ghadames and Leptis feel crisp. Camp nights require real jackets.</p>

<h2>East highlands and eclipse timing</h2>

<p>August 2027 totality carries heat and cloud tradeoffs with its own planning articles. Green mountain spring greenness rewards April May style travel when access allows.</p>

<h2>Wind and sand realism</h2>

<p>Storms shift desert plans. Good operators swap days rather than marching into visibility zero. Buffer days on event trips help.</p>

<h2>Build weather into TourBuilder</h2>

<p>Enter travel month first. Let suggested regions follow climate logic, not fantasy.</p>
{RELATED_ROUTE}
{CTA}
""",
        "How weather windows shape where to go in Libya: coast seasons, Sahara camps, summer limits, and eclipse timing.",
        "How weather windows shape where you should go in Libya: autumn spring sweet spots, summer south limits, winter camps.",
    ),
    (
        "insurance-proof-and-emergency-contacts-guests-prepare",
        f"""
<p><strong>Insurance proof and emergency contacts</strong> belong on your pre travel checklist alongside passport scans. IntoLibya may ask for travel insurance details and home country emergency names so coordinators can act if flights delay or health issues surface on route.</p>

<p>This is practical care, not suspicion of guests.</p>

<h2>Travel insurance expectations</h2>

<p>Buy coverage that includes medical evacuation and trip interruption appropriate to remote travel. Send policy number and hotline through TourBuilder when requested. Keep a copy offline on your phone.</p>

<h2>Emergency contacts at home</h2>

<p>Name one reachable person who knows your itinerary dates. Share IntoLibya coordinator contact with them too. Time zones differ. Clarity helps families sleep.</p>

<h2>Medical notes that matter</h2>

<p>Serious allergies, heart conditions, mobility devices, or medications guides should know about belong in your brief. Guides are not doctors yet they choose rest stops and driving pace with context.</p>

<h2>What operators do with the data</h2>

<p>Store securely for the trip window. Use when plans change or hospitals appear in conversation. Not for marketing lists.</p>

<h2>Embassy awareness</h2>

<p>Know your embassy registration habits for your nationality. Sponsored tourism still carries personal responsibility layers.</p>

<h2>Before you fly</h2>

<p>Insurance card photo, contact sheet, medication carry on, and shared flight details complete the adult part of adventure travel.</p>
{RELATED_GUEST}
{CTA}
""",
        "Insurance proof and emergency contacts for Libya tours: medical cover, home contacts, health notes, and pre flight checklist.",
        "Insurance proof and emergency contacts guests prepare for a Libya tour: coverage, contacts, and medical notes.",
    ),
    (
        "how-cancellation-talks-work-before-you-travel",
        f"""
<p><strong>How cancellation talks work before you travel</strong> should happen while quotes are fresh, not after visa money is spent. IntoLibya sets change and cancel terms in writing per quote because sponsorship work, held guides, and event slots have real costs.</p>

<p>Read terms before deposit. Ask questions until language feels boring.</p>

<h2>What deposits commit to</h2>

<p>Deposits start sponsor document preparation and lock operational dates. Refundability depends on how far travel is and whether event products apply. Leisure coast weeks differ from eclipse departures.</p>

<h2>Date change requests</h2>

<p>Many guests shift weeks before visa finality with operator approval. Late changes near event dates may be impossible. Start dialogue early if work schedules wobble.</p>

<h2>Visa denial scenarios</h2>

<p>Ask how your quote treats government refusal with documented proof. Policies vary by timing and costs already incurred. No operator controls embassy decisions.</p>

<h2>Force majeure and security shifts</h2>

<p>Licensed operators may reroute or postpone when access changes. Contracts explain how credits or refunds work in extreme cases.</p>

<h2>Travel insurance role</h2>

<p>Some interruptions belong to your insurer after operator terms exhaust. Buy coverage that matches remote travel reality.</p>

<h2>How to talk with us</h2>

<p>Use the booking thread tied to your TourBuilder quote. Put questions in writing. Keep confirmations saved.</p>

<h2>Peace of mind practice</h2>

<p>Understanding cancel language early lets you commit to <a href="/en/destination/ghadames">Ghadames</a> or Leptis days with open eyes.</p>
{RELATED_BOOK}
{CTA}
""",
        "How cancellation talks work before a Libya tour: deposit terms, date changes, visa denial, events, and written quote language.",
        "How cancellation talks work before you travel on a Libya tour: deposits, changes, visa issues, and event rules.",
    ),
    (
        "how-group-size-affects-a-libya-tour-day",
        f"""
<p><strong>How group size affects a Libya tour day</strong> shows up in van space, camp tent choices, meal tables, checkpoint paperwork, and how much silence you find at ruins. IntoLibya runs private couples up to small friend groups regularly. You need not join strangers unless you pick a shared product on purpose.</p>

<p>Name exact headcount in TourBuilder early. Sponsorship files list every traveler.</p>

<h2>Two to six guests</h2>

<p>Most common private shape. One or two vehicles, flexible stops for photos, easier restaurant seating, simpler rooming lists.</p>

<h2>Larger families or incentive groups</h2>

<p>Need multiple vehicles, staggered ruin entries, and camp capacity checks. Still workable with longer lead time. Do not surprise operators with extra cousins two weeks out.</p>

<h2>Solo travelers</h2>

<p>Solo private tours exist yet cost more per person because vehicles and guides are shared by one paying guest. Some join small scheduled groups when available.</p>

<h2>Camp and hotel logistics</h2>

<p>Desert camps assign tents by party splits you request. Hotels need correct bed configurations. Group size drives both.</p>

<h2>Pace differences</h2>

<p>Bigger groups move slower at breakfast and bathrooms. Build buffer minutes into days honestly.</p>

<h2>Book the real number</h2>

<p>Infants, teens, and late additions count for visas and seats. Quote accuracy prevents day one friction.</p>
{RELATED_GUEST}
{CTA}
""",
        "How group size affects a Libya tour day: vehicles, camps, rooms, pacing, and quoting accurate headcount in TourBuilder.",
        "How group size affects a Libya tour day: private parties, family counts, camps, and sponsorship lists.",
    ),
    (
        "can-you-add-extra-days-after-a-fixed-libya-package",
        f"""
<p><strong>Yes.</strong> You can add extra days after choosing a fixed Libya package. The package is a starting spine, not a locked cage. IntoLibya extends licensed routes with buffer nights in <a href="/en/destination/tripoli">Tripoli</a>, second ruin mornings, Ghadames additions, or Sahara chapters when season and access allow.</p>

<p>Build the base in TourBuilder, then customize before deposit so sponsorship covers the full calendar.</p>

<h2>Common extensions guests request</h2>

<p>Extra Tripoli medina day, repeat Leptis at golden hour, slow Ghadames craft shopping, one more camp night, or rest after a long flight. Each adds driving and lodging math.</p>

<h2>When extensions fail</h2>

<p>Visa leave limits, event fixed departures, or midsummer desert ambition beyond sensible heat plans. Operators say no to protect you.</p>

<h2>Fixed event packages differ</h2>

<p>Rally or eclipse products may allow pre or post buffers only within strict windows. Ask before assuming open ended extension.</p>

<h2>Quote as one licensed plan</h2>

<p>Do not book a package then freelance extra days independently. Sponsorship ties to the full itinerary list.</p>

<h2>How to request</h2>

<p>Select package, add days in TourBuilder, note must sees, request revised quote. One deposit covers the merged plan when accepted.</p>
{RELATED_BOOK}
{CTA}
""",
        "Yes, you can add extra days after a fixed Libya package: Tripoli buffers, extra ruin time, Ghadames, and one licensed quote.",
        "Can you add extra days after a fixed Libya package? Yes, extend in TourBuilder before deposit on one licensed plan.",
    ),
    (
        "event-travel-versus-flexible-tourbuilder-libya-trips",
        f"""
<p><strong>Event travel versus flexible TourBuilder Libya trips</strong> is a calendar personality test. Flexible coast weeks slide a day when flights wobble. Event trips lock to rally start lines, festival gates, eclipse totality, or December desert departures that will not wait for your late visa.</p>

<p>IntoLibya lists both modes. Pick the one that matches your leave reality.</p>

<h2>Flexible custom or package weeks</h2>

<p>Best when you have date range freedom, want classical coast depth, or mix Ghadames with optional camp nights without hard external clocks.</p>

<h2>Event anchored products</h2>

<p>Best when the event is the reason you fly. Double Shafra style desert weeks, Ghat festival culture, rally Te Te Waddan energy, or 2027 eclipse paths. Deposits and buffers tighten.</p>

<h2>Hybrid ambitions</h2>

<p>Some guests bolt Cyrenaica ruins onto eclipse travel or add Acacus after Ghat festival nights. Driving math must be honest. Ask early in TourBuilder.</p>

<h2>Pricing and availability honesty</h2>

<p>Live totals and seat counts stay in TourBuilder rather than invented on blog pages. Event weeks cost more operational effort per seat.</p>

<h2>Which should you choose</h2>

<p>If Instagram sold you Libya through a dated poster, choose event mode. If you simply want Leptis quiet, choose flexible western week mode.</p>

<h2>Next step</h2>

<p>Filter TourBuilder by event listings or open custom dates. Send documents fast when the calendar is fixed.</p>
{RELATED_EVENT}
{CTA}
""",
        "Event travel versus flexible TourBuilder Libya trips: fixed rally, festival, eclipse dates versus movable coast weeks.",
        "Event travel versus flexible TourBuilder Libya trips: when to lock event dates or choose movable custom weeks.",
    ),
]


def main() -> int:
    posts_dir = Path(__file__).resolve().parents[1] / "src/content/posts/en"
    counts: list[tuple[str, int]] = []
    link_errors: list[str] = []

    for slug, body, excerpt, seo_desc in POSTS:
        missing = verify_links(body, posts_dir)
        if missing:
            link_errors.extend(f"{slug}: {m}" for m in missing)
        update_post(slug, body.strip(), excerpt, seo_desc)
        counts.append((slug, wc(body)))

    print("\nWord counts:")
    min_slug, min_wc = min(counts, key=lambda x: x[1])
    for slug, n in counts:
        flag = " LOW" if n < 500 else ""
        print(f"  {n:4d}{flag}  {slug}")
    print(f"\nMin: {min_wc} ({min_slug})")

    if link_errors:
        print("\nMissing links:")
        for e in link_errors:
            print(f"  {e}")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
