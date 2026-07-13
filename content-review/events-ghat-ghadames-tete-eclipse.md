# Temporary: Festival & Eclipse Event JSON (factual)

**Delete this file when the chat ends** (say “end chat”).

This document holds four event objects in the Into Libya events schema, filled from **public reporting and astronomy sources**—not from existing tour itineraries (e.g. Double Shafra).

### How to read dates and fields

| Marker | Meaning |
|--------|---------|
| **Confirmed** | Exact dates or times published for that edition |
| **Provisional** | Patterned from the latest edition / season; official days not yet announced |
| `price: null` | No public Into Libya package price found |
| `isLibyanOnly: false` | Public cultural, motorsport, or astronomical events |
| `image` / `images` | Left empty—no invented CDN URLs |
| `daysItinerary` | Describes the **public event program**, not a sold tour product |

---

## 1. Ghat International Tourism Festival

### Explanation

The **Ghat International Tourism Festival** (مهرجان غات السياحي الدولي) is an annual cultural–tourism event in the oasis town of **Ghat**, southwest Libya (Tuareg / Fezzan region). The **31st edition** ran **28–30 December 2025** under the slogan «موروثنا… قيم وحضارة» (“Our heritage… values and civilization”). Coverage describes Tuareg heritage programming, artisan/heritage-house activities, and a closing **mehari (camel) race** plus evening cultural shows.

Historically the festival falls in **late December** and lasts about **three days**. Exact dates for the **2026** edition have **not** been officially published as of this research; the JSON below uses the **same calendar window as 2025** as a **provisional** placeholder.

### Date status

- **Confirmed (last edition):** 2025-12-28 → 2025-12-30  
- **In JSON (provisional next edition):** 2026-12-28 → 2026-12-30  

### Sources

