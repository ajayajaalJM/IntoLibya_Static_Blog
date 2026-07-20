#!/usr/bin/env python3
"""Expand Cluster C safety posts to 550-650 prose words."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
POSTS = ROOT / "src/content/posts/en"

MARKER = "<h2>Field notes from travelers who planned carefully</h2>"

EXPANSIONS: dict[str, str] = {
    "is-libya-dangerous-for-tourists-on-guided-trips": """
<h2>Compare with how you travel elsewhere</h2>

<p>If you have done guided trips in other complex regions, Libya will feel familiar in structure even when the history is new. You still get briefings, still follow local photo rules, still accept that the operator owns route decisions. What changes is the density of Roman and Greek heritage and the sheer quiet at major sites.</p>

<p>Guests who only know independent European city breaks sometimes mistake structure for danger. Structure here is the access mechanism. Without it, tourist visits do not happen legally at all.</p>

<h2>Questions worth asking any operator</h2>

<p>Who sponsors the eVisa? Which guides drive which legs? When does tourist police coordination apply? What does redesign look like if a coastal gate closes? How are photography limits explained before you reach a checkpoint? Strong answers mean the trip is being run by professionals, not optimists.</p>
""",
    "why-people-search-is-libya-safe-and-what-changes-on-a-tour": """
<h2>The search loop trap</h2>

<p>Many travelers spend weeks alternating between awe at Leptis photos and dread at advisory PDFs without ever opening a calendar. Search loops feel productive because tabs multiply. They are not planning. A licensed tour forces the next question: which week, which route, which sponsor.</p>

<h2>What family sees when you search</h2>

<p>Relatives rarely fear your curiosity. They fear your vagueness. Showing them a TourBuilder outline with named nights and operator contact often lowers the temperature more than winning a forum argument about geopolitics ever could.</p>

<h2>After the tour starts</h2>

<p>Most guests stop searching mid trip because the present tense finally has data: today’s driver, today’s site, tonight’s hotel. That shift is itself evidence that licensed structure changed the experience from abstract country to lived schedule.</p>
""",
    "libya-safety-for-tourists-compared-with-headline-fear": """
<h2>Memory bias after you return</h2>

<p>Oddly, return guests sometimes remember fear from planning more vividly than calm hours on the ground. That is normal psychology. Write a short post trip note about ordinary moments so future you does not inherit only headline memory.</p>

<h2>Social media distortion</h2>

<p>Short clips reward tension. A fifteen second checkpoint wait filmed without context reads differently than living it with a guide who has done the stop forty times this season. Consume social clips as entertainment, not as itinerary research.</p>

<h2>Building a fair mental model</h2>

<p>Picture three layers: advisory context for your citizenship, operator accountability for your week, and personal behavior rules for dress, photos, and patience. Safety planning means aligning all three, not choosing the scariest layer alone.</p>
""",
    "what-safe-feels-like-day-to-day-on-a-libya-tour": """
<h2>First day versus fourth day</h2>

<p>Day one often feels heightened: new language sounds, new checkpoint rhythm, jet lag. By day four, many guests describe a boring confidence. They still follow rules. They just stop catastrophizing each van stop. That arc is worth expecting so day one adrenaline is not misread as prophecy.</p>

<h2>Group energy matters</h2>

<p>Small private groups sometimes calm faster because questions get airtime. Larger groups still work when guides debrief consistently. Tell us if you need more translation of customs. Safe feeling grows from understanding, not from silence.</p>

<h2>What to track in a travel notebook</h2>

<p>Note pickup times, checkpoint durations, and one mundane joy daily. Coffee, bread, a shop joke, a cloud over a forum. Those notes become the honest story you tell friends instead of letting fear write the only draft.</p>
""",
    "is-libya-safe-enough-for-a-short-first-visit": """
<h2>Sample four day shape</h2>

<p>Land at Mitiga and rest. One Tripoli culture day. One full Leptis or Sabratha ruin day with shade planning. Buffer and fly out. That is enough to learn whether Libya belongs on your longer map without betting three weeks.</p>

