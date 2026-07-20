#!/usr/bin/env python3
"""Rewrite Batch B itinerary posts 066–072 to full blog quality."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from scripts.lib.update_post import update_post

CTA = """
<hr />

<h2>Plan your Libya trip with IntoLibya</h2>

<p>IntoLibya is your licensed sponsor for tourist travel. Use TourBuilder to shape days from live packages and activities, then let our team confirm what is runnable for your season.</p>

<p><a href="/tourbuilder/booking">Build Your Trip</a> · <a href="/tourbuilder/tour-packages">Browse tour packages</a> · <a href="/tourbuilder/search">Browse activities</a></p>
"""


def main():
    update_post(
        "tripoli-and-roman-ruins-short-plan",
        f"""
<p>A short <strong>Tripoli itinerary</strong> built around Roman ruins is the cleanest first look at tourist Libya. You land in the capital, recover, then give real hours to the coastal heavyweights instead of inventing a Sahara chapter you do not have time to enjoy.</p>

<p>This plan suits four to five day calendars. It is about depth on the Mediterranean edge, not national coverage.</p>

<h2>Who this short plan is for</h2>

<p>First visitors with tight vacation windows. Travel partners who want hotels more than camps. History fans who care more about Roman stone than dune driving. Guests connecting through Tunis who need a Mitiga friendly loop.</p>

<p>If Ghadames or Fezzan lakes are nonnegotiable, choose a longer western or adventure shape instead.</p>

<h2>A realistic day rhythm</h2>

<p>Day one: arrive at Mitiga, settle in <a href="/en/destination/tripoli">Tripoli</a>, take a light old town or waterfront orientation, sleep early. Day two: full guided block at <a href="/en/destination/leptis-magna">Leptis Magna</a>. Day three: <a href="/en/destination/sabratha">Sabratha</a> theatre and coastal light. Day four: Tripoli museum or medina depth, then departure buffer.</p>

<p>Flip Leptis and Sabratha if flight timing demands it. Do not compress both Roman cities into one exhausted afternoon unless you enjoy regret.</p>

<h2>How to make the short plan feel rich</h2>

<p>Add one Tripoli activity from TourBuilder, such as a walking focus or market morning. Keep evenings calm. Ask your guide for photography windows that respect local rules. Carry modest clothes and a cash plan.</p>

<p>IntoLibya handles licensed sponsorship, guides, and logistics so the short calendar stays legal and calm.</p>

<h2>What you will remember</h2>

<p>Empty Roman streets. A capital that still feels lived in. The surprise that Libya tourist travel is structured, not improvisational backpacking. That memory often becomes the reason guests return for desert nights later.</p>

<h2>Related reading</h2>

<ul>
<li><a href="/en/quick-trip-4-day-libya-package-guide">Quick Trip 4 Day Libya Package Guide</a></li>
<li><a href="/en/4-day-libya-itinerary-for-first-visitors">4 Day Libya Itinerary for First Visitors</a></li>
<li><a href="/en/sample-day-by-day-coastal-libya">Sample Day by Day: Coastal Libya</a></li>
<li><a href="/en/best-libya-tour-for-history-lovers">Best Libya Tour for History Lovers</a></li>
</ul>
{CTA}
""",
        "A short Tripoli itinerary with Roman ruins: capital arrival, Leptis Magna, Sabratha, and enough buffer to enjoy both.",
        "Tripoli itinerary for a short coastal trip focused on Leptis Magna and Sabratha with IntoLibya logistics.",
    )

    update_post(
        "tripoli-ghadames-and-leptis-circuit",
        f"""
<p>The classic <strong>Tripoli Ghadames Leptis</strong> circuit is the western story many travelers mean when they say they want Libya without a full Sahara expedition. You get capital life, the greatest Roman city in the region, and the desert pearl of Ghadames in one coherent loop.</p>

<p>This circuit usually wants about a week. Rushing it into four days turns hospitality into a blur.</p>

<h2>Why this triangle works</h2>

<p><a href="/en/destination/tripoli">Tripoli</a> gives you arrival logistics and urban texture. <a href="/en/destination/leptis-magna">Leptis Magna</a> delivers the archaeological wow. <a href="/en/destination/ghadames">Ghadames</a> shifts the mood to covered lanes, oasis architecture, and dune light. Add <a href="/en/destination/sabratha">Sabratha</a> or a <a href="/en/destination/jebel-nafusa">Jebel Nafusa</a> stop when the week has room.</p>

