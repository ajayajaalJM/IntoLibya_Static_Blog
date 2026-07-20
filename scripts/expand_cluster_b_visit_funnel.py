#!/usr/bin/env python3
"""Append unique expansion blocks to Cluster B posts below 500 words."""
from __future__ import annotations

import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from scripts.lib.update_post import update_post

POSTS_DIR = Path(__file__).resolve().parents[1] / "src/content/posts/en"

EXPANSIONS: dict[str, str] = {
    "what-do-you-need-from-me-to-start-a-libya-tour-booking": """
<h2>Payment rhythm and quote follow up</h2>
<p>Quotes usually arrive after a human review of your TourBuilder draft, not as instant checkout fiction. Expect questions about mobility, rooming, or flight hubs. Answer quickly so sponsorship batches stay on calendar. Deposit schedules and final balance dates appear in writing. Read them before you compare two similar looking plans from different months.</p>
<p>If your leave shifts, say so early. Small date moves are often easier before sponsor files exist than after eVisa uploads reference fixed entry days.</p>
""",
    "libya-tour-booking-steps-from-first-email-to-arrival": """
<h2>After you submit in TourBuilder</h2>
<p>Expect conversation, not silence. Coordinators may ask for clarification on camping tolerance, photography goals, or whether you need a buffer night after a Tunis connection. Treat that back and forth as part of the product. The faster the plan firms, the faster sponsorship can start without rushed scans.</p>
<p>Keep one thread per trip so visa, hotel, and flight updates stay traceable. Scattered messages across channels slow everyone down.</p>
""",
    "passport-photos-and-forms-guests-usually-send-first": """
<h2>Photo specs that repeat portal rejections</h2>
<p>Plain background, face forward, no sunglasses, recent likeness. Crop to head and shoulders as the portal expects. File size limits matter on government sites. If a upload fails twice, rescan rather than guessing.</p>
<p>Dual nationals should declare the passport they will travel on. Mismatch between sponsor file and ticket passport is a classic fixable delay.</p>
""",
    "how-flights-work-when-a-tour-company-guides-your-libya-entry": """
<h2>Return flights and mid tour domestic legs</h2>
<p>Departure day needs the same clarity as arrival. Share outbound flight numbers when you book them so hotel checkout and airport transfer timing include checkpoint margin. Some long itineraries use internal flights or long drives between west and east. Your quote assumes the entry airport your route actually uses.</p>
<p>Missed connections in Tunis or Istanbul happen. Message your coordinator when airlines rebook you. Licensed teams adjust pickup when they can with honest notice.</p>
""",
    "who-arranges-hotels-on-a-guided-libya-tour": """
<h2>Rooming lists and special requests</h2>
<p>Send rooming pairs, triples, or singles with your document batch. Late rooming changes stress small hotels in oasis towns. Quiet room away from elevator, adjoining rooms for parents and teens, or extra night before a desert leg all belong in TourBuilder notes early.</p>
<p>Camp nights need sleeping bag expectations spelled out in inclusions. Some all inclusive styles provide gear. Lean styles may ask you to pack layers without assuming luxury glamping.</p>
""",
    "where-should-first-timers-go-in-libya-first": """
<h2>Sample first week shapes that work</h2>
<p>Four days can cover Tripoli plus one major coast site if paced gently. Seven days fit Leptis, Sabratha, and Ghadames with sane driving. Ten days open one Sahara night or a second coast morning without heroics. Longer calendars can push toward lakes or Acacus when season supports access.</p>
<p>Trying to paste east Cyrene into a one week west plan usually produces a transfer montage guests regret. Depth beats stamp collection on first visit.</p>
""",
    "what-happens-on-day-one-after-you-land-in-libya": """
<h2>Phones, cash, and practical arrival kit</h2>
<p>Local SIM or roaming choices vary by guest. Your guide often helps with practical shopping if you need water, snacks, or modest clothing adjustments after travel. Cash for small purchases still matters beside cards in some towns.</p>
<p>Photography rules begin at the airport and at checkpoints. Ask before you film security areas or uniformed staff. Modest dress in the medina starts day one even if the hotel pool felt European.</p>
""",
    "how-long-before-travel-should-guests-send-documents": """
<h2>Document checklist by week</h2>
<p>Eight weeks out: TourBuilder quote accepted, deposit initiated, passport scans sent. Six weeks: sponsor pack received, eVisa portal opened. Four weeks: approval downloaded, flights booked with sane change rules. Two weeks: final flight numbers, insurance proof, dietary and mobility notes confirmed. One week: printed visa copy in carry on, coordinator contact saved offline.</p>
<p>Skipping steps because a friend got lucky last year is not a strategy. Your nationality and season may differ.</p>
""",
    "what-guests-ask-most-before-paying-a-libya-tour-deposit": """
<h2>Money and transparency questions</h2>
<p>Guests ask what happens to deposit if they must postpone, whether final totals include all travelers, and how payment methods work from abroad. Answers belong in your quote PDF or booking thread, not in rumor. Ask for line items until you understand what you are buying.</p>
<p>Compare two quotes by inclusions, not by vibe. Identical day counts hide different camp standards or meal coverage.</p>
""",
    "what-intolibya-tripadvisor-guests-mention-most": """
<h2>What reviews cannot tell you</h2>
<p>Your weather week, guide assignment, and security routing may differ from a review written two seasons ago. Use praise patterns for tone, not as guarantees. Negative notes about structure often come from guests who wanted independent hostel freedom inside a country that still requires sponsorship.</p>
<p>If quiet ruins matter to you, say so in TourBuilder. Operators can prioritize slow mornings when the brief asks for them.</p>
""",
    "how-to-describe-your-dream-libya-trip-in-one-message": """
<h2>Example brief that gets a fast answer</h2>
<p>Two adults, German passports, nine days in November, flexible by one day. Must see Leptis and Ghadames. One camp night if nights are cold but manageable. Moderate walking, vegetarian lunches, prefer all inclusive quote. No east this trip. That paragraph alone moves faster than three pages of inspiration quotes.</p>
<p>Attach nothing confidential in public forms. Passport details come through secure steps after quote direction is clear.</p>
""",
    "where-to-go-map-ideas-before-you-open-tourbuilder": """
<h2>From pins to a realistic spine</h2>
<p>Draw a line on the map, then count driving hours honestly. Fezzan from Tripoli is not a casual afternoon. Cyrene from Mitiga is a different trip than Sabratha. Star your three non negotiable stops, circle two optional extras, and delete the rest until leave days increase.</p>
<p>TourBuilder packages encode sensible driving math. Custom days need the same discipline when you add pins freely.</p>
""",
    "how-fixed-event-dates-change-your-libya-booking-timeline": """
<h2>Flight shopping around immovable dates</h2>
<p>Event weeks cluster demand on the same Tunis to Mitiga or Benghazi links. Buy early once visa approval is likely, yet keep change options until sponsor files look solid. Hotels near rally towns or festival gates fill before classical coast weeks.</p>
<p>Tell coordinators if you must arrive a day early for jet lag. Pre event buffer nights are easier to hold at deposit than to beg for later.</p>
""",
    "coast-first-or-desert-first-how-guests-decide": """
<h2>Photography and light considerations</h2>
<p>Coast first gives golden hour options at Leptis after you recover from travel. Desert first puts dune color at sunrise before you are road tired from ruins. Photographers should say which matters in the brief so drivers plan stops.</p>
<p>Rushing both orders into five days produces neither good light nor good sleep. Pick an order and protect at least one slow morning.</p>
""",
    "east-libya-or-west-libya-how-to-choose-your-first-region": """
<h2>Visa and routing are the same frame either way</h2>
<p>East or west, you still travel inside sponsorship with guides and required escorts. The difference is geography and highlight type, not freedom to wander solo. Eastern plans may use Benghazi entry when routes allow. Western plans assume Mitiga and Tripolitania classics.</p>
<p>Do not choose east only because a map looks balanced. Choose east because Cyrene or eclipse dates pull you there with enough days to justify the flight plan.</p>
""",
    "can-families-book-libya-tours-with-mixed-ages": """
<h2>Kids at ruins and camps</h2>
<p>Children often love Ghadames lanes and wide open theatre steps when heat is managed. They tire at long checkpoint days with few bathrooms. Teens engage when guides tell stories, not only dates. Build screen breaks and pool time into coastal hotel nights without guilt.</p>
<p>Strollers struggle on uneven stone. Baby carriers work better at sites. Say ages so vans and rooming lists fit car seats or booster needs where possible.</p>
""",
    "how-custom-quotes-differ-from-fixed-libya-packages": """
<h2>When custom is worth the wait</h2>
<p>Choose custom when your group mixes ages, diets, or photography timing that packages assume are standard. Choose fixed when your dates match a listed event or sampler and your must sees already align. Hybrid starts fixed then extends before deposit so one sponsor file covers the whole calendar.</p>
<p>Custom quotes may iterate twice. That is normal. Iteration beats surprise on day three.</p>
""",
    "airport-pickup-and-dropoff-on-guided-libya-trips": """
<h2>Multiple guests on different flights</h2>
<p>Friend groups sometimes land hours apart. Tell coordinators every flight separately. Pickup plans may stage two transfers or hold a reasonable joint meeting time at the hotel. Do not assume one driver waits indefinitely without notice.</p>
<p>Late night arrivals may skip sightseeing entirely. That is healthy design, not a lost day.</p>
""",
    "what-language-support-guests-get-on-libya-tours": """
<h2>Menus, checkpoints, and camp conversations</h2>
<p>English guides summarize Arabic menu items and explain what you are eating without pretending every dish has a European translation. Checkpoint small talk stays between guide and officials while you stay patient and polite.</p>
<p>Learning hello and thank you in Arabic delights hosts. Guides appreciate guests who try basic courtesy even when full conversation is not possible.</p>
""",
    "dietary-needs-how-to-tell-us-before-a-libya-tour": """
<h2>Group tables and mixed diets</h2>
<p>Mixed groups with one vegan and three omnivores need kitchen notice before arrival, not at the tent door. Operators often plan separate simple dishes rather than forcing everyone through one buffet guess.</p>
<p>Religious fasting periods change meal timing. Flag observance needs early so lunch plans respect your practice when routes allow.</p>
""",
    "fitness-level-what-libya-tours-expect-from-guests": """
<h2>Training that actually helps</h2>
<p>Walk uneven sidewalks at home before you fly. Practice stairs if Sabratha theatre seats matter. Stretch hips for van hours. Sahara guests benefit from sand walking practice on beaches if available. You need not join a gym cult. You should not hide knee pain until mile three of Leptis.</p>
<p>Operators can split groups briefly at sites when one guest needs shade while others explore one more wing. That only works when you speak up early.</p>
""",
    "how-weather-windows-shape-where-you-should-go": """
<h2>Regional snapshots by season</h2>
<p>Coastal Tripolitania tolerates more summer sightseeing with early starts than Fezzan dune afternoons. Ghadames spring and autumn charm fits family pacing. Acacus and Ghat deep products shine in cooler months. Cyrenaica highlands feel fresh in spring green periods when access allows.</p>
<p>Ask TourBuilder for month first, region second. Weather shaped routes feel smarter than map shaped regrets.</p>
""",
    "insurance-proof-and-emergency-contacts-guests-prepare": """
<h2>What to send and where to store it</h2>
<p>Upload insurance card image and emergency contact sheet when TourBuilder or your coordinator requests them. Store the same files offline on your phone and in email you can reach without WiFi at camp. Share coordinator WhatsApp with your home contact so one person can bridge time zones if you delay at a checkpoint.</p>
<p>Insurance without evacuation cover is thin for Sahara legs. Read policy geography clauses for north Africa.</p>
""",
    "how-cancellation-talks-work-before-you-travel": """
<h2>Postponement versus cancel</h2>
<p>Many guests postpone rather than cancel when work shifts. Postpone may carry less cost if sponsor work has not started. Cancel after sponsor files exist often incurs retained fees. Event products may treat both postpone and cancel strictly near departure.</p>
<p>Get answers in writing with dates attached. Verbal assurances fade. Written terms survive staff turnover.</p>
""",
    "how-group-size-affects-a-libya-tour-day": """
<h2>Vehicle and escort math</h2>
<p>Larger groups may need two guides or tourist police patterns scaled to party size. Costs rise per seat slower than solo private travel yet faster than you hope. Quote the real headcount including non walking infants who still need visa names.</p>
<p>Split bills among friends happen after one payer sends deposit. Decide internal money before you ask operators to hold ten seats.</p>
""",
    "can-you-add-extra-days-after-a-fixed-libya-package": """
<h2>Examples that usually work</h2>
<p>Buffer night in Tripoli after Tunis connection. Second Leptis morning for photographers. Extra Ghadames craft morning. One additional camp night when season allows. Rest day between desert return and flight home. Each extension stays inside the same sponsor itinerary list.</p>
<p>Extensions fail when they pretend to add east Cyrene to a five day west package without adding calendar days. Operators protect you from map fantasy.</p>
""",
    "event-travel-versus-flexible-tourbuilder-libya-trips": """
<h2>Choosing wrong mode hurts</h2>
<p>Flexible guests who book eclipse week without buffer treat weather like a moral failing. Event guests who pick open custom dates miss rally gates entirely. Read product titles carefully in TourBuilder. Event listings name dates for a reason.</p>
<p>When in doubt, message through booking with the event name and your leave window. Staff will steer mode before you deposit wrong shape.</p>
""",
}