<h2>When to extend instead of shorten</h2>

<p>If your leave allows ten days and your body likes heat, adding Ghadames or a first desert edge can follow naturally after a calm coastal start. The safety principle stays constant: extend only when the first rhythm felt manageable, not because FOMO demanded a desert sprint.</p>

<h2>Telling family it is short on purpose</h2>

<p>Saying “one controlled week, these sites, this operator” often reassures more than promising you will assess danger daily on the ground. Short first visits are a feature, not a compromise.</p>
""",
    "what-advisories-mean-when-you-still-want-to-visit-libya": """
<h2>Insurance as the adult conversation</h2>

<p>Insurers read advisories too. Confirm coverage in writing for your route and activities before deposit. An advisory you accept intellectually means little if your policy disagrees financially.</p>

<h2>Embassy limits in plain language</h2>

<p>Some travelers forget that embassy services may be limited even when tourism proceeds. That is not an argument against going. It is an argument for choosing operators with local accountability and keeping family contacts informed with realistic expectations.</p>

<h2>When to delay despite desire</h2>

<p>If your health, family obligations, or risk tolerance cannot survive a redesign week, delay. Libya’s stone waits. Advisories also update. Informed waiting beats resentful booking.</p>
""",
    "a-calm-checklist-before-you-decide-libya-is-for-you": """
<h2>8. Test your photography patience</h2>

<p>If you cannot ask before shooting people or accept no photo zones, friction will dominate memory. Libya rewards polite photographers with empty architecture. It punishes sneaky lenses with stress nobody needs.</p>

<h2>9. Confirm communication plans</h2>

<p>Decide how often you will message home and which operator contact covers emergencies. Vague “I will be fine” promises create secondary panic. Scheduled check ins help even when they are boring.</p>

<h2>10. Sleep on the decision twice</h2>

<p>Excitement and fear both lie at night. Re read your TourBuilder outline two mornings later. If it still feels worth the structure, proceed. If dread grew, honor that signal without shame.</p>
""",
    "how-guests-talk-about-safety-after-returning-from-libya": """
<h2>Vocabulary guests borrow</h2>

<p>Words like structured, monitored, bureaucratic, hospitable, and empty recur in emails. Less common are words like trapped or hunted when describing licensed weeks. That pattern does not erase advisories. It describes a frequent guest experience worth weighing.</p>

<h2>Photos change the story</h2>

<p>Return travelers often lead conversations with images: theatre rows, oasis doors, desert tea. Visual proof helps skeptics separate place beauty from planning fear. Pair photos with the operator name so context travels with the JPEG.</p>

<h2>When guests recommend waiting</h2>

<p>Mature return guests sometimes tell friends to wait until they can accept redesigns or modest dress without resentment. That advice is safety relevant too. Fit matters as much as access.</p>
""",
    "safety-questions-friends-will-ask-before-your-libya-trip": """
<h2>Why are you not going somewhere normal?</h2>

<p>Answer with specificity: empty UNESCO scale ruins, a north Africa gap in my travel map, and a licensed window that exists now with this operator. Normal is subjective. Your plan can still be prudent.</p>

<h2>What if the news gets worse before you fly?</h2>

<p>Explain deposit terms, redesign options, and that you are not ignoring news. You are traveling inside a managed plan that can respond to access changes. Calm beats defensiveness.</p>

<h2>Will you be contactable in the desert?</h2>

<p>Share realistic signal expectations. Some days have silence. Operator emergency paths still exist. Promising hourly Instagram stories sets everyone up for false alarm.</p>
""",
    "how-tour-days-reduce-uncertainty-for-nervous-travelers": """
<h2>Pre trip rehearsal helps</h2>

<p>Read one destination guide and one safety post, then stop. Build the calendar in TourBuilder. Rehearse mentally: airport, hotel, van, site, dinner. Nervous travelers who do this often report fewer surprise spikes because imagination already visited the pattern.</p>

<h2>Physical comfort as safety</h2>

