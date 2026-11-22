import json
p="/Users/nicky/Documents/Wildara/Site/assets/data/safaris.json"
D=json.load(open(p))
ren={"Lake Manyara And Ngorongoro Hidden Facts":"Lake Manyara & Ngorongoro Hidden Facts",
"Spectacular Tanzania Big Cats, Big fives animals & Cultural experience Tour":"Spectacular Tanzania: Big Cats, Big Five & Culture",
"Arusha NP, Tarangire and Ngorongoro Crater Budget":"Arusha NP, Tarangire & Ngorongoro Crater",
"Manyara, Serengeti and Ngorongoro Budget Tour":"Manyara, Serengeti & Ngorongoro",
"Serengeti and Ngorongoro Budget Tour":"Serengeti & Ngorongoro Essentials",
"Beauty of Serengeti and Ngorongoro Midrange":"Beauty of Serengeti & Ngorongoro",
"Tanzania Authentic Wildlife Midrange":"Tanzania Authentic Wildlife",
"Tanzania Smart Mid-range safari & Zanzibar Shore":"Tanzania Safari & Zanzibar Shore",
"Arusha NP, Tarangire, Ngorongoro, Eyasi & Manyara Budget":"Arusha NP, Tarangire, Eyasi & Manyara",
"Wildlife safari & Authentic African Culture":"Wildlife Safari & Authentic African Culture",
"Great Migration safari & Zanzibar Beach":"Great Migration Safari & Zanzibar Beach",
"Arusha NP, Tarangire, Serengeti, Ngorongoro & Manyara Program":"The Complete Northern Circuit",
"Tarangire, Serengeti, Ngorongoro & Manyara Perfect":"The Perfect Northern Circuit",
}
pools={"migration":["migration-crossing","wildebeest-walk","migration-watchers","wildebeest-grass"],
"zanzibar":["zanzibar-aerial","zanzibar-dhow","zanzibar-turquoise","zanzibar-pier"],
"culture":["sunset-tree","buffalo-birds","silhouette-vehicle"],
"bigfive":["lion-lioness","buffalo-serengeti","elephant-mara"],
"serengeti":["cheetah-mound","lions-resting","lone-acacia-herd","zebras-pair","lioness-grass","cheetahs-resting","lone-tree"],
"other":["elephant-herd","elephants-pair","giraffes-tall","zebra-herd","elephant-vehicle","zebras-mist","ostrich-tree","giraffe-pair"]}
cnt={k:0 for k in pools}
def take(k):
    v=pools[k][cnt[k]%len(pools[k])]; cnt[k]+=1; return v
for s in D:
    s["title"]=ren.get(s["title"],s["title"])
    s["destinations"]=s["destinations"].strip(" .").replace("crater","Crater")
    imgs=[]
    for t in s["themes"]: imgs.append(take(t))
    if "serengeti" in s["destinations"].lower(): imgs.append(take("serengeti"))
    while len(imgs)<4: imgs.append(take("other"))
    # unique
    u=[];[u.append(i) for i in imgs if i not in u]
    while len(u)<4: u.append(take("other"))
    s["images"]=u[:4]
    s["from"]=min(x[1] for x in s["prices"]) if s["prices"] else None
json.dump(D,open(p,"w"),ensure_ascii=False,separators=(",",":"))
print(json.dumps(D[18]["itinerary"][2],indent=1)[:800]); print(D[18]["intro"], D[18]["images"])
