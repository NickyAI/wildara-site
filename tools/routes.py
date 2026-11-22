"""Adds a map route (ordered stops with day numbers) and an 8-photo gallery to each safari,
then regenerates Site/assets/js/safaris-data.js. Run after parse.py + polish.py."""
import json, re, os

SITE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "Site")
P = os.path.join(SITE, "assets/data/safaris.json")
D = json.load(open(P))

# keyword -> map node (checked by position in the day title, so order is preserved)
KEYS = [
    (r"arusha national park", "arushanp"), (r"serval", "arusha"),
    (r"tarangire", "tarangire"), (r"manyara", "manyara"),
    (r"eyasi", "eyasi"), (r"ndutu|southern serengeti", "ndutu"),
    (r"northern serengeti|mara heritage", "mara"),
    (r"central serengeti|serengeti", "serengeti"),
    (r"ngorongoro", "ngorongoro"),
    (r"karatu|kankari|farm of dreams|eileen|marera|olea", "karatu"),
    (r"zanzibar|stone town|nungwi|matemwe|villa kiva", "zanzibar"),
    (r"arusha|arrival|kibo palace|gold crest|fun retreat|planet lodge|airport|departure|end of itinerary", "arusha"),
]

GALLERY = {
    "tarangire": ["elephant-herd", "elephants-pair", "giraffes-tall", "buffalo-birds"],
    "manyara": ["elephants-pair", "giraffe-pair", "zebra-herd"],
    "ngorongoro": ["buffalo-serengeti", "zebras-mist", "lions-resting", "child-binoculars"],
    "serengeti": ["cheetah-mound", "lion-lioness", "lioness-grass", "lone-acacia-herd", "cheetahs-resting", "lone-tree", "zebras-pair"],
    "mara": ["migration-crossing", "migration-watchers", "wildebeest-grass", "elephant-mara"],
    "ndutu": ["wildebeest-walk", "ostrich-tree", "cheetahs-resting"],
    "eyasi": ["sunset-tree", "silhouette-vehicle"],
    "arushanp": ["giraffe-pair", "buffalo-birds"],
    "arusha": ["sundowner-couple"],
    "karatu": ["sundowner-couple"],
    "zanzibar": ["zanzibar-aerial", "zanzibar-dhow", "zanzibar-turquoise", "zanzibar-pier"],
}
FILL = ["binocular-girls", "elephant-vehicle", "sunset-acacia", "silhouette-vehicle", "zebra-herd", "boy-vehicle"]


def stops_in(title):
    t = title.lower()
    found = []
    for pat, key in KEYS:
        for m in re.finditer(pat, t):
            # don't let generic "serengeti" re-match inside a more specific phrase
            if key == "serengeti" and re.search(r"(northern|southern) serengeti|serengeti ndutu", t[max(0, m.start() - 9):m.end() + 6]):
                continue
            if key == "arusha" and "arusha national park" in t[m.start():m.start() + 22]:
                continue
            found.append((m.start(), key))
    found.sort()
    out = []
    for _, k in found:
        if not out or out[-1] != k:
            out.append(k)
    return out


def money(n):
    return "${:,}".format(n)


