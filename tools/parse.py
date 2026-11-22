import docx, glob, os, re, json, hashlib
out=[]; seen=set()
def slug(s): return re.sub(r'[^a-z0-9]+','-',s.lower()).strip('-')
for f in sorted(glob.glob("/Users/nicky/Documents/Wildara/Itineraries/*.docx")):
    b=os.path.basename(f)
    if "(1)" in b: continue
    d=docx.Document(f)
    P=[p.text.strip() for p in d.paragraphs if p.text.strip()]
    m=re.match(r'(\d+)_?\s*DAYS?_\s*(.+?)_(Safari|Tour|SAFARI)',b,re.I)
    days=int(m.group(1)); title=m.group(2).strip()
    title=re.sub(r'\bSupper\b','Super',title); title=title.replace('&M','& M').replace(' river',' River').replace(' crossing',' Crossing')
    if title.isupper(): title=title.title()
    title=re.sub(r'\s+',' ',title)
    # intro
    intro=[]; i=0
    while i<len(P) and not P[i].upper().startswith("SAFARI HIGHLIGHT"):
        if P[i]!="INTRODUCTION": intro.append(P[i])
        i+=1
    tagline=intro[0] if intro else ""
    introtext=intro[1:]
    hl={}
    for p in P[i:i+12]:
        if ':' in p:
            k,v=p.split(':',1); k=k.strip().lower()
            if k in("destinations","guide","safari category","transport type"): hl[k]=v.strip()
    # days
    dl=[]; cur=None; parkdesc={}
    for j,p in enumerate(P):
        md=re.match(r'Day\s*(\d+)\s*:\s*(.+)',p)
        if md:
            cur={"day":int(md.group(1)),"title":re.sub(r'\(.*?\)','',md.group(2)).strip(" \t-"),"transfer":"","program":"","stay":""}
            dl.append(cur); continue
        if not cur: continue
        if p.startswith("Transfer") and not cur["transfer"] and ':' in p and len(p)<120: cur["transfer"]=p.split(':',1)[0].replace("Transfer","").strip()+" · "+p.split(':',1)[1].strip() if p.count(':') else p
        elif p.startswith("Program:") and not cur["program"]: cur["program"]=p[8:].strip()
        elif re.match(r'(Accommodation|Overnight)\s*:',p) and not cur["stay"]: cur["stay"]=p.split(':',1)[1].strip()
        elif p.startswith("Safari Price"): cur=None
    # tables
    acc=[];price=[]
    for tb in d.tables:
        rows=[[c.text.strip() for c in r.cells] for r in tb.rows]
        h=rows[0][0].lower()
        if h.startswith("accommodation"): acc=[{"name":r[0],"loc":r[1],"nights":r[2],"basis":r[3]} for r in rows[1:] if r[0]]
        if h.startswith("group"):
            for r in rows[1:]:
                n=re.findall(r'\d+',r[0]); v=re.sub(r'[^\d]','',r[1])
                if n and v: price.append([int(n[0]),int(v)])
    def section(start,stop):
        try: a=next(k for k,p in enumerate(P) if p.startswith(start))
        except StopIteration: return []
        res=[]
        for p in P[a+1:]:
            if any(p.startswith(s) for s in stop): break
            res.append(p)
        return res
    inc=section("Included in the",["Excluded"]); exc=section("Excluded from",["Optional"])
    tl=(title+" "+b).lower()
    themes=[]
    if "migration" in tl or "mara" in tl or "calving" in tl: themes.append("migration")
    if "zanzibar" in tl: themes.append("zanzibar")
    if "cultur" in tl or "eyasi" in tl: themes.append("culture")
    if "big five" in tl or "big cat" in tl or "big fives" in tl: themes.append("bigfive")
    tier="Budget" if "budget" in tl else ("Mid-range" if "mid" in tl else "Classic")
    sid=f"{days}-days-"+slug(title)
    if sid in seen: continue
    seen.add(sid)
    out.append(dict(id=sid,days=days,title=title,tagline=tagline,intro=introtext,destinations=hl.get("destinations",""),category=hl.get("safari category","Private Safari").strip(" ."),transport=hl.get("transport type",""),tier=tier,themes=themes,itinerary=dl,accommodation=acc,prices=price,included=inc,excluded=exc))
out.sort(key=lambda x:(x["days"],x["title"]))
json.dump(out,open("/Users/nicky/Documents/Wildara/Site/assets/data/safaris.json","w"),ensure_ascii=False,indent=1)
for o in out: print(o["days"],o["tier"],o["themes"],o["title"],"|",o["destinations"][:60],"|",len(o["itinerary"]),"days |",o["prices"][:1],o["prices"][-1:])