<p>Hydration, hat, and rest are not wellness fluff. Dehydrated brains catastrophize. Licensed days that build shade and meal stops are safety engineering dressed as hospitality.</p>

<h2>Permission to ask the same question twice</h2>

<p>Good teams expect repeat questions about dress or checkpoints. Asking twice is cheaper than guessing once wrong. Use the guide channel generously if that is how you travel best.</p>
""",
    "libya-travel-fear-versus-on-the-ground-tour-rhythm": """
<h2>Jet lag and fear overlap</h2>

<p>Exhaustion amplifies worry on arrival night. Many guests misattribute jet lag dread to country danger. Sleep, eat, listen to tomorrow’s plan, and reassess in daylight before declaring the trip a mistake.</p>

<h2>Rhythm includes social warmth</h2>

<p>Tea offers, shop banter, and guide jokes become part of the weekly beat. Fear playlists rarely include those sounds because they were not in the research phase. Let hospitality update your model on the ground.</p>

<h2>Returning home</h2>

<p>Reverse culture shock sometimes means missing the clarity of guided days. That nostalgia is data about how structure felt, not proof that fear was foolish. Use it to decide whether you want a longer return map.</p>
""",
    "is-the-libyan-sahara-safe-for-camping-guests": """
<h2>Crew roles on camp nights</h2>

<p>Licensed desert weeks include people who cook, manage vehicles, and watch weather shifts. You are not improvising survival alone. Ask who stays on duty overnight and how emergencies route back toward pavement.</p>

<h2>Packing for temperature swings</h2>

<p>Daytime sun and nighttime chill on the same dune surprise first timers. Layers matter as much as camera batteries. Comfortable campers make safer campers because fatigue stays lower.</p>

<h2>Combining festival timing</h2>

<p>Some guests align Ghat festival culture days with camp nights. Crowds and music change the mood without removing licensed structure. Tell TourBuilder early if festival timing is part of your desert goal.</p>
""",
    "city-walking-safety-on-guided-tripoli-days": """
<h2>Museum days versus medina days</h2>

<p>Museums offer air conditioning and context that calms first timers. Medina walks offer texture and commerce that can feel busier. Mix both across Tripoli time rather than stacking intensity on jet lagged day one.</p>

<h2>Money and markets</h2>

<p>Carry small cash for souvenirs but let the guide lead bargaining tone. Most friction comes from misunderstanding intent, not from universal hostility. Polite nos are normal everywhere.</p>

<h2>Pairing Tripoli with coastal ruins</h2>

<p>Urban days teach rules that transfer directly to Sabratha and Leptis photo habits. Think of Tripoli as classroom, coast as field trip. That sequencing lowers city fear for many guests.</p>
""",
    "how-women-guests-describe-feeling-safe-in-libya": """
<h2>Evening pacing choices</h2>

<p>Some women prefer earlier hotel returns on private tours. Others enjoy late tea with hosts when invited. Both are valid when chosen, not when forced. Tell operators your evening comfort early so drivers plan accordingly.</p>

<h2>Traveling with male colleagues or partners</h2>

<p>Mixed groups follow the same licensed frame. Couples still benefit from modest dress and guide translation. See <a href="/en/safety-for-couples-visiting-libya">safety for couples visiting Libya</a> for paired travel notes.</p>

<h2>Online comments versus operator answers</h2>

<p>Threads that erase women or erase risk both fail. Ask IntoLibya direct questions about your dates and route. Your comfort decision deserves better data than a stranger’s all caps verdict.</p>
""",
    "is-libya-safe-for-photographers-who-follow-local-rules": """
<h2>Working with empty sites</h2>

<p>Empty theatres tempt wide lenses and long climbs. Safety also means watching footing on ancient steps and sun exposure on open forums. Guides can suggest angles that protect knees and gear simultaneously.</p>

<h2>People and consent culture</h2>

<p>Portraits without permission create conflict fast. Candid street obsession works poorly here. Slow down, ask, accept no, and keep architecture as your primary subject when in doubt.</p>

<h2>Backup and redundancy</h2>

