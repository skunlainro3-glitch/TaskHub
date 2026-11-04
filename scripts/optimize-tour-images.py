"""Create responsive WebP thumbnails from existing, approved tour photos.
No photos or tour facts are generated. Run with Python + Pillow, not at runtime.
"""
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.parse import urlparse
from urllib.error import HTTPError
from PIL import Image, ImageOps
import hashlib, io, json, sys
sys.stdout.reconfigure(encoding='utf-8')
root=Path(__file__).resolve().parent.parent
cache=root/'work'/'image-sources';cache.mkdir(parents=True,exist_ok=True)
dest=root/'public'/'images'/'optimized';dest.mkdir(parents=True,exist_ok=True)
catalog=json.loads((root/'catalog'/'enviet-tours.json').read_text(encoding='utf-8'))
sources={t.get('sourceImage') or t.get('image') for t in catalog['tours']}
sources.discard(None)
sources.update('/images/tours/'+p.name for p in (root/'public/images/tours').glob('*.jpg'))
index={};unavailable=[];original_bytes=0;optimized_bytes=0
for source in sorted(sources):
    key=hashlib.sha256(source.encode()).hexdigest()[:12]
    if source.startswith('/images/'):
        raw=(root/'public'/source.lstrip('/')).read_bytes()
    else:
        if urlparse(source).scheme!='https' or urlparse(source).netloc!='dulichenvietcs.netlify.app':
            raise ValueError('Source must be from the approved tour catalog')
        saved=cache/(key+'.img')
        if saved.exists():raw=saved.read_bytes()
        else:
            try:
                with urlopen(Request(source,headers={'User-Agent':'TaskHub-image-optimization/1.0'}),timeout=30) as response:
                    if not response.headers.get('Content-Type','').startswith('image/'):raise ValueError('Not an image')
                    raw=response.read(12_000_001)
            except HTTPError as error:
                if error.code==404:
                    unavailable.append(source);print('Unavailable source photo:',urlparse(source).path);continue
                raise
            if len(raw)>12_000_000:raise ValueError('Source image too large')
            saved.write_bytes(raw)
    original_bytes+=len(raw)
    im=ImageOps.exif_transpose(Image.open(io.BytesIO(raw))).convert('RGB')
    variants=[]
    for width in sorted({min(480,im.width),min(960,im.width)}):
        thumb=im.resize((width,max(1,round(im.height*width/im.width))),Image.Resampling.LANCZOS)
        file=dest/(key+'-'+str(width)+'.webp');thumb.save(file,'WEBP',quality=74,method=6)
        variants.append({'url':'/images/optimized/'+file.name,'width':thumb.width,'height':thumb.height,'bytes':file.stat().st_size})
    largest=variants[-1];optimized_bytes+=largest['bytes']
    index[source]={'image':largest['url'],'width':largest['width'],'height':largest['height'],'srcSet':', '.join(v['url']+' '+str(v['width'])+'w' for v in variants)}
(root/'src'/'tour-image-variants.mjs').write_text('// Generated from approved source photos by scripts/optimize-tour-images.py.\nexport const tourImageVariants = '+json.dumps(index,ensure_ascii=False,indent=2)+';\nexport const unavailableTourImageSources = '+json.dumps(unavailable,ensure_ascii=False,indent=2)+';\n',encoding='utf-8')
print(json.dumps({'photos':len(index),'source_bytes':original_bytes,'largest_webp_bytes':optimized_bytes,'reduction_percent':round((1-optimized_bytes/original_bytes)*100,1)}))