EXPANSIONS2: dict[str, str] = {
    "what-intolibya-tripadvisor-guests-mention-most": """
<h2>Turning review themes into your brief</h2>
<p>Mention preferred pace, fear of crowds, and camping tolerance when you open TourBuilder. Reviews praise handled logistics most when guests participated in clear planning. Copy the tone, not every stop a stranger loved five years ago.</p>
""",
    "how-to-describe-your-dream-libya-trip-in-one-message": """
<h2>Follow up questions are normal</h2>
<p>Coordinators may ask whether you prefer lean or all inclusive quotes, whether cold camp nights are acceptable, and which airport you can reach from home. Short answers keep momentum better than another essay.</p>
""",
    "where-to-go-map-ideas-before-you-open-tourbuilder": """
<h2>Use destination guides as depth, not noise</h2>
<p>Read one destination guide per region you are considering, then stop scrolling. IntoLibya destination pages explain access honestly. They pair well with map pins before you commit days in TourBuilder.</p>
""",
    "how-fixed-event-dates-change-your-libya-booking-timeline": """
<h2>Sponsor batches move with events too</h2>
<p>Event departures sometimes share sponsor preparation windows with stricter headcounts. Send every passport in the same batch when your quote lists a closed group date. Partial batches delay the whole van, not just one guest.</p>
""",
    "coast-first-or-desert-first-how-guests-decide": """
<h2>Jet lag tilts the choice</h2>
<p>Long hub nights through Tunis favor coast hotels before camps even if dunes excite you most. Sleep first, sand second, is a boring slogan that saves week one.</p>
""",
    "east-libya-or-west-libya-how-to-choose-your-first-region": """
<h2>Return trips flip the answer</h2>
<p>Guests who loved western Roman scale often return for Cyrene quiet. Guests who eclipse travel east first still add Leptis on a later leave window. Region choice is per trip, not for life.</p>
""",
    "can-families-book-libya-tours-with-mixed-ages": """
<h2>Grandparent and teen compromise days</h2>
<p>Split one morning so teens walk a full site while grandparents enjoy tea nearby with a guide rotation. Licensed teams accommodate split pacing when you flag it before deposit, not at breakfast surprise.</p>
""",
    "how-custom-quotes-differ-from-fixed-libya-packages": """
<h2>Read the revision notes</h2>
<p>Custom quotes often arrive with one revision round explaining driving tradeoffs. Read that note before asking for a third ruin on the same day. Geography pushes back politely.</p>
""",
    "airport-pickup-and-dropoff-on-guided-libya-trips": """
<h2>Name signs and contact numbers</h2>
<p>Save coordinator phone numbers before you land. Roaming may lag at Mitiga. Your driver expects the name on your passport, not only your nickname in TourBuilder.</p>
""",
    "what-language-support-guests-get-on-libya-tours": """
<h2>Written versus spoken needs</h2>
<p>Guests who want deep academic archaeology may request guide bios or reading suggestions in advance. Casual travelers need conversational English at meals and checkpoints. Match request to actual need.</p>
""",
    "dietary-needs-how-to-tell-us-before-a-libya-tour": """
<h2>Repeat allergies at booking confirmation</h2>
<p>When you pay deposit, repeat severe allergies in the payment note even if TourBuilder fields already hold them. Redundant clarity prevents kitchen misses during busy season batches.</p>
""",
    "fitness-level-what-libya-tours-expect-from-guests": """
<h2>Rest days are legitimate</h2>
<p>Request a hotel afternoon without sightseeing guilt. Licensed weeks can include one slow day per seven without breaking sponsorship. Fatigue makes checkpoints feel harder than they are.</p>
""",
    "how-weather-windows-shape-where-you-should-go": """
<h2>Pack for the region you chose</h2>
<p>Coast mild days still need sun cover. Desert nights need warm layers even when midday felt gentle. Weather planning includes wardrobe, not only map pins.</p>
""",
    "insurance-proof-and-emergency-contacts-guests-prepare": """
<h2>Medication carry on discipline</h2>
<p>Keep essential meds in hand luggage with copies of prescriptions where regulations require them. Remote camps cannot replace forgotten insulin or heart medication on an hour notice.</p>
""",
    "how-cancellation-talks-work-before-you-travel": """
<h2>Insurance and operator terms together</h2>
<p>Some losses fall outside operator refunds yet inside travel insurance claims. Read both documents before deposit so you know which lever applies to which problem.</p>
""",
    "how-group-size-affects-a-libya-tour-day": """
<h2>Private feel at six versus twelve</h2>
<p>Even private groups change rhythm above six people at meals and bathrooms. Keep parties smaller if ruin silence matters more than celebrating a big friend reunion at one long table.</p>
""",
    "can-you-add-extra-days-after-a-fixed-libya-package": """
<h2>Visa length must cover extensions</h2>
<p>Extra days still need sponsor itinerary alignment and visa validity that covers the full stay. Extend before eVisa submission when possible so government dates match hotel nights.</p>
""",
    "event-travel-versus-flexible-tourbuilder-libya-trips": """
<h2>Hybrid is possible with honest math</h2>
<p>Some guests book flexible coast days before a fixed rally weekend in one quote. That hybrid needs early custom review. Do not assume two separate bookings stitch cleanly without sponsor coordination.</p>
""",
}