<p>Dust happens. Carry redundant storage and charge routines that do not depend on one outlet in a camp. Losing files feels like disaster even when personal safety was never at stake. Plan tech redundancy like you plan insurance.</p>
""",
    "safety-for-older-travelers-on-supported-libya-itineraries": """
<h2>Footwear and ruin realism</h2>

<p>Stone surfaces are uneven. Supportive shoes beat fashion sandals at Leptis. Tell guides if you need a hand on steps. Pride causes falls everywhere, not only in Libya.</p>

<h2>Companion travel</h2>

<p>Older couples often thrive on private tours with shared pacing agreements. One partner’s stamina should not silently dictate the other’s misery. Split activities when needed with guide help.</p>

<h2>Medication timing across long drives</h2>

<p>Build meal and restroom stops into the map when prescriptions require food at fixed hours. That detail belongs in booking notes, not in a surprise shout from the back seat.</p>
""",
    "scam-anxiety-versus-real-tourist-risks-in-libya": """
<h2>Deposit stages that calm minds</h2>

<p>Clear staged payments tied to visa progress and named services reduce the “did I just Venmo a ghost?” feeling. Ask for paperwork you can show a skeptical spouse. Transparency is part of safety.</p>

<h2>Comparison shopping without race to bottom</h2>

<p>Absurdly cheap offers deserve suspicion. Moderate pricing with license clarity beats bargain hunting in opaque markets. Compare inclusions, redesign policies, and guide language skills, not only headline price.</p>

<h2>After you land</h2>

<p>Most scam anxiety fades once the same driver appears each morning and invoices match reality. If something feels off on the ground, raise it immediately with the operator channel rather than posting vague panic online.</p>
""",
    "how-communication-with-your-guide-builds-safety-confidence": """
<h2>Language layers</h2>

<p>Many guides speak multiple languages but appreciate simple direct questions. Write down must know phrases for dress, photos, and timing if that helps you. Communication aids are not childish. They are tools.</p>

<h2>Cultural translation moments</h2>

<p>Hospitality offers can confuse guests who fear hidden costs. Ask your guide to explain customs before you accept or decline. Understanding intent prevents offense on both sides.</p>

<h2>Escalation path</h2>

<p>Know how to reach the operator office if guide communication truly fails. Licensed teams expect occasional mismatches and fix them. Confidence includes knowing backup exists without drama.</p>
""",
}

ROUND2: dict[str, str] = {
    "libya-safety-for-tourists-compared-with-headline-fear": """
<h2>Share the planning load</h2>

<p>Ask a skeptical friend to read your TourBuilder week while you read the advisory. Splitting tasks reduces the chance that one emotional source controls the whole decision. Two calm readers beat one exhausted scroll session.</p>
""",
    "what-advisories-mean-when-you-still-want-to-visit-libya": """
<h2>Keep a decision journal</h2>

<p>Write why you want to go, what structure you accept, and what would make you postpone. Revisit the page after building your route. If reasons still hold, you are choosing rather than drifting.</p>
""",
    "a-calm-checklist-before-you-decide-libya-is-for-you": """
<h2>11. Name your must see honestly</h2>

<p>One ruin, one city day, one desert edge, or eclipse timing. Vague must see everything lists create unsafe pacing. Specific hunger makes safer maps.</p>
""",
    "how-guests-talk-about-safety-after-returning-from-libya": """
<h2>Recommendations with nuance</h2>

<p>Return guests often add caveats when they endorse Libya: go licensed, read advisories, accept redesigns. That nuance helps future travelers more than pure hype or pure fear ever could.</p>
""",
    "safety-questions-friends-will-ask-before-your-libya-trip": """
<h2>Can you leave if you hate it?</h2>

<p>Explain that trips can redesign and that you purchased adult planning, not a hostage plot. Honest talk about flexibility reduces dramatic interventions from people who love you.</p>
""",
    "how-tour-days-reduce-uncertainty-for-nervous-travelers": """
<h2>Bring a comfort object without shame</h2>