- [Alwasat — 31st edition 28–30 Dec 2025](https://alwasat.ly/news/art-culture/500996)
- [Libya 24 — same dates / slogan](https://libya24.tv/2025/12/20/19961/)
- [Lana News — closing with mehari race, heritage house, evening show (31 Dec 2025)](https://www.lananews.com/ar/?p=466851)
- Background pattern: late Dec, ~3 days — [Toplist / Ghat Festival](https://toplist.info/top/ghat-festival-41864.htm), [ewpnet Ghat notes](https://maps.ewpnet.com/libya/ghat.htm)

### JSON

```json
{
  "id": "event_ghat_international_tourism_festival",
  "title": "Ghat International Tourism Festival",
  "days": 3,
  "price": null,
  "isLibyanOnly": false,
  "scheduleType": "fixed",
  "daysItinerary": [
    [
      {
        "title": "Festival opening in Ghat",
        "duration": "Daytime – evening",
        "description": "Opening of the International Tourism Festival in Ghat. Official and local programming highlights southern Libyan and Tuareg cultural identity; the 31st edition (2025) used the slogan «موروثنا… قيم وحضارة»."
      },
      {
        "title": "Heritage and cultural performances",
        "duration": "Evening",
        "description": "Music, dance, and heritage-focused presentations typical of the festival’s first-day celebrations in the oasis town."
      }
    ],
    [
      {
        "title": "Traditional industries and artisan exhibitions",
        "duration": "Daytime",
        "description": "Displays of traditional crafts and local industries; visitors and participating communities gather around heritage programming in Ghat."
      },
      {
        "title": "Heritage house (beit turathi) activities",
        "duration": "Afternoon – evening",
        "description": "Heritage-house programming as reported among the festival’s cultural activities (documented on the 2025 closing coverage alongside other events)."
      },
      {
        "title": "Evening cultural / artistic show",
        "duration": "Evening",
        "description": "Night-time artistic and folkloric performances reflecting Fezzan / Tuareg cultural diversity."
      }
    ],
    [
      {
        "title": "Mehari (camel) race",
        "duration": "Daytime – afternoon",
        "description": "The festival’s signature closing highlight: a mehari camel race, described as one of the south’s major heritage sporting events, with competitive riders and large public attendance (2025 closing day)."
      },
      {
        "title": "Mehari exhibitions and closing ceremony",
        "duration": "Afternoon – evening",
        "description": "Special mehari displays and a closing artistic evening marking the end of the festival edition."
      }
    ]
  ],
  "dates": [
    "2026-12-28",
    "2026-12-29",
    "2026-12-30"
  ],
  "description": "Three-day International Tourism Festival in Ghat celebrating Tuareg and southern Libyan heritage—crafts, music, and a closing mehari (camel) race. Dates for 2026 are provisional (same late-December window as the confirmed 31st edition, 28–30 Dec 2025).",
  "overview": "Ghat’s International Tourism Festival is one of Libya’s best-known Saharan cultural events, held in the historic oasis near the Algerian border.\n\nProgramming centers on Tuareg and Fezzan heritage: traditional dress, music and dance, artisan exhibitions, heritage-house activities, and a climactic mehari camel race.\n\nThe 31st edition ran 28–30 December 2025 under the slogan «موروثنا… قيم وحضارة». Exact 2026 dates are not yet officially announced; this object uses that same late-December window provisionally. price is null (no public package price). This itinerary describes the public festival program, not a commercial tour product.",
  "highlights": [
    "Tuareg & Fezzan cultural heritage",
    "Artisan and traditional-industry exhibitions",
    "Heritage-house programming",
    "Closing mehari (camel) race",
    "Late-December oasis festival in Ghat"
  ],
  "image": "",
  "images": []
}
```

---

## 2. Ghadames International Festival

### Explanation

The **Ghadames International Festival** (مهرجان غدامس السياحي الدولي) is a traditionally **three-day** celebration in the UNESCO-listed oasis of **Ghadames**, usually in **October or November**. Documented structure: **day 1** opening; **day 2** traditional-industry exhibitions and evening Tuareg music/dance; **day 3** mehari / horse races and marketplace activity. Families return to ancestral homes in the old town; public festivities include traditional dress, singing, dancing, crafts, and races outside the walls.

In **May 2026**, Libyan news agency **LANA** reported that tourism officials and the Ghadames development authority discussed **reviving the festival’s 15th edition** during the **last quarter of 2026**, alongside desert-rally and heritage tourism plans. **Exact day numbers for 2026 are not published.** The JSON uses a **provisional late-October** window consistent with historical practice.

### Date status

- **Confirmed season (2026 revival intent):** Q4 2026 (LANA, 13 May 2026)  
- **In JSON (provisional days):** 2026-10-23 → 2026-10-25  

### Sources

- [LANA — Tourism Minister in Ghadames; revival of 15th edition in Q4 2026 (13 May 2026)](https://lana.gov.ly/post.php?id=357396&lang=ar)
- [Tours Libya — Ghadames Festival (Oct/Nov, 3 days, races, old town)](https://tourslibya.com/festivals/ghadames-festival/)
- [Temehu calendar — typical Oct timing; day-by-day structure notes](https://www.temehu.com/Calendar.htm)
- [Wikipedia (PL) — 3 days, Oct/Nov, opening / crafts / races](https://pl.wikipedia.org/wiki/Ghadames_(festiwal))
- Related (separate event): [Tour In Libya — Ghadames Shopping & Heritage Days, late Oct 2024](https://www.tourinlibya.com/ghadames-days-festival/)

### JSON

```json
{
  "id": "event_ghadames_international_festival",
  "title": "Ghadames International Festival",
  "days": 3,
  "price": null,
  "isLibyanOnly": false,
  "scheduleType": "fixed",
  "daysItinerary": [
    [
      {
        "title": "Official festival opening",
        "duration": "Daytime – evening",
        "description": "Opening ceremony of the Ghadames International Festival. The old town and modern oasis host returning families and visitors for the start of the multi-day heritage celebration."
      },
      {
        "title": "Old Town comes alive",
        "duration": "Evening",
        "description": "Covered alleys and ancestral homes fill with music, traditional dress, and communal gathering—the festival’s role in reconnecting residents with the UNESCO old city."
      }
    ],
    [
      {
        "title": "Traditional industries exhibitions",
        "duration": "Daytime",
        "description": "Second-day focus on traditional crafts and industries: pottery, leatherwork, silver, and other handmade goods demonstrated and sold in market-style settings."
      },
      {
        "title": "Tuareg music and dance performances",
        "duration": "Evening",
        "description": "Night shows of Tuareg music and dance in traditional dress—one of the festival’s most visible cultural highlights."
      }
    ],
    [
      {
        "title": "Horse and mehari (camel) races",
        "duration": "Daytime",
        "description": "Public races outside the city walls, linking the event to Tuareg desert heritage; reported as a core third-day activity."
      },
      {
        "title": "Marketplace (souq) and closing festivities",
        "duration": "Afternoon – evening",
        "description": "Open marketplace activity, food traditions (including local breads such as taguella in heritage accounts), and closing celebrations of the three-day festival."
      }
    ]
  ],
  "dates": [
    "2026-10-23",
    "2026-10-24",
    "2026-10-25"
  ],
  "description": "Three-day International Festival in UNESCO Ghadames—old-town heritage, crafts, Tuareg music and dance, and horse/mehari races. 2026 days are provisional (Q4 revival announced May 2026; exact dates not yet published).",
  "overview": "The Ghadames International Festival is among the Sahara’s best-known cultural gatherings: for about three days each autumn, the oasis’s old town fills again with families, traditional dress, music, crafts, and desert races.\n\nTypical structure (from long-standing festival reporting): opening on day one; traditional-industry exhibitions and evening performances on day two; mehari/horse races and marketplace activity on day three.\n\nIn May 2026, officials discussed reviving the 15th edition in the last quarter of 2026. Exact calendar days are not yet public; this object uses a provisional late-October window. price is null. Itinerary = public festival program, not an Into Libya packaged tour.",
  "highlights": [
    "UNESCO Old Town of Ghadames",
    "Tuareg music, dance & traditional dress",
    "Traditional crafts & industries fair",
    "Horse and mehari (camel) races",
    "Q4 2026 revival discussed by tourism officials"
  ],
  "image": "",
  "images": []
}
```

---

## 3. Rally Te Te (Waddan)

### Explanation

**Rally Te Te** (also written T-T / TeTe Desert Rally) is Libya’s major annual **desert motorsport** event in **Waddan**, **Al-Jufra** district (central Libya). The **11th edition (2025)** program was reported as:

| Date | Program |
|------|---------|
| 2025-11-08 | Sand Dune Challenge |
| 2025-11-09 | Endurance rally (cars & motorcycles) |
| 2025-11-10 | Final stage + winner crowning at the main rally camp |

Reporting cites international and regional teams (Libya, Algeria, Tunisia, Kuwait, Morocco, US, Canada, etc.), 4x4s, motorcycles, and large spectator turnout. Organizers stated the **12th edition returns in November 2026**; **exact 2026 day numbers were not published**—the JSON mirrors the **2025 three-day competition block** as **provisional**.

### Date status

- **Confirmed (2025 program):** 2025-11-08 → 2025-11-10  
- **Confirmed (next edition year):** November 2026 (12th edition)  
- **In JSON (provisional 2026 days):** 2026-11-08 → 2026-11-10  

### Sources

- [Libyan Life — 2025 program days; 12th edition Nov 2026](https://libyanlife.com/libyas-te-te-desert-rally-in-waddan/)
- [Libyan Express — multi-day T-T Desert Rally in Waddan; 4x4 & motorcycles](https://www.libyanexpress.com/desert-rally-champions-gather-in-libyas-waddan-for-four-day-event/)
- [Afanen (AR) — Te Te Waddan 2025, 11th edition preparations](https://afanen.net/%d8%b1%d8%a7%d9%84%d9%8a-%d8%aa%d9%8a-%d8%aa%d9%8a-%d9%88%d8%af%d8%a7%d9%86-2025-%d9%85%d8%ba%d8%a7%d9%85%d8%b1%d8%a9-%d8%a7%d9%84%d8%b5%d8%ad%d8%b1%d8%a7%d8%a1-%d8%aa%d8%b9%d9%88%d8%af/)

### JSON

```json
{
  "id": "event_rally_te_te_waddan",
  "title": "Rally Te Te — Waddan Desert Rally",
  "days": 3,
  "price": null,
  "isLibyanOnly": false,
  "scheduleType": "fixed",
  "daysItinerary": [
    [
      {
        "title": "Arrival at Waddan rally camp",
        "duration": "Morning – midday",
        "description": "Competitors, support crews, and spectators gather in Waddan (Al-Jufra). The desert camp and opening displays set up for Libya’s premier off-road rally."
      },
      {
        "title": "Sand Dune Challenge",
        "duration": "Afternoon – evening",
        "description": "Opening competition day as reported for the 11th edition (2025): the Sand Dune Challenge across Waddan’s dune stages—4x4s and related off-road classes in front of large public crowds."
      }
    ],
    [
      {
        "title": "Endurance Rally — cars and motorcycles",
        "duration": "Full competition day",
        "description": "Endurance stage for cars and motorcycles over desert routes designed by the organizing committee (2025 day-two program). International and Libyan teams compete over extended dune and desert terrain."
      },
      {
        "title": "Spectator and camp atmosphere",
        "duration": "Evening",
        "description": "Rally camp hospitality and community celebration around the motorsport program; the event is also framed as desert-tourism promotion for the Jufra region."
      }
    ],
    [
      {
        "title": "Final stage",
        "duration": "Daytime",
        "description": "Closing competition stages on the designated desert course, culminating the multi-day Te Te program."
      },
      {
        "title": "Winner crowning ceremony",
        "duration": "Afternoon – evening",
        "description": "Official crowning at the main rally camp (reported climax of the 2025 edition on 10 November), ending the competitive weekend."
      }
    ]
  ],
  "dates": [
    "2026-11-08",
    "2026-11-09",
    "2026-11-10"
  ],
  "description": "Three-day Te Te Desert Rally in Waddan (Al-Jufra): dune challenge, endurance for cars and bikes, and crowning at the rally camp. November 2026 (12th edition) is confirmed; exact days are provisional (mirrored from the 2025 program 8–10 Nov).",
  "overview": "Rally Te Te is Libya’s flagship desert motorsport gathering, held annually in Waddan in the Al-Jufra district.\n\nThe 2025 (11th) edition opened with a Sand Dune Challenge (8 Nov), continued with an endurance rally for cars and motorcycles (9 Nov), and closed with a final stage and winner crowning at the main camp (10 Nov). Fields have included teams from Libya and abroad.\n\nOrganizers confirmed the 12th edition for November 2026; precise 2026 calendar days were not published at research time, so this object reuses the 2025 day pattern provisionally. price is null. Itinerary follows the reported public competition program.",
  "highlights": [
    "Waddan / Al-Jufra desert dunes",
    "Sand Dune Challenge",
    "Endurance rally (cars & motorcycles)",
    "International & regional teams",
    "12th edition — November 2026"
  ],
  "image": "",
  "images": []
}
```

---

## 4. Total Solar Eclipse 2027 (Libya)

### Explanation

On **Monday 2 August 2027**, a **total solar eclipse** crosses North Africa. In Libya, the path of totality includes **Benghazi** and nearby Cyrenaica locations; **Tobruk** sees a deep **partial** only. For **Benghazi** (local time **EET**):

| Phase | Approx. time |
|-------|----------------|
| Partial begins | ~10:10 |
| Maximum / totality | ~11:31 (**~6m 11s** totality) |
| Partial ends | ~12:53 |

Country-wide windows reported for Libya: partial from ~09:54, totality window ~11:16–11:46, partial ends ~13:19 (location-dependent). Climatology along the Libyan/Egyptian desert track is among the clearest for this eclipse. The JSON uses a **3-day** window (arrive / eclipse day / depart) with **confirmed** eclipse date **2027-08-02**.

### Date status

- **Confirmed eclipse day:** 2027-08-02  
- **In JSON (travel window):** 2027-08-01 → 2027-08-03  

### Sources

- [timeanddate — Total solar eclipse in Libya, 2 Aug 2027](https://www.timeanddate.com/eclipse/in/libya?iso=20270802)
- [timeanddate — Benghazi: 6m 11s totality, 10:10–12:53](https://www.timeanddate.com/eclipse/in/libya/benghazi?iso=20270802)
- [timeanddate — Tobruk: partial only](https://www.timeanddate.com/eclipse/in/libya/tobruk?iso=20270802)
- [TheSkyLive — Libya visibility; Benghazi best urban duration](https://theskylive.com/solar-eclipse?cc=LY&id=2027-08-02)
- [EclipseWise — SE 2027 Aug 02](https://www.eclipsewise.com/solar/SEprime/2001-2100/SE2027Aug02Tprime.html)
- [NASA GSFC — path of totality table](https://eclipse.gsfc.nasa.gov/SEpath/SEpath2001/SE2027Aug02Tpath.html)
- [Eclipsophile — TSE 2027 clear-sky climatology over Libya/Egypt](https://eclipsophile.com/tse2027/)

### JSON

```json
{
  "id": "event_total_solar_eclipse_2027_libya",
  "title": "Total Solar Eclipse 2027 — Benghazi Path",
  "days": 3,
  "price": null,
  "isLibyanOnly": false,
  "scheduleType": "fixed",
  "daysItinerary": [
    [
      {
        "title": "Arrive in Benghazi (path of totality)",
        "duration": "Daytime",
        "description": "Position in or near Benghazi / Cyrenaica on the path of totality. Benghazi is among Libya’s best urban viewing sites (~6 minutes 11 seconds of totality). Tobruk is outside totality (partial only)."
      },
      {
        "title": "Viewing-site briefing and safety check",
        "duration": "Afternoon – evening",
        "description": "Confirm observing location, weather outlook (Libyan desert track has excellent August clear-sky climatology), and ISO-compliant eclipse glasses / filtered optics for all partial phases. Never look at the uneclipsed or partially eclipsed Sun without proper filtration."
      }
    ],
    [
      {
        "title": "Partial eclipse begins",
        "duration": "~10:10am EET (Benghazi)",
        "description": "First contact in Benghazi area: Moon begins covering the Sun. Use certified solar filters only during all partial phases."
      },
      {
        "title": "Totality",
        "duration": "~11:31am EET · ~6m 11s (Benghazi)",
        "description": "Total phase in Benghazi: Sun fully covered for about 6 minutes 11 seconds at maximum (~11:31 EET). Filters may be removed only during totality; replace them immediately as the diamond ring / second/third contact ends."
      },
      {
        "title": "Partial eclipse ends",
        "duration": "~12:53pm EET (Benghazi)",
        "description": "Final partial phases conclude in Benghazi around 12:53pm EET. Country-wide partial can extend later depending on location (Libya partial end reported near ~1:19pm EET in some path summaries)."
      }
    ],
    [
      {
        "title": "Post-eclipse wrap and departure window",
        "duration": "Morning – afternoon",
        "description": "Optional second-day local time in Cyrenaica after the rare long totality, then depart. Eclipse day itself is fixed: Monday 2 August 2027."
      }
    ]
  ],
  "dates": [
    "2027-08-01",
    "2027-08-02",
    "2027-08-03"
  ],
  "description": "Three-day window around the 2 August 2027 total solar eclipse on Libya’s path of totality, centered on Benghazi (~6m 11s totality near 11:31 EET). Astronomy timings confirmed; price null (not a priced tour product).",
  "overview": "On 2 August 2027 a total solar eclipse crosses Morocco, Spain, Algeria, Libya, Egypt, and beyond. In Libya, Benghazi lies deep in the path of totality with roughly 6 minutes 11 seconds of total phase and a high midday Sun—among the longest urban durations in the country.\n\nPartial phases in Benghazi run approximately 10:10am–12:53pm EET, with maximum near 11:31am. Sites such as Tobruk see a deep partial eclipse without totality. Summer desert climatology along the Libyan–Egyptian track favors clear skies.\n\nThis object uses a 1–3 August 2027 travel window around the confirmed eclipse day. price is null. Itinerary is astronomy timing and viewing logistics, not a cultural tour package. Eye safety is mandatory for all non-total phases.",
  "highlights": [
    "Confirmed date: 2 August 2027",
    "Benghazi ~6m 11s totality",
    "Maximum ~11:31am EET",
    "Strong clear-sky prospects in Libya",
    "Path of totality across Cyrenaica"
  ],
  "image": "",
  "images": []
}
```

---

## Sources index

| Topic | URL |
|-------|-----|
| Ghat festival dates 2025 | https://alwasat.ly/news/art-culture/500996 |
| Ghat festival / slogan | https://libya24.tv/2025/12/20/19961/ |
| Ghat closing / mehari | https://www.lananews.com/ar/?p=466851 |
| Ghat background | https://toplist.info/top/ghat-festival-41864.htm |
| Ghadames revival Q4 2026 | https://lana.gov.ly/post.php?id=357396&lang=ar |
| Ghadames festival overview | https://tourslibya.com/festivals/ghadames-festival/ |
| Ghadames calendar / structure | https://www.temehu.com/Calendar.htm |
| Ghadames festival (PL wiki) | https://pl.wikipedia.org/wiki/Ghadames_(festiwal) |
| Rally Te Te 2025 + Nov 2026 | https://libyanlife.com/libyas-te-te-desert-rally-in-waddan/ |
| Rally Te Te coverage | https://www.libyanexpress.com/desert-rally-champions-gather-in-libyas-waddan-for-four-day-event/ |
| Rally Te Te AR | https://afanen.net/%d8%b1%d8%a7%d9%84%d9%8a-%d8%aa%d9%8a-%d8%aa%d9%8a-%d9%88%d8%af%d8%a7%d9%86-2025-%d9%85%d8%ba%d8%a7%d9%85%d8%b1%d8%a9-%d8%a7%d9%84%d8%b5%d8%ad%d8%b1%d8%a7%d8%a1-%d8%aa%d8%b9%d9%88%d8%af/ |
| Eclipse Libya | https://www.timeanddate.com/eclipse/in/libya?iso=20270802 |
| Eclipse Benghazi | https://www.timeanddate.com/eclipse/in/libya/benghazi?iso=20270802 |
| Eclipse Tobruk (partial) | https://www.timeanddate.com/eclipse/in/libya/tobruk?iso=20270802 |
| Eclipse TheSkyLive | https://theskylive.com/solar-eclipse?cc=LY&id=2027-08-02 |
| EclipseWise | https://www.eclipsewise.com/solar/SEprime/2001-2100/SE2027Aug02Tprime.html |
| NASA path | https://eclipse.gsfc.nasa.gov/SEpath/SEpath2001/SE2027Aug02Tpath.html |
| Eclipsophile climatology | https://eclipsophile.com/tse2027/ |