EXPANSIONS3: dict[str, str] = {
    "where-to-go-map-ideas-before-you-open-tourbuilder": """
<h2>One region per short leave window</h2>
<p>If you only have five days, pick western coast depth instead of pinning Acacus and Cyrene on the same fantasy map. TourBuilder will still be there when you return for trip two.</p>
""",
    "coast-first-or-desert-first-how-guests-decide": """
<h2>Ask your group, not the forum</h2>
<p>Couples split on camp fear every week. Name the least adventurous traveler in your party and plan for their comfort first. Libya rewards honest group politics early.</p>
""",
    "airport-pickup-and-dropoff-on-guided-libya-trips": """
<h2>Tipping and small thanks</h2>
<p>Drivers appreciate polite clarity more than vague airport stress. Confirm bags, confirm hotel name, then relax. Your guide team sets tone for the whole week from this first hour.</p>
""",
    "what-language-support-guests-get-on-libya-tours": """
<h2>Evening recap habit</h2>
<p>Ask guides to recap tomorrow timing at dinner if your group includes anxious travelers. A five minute preview prevents morning confusion at checkpoints.</p>
""",
    "dietary-needs-how-to-tell-us-before-a-libya-tour": """
<h2>Snacks as backup, not insult</h2>
<p>Pack approved backup snacks for picky eaters even when kitchens try hard. Desert driving days run long. Hunger makes ruins feel like punishment.</p>
""",
    "how-weather-windows-shape-where-you-should-go": """
<h2>Check month before myth</h2>
<p>Social media photos rarely show the season they were taken. Tell TourBuilder your exact month first so coordinators do not build winter camp routes for July leave by mistake.</p>
""",
    "insurance-proof-and-emergency-contacts-guests-prepare": """
<h2>Share itinerary at home</h2>
<p>Send your licensed day outline to your emergency contact when the quote finalizes, not from memory later. Sponsored routes change slightly, yet core dates help family feel calm.</p>
""",
    "how-cancellation-talks-work-before-you-travel": """
<h2>Ask about transfer credits</h2>
<p>Some postponements become date credits rather than cash refunds depending on timing. Clarify which outcome your quote allows before you assume cash back.</p>
""",
    "how-group-size-affects-a-libya-tour-day": """
<h2>Quote infants explicitly</h2>
<p>Even non walking babies need passport data for sponsor lists. Include every human traveling, not only paying adults, when you request seats and rooms.</p>
""",
    "can-you-add-extra-days-after-a-fixed-libya-package": """
<h2>Extend before visa upload when possible</h2>
<p>If you already know you want a buffer night, add it before eVisa dates are submitted. Retroactive extensions sometimes work yet often cost more operational effort than planning upfront.</p>
""",
    "event-travel-versus-flexible-tourbuilder-libya-trips": """
<h2>Name the anchor experience</h2>
<p>Write rally, festival, eclipse, or open coast week in your first TourBuilder message. One anchor word routes you to the correct product mode faster than vague adventure language.</p>
""",
}