<p>Earplugs, snacks, a paperback, or a note from home belong in the van. Nervous travelers sometimes treat comfort items as weakness. They are regulation tools. Use them.</p>
""",
    "libya-travel-fear-versus-on-the-ground-tour-rhythm": """
<h2>Compare hours honestly</h2>

<p>Count how many trip hours were meals, sleeps, and van rides versus how many minutes you spent anxious before flying. Fear often loses the math even when advisories stay serious on paper.</p>
""",
    "is-the-libyan-sahara-safe-for-camping-guests": """
<h2>First camp versus repeat camp</h2>

<p>Guests who loved night one sometimes skip drama on night three because routines repeat. Expect learning curve comfort, not instant expert calm.</p>
""",
    "city-walking-safety-on-guided-tripoli-days": """
<h2>Traffic and crossing habits</h2>

<p>Let guides lead street crossings and parking approaches. Urban safety often lives in small movements you might miss while staring at architecture.</p>
""",
    "how-women-guests-describe-feeling-safe-in-libya": """
<h2>Confidence grows with repetition</h2>

<p>By midweek many women report that stares feel less threatening once norms are understood. Early day hypervigilance often softens into focused curiosity at sites.</p>
""",
    "is-libya-safe-for-photographers-who-follow-local-rules": """
<h2>Golden hour planning</h2>

<p>Ask guides to bias ruin times toward gentle light when possible. Safer photography also means fewer heat stressed rushed frames at noon.</p>
""",
    "safety-for-older-travelers-on-supported-libya-itineraries": """
<h2>Rest as itinerary feature</h2>

<p>Hotel afternoon rest is not failure. It is how older guests arrive at sunset sites with steady knees and clear heads.</p>
""",
    "scam-anxiety-versus-real-tourist-risks-in-libya": """
<h2>Reference checks that matter</h2>

<p>Ask operators for sample itineraries and license clarity, not mystery testimonials. Professional documentation calms scam fear better than vibes.</p>
""",
    "how-communication-with-your-guide-builds-safety-confidence": """
<h2>Thank clarity out loud</h2>

<p>When a guide explains a confusing moment well, acknowledge it. Teams repeat behaviors guests appreciate. Communication confidence becomes mutual.</p>
""",
    "what-safe-feels-like-day-to-day-on-a-libya-tour": """
<h2>Transfers as breathing room</h2>

<p>Long drives feel safer to many guests when they know the destination and stop plan. Van time becomes processing time instead of trapped time.</p>
""",
    "is-libya-safe-enough-for-a-short-first-visit": """
<h2>Post trip decision point</h2>

<p>End week one with an honest body check. If you want more, book longer later. Short visits succeed when they answer a question rather than closing the story forever.</p>
""",
    "why-people-search-is-libya-safe-and-what-changes-on-a-tour": """
<h2>Bookmark fewer tabs</h2>

<p>After reading this page and building TourBuilder, close redundant search tabs on purpose. Planning hygiene is part of emotional safety too.</p>
""",
}

ROUND3: dict[str, str] = {
    "a-calm-checklist-before-you-decide-libya-is-for-you": """
<h2>12. Plan the first dinner conversation</h2>

<p>Imagine explaining your day list to a skeptical friend in one minute. If you stumble, the plan is not concrete enough yet. Clarity before departure prevents performative bravery on the ground.</p>

<p>IntoLibya would rather answer hard fit questions early than collect deposits from travelers who needed one more honest week of thinking.</p>
""",
    "city-walking-safety-on-guided-tripoli-days": """
<h2>Weather and seasonal pacing</h2>

<p>Summer city walks demand shorter routes and more indoor museum time. Milder months reward longer medina loops. Tell TourBuilder your season so Tripoli days are not accidentally stacked on the hottest afternoon of your trip.</p>

<p>Guests who treat heat as a safety variable, not as personal failure, usually enjoy urban Libya more than warriors who refuse water breaks.</p>
""",
    "how-communication-with-your-guide-builds-safety-confidence": """
<h2>Practice questions before you land</h2>