def safari_faqs(s):
    """Itinerary FAQs, written from the safari's own data (shown on the page and in FAQPage JSON-LD)."""
    keys = [r["k"] for r in s["route"]]
    prices = sorted(s["prices"])
    mn, mx = prices[0][0], prices[-1][0]
    two = next((p for g, p in prices if g == max(2, mn)), prices[0][1])
    if "mara" in keys:
        when = ("This journey is built around the Mara River crossings in the northern Serengeti, which usually happen between July "
                "and early October. August and September are the most reliable months. Herds move with the rains, so no date is "
                "guaranteed, but our guides follow daily reports to give you the best chance.")
    elif "ndutu" in keys:
        when = ("This safari is designed for calving season on the southern plains around Ndutu, roughly January to March, with "
                "February usually the peak. It is a green, dramatic time with excellent predator activity and fewer vehicles than "
                "the northern crossings.")
    else:
        when = ("The parks on this route are rewarding all year. The dry season from June to October brings easy game viewing around "
                "water, while the green season from November to May offers lush landscapes, newborn animals, quieter parks and often "
                "better lodge availability. We will suggest the best dates for what you want to see.")
    lodges = list(dict.fromkeys(a["name"] for a in s["accommodation"]))
    crater = ", the Ngorongoro Crater service fee" if "ngorongoro" in keys else ""
    end = ("The journey continues by short domestic flight to Zanzibar, and ends with a transfer for your international flight."
           if "zanzibar" in keys else
           "On the final day we drop you at the airport about three hours before your international flight.")
    return [
        {"q": "Is this a private safari?", "a": "Yes. Every Wildara safari is private, so the vehicle, the guide and the pace are yours alone. You travel in a 4x4 Toyota Land Cruiser with a pop-up roof, binoculars, charging points and mineral water on board, with a professional English-speaking guide throughout."},
        {"q": f"How much does the {s['days']}-day safari cost?", "a": f"Prices are per person in USD and depend on group size: {money(two)} per person for {max(2, mn)} travellers, falling to {money(prices[-1][1])} per person for a group of {mx}. Larger groups are quoted on request. Prices may change before full payment, as set out in our terms and conditions."},
        {"q": "When is the best time to do this safari?", "a": when},
        {"q": "What is included in the price?", "a": f"Airport transfers, a private 4x4 safari vehicle and guide, all park entrance and conservation fees{crater}, all game drives listed, accommodation on the stated meal basis, picnic lunches on game drives, drinking water and government taxes. International flights, visas, travel insurance, tips and drinks at lodges are not included."},
        {"q": "Where does the safari start and finish?", "a": "Your guide meets you at Kilimanjaro International Airport or Arusha Airport on day 1 and transfers you to your hotel. " + end},
        {"q": "Where will we stay?", "a": f"This itinerary uses {', '.join(lodges)}. Each is chosen for its location, comfort and warm service. If you would like to upgrade to a more exclusive camp or change the style of accommodation, we will happily adjust the proposal."},
        {"q": "Can we change or extend the itinerary?", "a": "Of course. Every itinerary is a starting point. We can add nights, swap parks, include a hot-air balloon flight or walking safari, or add a few days on Zanzibar. Tell us what matters to you and we will reshape the route and the price."},
        {"q": "How do we book, and what deposit is needed?", "a": "Send an enquiry and we will reply with a tailored proposal. A 30% non-refundable deposit confirms your booking, and the balance is due 45 to 60 days before travel. Bookings made within 60 days of travel are paid in full at booking."},
    ]


for s in D:
    route = []
    for d in s["itinerary"]:
        ks = stops_in(d["title"]) or (stops_in(d.get("stay", "")) if d.get("stay") else [])
        if d["day"] == 1 and (not ks or ks[0] != "arusha"):
            ks = ["arusha"] + ks          # every journey starts at Arusha / Kilimanjaro
        for k in ks:
            if route and route[-1]["k"] == k:
                if d["day"] not in route[-1]["days"]:
                    route[-1]["days"].append(d["day"])
            else:
                route.append({"k": k, "days": [d["day"]]})
    s["route"] = route

    seen = list(s["images"])
    for stop in route:
        for im in GALLERY.get(stop["k"], []):
            if im not in seen:
                seen.append(im)
    for im in FILL:
        if len(seen) >= 8:
            break
        if im not in seen:
            seen.append(im)
    s["gallery"] = seen[:8]
    s["faqs"] = safari_faqs(s)

json.dump(D, open(P, "w"), ensure_ascii=False, separators=(",", ":"))
open(os.path.join(SITE, "assets/js/safaris-data.js"), "w").write("window.WILDARA_SAFARIS=" + json.dumps(D, ensure_ascii=False, separators=(",", ":")) + ";")
for s in D:
    print(f'{s["days"]:>2} {s["title"][:44]:44} ' + " > ".join(f'{r["k"]}{r["days"]}' for r in s["route"]))
