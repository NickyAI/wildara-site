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

json.dump(D, open(P, "w"), ensure_ascii=False, separators=(",", ":"))
open(os.path.join(SITE, "assets/js/safaris-data.js"), "w").write("window.WILDARA_SAFARIS=" + json.dumps(D, ensure_ascii=False, separators=(",", ":")) + ";")
for s in D:
    print(f'{s["days"]:>2} {s["title"][:44]:44} ' + " > ".join(f'{r["k"]}{r["days"]}' for r in s["route"]))
