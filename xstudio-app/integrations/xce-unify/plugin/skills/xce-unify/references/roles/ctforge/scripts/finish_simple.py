#!/usr/bin/env python3
"""Compose an SVG production document with embedded artwork and fixed typography."""
import argparse,base64,json
from pathlib import Path
from html import escape
from PIL import Image,ImageFont

VIEWS=['front_full','side_90_full','three_quarter_full','rear_full','front_bust','profile_90_bust']

def finish(image,name,inspection,output):
    image=Path(image).resolve();output=Path(output).resolve()
    if output==image:raise ValueError('Never overwrite source artwork')
    if output.exists():raise ValueError('Choose a new output version')
    if output.suffix.lower()!='.svg':raise ValueError('Output must be .svg')
    if not isinstance(name,str) or not name.strip() or any(ord(c)<32 for c in name):raise ValueError('A literal nonempty name is required')
    if Path(inspection.get('source_path','')).resolve()!=image:raise ValueError('Inspection does not identify this image')
    if inspection.get('layout')!='six_columns' or inspection.get('views')!=VIEWS:raise ValueError('Six-column inspection required')
    for k in ['inspected','body_and_face_framing_ok','gray_studio','identity_and_wardrobe_ok','text_free']:
        if inspection.get(k) is not True:raise ValueError('Required observed check: '+k)
    with Image.open(image) as im:
        fmt=im.format
        if fmt not in ['PNG','JPEG','WEBP']:raise ValueError('Unsupported artwork format')
        im.verify()
    mime={'PNG':'image/png','JPEG':'image/jpeg','WEBP':'image/webp'}[fmt]
    size=42
    while size>=18:
        font=ImageFont.truetype('DejaVuSans.ttf',size)
        if font.getlength(name)<=1760:break
        size-=1
    if size<18:raise ValueError('Name is too long for a legible footer')
    data=base64.b64encode(image.read_bytes()).decode('ascii')
    labels=['1. FRONT (FULL BODY)','2. SIDE 90° (FULL BODY)','3. 3/4 (FULL BODY)','4. REAR (FULL BODY)','5. FRONT FACE','6. PROFILE FACE 90°']
    parts=['<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1920" height="1080" viewBox="0 0 1920 1080">',
           '<rect width="1920" height="1080" fill="#808080"/>',
           f'<image x="0" y="0" width="1920" height="980" preserveAspectRatio="xMidYMid meet" xlink:href="data:{mime};base64,{data}"/>',
           '<rect x="0" y="980" width="1920" height="100" fill="#000"/>',
           '<g fill="#fff" font-family="DejaVu Sans, Arial, sans-serif" text-anchor="middle">']
    for i,label in enumerate(labels):parts.append(f'<text x="{160+320*i}" y="1004" font-size="15">{escape(label)}</text>')
    parts.append(f'<text id="character-name" x="960" y="1061" font-size="{size}">{escape(name)}</text>')
    parts.extend(['</g>','</svg>'])
    output.write_text('\n'.join(parts),encoding='utf-8')
    return str(output)

def main():
    p=argparse.ArgumentParser(description=__doc__)
    for k in ['image','name','inspection','output']:p.add_argument('--'+k,required=True)
    a=p.parse_args()
    print(finish(a.image,a.name,json.loads(Path(a.inspection).read_text()),a.output))
if __name__=='__main__':main()

