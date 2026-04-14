// ============================================================
// INITIAL DATA — seeded into Firestore on first run.
// Pulled from the Scouting Playbook + Wedding Context.
// Edit any of this freely; changes here only apply to brand-new
// setups. Once you've loaded data once, edit in-app instead.
// ============================================================

export const SEEDS = {
  meta: {
    weddingDate: null,
    budgetTotal: 20000,
    currency: "USD",
    xcdPerUsd: 2.7,
    updatedAt: new Date().toISOString(),
  },

  // ---------- BUDGET CATEGORIES ----------
  budgetCategories: [
    { id: "venue-catering", name: "Venue & Catering", target: 9000, color: "#0B7A8F" },
    { id: "florals-decor", name: "Florals & Décor", target: 2500, color: "#2A9D8F" },
    { id: "photography-video", name: "Photography / Video", target: 2500, color: "#E76F51" },
    { id: "music-entertainment", name: "Music / Entertainment", target: 1300, color: "#F4A261" },
    { id: "attire", name: "Wedding Attire", target: 800, color: "#E9C46A" },
    { id: "rehearsal-dinner", name: "Rehearsal Dinner", target: 1800, color: "#264653" },
    { id: "officiant-gift", name: "Officiant Thank-You Gift", target: 300, color: "#6BAE7E" },
    { id: "transport-logistics", name: "Transportation & Guest Logistics", target: 500, color: "#FF7E5F" },
    { id: "stationery-website", name: "Stationery / Website", target: 200, color: "#A8DADC" },
    { id: "contingency", name: "Contingency", target: 1100, color: "#8D99AE" },
  ],

  budgetLineItems: [],

  // ---------- VENUES ----------
  venues: [
    {
      id: "pigeon-island",
      name: "Pigeon Island Ruins",
      area: "Rodney Bay, north",
      tags: ["symbolic", "historic", "sunset"],
      status: "shortlist",
      scores: {},
      notes: "Free-standing ruins, dramatic, weather-exposed. Plan B required.",
      links: [],
    },
    {
      id: "villa-capri",
      name: "Villa Capri",
      area: "Cap Estate",
      tags: ["villa", "private", "views"],
      status: "shortlist",
      scores: {},
      notes: "Hilltop villa, privacy, requires full catering & rentals.",
      links: [],
    },
    {
      id: "cap-maison",
      name: "Cap Maison",
      area: "Cap Estate",
      tags: ["resort", "boutique", "cliffside"],
      status: "shortlist",
      scores: {},
      notes: "Small luxury resort, Rock Maison for ceremonies.",
      links: [],
    },
    {
      id: "the-landings",
      name: "The Landings",
      area: "Rodney Bay",
      tags: ["resort", "beach", "room-blocks"],
      status: "shortlist",
      scores: {},
      notes: "Full-service resort with villas for family.",
      links: [],
    },
    {
      id: "windjammer",
      name: "Windjammer Landing",
      area: "Labrelotte Bay",
      tags: ["resort", "villa-rooms", "all-inclusive-opt"],
      status: "shortlist",
      scores: {},
      notes: "Ocean-front villas, several ceremony locations.",
      links: [],
    },
    {
      id: "sandals-grande",
      name: "Sandals Grande",
      area: "Pigeon Island Causeway",
      tags: ["all-inclusive", "adults-only", "packages"],
      status: "shortlist",
      scores: {},
      notes: "All-inclusive; turnkey packages but vendor flexibility limited.",
      links: [],
    },
  ],

  // Criteria used for scoring — matches the Venue Scorecard xlsx.
  scoreCriteria: [
    { id: "ceremony-setting", label: "Ceremony setting & views", weight: 5 },
    { id: "reception-space", label: "Reception space & flow", weight: 4 },
    { id: "all-in-cost", label: "All-in cost (for our guest count, USD)", weight: 5 },
    { id: "guest-experience", label: "Guest experience & accessibility", weight: 3 },
    { id: "vendor-flexibility", label: "Vendor & catering flexibility", weight: 3 },
    { id: "weather-backup", label: "Weather backup / Plan B", weight: 3 },
    { id: "coordinator", label: "On-site coordinator responsiveness", weight: 3 },
    { id: "photography-potential", label: "Photography potential", weight: 3 },
    { id: "rehearsal-onsite", label: "Rehearsal dinner on-site", weight: 2 },
    { id: "room-block", label: "Hotel / room block availability", weight: 2 },
    { id: "vibe", label: "Vibe / gut feel", weight: 3 },
  ],

  // ---------- TRIP ITINERARY (Apr 18–27, 2026) ----------
  tripDays: [
    { date: "2026-04-18", label: "Day 1 · Sat", title: "Arrive in Saint Lucia", sub: "Settle in with family. Hydrate, light dinner, early night.", items: ["Land UVF", "Pick up car from Devan's dad", "Dinner in / family catch-up"] },
    { date: "2026-04-19", label: "Day 2 · Sun", title: "Reset + Pigeon Island scouting walk", sub: "Informal visit — feel the ruins, check light, map angles for Plan A photos.", items: ["Morning coffee with Devan's family", "Pigeon Island afternoon walk", "Dinner at Rodney Bay"] },
    { date: "2026-04-20", label: "Day 3 · Mon", title: "Villa Capri + Cap Maison visits", sub: "North-coast villa + resort pairing. Bring scorecard, ask about all-in USD pricing.", items: ["Villa Capri tour (AM)", "Lunch nearby", "Cap Maison tour (PM)", "Debrief notes over dinner"] },
    { date: "2026-04-21", label: "Day 4 · Tue", title: "The Landings + Windjammer Landing", sub: "Resort day — focus on room blocks, family villas, rehearsal dinner options.", items: ["The Landings tour", "Windjammer tour", "Compare rate sheets"] },
    { date: "2026-04-22", label: "Day 5 · Wed", title: "Sandals Grande + breather", sub: "Morning tour, afternoon rest. Process what we've seen.", items: ["Sandals Grande tour", "Beach afternoon", "Score all venues seen so far"] },
    { date: "2026-04-23", label: "Day 6 · Thu", title: "Photographer meetings + vendors", sub: "Ideally meet 1–2 photographers in person; walk through shot list.", items: ["Photographer meet #1", "Photographer meet #2 (if possible)", "Florist / officiant coffee"] },
    { date: "2026-04-24", label: "Day 7 · Fri", title: "Photo shoot day (Plan A + B)", sub: "Golden-hour beach + Pigeon Island ruins. Backup: overcast = next day.", items: ["Beach shoot — sunrise or 5pm", "Outfit change", "Pigeon Island sunset"] },
    { date: "2026-04-25", label: "Day 8 · Sat", title: "Photo shoot backup + re-visit favorite", sub: "Redo anything weather killed. Re-tour top 1–2 venues with fresh eyes.", items: ["Re-shoots if needed", "Second visit to top venue(s)", "Test tasting if offered"] },
    { date: "2026-04-26", label: "Day 9 · Sun", title: "Decision day + planner meeting", sub: "Lock the venue, confirm date, draft deposits. Family dinner.", items: ["Morning: rank venues final", "Afternoon: meet planner to decide", "Send holds / deposits", "Family celebration dinner"] },
    { date: "2026-04-27", label: "Day 10 · Mon", title: "Return home", sub: "Buffer morning in case of late negotiations.", items: ["Final vendor emails", "Pack", "Fly out"] },
  ],

  // ---------- SITE-VISIT CHECKLIST (per venue) ----------
  siteChecklist: [
    { group: "Physical walk-through", items: [
      "Ceremony location — light at planned time?",
      "Reception space flow — bar, dance, seating",
      "Photography spots — 3 distinct backgrounds",
      "Weather backup space — actual room or vague tent?",
      "Getting-ready rooms for couple",
      "Restroom access & quality",
      "Parking / drop-off logistics",
    ]},
    { group: "Operations & cost", items: [
      "All-in price for our guest count in USD",
      "Service charge + taxes included?",
      "Minimums — food, beverage, room nights",
      "Vendor policy — outside vendors allowed?",
      "Corkage / cake-cutting fees",
      "Rental needs (tables, chairs, linens, sound)",
      "Deposit schedule + cancellation policy",
    ]},
    { group: "Hospitality", items: [
      "Room block availability & pricing",
      "Rehearsal dinner on-site — same venue or restaurant?",
      "Coordinator — response time in our email thread so far?",
      "How many other events that weekend?",
      "Sound / noise curfew",
    ]},
    { group: "Gut check", items: [
      "Would Devan's family feel welcome here?",
      "Would guests say 'wow' when they walk in?",
      "Does the space match our ceremony intention?",
      "Any red flags in the tour — rushed, vague, dismissive?",
    ]},
  ],

  // ---------- PHOTO SHOOT LIST (Plans A/B/C/D from playbook) ----------
  photoShots: [
    { plan: "Plan A — Pigeon Island, sunset", shots: [
      "Full-length formal on the ruins steps",
      "Close-up portrait framed by stone arch",
      "Candid walking shot along the old walls",
      "Silhouette against sunset ocean",
      "Hands / rings detail with ruins texture behind",
    ]},
    { plan: "Plan B — Beach golden hour", shots: [
      "Barefoot walking shot toward the water",
      "Embrace with waves behind",
      "Devan lifting Ordy / laugh shot",
      "Wide landscape with us small in frame",
      "Sand / footprint detail shot",
    ]},
    { plan: "Plan C — Villa / lifestyle", shots: [
      "Cozy couple on the villa balcony",
      "Coffee & slow morning flat-lay",
      "Candid looking at each other near big window",
      "Detail of tropical flower arrangement",
    ]},
    { plan: "Plan D — 'We were here' symbolic", shots: [
      "Site we fell in love with first — statement portrait",
      "Street or local spot meaningful to Devan's family",
      "Handheld polaroid / note detail",
      "Group portrait with Devan's parents (if available)",
    ]},
  ],

  // ---------- MILESTONES / TIMELINE ----------
  milestones: [
    { id: "m-visit", date: "2026-04-18", title: "Scouting trip begins", sub: "Apr 18–27 in Saint Lucia", done: false },
    { id: "m-decide", date: "2026-04-26", title: "Venue decision", sub: "Rank venues, meet planner", done: false },
    { id: "m-deposit", date: "2026-05-10", title: "Primary venue deposit", sub: "Target: within 2 weeks of decision", done: false },
    { id: "m-date-lock", date: "2026-05-15", title: "Lock the date", sub: "Confirm wedding day officially", done: false },
    { id: "m-std", date: "2026-06-01", title: "Send save-the-dates", sub: "Especially important — international travel", done: false },
    { id: "m-photog", date: "2026-06-15", title: "Book photographer", sub: "Contract + deposit", done: false },
    { id: "m-website", date: "2026-07-01", title: "Launch wedding website", sub: "With photos from Apr shoot", done: false },
    { id: "m-invites", date: "2026-11-01", title: "Send invitations", sub: "~3–4 months before wedding", done: false },
    { id: "m-rsvp", date: "2026-12-15", title: "RSVPs due", sub: "Final headcount for venue", done: false },
    { id: "m-final-walk", date: "2027-02-01", title: "Final vendor walkthrough", sub: "Timeline with planner", done: false },
  ],

  // ---------- PACKING LIST (trip) ----------
  packingList: [
    { group: "Documents & essentials", items: [
      "Passports",
      "Travel insurance card",
      "Flight confirmations (offline copy)",
      "Trip itinerary (offline copy)",
      "List of all vendor contacts",
      "Scouting playbook PDF on phone",
    ]},
    { group: "Site visits", items: [
      "Notebook + pens",
      "Printed venue scorecard (backup)",
      "Measuring tape (for venue spaces)",
      "Phone charger + battery pack",
      "Comfortable walking shoes",
    ]},
    { group: "Photo shoot outfits", items: [
      "Outfit 1 — beach (light, flowing)",
      "Outfit 2 — formal portraits (elevated)",
      "Outfit 3 — villa lifestyle (cozy)",
      "Swimwear",
      "Jewelry / accessories",
      "Hair / makeup touch-up kit",
    ]},
    { group: "Tropical basics", items: [
      "Reef-safe sunscreen",
      "Bug repellent",
      "Hats / sunglasses",
      "Swimsuits (x2 each)",
      "Flip-flops",
      "Light rain jacket (April showers)",
    ]},
  ],

  // ---------- SCRATCHPAD / INSPIRATION ----------
  inspirationItems: [],
  inspirationCategories: ["All", "Ceremony", "Décor", "Attire", "Food", "Paper", "Photography"],
};