<p>Write five questions in your notes app: checkpoint behavior, dress, photography, redesign, emergency contact. Ask them on day one even if you feel silly repeating basics. Guides respect prepared guests.</p>

<p>Confidence is cumulative. Each answered question removes one imaginary monster from the week ahead.</p>
""",
    "how-guests-talk-about-safety-after-returning-from-libya": """
<h2>Storytelling without bravado</h2>

<p>The most helpful return stories include one hard moment and how structure solved it: a wait, a redesign, a stern checkpoint, a guide explanation. Polished bravado helps nobody plan. Messy honesty does.</p>
""",
    "how-tour-days-reduce-uncertainty-for-nervous-travelers": """
<h2>Travel with a named worry list</h2>

<p>Write your top three fears before flying. Check them off daily with evidence. Checkpoint boring? Site access smooth? Guide reachable? Data beats rumination when nerves spike at night.</p>
""",
    "how-women-guests-describe-feeling-safe-in-libya": """
<h2>Site time versus city time</h2>

<p>Many women report that empty ruin hours feel emotionally easier than busy medina texture. Private pacing can bias the map toward site heavy days if that matches your comfort curve.</p>
""",
    "is-libya-dangerous-for-tourists-on-guided-trips": """
<h2>Western week as proof of concept</h2>

<p>A coastal western sampler is often the safest argument you can make to yourself before a longer map. Prove the licensed rhythm works for your body and nerves, then expand.</p>
""",
    "is-libya-safe-enough-for-a-short-first-visit": """
<h2>Document the first week for future you</h2>

<p>Keep a simple log: sleep, heat, checkpoint waits, joy moments. If you return for Sahara chapters later, that log becomes planning gold instead of vague memory.</p>
""",
    "is-libya-safe-for-photographers-who-follow-local-rules": """
<h2>Editing time on travel days</h2>

<p>Build rest into evenings instead of choking drives with laptop guilt. Tired photographers take worse risks at sites. Pacing is a safety choice for creatives too.</p>
""",
    "is-the-libyan-sahara-safe-for-camping-guests": """
<h2>Water and hygiene expectations</h2>

<p>Ask what camp hygiene looks like on your route. Knowing the answer prevents midnight anxiety spirals. Licensed crews plan water; guests plan patience.</p>
""",
    "libya-safety-for-tourists-compared-with-headline-fear": """
<h2>Teach one friend the difference</h2>

<p>Explain headline scale versus itinerary scale to one person who loves you. If they understand the distinction, you gain an ally instead of a daily debate partner.</p>
""",
    "libya-travel-fear-versus-on-the-ground-tour-rhythm": """
<h2>Name the fear playlist songs</h2>

<p>Write which headlines or comments stuck in your head. Compare each to an on ground counterexample from your actual day list. The exercise sounds silly. It works.</p>

<p>Rhythm wins planning arguments only when you notice it happening.</p>
""",
    "safety-for-older-travelers-on-supported-libya-itineraries": """
<h2>Elevators, steps, and ruin honesty</h2>

<p>Ask which hotels and sites include stairs without shade. A honest map may swap one ruin viewpoint for another with gentler access. Substitution beats heroic suffering.</p>
""",
    "safety-questions-friends-will-ask-before-your-libya-trip": """
<h2>Give them one printed page</h2>

<p>Operator name, dates, route shape, insurance yes, advisory read yes. One page beats twenty texts. Friends worry less when paper looks boring and competent.</p>
""",
    "scam-anxiety-versus-real-tourist-risks-in-libya": """
<h2>Keep receipts and names</h2>

<p>Save sponsor letters, invoices, and guide introductions. Paper trails calm scam fear and help family feel the trip is real, not improvised.</p>
""",
    "what-advisories-mean-when-you-still-want-to-visit-libya": """
<h2>Re read advisories after TourBuilder</h2>

<p>Once your route exists, read the advisory again with site names in mind. You may still accept the risk. You will at least know you read twice with context.</p>
""",
    "what-safe-feels-like-day-to-day-on-a-libya-tour": """