<p>The roads are familiar to licensed teams. The contrast teaches the country faster than a single theme trip.</p>

<h2>Sample week shape</h2>

<p>Open in Tripoli. Give Leptis a full day. Move west for Sabratha or mountain connective tissue. Continue to Ghadames for old town walking and a sunset on sand. Return with buffer before your outbound flight.</p>

<p>Exact order flexes with season and permissions. TourBuilder western week packages map closely onto this circuit.</p>

<h2>Customization tips</h2>

<p>History lovers should protect ruin hours before adding shopping stops. Culture lovers should protect a home lunch or guided medina block in Ghadames. Photographers should ask for golden hour access without breaking checkpoint timing.</p>

<p>IntoLibya sponsors the itinerary as a licensed operator. Your job is to pick priorities so we do not overload the vans.</p>

<h2>When to choose something else</h2>

<p>Choose a pure coastal short plan if you lack desert town days. Choose an adventure length if you need oasis lakes and Acacus nights. Choose an eastern chapter only when access and vacation length support it.</p>

<h2>Related reading</h2>

<ul>
<li><a href="/en/lets-explore-7-day-libya-package-guide">Lets Explore 7 Day Libya Package Guide</a></li>
<li><a href="/en/7-day-western-libya-itinerary">7 Day Western Libya Itinerary</a></li>
<li><a href="/en/one-week-in-libya-if-you-love-unesco-sites">One Week in Libya If You Love UNESCO Sites</a></li>
<li><a href="/en/ghadames-pearl-of-the-desert-guide">Ghadames Pearl of the Desert Guide</a></li>
</ul>
{CTA}
""",
        "Tripoli, Ghadames, and Leptis Magna in one classic western circuit, usually best as a full week with IntoLibya.",
        "Classic Tripoli Ghadames Leptis circuit for a western Libya week, with tips on pacing, add ons, and when to go longer.",
    )

    update_post(
        "sahara-focused-libya-itinerary",
        f"""
<p>A <strong>Libya Sahara itinerary</strong> puts sand, silence, and oasis water at the center. Coastal ruins can still appear as bookends, but the emotional weight sits in Fezzan nights, dune travel, and rock landscapes rather than in a museum sprint.</p>

<p>If you came for the desert, design for the desert. Everything else is garnish.</p>

<h2>Core places Sahara itineraries chase</h2>

<p>Most desert focused plans aim at some mix of Ubari sand seas, an oasis swim at <a href="/en/destination/gaberoun">Gaberoun</a>, Garamantian context near <a href="/en/destination/germa">Germa</a>, and time toward <a href="/en/destination/ghat">Ghat</a> and the <a href="/en/destination/acacus-mountains">Acacus Mountains</a> for camping and prehistoric art. A western approach may also include <a href="/en/destination/ghadames">Ghadames</a> as a softer desert town chapter.</p>

<p>Not every departure reaches every pin. Season, access, and group energy decide the honest map.</p>

<h2>How many days you really need</h2>

<p>A western week that only brushes Ghadames is not a Sahara focused itinerary. Adventure lengths around twelve to fifteen days are where desert nights start to feel real. Full country styles add eastern history if you insist on doing everything once.</p>

<p>Count camping nights. Count long transfer days. Ask IntoLibya which activities are locked for your dates.</p>

<h2>Rhythm that keeps humans happy</h2>

<p>Arrive via <a href="/en/destination/tripoli">Tripoli</a>, take one coastal reset day if needed, then commit south. Protect sleep before big dune stages. Build a swim day after heavy sand driving. Leave buffer before your outbound flight so a desert delay does not become an airport disaster.</p>

<p>TourBuilder adventure packages and Sahara activities keep the catalog live. Customize by adding tea experiences, engraving walks, or extra oasis time rather than inventing impossible geography.</p>

<h2>Practical desert notes</h2>

<p>Prefer cooler months. Pack layers for cold nights. Confirm photography rules at rock art sites. Bring a cash plan. Tell your operator about medical needs before you are hours from a clinic.</p>