EXPANSIONS4: dict[str, str] = {
    "airport-pickup-and-dropoff-on-guided-libya-trips": """
<p>Confirm pickup in your quote inclusions thread so day one stays boring in the best way.</p>
""",
    "what-language-support-guests-get-on-libya-tours": """
<p>English support is standard on tourist routes when you request it during quoting, not as a last minute favor at the gate.</p>
""",
    "dietary-needs-how-to-tell-us-before-a-libya-tour": """
<p>Clear diet notes in TourBuilder help kitchens more than polite assurances that you will eat whatever appears.</p>
""",
    "how-weather-windows-shape-where-you-should-go": """
<p>Month first, map second. Weather shaped plans feel smarter than pin collecting on a screen.</p>
""",
    "how-cancellation-talks-work-before-you-travel": """
<p>Written terms beat verbal comfort when deposits start sponsor work that cannot unwind instantly.</p>
""",
    "how-group-size-affects-a-libya-tour-day": """
<p>Every seat in the van needs a passport name on the sponsor list, even quiet teenagers.</p>
""",
    "can-you-add-extra-days-after-a-fixed-libya-package": """
<p>One merged licensed quote beats a package plus freelance days that break sponsorship alignment.</p>
""",
}


def wc(html: str) -> int:
    return len([w for w in re.sub(r"<[^>]+>", " ", html).split() if w])


