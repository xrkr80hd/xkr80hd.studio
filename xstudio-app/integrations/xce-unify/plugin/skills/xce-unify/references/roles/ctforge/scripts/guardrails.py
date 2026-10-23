#!/usr/bin/env python3
"""Validate declared xstudio jobs and parse direct commands. Does not inspect images."""
import argparse,json,re,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
CONTRACT=json.loads((ROOT/'references/contract.json').read_text())
VOICES={v['name'] for v in json.loads((ROOT/'references/voices.json').read_text())['voices']}
COMMANDS={'RITP','RITPCB','RITPRL','MCS','MCSRL','MCSCB','RIRL','RICB','PTPRL','PTPCB','PTP','LEGEND','RESETREF','XSTUDIOSTRBRD','LOCK','MAP','TOPDOWN','POV','OTS','SHOT','COVERAGE','DIRECT','COMMERCIAL','REPAIR','ANCHOR','NXT','11','123GO'}
CONTROL={'STBY','RPTPLS','RPTALLPLS','RPSPLS','LTSTLK','LTSTOK','ANSR','SHFT'}
NO_IMAGE={'PTPRL','PTPCB','PTP','LEGEND','RESETREF','XSTUDIOSTRBRD','LOCK'}|CONTROL

def parse(text):
    # Only use this for an actual invocation, not conversational command discussion.
    if not isinstance(text,str): return {'command':None,'error':'text must be a string'}
    t=text.strip()
    t=re.sub(r'^@?xstudio\b[\s:]*','',t,flags=re.I).strip()
    if not t or t[0] in '\'"`': return {'command':None,'reason':'quoted or empty input'}
    # Safety controls count when used as an explicit separate line, not inside a name.
    controls=[line.strip().lstrip('/').upper() for line in t.splitlines()]
    stop=next((c for c in controls if c in CONTROL),None)
    inline=re.search(r'(?:^|[.!?;]\s+)(?:/)?(ANSR|STBY|RPTPLS|RPTALLPLS|RPSPLS|LTSTLK|LTSTOK|SHFT)\b\s*:',t,re.I)
    if inline: stop=inline[1].upper()
    if stop: return {'command':stop,'generate':False,'arguments':''}
    t=re.sub(r'^/?RITC\s+(RL|CB)\b',lambda m:'RI'+m[1].upper(),t,flags=re.I)
    t=re.sub(r'^/?(SMPLE|SMPL|SIMPLE)(?=\s|$)',lambda m:'MCS'+m[1].upper(),t,flags=re.I)
    t=re.sub(r'^/?RITP\s+(RL|CB)\b',lambda m:'RITP'+m[1].upper(),t,flags=re.I)
    simple_alias=re.match(r'^/?(MCSRL|MCSCB|MCS)(?:SMPLE|SMPL|SIMPLE)(?=\s|$)',t,re.I)
    if simple_alias:
        t=simple_alias[1].upper()+t[simple_alias.end():]
    m=re.match(r'^/?([A-Za-z0-9]+)(?:\s+(.*))?$',t,re.S)
    if not m or m[1].upper() not in COMMANDS|CONTROL:return {'command':None,'reason':'not a direct known command'}
    c=m[1].upper();args=(m[2] or '').strip()
    out={'command':c,'arguments':args,'generate':c in {'MCS','MCSRL','MCSCB','RIRL','RICB','RITPCB','RITPRL'}}
    if simple_alias: out['mode']='simple'
    if c in {'MCS','MCSRL','MCSCB'}:
        args=re.sub(r'^[—–-]\s*','',args).strip()
        parts=re.split(r'(?:\s+[—–-]\s*)?\s+edit\b\s*:?\s*',args,maxsplit=1,flags=re.I)
        explicit_edit=len(parts)>1
        if not explicit_edit:
            parts=re.split(r'\s+[—–-]\s+',args,maxsplit=1)
        name=parts[0].strip()
        if name.startswith('[') and name.endswith(']'):name=name[1:-1].strip()
        edits=parts[1].strip() if len(parts)>1 else ''
        if edits.startswith('[') and edits.endswith(']'):edits=edits[1:-1].strip()
        out.update(name=name,edits=edits,style_edit=edits,style=c[-2:] if c!='MCS' else 'AUTO',kind='sheet',edit_mode='style' if edits else None)
        if not name:
            out['generate']=False
            out['needs_contextual_name_resolution']=True
        if len(parts)==1 and re.search(r'\s+(add|remove|wearing|with|change|put)\s+',name,re.I):
            out['needs_contextual_name_resolution']=True
            out['generate']=False
    if c=='RITP':
        out.update(generate=False,kind='reinterpretation',requires_style_choice=True,question='CB or RL?')
    elif c in {'RITPCB','RITPRL'}:
        out.update(kind='reinterpretation',style=c[-2:],preserve_source_composition=True)
    if c=='MCS': out['requires_reference_style_resolution']=True
    return out

