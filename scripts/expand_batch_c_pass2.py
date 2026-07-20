#!/usr/bin/env python3
"""Second expansion pass for Batch C posts still under 450 words."""
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from scripts.lib.update_post import update_post, POSTS, assert_no_hyphen
from scripts.expand_batch_c_to_450 import strip_cta, extract_body, extract_excerpt_seo, cta_for

EXTRAS2 = {
    "libya-for-small-friend-groups": """
<h2>Sample private group week</h2>
<p>Day one Tripoli arrival and old city orientation. Day two Sabratha. Day three and four Leptis Magna with a buffer night. Midweek swing toward Ghadames or a short desert camp if the whole crew votes yes. Final day markets and departure buffer. Exact order flexes with flights and season.</p>
<p>The vote matters. Private groups fail when one loud friend dictates dunes while three others wanted museums. Use a simple ranked list before IntoLibya drafts the quote. TourBuilder then becomes a refinement tool, not a conflict arena.</p>
<p>After the trip, share a common photo folder and a tip plan so the last day does not turn into awkward cash math. Structure keeps friendship intact when the adventure is intense.</p>
""",
    "libya-tours-for-adventure-seekers": """
<h2>Gear that actually matters</h2>
<p>Broken in closed shoes, sun protection, a warm night layer, and a dry sense of humor outperform brand new expedition costumes. Ask what camping furniture IntoLibya provides so you do not double pack. Remoteness makes every unnecessary kilo louder.</p>
<p>Navigation is a team job here. Guests who wander off for a private ridge photo can create real search problems. Adventure is collective on licensed tours. The reward is access to places solo travelers cannot lawfully reach.</p>
<p>If rally or cohort desert events excite you, confirm them live in TourBuilder and treat those dates as anchors. Otherwise keep the custom expedition flexible inside the good season window.</p>
""",
    "libya-tours-for-archaeology-fans": """
<h2>Museum days and context</h2>
<p>A Tripoli museum morning before Leptis can sharpen what you later see in situ. Ask for that sequence when collections and openings allow. Context turns ornamental detail into evidence.</p>
<p>Bring a notebook even if you shoot thousands of frames. Writing one paragraph per site at dinner locks learning better than another similar capital photo. Teachers already know this. Adult fans forget it under beauty pressure.</p>
<p>IntoLibya can mark archaeology priority in the brief so drivers and guides protect site hours from optional shopping drift. Your deposit should buy stone time, not only transport.</p>
""",
    "libya-for-honeymoon-style-couples": """
<h2>Photo memories without performing</h2>
<p>Ask your guide for a few unhurried couple frames at sites where it is welcome. Then put the phone away and walk. The best honeymoon style moments in Libya are often unposted: shared silence in a theatre, shared laughter when the wind rearranges the picnic.</p>
<p>If one partner is a content creator, agree boundaries before the trip. Not every intimate hour needs an audience. IntoLibya can still help with legal filming limits. Emotional limits are yours.</p>
<p>Choose autumn or spring when you can. Heat arguments are the least romantic souvenir available.</p>
""",
    "libya-for-digital-creators-and-travel-bloggers": """
<h2>Platform specifics without spam</h2>
<p>Short form video loves dune edges and theatre reveals. Long form loves process: visa reality, guided safety layers, empty UNESCO walking. Newsletters love practical packing and season truth. Match format to honesty.</p>
<p>Do not invent access you did not have. Audiences who later try to copy illegal freestyle plans create problems for hosts and future creators. Model the licensed path.</p>
<p>When festival weeks appear in your calendar, confirm live TourBuilder events and disclose sponsorship relationships clearly. Trust is part of the craft.</p>
""",
    "libya-tours-for-history-teachers-and-students": """
<h2>Risk education without fear theater</h2>
<p>Students should learn why advisories exist and why licensed itineraries differ from backpacker myths. That lesson is civic literacy. It should not become a horror story hour that blocks curiosity.</p>
<p>Assign roles: one student tracks chronology, one maps trade routes, one notes heritage conservation questions. Active looking beats passive trailing.</p>
<p>IntoLibya can host serious educational groups when paperwork and supervision are real. Start early. Spring and autumn walking weather make teaching outdoors kinder.</p>
""",
    "libya-in-march-and-april": """
<h2>Photography and spring color</h2>
<p>Spring light is clean. Coastal stone photographs well. Desert edges pick up warmer tones late day. Wind can soften skies with haze on some afternoons, so keep schedule flexibility for the frame you care about most.</p>
<p>If you hope for oasis swims, ask what water temperatures and access look like in your exact week. Spring is friendlier than winter, still not a tropical brochure.</p>
<p>Book sponsorship while winter is still on the home calendar. March arrives faster than distracted travelers expect.</p>
""",
    "libya-tours-for-photographers": """
<h2>File workflow on the road</h2>
<p>Dual card cameras earn their keep. Dust loves single points of failure. Evening backups to a small drive help if you can power up. Do not leave the only copy of a Leptis sunrise in a jacket that later meets sand.</p>
<p>Ask teammates or partners for patience during golden hour. Photography tours fail socially when every stop becomes an argument. IntoLibya can set expectations in the group brief if you travel with non photographers.</p>
<p>Season choice remains the silent co author of your gallery. Autumn and spring usually write the kinder chapters.</p>
""",
    "libya-for-older-travelers-who-want-support": """
<h2>After the booking</h2>
<p>Practice walking on uneven ground at home if you have been desk bound. Break in shoes. Review medications with travel timing in mind. Share emergency contacts with IntoLibya’s trip lead.</p>
<p>On the road, speak up early when a pace is wrong. Guides would rather adjust mid morning than manage a preventable injury at dusk. Support is a dialogue.</p>
<p>Many older travelers finish Libya weeks saying the quiet sites were the gift they had stopped expecting from modern tourism. That gift is available when the itinerary respects the body carrying the curiosity.</p>
""",
    "libya-for-repeat-north-africa-travelers": """
<h2>Second visit thinking</h2>
<p>Some repeat regional travelers will want a second Libya trip later: coast first, desert second, or festival second. Say if you are designing a multi year arc. IntoLibya can avoid repeating the same western loop accidentally.</p>
<p>Bring comparative questions. Guides enjoy guests who can talk Carthage, Luxor, Tassili, or Chefchaouen without demanding Libya become those places. Comparison is a tool. Nostalgia is a trap.</p>
<p>Keep doing the paperwork. Familiarity with North Africa is not a visa.</p>
""",
    "libya-in-october-and-november": """
<h2>Family adult groups in autumn</h2>
<p>Adult children traveling with parents often find October and November ideal. Walking is kinder. Evenings are social without heat collapse. Private group pacing can give everyone dignity.</p>
<p>If a festival overlaps your autumn week, decide whether you want that energy. Quiet seekers should verify event calendars. Buzz seekers should lean in through TourBuilder listings.</p>
<p>Autumn is popular because it works. Popular still requires a deposit clock. Start yours.</p>
""",
    "libya-tours-for-food-travelers": """
<h2>Markets, homes, and consent</h2>
<p>Not every kitchen is a content set. If a home lunch is arranged, be a guest first. Ask before photographing hosts and dishes. Food travelers who lead with gratitude get invited deeper than food travelers who lead with cameras.</p>
<p>Carry any enzyme tablets or allergy cards you rely on. Translate key needs into clear English notes for guides. IntoLibya can brief kitchens when you give them something briefing can use.</p>
<p>Pair culinary days with enough site time that the trip still feels like Libya, not only a moving restaurant. Balance is the flavor.</p>
""",
    "libya-after-you-have-already-seen-morocco": """
<h2>Itinerary bridge ideas</h2>
<p>A first Libya week after Morocco might emphasize Leptis, Sabratha, Tripoli, and Ghadames without forcing a full Acacus expedition on day three. Save deeper Sahara for when you know you want more remoteness. Or jump straight to sand if Morocco already saturated your city appetite.</p>
<p>Either way, licensed sponsorship is the bridge. TourBuilder is where you describe what Morocco already covered so IntoLibya does not sell you a duplicate emotional arc.</p>
<p>Come humble. Libya is not Morocco with the volume lowered. It is another country with another rulebook and another kind of quiet.</p>
""",
    "libya-for-people-who-hate-crowds": """
<h2>Crowd sensitive day tactics</h2>
<p>Start signature sites early. Take lunch away from the main plaza energy when any exists. Ask for secondary angles and longer loops inside big archaeological fields. Leptis is large enough that even a few other visitors can vanish behind walls.</p>
<p>Skip stacking every famous name into the same afternoon. Crowding is sometimes self inflicted by itinerary greed. IntoLibya can protect spacing if you say quiet is the metric.</p>
<p>Festival weeks are the exception that proves the rule. Choose them only when you want people noise on purpose.</p>
""",
    "best-month-for-sahara-camping-in-libya": """
<h2>Women travelers and camp comfort</h2>
<p>Ask practical questions about washing, toilet arrangements, and clothing guidance before you pack. Good operators answer plainly. Mystery helps nobody after dark in the dunes.</p>
<p>Couples and friend groups should agree on how many camp nights feel fun versus enough. More is not always better. Two great nights can beat five tired ones.</p>
<p>Pick the month that lets you sleep. Then let IntoLibya turn that month into a sponsored camp sequence with real vehicles and guides.</p>
""",
    "best-month-for-roman-ruins-in-libya": """
<h2>Heat, marble, and attention spans</h2>
<p>Hot stone radiates. In marginal months, plan shade breaks like they are part of the pedagogy. Bring water discipline even in November. Ruins do not have cafe dens every fifty meters.</p>
<p>If you are coming from Italy, Tunisia, or Egypt with comparative ruin experience, tell your guide. Comparative talk elevates the day for everyone.</p>
<p>The best month is the one that keeps your attention on inscriptions and axial planning rather than on finding the next patch of shade. Autumn and spring usually deliver that gift.</p>
""",
    "ramadan-travel-tips-for-visitors-to-libya": """
<h2>Workday energy and driving days</h2>
<p>Some service patterns slow in daylight hours. IntoLibya plans around that with earlier activity and careful meal staging. Guests should not invent snack stops that put hosts in awkward public positions.</p>
<p>Long desert transfers still happen when the itinerary needs them. Hydration planning becomes more private and more intentional. Listen to your guide’s specific instructions for that week’s route.</p>
<p>Ramadan can deepen a trip if you arrive respectful. It can frustrate you if you arrive expecting ordinary tourist dining hours everywhere. Choose knowingly.</p>
""",
    "shoulder-season-booking-windows-for-libya": """
<h2>Signals you waited too long</h2>
<p>When preferred desert camps are gone, when your second choice dates keep slipping, or when eVisa buffer shrinks under three comfortable weeks for your nationality pattern, you are late. Pivot dates or simplify the route rather than bullying the calendar.</p>
<p>IntoLibya will offer honest alternatives. TourBuilder still helps you see package shapes that fit the remaining window. Shoulder season rewards the prepared more than the purely spontaneous.</p>
""",
    "double-shafra-sahara-trip-explained": """
<h2>After you book</h2>
<p>Train lightly if you have been inactive. Break in shoes. Read packing notes for cold nights even if the event page shows sunny marketing images. Confirm passport validity and insurance.</p>
<p>Join group communication channels if offered and keep questions centralized. Cohort trips run smoother when twenty people are not improvising twenty logistics theories.</p>
<p>Double Shafra Sahara is a shared desert sentence. Show up ready to be part of the grammar.</p>
""",
    "visiting-libya-in-spring": """
<h2>Spring health basics</h2>
<p>Sun is stronger than winter travelers expect. Use sunscreen on ruin days even when the breeze feels kind. Allergies can appear with dust and seasonal plant cycles for sensitive guests. Pack the remedies you already trust.</p>
<p>Hydration still matters. Mild air tricks people into drinking less. Guides notice. Be the guest who does not need a lecture.</p>
<p>Spring remains a top IntoLibya recommendation for mixed itineraries. Claim it with paperwork lead time, not with last week panic.</p>
""",
    "rally-te-te-waddan-desert-rally-guide": """
<h2>What to pack for rally days</h2>
<p>Dust scarf, sunglasses, closed shoes, sun layers, and a camera rain cover style protector for fine particles. Hearing comfort gear helps some guests. Leave trailing scarf ends that can catch on equipment at home.</p>
<p>Nights may still cool. Rally excitement does not cancel desert physics. Pack the same smart night layer you would bring for other Sahara evenings.</p>
<p>Then confirm the live event, deposit with IntoLibya, and keep your eVisa timeline ahead of the start line energy.</p>
""",
    "how-to-plan-a-libya-trip-around-fixed-event-dates": """
<h2>Contingency thinking</h2>
<p>Ask what happens if weather shifts a viewing plan, or if a festival schedule edits a public day. Good operators have branch plans. You should hear them before you need them.</p>
<p>Keep one flexible evening in the wrap days for recovery. Event intensity plus travel fatigue can flatten the next morning’s ruin visit if you stack without mercy.</p>
<p>Fixed dates demand calm process. TourBuilder listings plus IntoLibya sponsorship are how calm process becomes tickets and tents in the right place.</p>
""",
    "double-shafra-ghadames-trip-explained": """
<h2>Old town manners</h2>
<p>Ghadames lanes are lived heritage, not only a set. Keep voices reasonable. Follow guide paths. Buy thoughtfully if shops are open to visitors. The best photos often come after you stop treating residents as background.</p>
<p>Ask about rooftop or viewpoint access rather than improvising climbs. Cohort schedules usually include the good angles without the bad ideas.</p>
<p>Choose this product when town culture is the headline. Choose the Sahara sibling when dunes are the headline. Read both live pages before your deposit hand moves.</p>
""",
}


def main():
    for slug, extra in EXTRAS2.items():
        assert_no_hyphen(extra, f"{slug} extra2")
        body = extract_body(slug)
        core = strip_cta(body)
        new_body = f"{core}\n{extra.strip()}\n{cta_for(slug)}"
        excerpt, seo = extract_excerpt_seo(slug)
        update_post(slug, new_body, excerpt, seo)
    print(f"Expanded {len(EXTRAS2)} posts (pass 2).")


if __name__ == "__main__":
    main()
