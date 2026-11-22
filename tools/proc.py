from PIL import Image, ImageOps
import glob, os, json
Image.MAX_IMAGE_PIXELS=None
M="/Users/nicky/Documents/Wildara/Media/"; O="/Users/nicky/Documents/Wildara/Site/assets/img/"
names="giraffe-pair binocular-girls sunset-acacia elephant-mara migration-crossing wildebeest-walk buffalo-serengeti buffalo-birds cheetah-mound cheetahs-resting child-binoculars sundowner-couple elephant-vehicle elephants-pair giraffes-tall lone-acacia-herd elephant-herd zebra-herd lion-lioness lioness-grass lions-resting lone-tree ostrich-tree silhouette-vehicle sunset-tree boy-vehicle zanzibar-dhow migration-watchers zanzibar-pier zanzibar-turquoise zanzibar-aerial zebras-mist wildebeest-grass zebras-pair".split()
fs=sorted(f for f in glob.glob(M+"*") if os.path.isfile(f))
meta={}
for f,n in zip(fs,names):
    im=ImageOps.exif_transpose(Image.open(f)).convert("RGB")
    w,h=im.size; meta[n]=[w,h]
    for tw, suffix, q in ((640, "s", 82), (960, "t", 82), (1280, "m", 82), (2400, "l", 80)):
        tw = min(tw, w)
        r = im.resize((tw, round(h * tw / w)), Image.LANCZOS)
        r.save(f"{O}{n}-{suffix}.webp", "WEBP", quality=q, method=6)
    print(n, flush=True)
json.dump(meta,open(O+"../data/img-meta.json","w"))