def validate(job):
    errors=[];counts={}
    if not isinstance(job,dict):return {'ok':False,'errors':['job must be an object'],'counts':{}}
    kind=job.get('kind')
    command=str(job.get('command','')).lstrip('/').upper()
    if command in {'MCSRL','MCSCB'}:
        if kind!='sheet':errors.append('MCS commands require kind=sheet; style edits cannot reroute the deliverable')
        if job.get('style')!=command[-2:]:errors.append('MCS command and rendering medium must match')
        if not isinstance(job.get('style_edit',''),str):errors.append('style_edit must be text')
    if kind not in {'sheet','flow','reference_reset','prompt','reinterpretation','location'}:
        errors.append('unknown job kind')
    if kind in {'sheet','reinterpretation','location','prompt'}:
        refs=job.get('references',[])
        if not isinstance(refs,list): errors.append('references must be an array'); refs=[]
        if not refs and not job.get('approved_description'):
            errors.append('assigned references or an approved description are required')
        if not job.get('project_id') or not job.get('asset_id'):errors.append('project_id and asset_id required')
        allowed={'identity','body','wardrobe','equipment','location','layout','style'}
        for r in refs:
            if not isinstance(r,dict):errors.append('reference must be an object');continue
            if not r.get('source_id'):errors.append('reference source_id missing')
            if r.get('role') not in allowed:errors.append('reference role invalid')
            if r.get('status') not in {'supplied','locked'}:errors.append('only supplied/locked references may drive generation')
            if r.get('available') is not True:errors.append('reference has not been confirmed accessible')
            if r.get('project_id')!=job.get('project_id') and not r.get('explicit_cross_project_authorization'):
                errors.append('cross-project reference requires explicit authorization')
            if r.get('source_id') in job.get('rejected_source_ids',[]):errors.append('rejected reference selected')
        if job.get('critical_unknowns'):errors.append('resolve critical unknowns before execution')
    if kind=='sheet':
        mode=job.get('mode')
        if mode not in {'simple','complex'}:errors.append('sheet mode must be simple or complex')
        if job.get('expression_panels',False):errors.append('expression panels are forbidden')
        if mode=='simple':
            for field in ['equipment','approved_equipment','details','equipment_evidence','detail_evidence','character_prompt','copyable_character_prompt']:
                if job.get(field):errors.append('simple anchors forbid '+field)
        if mode=='complex':
            refs_by_id={r.get('source_id'):r for r in refs if isinstance(r,dict)}
            for field,evidence_key in [('equipment','equipment_evidence'),('details','detail_evidence')]:
                selected=job.get(field,[])
                records=job.get(evidence_key,[])
                if not isinstance(selected,list) or not isinstance(records,list):
                    errors.append(field+' and its evidence must be arrays');continue
                if len(set(map(str,selected)))!=len(selected):errors.append('duplicate '+field)
                if len(records)!=len(selected):errors.append('each selected '+field+' needs exactly one evidence record')
                for item in selected:
                    matches=[e for e in records if isinstance(e,dict) and e.get('item')==item]
                    if len(matches)!=1:errors.append('missing or duplicate evidence for '+str(item));continue
                    e=matches[0];ref=refs_by_id.get(e.get('source_id'),{})
                    if e.get('visible') is not True or e.get('needed') is not True or not str(e.get('reason','')).strip():errors.append('visible and needed evidence required for '+str(item))
                    if ref.get('role') not in {'identity','body','wardrobe','equipment'} or ref.get('status') not in {'supplied','locked'} or ref.get('available') is not True:errors.append('invalid visual evidence source for '+str(item))
        for key in ['aspect_ratio','views','bust_positions','background','palette','description_panel','layout','name_position']:
            override=job.get('explicit_user_overrides',{}).get(key)
            expected=CONTRACT['modes'].get(mode,{}).get(key,CONTRACT.get(key))
            if override is not None:
                if not isinstance(override,dict) or not override.get('instruction') or 'value' not in override:
                    errors.append('override needs exact user instruction and value: '+key)
                else: expected=override['value']
            if job.get(key)!=expected:errors.append('sheet contract mismatch: '+key)
        name=job.get('name')
        if not isinstance(name,str) or not name.strip():errors.append('character name required')
        if job.get('title')!=name:errors.append('title must equal supplied character name')
        if isinstance(name,str) and (re.search(r'\b(MCSRL|MCSCB|RITC|PTPRL|PTPCB)\b',name,re.I) or '[' in name or ']' in name):
            errors.append('title contains command/syntax text')
        if job.get('style') not in {'RL','CB'}:errors.append('style must be RL or CB')
        eq=job.get('equipment');approved=job.get('approved_equipment')
        if not isinstance(eq,list) or not isinstance(approved,list):errors.append('equipment arrays required (empty means none)')
        else:
            if eq!=approved:errors.append('equipment must exactly match selected approved items')
            if len(set(map(str,eq)))!=len(eq):errors.append('duplicate equipment slots')
            if job.get('equipment_slots')!=len(eq):errors.append('unused or missing equipment slots')
        if mode=='complex':
            if not isinstance(job.get('character_prompt'),str) or not job['character_prompt'].strip():errors.append('character prompt required')
            if job.get('copyable_character_prompt')!=job.get('character_prompt'):errors.append('panel and copyable prompt must match')
    if kind=='flow':
        if job.get('basePreset') not in VOICES:errors.append('basePreset is not in the supplied 30-preset baseline')
        for field in ['voicePerformance','dialog']:
            val=job.get(field)
            if not isinstance(val,str) or not val.strip():errors.append(field+' must be nonempty text');continue
            counts[field]={'code_points':len(val),'utf16_units':len(val.encode('utf-16-le'))//2}
            if max(counts[field].values())>CONTRACT['voice_limit']:errors.append(field+' exceeds 120 characters')
            if re.search(r'[\x00-\x1f\x7f]',val):errors.append(field+' contains line breaks/control characters')
    if kind=='reference_reset':
        selected=job.get('selected_source_ids',[])
        if not isinstance(selected,list) or not selected:errors.append('reset needs designated or last approved source IDs')
        elif set(selected)&set(job.get('rejected_source_ids',[])):errors.append('reset cannot select rejected sources')
        records=job.get('references',[])
        by_id={r.get('source_id'):r for r in records if isinstance(r,dict)}
        for sid in selected if isinstance(selected,list) else []:
            r=by_id.get(sid,{})
            if r.get('status') not in {'supplied','locked'} or r.get('available') is not True:
                errors.append('reset source must be accessible and supplied/locked: '+str(sid))
            if not r.get('role') or not r.get('scope'):errors.append('reset source role and feature scope required')
            if r.get('project_id')!=job.get('project_id') and not r.get('explicit_cross_project_authorization'):
                errors.append('reset source belongs to another project')
        if job.get('delete_files',False):errors.append('reset does not delete stored files')
        if job.get('preserve_layout') is not True:errors.append('reset must preserve approved layout')
        if job.get('preserve_other_assets') is not True:errors.append('reset must preserve other assets')
    return {'ok':not errors,'errors':errors,'counts':counts,'scope':'declared metadata only; visual inspection still required'}

def review(record):
    """Validate an observer's pixel inspection record; this is NOT image recognition."""
    if not isinstance(record,dict):
        return {'ok':False,'errors':['review must be an object']}
    errors=[]
    if record.get('mode') not in {'simple','complex'}:errors.append('review mode required')
    if not record.get('output_image_id'):errors.append('output image ID required')
    if record.get('inspected') is not True:errors.append('actual image inspection required')
    expected=record.get('expected_name')
    if not isinstance(expected,str) or not expected.strip():errors.append('expected name required')
    if record.get('observed_name')!=expected:errors.append('visible name missing or mismatched')
    for key in ['name_legible','name_uncropped']:
        if record.get(key) is not True:errors.append(key+' must be observed true')
    mode=record.get('mode')
    position='bottom_center' if mode=='simple' else 'top_left'
    layout='six_columns' if mode=='simple' else 'four_columns_stacked_portraits'
    if record.get('observed_name_position')!=position:errors.append('incorrect visible name placement')
    if record.get('observed_layout')!=layout:errors.append('incorrect observed layout')
    if record.get('observed_views')!=CONTRACT['views']:errors.append('incorrect observed view sequence')
    return {'ok':not errors,'errors':errors,'scope':'recorded visual observations only; not automated pixel verification'}

def main():
    p=argparse.ArgumentParser(description=__doc__,epilog='Sheet job: kind, project_id, asset_id, name/title, style, contract keys, equipment/approved_equipment/equipment_slots, character_prompt/copyable_character_prompt, references[{source_id,role,status,available,project_id}], rejected_source_ids, critical_unknowns. Flow job: kind=flow, basePreset, voicePerformance, dialog. Reset job: kind=reference_reset, selected_source_ids, rejected_source_ids, preserve_layout=true, preserve_other_assets=true, delete_files=false.')
    p.add_argument('job',nargs='?',help='JSON path or - for stdin');p.add_argument('--parse',help='Parse a direct command only')
    p.add_argument('--review',action='store_true',help='Validate a recorded visual inspection, not image pixels')
    a=p.parse_args()
    if a.parse is not None:print(json.dumps(parse(a.parse),ensure_ascii=False));return
    if not a.job:p.error('provide a job JSON or --parse')
    try:j=json.load(sys.stdin) if a.job=='-' else json.loads(Path(a.job).read_text());r=review(j) if a.review else validate(j)
    except (ValueError,OSError,TypeError) as e:r={'ok':False,'errors':[str(e)]}
    print(json.dumps(r,ensure_ascii=False,indent=2));sys.exit(0 if r['ok'] else 1)
if __name__=='__main__':main()