<h2>Safe enough is not zero adrenaline</h2>

<p>One stern moment does not erase a week of structure. Guests who expect zero spikes sometimes misread normal friction as failure. Context matters.</p>
""",
}

ROUND4: dict[str, str] = {
    "a-calm-checklist-before-you-decide-libya-is-for-you": """
<p>Revisit this checklist after TourBuilder, not before. Numbers on a calendar turn abstract worry into decisions you can defend to family without shouting.</p>
""",
    "city-walking-safety-on-guided-tripoli-days": """
<p>If Tripoli still feels intense after day one, ask for shorter medina loops or more museum time on day two. Licensed trips can bend without breaking.</p>
""",
    "how-communication-with-your-guide-builds-safety-confidence": """
<p>End each day by confirming tomorrow’s pickup window. That thirty second ritual prevents a surprising amount of midnight anxiety for first time north Africa travelers.</p>
""",
    "how-guests-talk-about-safety-after-returning-from-libya": """
<p>When recommending Libya, pair wonder with structure. Friends trust return stories that sound like planning, not like daredevil cosplay.</p>
""",
    "how-tour-days-reduce-uncertainty-for-nervous-travelers": """
<p>Consider private pacing if group social unknowns spike your nerves. The licensed frame stays identical while social load drops.</p>
""",
    "how-women-guests-describe-feeling-safe-in-libya": """
<p>Pack a light scarf for unexpected mosque or conservative stops even if daily dress already feels modest. Small prep reduces last minute stress.</p>
""",
    "is-libya-safe-for-photographers-who-follow-local-rules": """
<p>Tell TourBuilder which sites matter most for your portfolio so drives serve photos instead of fighting them. Intent helps guides protect your safety and your shots.</p>
""",
    "is-the-libyan-sahara-safe-for-camping-guests": """
<p>Bring earplugs and a headlamp. Small camp comforts reduce fatigue, and fatigue is when people make sloppy choices in any country.</p>
""",
    "libya-travel-fear-versus-on-the-ground-tour-rhythm": """
<p>Record one mundane audio note daily: traffic, tea, wind. Playback later reminds you how normal most hours sounded.</p>
""",
    "safety-for-older-travelers-on-supported-libya-itineraries": """
<p>Share walking distance limits in writing during booking. Guides can cluster sites to minimize pointless steps across hot parking lots.</p>
""",
    "safety-questions-friends-will-ask-before-your-libya-trip": """
<p>Offer to call once after your first full day on the ground. One calm report beats a week of speculative dread in the group chat.</p>
""",
    "scam-anxiety-versus-real-tourist-risks-in-libya": """
<p>If an offer bypasses sponsorship entirely, treat that as the scam category worth fearing. Everything else gets quieter once paperwork looks professional.</p>
""",
}


def prose_words(text: str) -> int:
    prose = text.split("<h2>Related reading</h2>")[0]
    plain = re.sub(r"<[^>]+>", " ", prose)
    plain = re.sub(r"\s+", " ", plain).strip()
    return len(plain.split())


def main() -> None:
    slugs = set(EXPANSIONS) | set(ROUND2) | set(ROUND3) | set(ROUND4)
    for slug in sorted(slugs):
        path = POSTS / f"{slug}.md"
        raw = path.read_text(encoding="utf-8")
        if MARKER not in raw:
            print(f"SKIP {slug}: marker missing")
            continue
        parts = []
        for block in (EXPANSIONS, ROUND2, ROUND3, ROUND4):
            if slug in block:
                parts.append(block[slug].strip())
        expansion = "\n\n".join(parts)
        updated = raw.replace(MARKER, expansion + "\n\n" + MARKER, 1)
        path.write_text(updated, encoding="utf-8")
        wc = prose_words(updated.split("---", 2)[2])
        if wc >= 550:
            status = "OK"
        elif wc >= 500:
            status = "MID"
        else:
            status = "LOW"
        print(f"{status} {slug}: {wc} words")


if __name__ == "__main__":
    main()