def parse_post(path: Path) -> tuple[str, str, str, str]:
    raw = path.read_text()
    parts = raw.split("---", 2)
    fm = parts[1]
    body = parts[2].lstrip()
    excerpt_m = re.search(r"^excerpt: '(.+)'$", fm, re.M)
    seo_m = re.search(r"^  description: '(.+)'$", fm, re.M)
    excerpt = excerpt_m.group(1).replace("''", "'") if excerpt_m else ""
    seo = seo_m.group(1).replace("''", "'") if seo_m else ""
    return body, excerpt, seo, raw


def insert_expansion(body: str, expansion: str) -> str:
    marker = "<h2>Related reading</h2>"
    if marker not in body:
        raise ValueError("No Related reading marker")
    return body.replace(marker, expansion.strip() + "\n\n" + marker, 1)


def main() -> int:
    counts = []
    slugs = sorted(set(EXPANSIONS) | set(EXPANSIONS2) | set(EXPANSIONS3) | set(EXPANSIONS4))
    for slug in slugs:
        path = POSTS_DIR / f"{slug}.md"
        body, excerpt, seo, _ = parse_post(path)
        for block in (EXPANSIONS, EXPANSIONS2, EXPANSIONS3, EXPANSIONS4):
            if slug not in block:
                continue
            expansion = block[slug]
            if expansion.strip() not in body:
                body = insert_expansion(body, expansion)
        update_post(slug, body.strip(), excerpt, seo)
        counts.append((slug, wc(body)))

    print("\nWord counts after expansion:")
    min_slug, min_wc = min(counts, key=lambda x: x[1])
    for slug, n in counts:
        flag = " LOW" if n < 500 else ""
        print(f"  {n:4d}{flag}  {slug}")
    print(f"\nMin: {min_wc} ({min_slug})")
    return 1 if min_wc < 500 else 0


if __name__ == "__main__":
    raise SystemExit(main())