<p>Licensed sponsorship is not optional theater. It is how tourist desert travel runs.</p>

<h2>Related reading</h2>

<ul>
<li><a href="/en/best-libya-tour-for-sahara-travelers">Best Libya Tour for Sahara Travelers</a></li>
<li><a href="/en/sample-day-by-day-sahara-libya">Sample Day by Day: Sahara Libya</a></li>
<li><a href="/en/fezzan-desert-lakes-itinerary">Fezzan Desert Lakes Itinerary</a></li>
<li><a href="/en/ghat-and-acacus-expedition-outline">Ghat and Acacus Expedition Outline</a></li>
</ul>
{CTA}
""",
        "Libya Sahara itinerary advice for travelers who want dunes, oasis lakes, Germa context, and Acacus nights with honest pacing.",
        "Build a Libya Sahara itinerary around Fezzan oases, Ghat, and the Acacus Mountains, with day counts that protect desert nights.",
    )

    update_post(
        "archaeology-focused-libya-itinerary",
        f"""
<p>A <strong>Libya archaeology itinerary</strong> is for travelers who measure a trip by stone, inscription, and site time rather than by selfie density. Libya rewards that mindset because major ruins often feel almost private compared with crowded Mediterranean peers.</p>

<p>You still travel with licensed sponsorship and guides. The difference is how fiercely you protect hours on site.</p>

<h2>Western archaeology core</h2>

<p>Start in <a href="/en/destination/tripoli">Tripoli</a> for museums and urban layers. Give a full day or more to <a href="/en/destination/leptis-magna">Leptis Magna</a>, the star of many itineraries. Add <a href="/en/destination/sabratha">Sabratha</a> for theatre drama on the sea. If time allows, weave mountain stopovers in <a href="/en/destination/jebel-nafusa">Jebel Nafusa</a> for later fortified architecture that deepens the long timeline.</p>

<p>Ghadames is not Roman, yet its oasis urbanism belongs on many archaeology minded weeks as living heritage.</p>

<h2>Eastern and desert layers</h2>

<p>When access and vacation length allow, add <a href="/en/destination/shahat">Shahat</a> for Cyrene and related classical landscapes in the east. In the south, <a href="/en/destination/germa">Germa</a> opens Garamantian stories that sit beside Sahara travel rather than beside the Roman coast.</p>

<p>Acacus rock art near <a href="/en/destination/ghat">Ghat</a> is prehistoric archaeology in open air. Treat it with the same respect you would give a museum gallery.</p>

<h2>How to structure days</h2>

<p>One major site per day beats two rushed tickets. Ask for guides who can talk chronology without drowning you. Use TourBuilder to add museum blocks or extra ruin hours instead of random shopping inserts.</p>

<p>Seven days can cover a strong western archaeology loop. Twelve or more days can mix coast, desert heritage, and eastern classical sites when runnable.</p>

<h2>Fieldcraft for ruin lovers</h2>

<p>Wear shoes that forgive uneven stone. Carry water and sun protection. Confirm photography rules. Start early for light and temperature. Tell IntoLibya if accessibility needs matter so pacing stays humane.</p>

<h2>Related reading</h2>

<ul>
<li><a href="/en/best-libya-tour-for-history-lovers">Best Libya Tour for History Lovers</a></li>
<li><a href="/en/libya-tours-for-archaeology-fans">Libya Tours for Archaeology Fans</a></li>
<li><a href="/en/east-libya-history-itinerary">East Libya History Itinerary</a></li>
<li><a href="/en/one-week-in-libya-if-you-love-unesco-sites">One Week in Libya If You Love UNESCO Sites</a></li>
</ul>
{CTA}
""",
        "Libya archaeology itinerary ideas from Leptis Magna and Sabratha to Cyrene, Germa, and Acacus rock art with site first pacing.",
        "Plan a Libya archaeology itinerary that protects ruin hours across western Roman sites, eastern classical stops, and desert heritage.",
    )

    update_post(
        "photography-focused-libya-itinerary",
        f"""
<p>A <strong>Libya photography tour</strong> itinerary is less about collecting pins and more about collecting light. You still need licensed sponsorship and a runnable route. You also need patience for golden hour, permission awareness, and fewer rushed transfers.</p>

