#!/usr/bin/env python3
"""Render xstudio's fixed 16:9 blank SVG template; no generated character content."""
import argparse,json,textwrap
from html import escape
from pathlib import Path

def render(name,items,details,prompt,mode="simple",artwork_only=False):
    if artwork_only:
        if mode!='simple' or items or details or prompt:raise ValueError('Artwork-only template is simple with no extras')
        parts=['<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="980" viewBox="0 0 1920 980">','<rect width="1920" height="980" fill="#808080"/>']
        for i in range(1,6):parts.append(f'<rect x="{320*i-3}" y="0" width="6" height="980" fill="#000"/>')
        return '\n'.join(parts+['</svg>'])
    if mode not in {"simple","complex"}:raise ValueError("mode must be simple or complex")
    if mode=="simple" and (items or details or prompt):raise ValueError("Simple anchors contain only six views; extra panels/text are forbidden")
    if not name.strip():raise ValueError('A supplied character name is required')
    if items and (1430-12*(len(items)-1))/len(items)<110:raise ValueError('Equipment panels would be too narrow to read; resolve overflow before rendering')
    if details and (1430-12*(len(details)-1))/len(details)<110:raise ValueError('Detail panels would be too narrow to read; select useful details or resolve overflow')
    if len(prompt.split())>85:raise ValueError('Keep the panel prompt readable: at most 85 words')
    out=['<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">','<rect width="1920" height="1080" fill="#ededed"/>','<g font-family="Arial, sans-serif" fill="#171717">']
    def text(x,y,t,size=17,anchor='start',color='#171717'):
        out.append(f'<text x="{x}" y="{y}" font-size="{size}" text-anchor="{anchor}" fill="{color}">{escape(t)}</text>')
    def panel(x,y,w,h,label):
        out.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="none" stroke="#333" stroke-width="2"/>')
        out.append(f'<path d="M{x},{y+34}h{w}" stroke="#777"/>');text(x+w/2,y+23,label,min(16,max(10,(w-16)/max(1,len(label))/.6)),'middle')
    if mode=='simple':
        labels=['1. FRONT (FULL BODY)','2. SIDE 90° (FULL BODY)','3. 3/4 (FULL BODY)','4. REAR (FULL BODY)','5. FRONT FACE','6. PROFILE FACE 90°']
        out.append('<rect x="0" y="0" width="1920" height="980" fill="#808080"/>')
        for i,label in enumerate(labels):
            if i: out.append(f'<rect x="{320*i-3}" y="0" width="6" height="980" fill="#000"/>')
            out.append(f'<rect x="{320*i}" y="980" width="320" height="36" fill="#000"/>')
            text(320*i+160,1004,label,15,'middle','white')
        out.append('<rect x="0" y="1016" width="1920" height="64" fill="#000"/>')
        text(960,1062,name,min(38,1700/max(1,len(name))/.65),'middle','white')
        return '\n'.join(out+['</g>','</svg>'])
    out.append('<rect x="28" y="16" width="670" height="49" fill="#111"/>')
    text(44,51,name,min(34,1000/max(1,len(name))),color='white')
    text(1892,49,'CHARACTER REFERENCE SHEET | MODEL SHEET ANCHOR',20,'end')
    for i,label in enumerate(['FULL BODY FRONTAL VIEW','FULL BODY SIDE PROFILE (90°)','FULL BODY 3/4 VIEW','FULL BODY REAR VIEW']):
        panel(28+376*i,86,362,966 if mode=="simple" else 526,label)
    panel(1532,86,360,476 if mode=='simple' else 256,'FRONT FACE PORTRAIT');panel(1532,576 if mode=='simple' else 356,360,476 if mode=='simple' else 256,'PROFILE FACE PORTRAIT (90°)')
    if mode=='simple':return '\n'.join(out+['</g>','</svg>'])
    content_x,content_w=28,1430
    if items:
        gap=12;w=(content_w-gap*(len(items)-1))/len(items)
        for i,item in enumerate(items):panel(content_x+i*(w+gap),634,w,188,item)
    detail_y=844 if items else 634;detail_h=208 if items else 418
    if details:
        text(28,detail_y+22,'DETAILS & CALLOUTS',18)
        gap=12;w=(content_w-gap*(len(details)-1))/len(details)
        for i,label in enumerate(details):panel(content_x+i*(w+gap),detail_y+36,w,detail_h-36,label)
    panel(1480,634,412,418,'CHARACTER PROMPT')
    for i,line in enumerate(textwrap.wrap(prompt,width=42)):
        if i>=18:raise ValueError('Character prompt overflows panel; shorten it')
        text(1496,695+i*19,line,16)
    out+=['</g>','</svg>'];return '\n'.join(out)

def rasterize(svg,dest):
    # Deterministic schematic rendering. No model or raster image editing.
    from PIL import Image,ImageDraw,ImageFont
    import xml.etree.ElementTree as ET
    root=ET.fromstring(svg)
    image=Image.new('RGB',(int(root.attrib['width']),int(root.attrib['height'])),'#ededed');draw=ImageDraw.Draw(image)
    for e in root.iter():
        tag=e.tag.rsplit('}',1)[-1];a=e.attrib
        if tag=='rect':
            x,y=float(a.get('x',0)),float(a.get('y',0));w,h=float(a['width']),float(a['height'])
            fill=a.get('fill');outline=a.get('stroke')
            draw.rectangle((x,y,x+w,y+h),fill=None if fill=='none' else fill,outline=outline,width=int(float(a.get('stroke-width',1))))
        elif tag=='path':
            import re
            m=re.fullmatch(r'M([0-9.]+),([0-9.]+)h([0-9.]+)',a['d'])
            if m:
                x,y,w=map(float,m.groups());draw.line((x,y,x+w,y),fill=a.get('stroke','#777'))
        elif tag=='text':
            font=ImageFont.truetype('DejaVuSans.ttf',max(10,int(float(a['font-size']))))
            anchor={'start':'ls','middle':'ms','end':'rs'}[a.get('text-anchor','start')]
            draw.text((float(a['x']),float(a['y'])),e.text or '',font=font,fill=a.get('fill','#171717'),anchor=anchor)
    image.save(dest)

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('job',help='JSON with name, equipment, details, character_prompt');p.add_argument('output',help='.svg or .png path (PNG requires Pillow)');p.add_argument('--artwork-only',action='store_true');a=p.parse_args()
    j=json.loads(Path(a.job).read_text())
    from guardrails import validate
    result=validate(j)
    if not result['ok']:raise ValueError('; '.join(result['errors']))
    svg=render(j['name'],j.get('equipment',[]),j.get('details',[]),j.get('character_prompt',''),j['mode'],a.artwork_only)
    dest=Path(a.output)
    if dest.suffix.lower()=='.png':
        rasterize(svg,dest)
    elif dest.suffix.lower()=='.svg':dest.write_text(svg)
    else:raise ValueError('Output must be SVG or PNG')
    print(str(dest.resolve()))
if __name__=='__main__':main()