<p>If your camera bag is heavier than your shoes, design the days for the camera bag.</p>

<h2>Best frames by region</h2>

<p><a href="/en/destination/tripoli">Tripoli</a> offers medina texture, coast light, and museum details. <a href="/en/destination/leptis-magna">Leptis Magna</a> and <a href="/en/destination/sabratha">Sabratha</a> reward early entry and long shadows on stone. <a href="/en/destination/ghadames">Ghadames</a> gives covered lanes, whitewashed geometry, and dune sunsets. Sahara chapters add oasis palms at <a href="/en/destination/gaberoun">Gaberoun</a>, Acacus silhouettes near <a href="/en/destination/ghat">Ghat</a>, and night skies when camping is part of the plan.</p>

<p>Eastern light around <a href="/en/destination/shahat">Shahat</a> is a gift when access allows classical ruins without crowds.</p>

<h2>How to build a photo first schedule</h2>

<p>Ask IntoLibya for sunrise or late afternoon site windows where practical. Avoid stacking two major locations on the same harsh midday. Put a recovery evening before long desert stages so you are not shooting through exhaustion.</p>

<p>Use TourBuilder to add activities that create time on location rather than shopping detours. A guided ruin block with flexible pacing beats a checklist sprint.</p>

<h2>Rules and respect</h2>

<p>Read photography rules before you arrive. Some places restrict drones, people, checkpoints, or sensitive facilities. Rock art sites need care. Ask before photographing residents. A great frame that embarrasses a host is a bad frame.</p>

<p>Licensed guides help you stay welcome. That access is part of image quality.</p>

<h2>Gear and season notes</h2>

<p>Protect lenses from dust. Pack batteries for cold desert nights. Prefer cooler months for Sahara work. Tell your operator if you need vehicle space for tripods so logistics are not a surprise on day one.</p>

<h2>Related reading</h2>

<ul>
<li><a href="/en/libya-tours-for-photographers">Libya Tours for Photographers</a></li>
<li><a href="/en/photography-rules-for-tourists-in-libya">Photography Rules for Tourists in Libya</a></li>
<li><a href="/en/sahara-focused-libya-itinerary">Sahara Focused Libya Itinerary</a></li>
<li><a href="/en/adventure-time-libya-package-guide">Adventure Time Libya Package Guide</a></li>
</ul>
{CTA}
""",
        "Libya photography tour itinerary tips: protect golden hour at Roman sites, Ghadames lanes, oasis water, and Acacus skies.",
        "Build a Libya photography itinerary with light first pacing, permission awareness, and TourBuilder time on location.",
    )

    update_post(
        "food-and-culture-libya-itinerary",
        f"""
<p>A <strong>Libya food tour itinerary</strong> is really a culture itinerary with better lunch plans. You will still see ruins and desert towns. The difference is how often you slow down for markets, home meals, tea rituals, and the everyday textures that do not fit on a monument ticket.</p>

<p>Come hungry. Come curious. Come ready to follow local etiquette.</p>

<h2>Where food and culture shine</h2>

<p><a href="/en/destination/tripoli">Tripoli</a> is the easiest place to taste coastal Libya: markets, bakeries, fish when timing fits, and old town wandering between bites. <a href="/en/destination/ghadames">Ghadames</a> is famous among guests for traditional home lunches and oasis hospitality. Sahara chapters may include Tuareg tea and bread experiences near <a href="/en/destination/ghat">Ghat</a> or camp evenings where simple food tastes huge after sand.</p>

<p>Mountain stops in <a href="/en/destination/jebel-nafusa">Jebel Nafusa</a> add village rhythm between coast and desert.</p>

<h2>How to structure a culture first week</h2>

<p>Keep one major sightseeing focus per day, then protect a meal experience that is not eaten in a moving van. In TourBuilder, look for activities such as home lunches, market walks, or tea ceremonies and place them on lighter transfer days.</p>

<p>You can still visit <a href="/en/destination/leptis-magna">Leptis Magna</a> or <a href="/en/destination/sabratha">Sabratha</a>. Just do not treat lunch as optional glue between ruins.</p>

<h2>Etiquette that keeps doors open</h2>

<p>Dress modestly. Ask before photographing people or private homes. Accept tea when offered if you can. Follow your guide on mosque visits. Alcohol is not part of normal tourist dining here, so adjust expectations with grace.</p>

<p>IntoLibya, as licensed sponsor, builds cultural stops that are welcomed rather than improvised intrusion.</p>

<h2>Who this itinerary suits</h2>

<p>Travelers who loved home cooked meals in other north African trips. Couples who want conversation as much as monuments. Guests who prefer hotels and town stays over hard expedition camping, though a gentle desert evening can still fit.</p>

<h2>Related reading</h2>

<ul>
<li><a href="/en/libya-tours-for-food-travelers">Libya Tours for Food Travelers</a></li>
<li><a href="/en/lunch-in-a-traditional-home-in-ghadames">Lunch in a Traditional Home in Ghadames</a></li>
<li><a href="/en/libya-itinerary-for-couples">Libya Itinerary for Couples</a></li>
<li><a href="/en/tripoli-ghadames-and-leptis-circuit">Tripoli Ghadames and Leptis Circuit</a></li>
</ul>
{CTA}
""",
        "Libya food tour itinerary ideas that slow the pace for markets, home lunches, tea rituals, and town hospitality with IntoLibya.",
        "Plan a Libya food and culture itinerary around Tripoli, Ghadames hospitality, and desert tea experiences without rushing every ruin.",
    )

    update_post(
        "east-libya-history-itinerary",
        f"""
<p>An <strong>east Libya itinerary</strong> is for travelers who want Greek and later history layers beyond the western Roman hits. When access allows, the east offers <a href="/en/destination/benghazi">Benghazi</a> as a gateway city and <a href="/en/destination/shahat">Shahat</a> for ancient Cyrene and related classical landscapes in the green mountain belt.</p>

<p>This is not a casual add on to a four day coastal sampler. It needs intentional days and clear confirmation from your operator.</p>

<h2>What eastern history trips usually include</h2>

<p>Expect time around Shahat for Cyrene’s temples, agoras, and setting. Many travelers also want context for Apollonia’s coastal archaeology when routing supports it, plus green mountain scenery that feels nothing like Fezzan sand. Benghazi may serve as logistics and modern city texture depending on the plan.</p>

<p>IntoLibya will tell you what is runnable for your dates rather than promising a textbook map.</p>

<h2>How east fits with west or Sahara</h2>

<p>Some guests fly a western week first and return later for the east. Others need a longer full country style trip that sequences coast, desert, and east carefully. Mixing everything into twelve frantic days can work for tough travelers and fail for everyone else.</p>

<p>If your heart belongs only to <a href="/en/destination/leptis-magna">Leptis Magna</a> and <a href="/en/destination/ghadames">Ghadames</a>, you may not need the east on trip one.</p>

<h2>Planning questions to ask</h2>

<ul>
<li>Is eastern access confirmed for my nationality and dates?</li>
<li>How many nights does Cyrene deserve without rushing?</li>
<li>Are flights or long road transfers part of the link from Tripoli?</li>
<li>What museum or guide depth is available on the ground?</li>
</ul>

<p>Use TourBuilder when eastern days appear in live packages, and treat them as confirmed only after human review.</p>

<h2>Practical notes</h2>

<p>Carry the same sponsorship and eVisa discipline you would for western travel. Pack for cooler mountain evenings. Read photography rules. Build buffer around any domestic flight legs.</p>

<h2>Related reading</h2>

<ul>
<li><a href="/en/is-eastern-libya-open-for-tourists">Is Eastern Libya Open for Tourists</a></li>
<li><a href="/en/shahat-and-ancient-cyrene-guide">Shahat and Ancient Cyrene Guide</a></li>
<li><a href="/en/archaeology-focused-libya-itinerary">Archaeology Focused Libya Itinerary</a></li>
<li><a href="/en/seasoned-expeditioner-18-day-libya-package-guide">Seasoned Expeditioner 18 Day Libya Package Guide</a></li>
</ul>
{CTA}
""",
        "East Libya itinerary guidance for Benghazi and Shahat when access allows, with honest notes on combining east with west or Sahara.",
        "Plan an east Libya history itinerary around Cyrene and the green mountains, confirmed with IntoLibya for your travel dates.",
    )

    print("Batch B part 3 done")


if __name__ == "__main__":
    main()
