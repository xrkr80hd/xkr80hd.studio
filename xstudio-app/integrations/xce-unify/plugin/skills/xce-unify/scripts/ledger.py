#!/usr/bin/env python3
"""Validate declared XCE continuity; optionally verify/copy actual PNG deliverables.
Does not render images, inspect visual likeness, call services or modify project data.
"""
import argparse,copy,hashlib,json,re,struct,zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]

def shape(schema,value,path='$'):
    kind=schema.get('type')
    ok={'object':lambda:isinstance(value,dict),'array':lambda:isinstance(value,list),'string':lambda:isinstance(value,str),'boolean':lambda:type(value) is bool,'integer':lambda:type(value) is int,'number':lambda:type(value) in (int,float)}
    if kind and not ok[kind]():raise ValueError(path+': wrong type')
    if 'const' in schema and (value!=schema['const'] or type(value)!=type(schema['const'])):raise ValueError(path+': wrong constant')
    if 'enum' in schema and value not in schema['enum']:raise ValueError(path+': invalid choice')
    if kind=='object':
        for key in schema.get('required',[]):
            if key not in value:raise ValueError(path+': missing '+key)
        for key,v in value.items():
            if key not in schema['properties']:raise ValueError(path+': unknown '+key)
            shape(schema['properties'][key],v,path+'.'+key)
    if kind=='array':
        if len(value)>schema.get('maxItems',10**9):raise ValueError(path+': too many entries')
        for i,v in enumerate(value):shape(schema['items'],v,path+f'[{i}]')
    if kind=='string':
        if not schema.get('minLength',0)<=len(value)<=schema.get('maxLength',10**9):raise ValueError(path+': invalid length')
        if 'pattern' in schema and not re.fullmatch(schema['pattern'],value):raise ValueError(path+': invalid identifier')
    if kind in ('number','integer'):
        if not schema.get('minimum',-float('inf'))<=value<=schema.get('maximum',float('inf')):raise ValueError(path+': number outside bounds')

def validate(doc,verify_media=False,base=None):
    shape(json.loads((ROOT/'references/continuity.schema.json').read_text()),doc)
    shots=doc['recorded_handoff_ledger'];rev=doc['plan_revision'];g=doc['global_constraints'];warnings=[]
    audit=doc['harmonization_audit_engine']
    if audit['audit_status']=='PASS' and (audit['missing_links'] or audit['detected_contradictions'] or any(v!='PASS' for v in audit['checks_performed'].values())):raise ValueError('Audit cannot claim PASS with missing or unchecked links')
    roles=[r['role'] for r in doc['plugin_release_chain']]
    if len(set(roles))!=len(roles):raise ValueError('Duplicate role releases')
    registry=json.loads((ROOT/'references/plugin-registry.json').read_text())
    if not {r['role'] for r in registry['routes']}.issubset(set(roles)):raise ValueError('A registered XCE role is omitted; mark it pending/not required with a reason')
    for release in doc['plugin_release_chain']:
        if release['status']=='COMPLETE' and release['invocation_type'] in ('UNAVAILABLE','NOT_REQUIRED'):raise ValueError('Unavailable or unnecessary role cannot claim completion')
        if release['status']=='COMPLETE' and not release['evidence'].strip():raise ValueError('Release completion requires evidence')
        if release['status']=='NOT_REQUIRED' and not release['evidence'].strip():raise ValueError('Skipped role requires a reason')
    advanced=doc['stage'] in ('READY_TO_RENDER','RENDERING','REVIEW','COMPLETE')
    if advanced:
        h=doc['handshake']
        if not h['source_verified'] or h['source_url']!=doc['workspace_origin'] or not h['checked_at'] or not h['evidence']:raise ValueError('Current verified XSTUDIO handshake required')
        if not doc['project_id'] or not doc['scene_id'] or not shots:raise ValueError('Actual project, scene and shot plan required')
        for key in ('script_revision','shots_revision','render_revision'):
            if doc['approvals'][key]!=rev:raise ValueError('Missing or stale '+key)
        mv=next(r for r in doc['plugin_release_chain'] if r['role']=='XCE_MV')
        if any(len(s['coverage']['angles'])!=4 for s in shots):raise ValueError('UNIFY requires four coverage angles per beat, not legacy seven-shot defaults')
        if not g['grade_id'] and not g['grade_prompt'].strip():raise ValueError('Choose an actual grade or reviewed staged look')
        if any(a['anchor_status']!='LOCKED' or not a['mcs_reference_id'] or a['mcs_reference_id'] not in a['reference_ids'] or a['reference_status']=='UNRESOLVED' for a in doc['active_team_sheets']):raise ValueError('Locked MCS link and actual team reference bytes required')
        if any(r['status'] in ('PENDING','BLOCKED') for r in doc['plugin_release_chain']):raise ValueError('An unresolved required role blocks rendering')
    actor_ids=[a['asset_id'] for a in doc['active_team_sheets']]
    if len(set(actor_ids))!=len(actor_ids):raise ValueError('Duplicate team actor')
    shot_ids=set();prior=None;baseline=shots[0]['start_world_state'] if shots else None
    for index,s in enumerate(shots,1):
        if s['shot_id'] in shot_ids or s['sequence_order']!=index:raise ValueError('Unique consecutive shot ordering required')
        shot_ids.add(s['shot_id'])
        if s['planned_image_file']!=f'Shot_{index:02d}_16x9.png':raise ValueError('Use standalone numbered 16:9 filenames')
        for state in ('start_world_state','end_world_state'):
            ids=[a['asset_id'] for a in s[state]['actors']]
            if len(set(ids))!=len(ids) or set(ids)!=set(actor_ids):raise ValueError('Every shot snapshot must include the whole selected team')
            if s[state]['world_lighting']!=g['world_lighting_anchor']:raise ValueError('World-space lighting anchor drift')
        if prior and doc['mode']=='AS' and s['start_world_state']!=prior['end_world_state']:raise ValueError('AS start does not inherit previous end')
        if doc['mode']=='SS' and (s['start_world_state']!=baseline or s['end_world_state']!=baseline):raise ValueError('SS must freeze the same world instant')
        t=s['camera_transition']
        if prior and s['camera_start']!=prior['camera_end'] and (t['kind']=='none' or not t['approved'] or not t['description'].strip()):raise ValueError('Camera change requires an approved cut/move')
        if (s['grade_id'],s['grade_version'],s['grade_prompt'])!=(g['grade_id'],g['grade_version'],g['grade_prompt']):raise ValueError('Shot grading differs from scene lock')
        b=s['active_beat_execution']
        if b['character_id'] and b['character_id'] not in actor_ids:raise ValueError('Foreign speaker')
        if b['dialogue'] and (not b['character_id'] or not b['mood'].strip()):raise ValueError('Dialogue requires a present speaker and mood')
        if len(b['dialogue'].split())>s['duration_seconds']*2.5:warnings.append(s['shot_id']+': long dialogue; split beats/shots, do not rush delivery')
        if not s['image_prompt'].strip() or not s['motion_prompt'].strip():raise ValueError('Self-contained image and motion prompts required')
        coverage=s['coverage'];angles=coverage['angles']
        if len(angles)!=4 or sorted(a['angle_number'] for a in angles)!=[1,2,3,4]:raise ValueError('Exactly four distinct numbered coverage angles required')
        if len({json.dumps(a['camera_start'],sort_keys=True) for a in angles})!=4:raise ValueError('Four distinct approved camera views required')
        rendered=any(a['output']['status']!='NOT_GENERATED' for a in angles)
        if coverage['status']!='SETUP_PENDING' or rendered:
            if not coverage['master_reference_id'] or not coverage['master_reference_confirmed'] or not coverage['angles_confirmed'] or not coverage['focus_confirmed'] or coverage['action_focus']=='UNCONFIRMED' or not coverage['focus_details'].strip():raise ValueError('MV must ask and resolve master reference, four-angle choice and Direction Box focus before rendering')
        if rendered and coverage['render_approved_revision']!=rev:raise ValueError('Missing current four-angle batch generation approval')
        for a in angles:
            if not a['image_prompt'].strip() or not a['motion_prompt'].strip() or doc['workspace_origin'] not in a['image_prompt'] or doc['workspace_origin'] not in a['motion_prompt']:raise ValueError('Each angle prompt needs its own source directive and complete content')
            if a['world_state']['world_lighting']!=g['world_lighting_anchor']:raise ValueError('Coverage lighting drift')
            if {actor['asset_id'] for actor in a['world_state']['actors']}!=set(actor_ids):raise ValueError('Each coverage frame must retain the full scene team')
            if doc['mode']=='SS' and a['world_state']!=baseline:raise ValueError('SS coverage cannot advance the physical instant')
        selected=coverage['selected_continuation_angle']
        if selected:
            a=next(a for a in angles if a['angle_number']==selected)
            if not coverage['continuation_confirmed'] or a['output']['status']!='REVIEWED' or a['state_evidence']!='OBSERVED_REVIEWED':raise ValueError('User must select an actual reviewed angle as continuation')
            if s['end_world_state']!=a['world_state'] or s['camera_end']!=a['camera_end']:raise ValueError('Canonical continuation must copy the selected actual state/camera')
            if s['output']!=a['output']:raise ValueError('Canonical output receipt must alias the selected angle')
        elif coverage['continuation_confirmed'] or coverage['status']=='CONTINUATION_SELECTED':raise ValueError('Cannot confirm a missing continuation angle')
        if prior and rendered and not prior['coverage']['selected_continuation_angle']:raise ValueError('Select previous generated continuation before advancing the next beat')
        receipt=s['output']
        if receipt['status']=='NOT_GENERATED' and (receipt['file_path'] or receipt['width'] or receipt['height'] or receipt['sha256'] or receipt['user_approved']):raise ValueError('Planned output cannot claim media or approval')
        if receipt['status']!='NOT_GENERATED':
            if doc['approvals']['render_revision']!=rev:raise ValueError('Generated output belongs to an unapproved/stale render revision')
            if not receipt['file_path'] or not re.fullmatch('[0-9a-f]{64}',receipt['sha256']) or receipt['width']<=0 or receipt['width']*9!=receipt['height']*16:raise ValueError('Actual output path, hash and measured 16:9 dimensions required')
        if receipt['status']=='REVIEWED' and (not receipt['visual_review'].strip() or not receipt['user_approved']):raise ValueError('Reviewed media needs visual and user approval evidence')
        for a in angles:
            out=a['output']
            if out['status']=='NOT_GENERATED' and (out['file_path'] or out['width'] or out['height'] or out['sha256'] or out['user_approved']):raise ValueError('Planned angle cannot claim generated media')
            if out['status']!='NOT_GENERATED' and (not out['file_path'] or not re.fullmatch('[0-9a-f]{64}',out['sha256']) or out['width']<=0 or out['width']*9!=out['height']*16):raise ValueError('Angle requires real output proof and measured 16:9 dimensions')
            if out['status']=='REVIEWED' and (not out['visual_review'].strip() or not out['user_approved']):raise ValueError('Angle output review evidence required')
            if verify_media:
                if out['status']=='NOT_GENERATED':raise ValueError('Cannot bundle missing images')
                file=Path(out['file_path']);file=file if file.is_absolute() else Path(base or '.').resolve()/file
                data=file.read_bytes()
                if len(data)<24 or data[:8]!=b'\x89PNG\r\n\x1a\n' or data[12:16]!=b'IHDR':raise ValueError('A real PNG is required, not relabeled media')
                if struct.unpack('>II',data[16:24])!=(out['width'],out['height']) or hashlib.sha256(data).hexdigest()!=out['sha256']:raise ValueError('Output dimensions or hash mismatch')
        prior=s
    if doc['continuity_status']=='LOCKED_CONTINUOUS' or doc['stage']=='COMPLETE':
        if not advanced or not shots or any(s['output']['status']!='REVIEWED' or not s['coverage']['continuation_confirmed'] or any(a['output']['status']!='REVIEWED' for a in s['coverage']['angles']) for s in shots):raise ValueError('Unrendered/unreviewed frames cannot be locked continuous or complete')
    return warnings

def bundle(doc,path,base):
    warnings=validate(doc,True,base)
    with zipfile.ZipFile(path,'w',zipfile.ZIP_DEFLATED) as archive:
        archive.writestr('ledger.json',json.dumps(doc,indent=2))
        mapping=[];index=0
        for s in doc['recorded_handoff_ledger']:
            for a in s['coverage']['angles']:
                index+=1;p=Path(a['output']['file_path']);p=p if p.is_absolute() else Path(base)/p
                name=f'Shot_{index:02d}_16x9.png';archive.write(p,name)
                mapping.append({'file':name,'beat_id':s['active_beat_execution']['beat_id'],'angle':a['angle_number'],'canonical':a['angle_number']==s['coverage']['selected_continuation_angle']})
                for kind,key in (('image','image_prompt'),('motion','motion_prompt')):archive.writestr(f'prompts/Shot_{index:02d}_{kind}.txt',a[key])
                b=s['active_beat_execution']
                if b['dialogue']:archive.writestr(f'prompts/Shot_{index:02d}_dialogue.txt',f"{b['character_id']} ({b['mood']})\n\"{b['dialogue']}\"\n{b['direction_box_1']}\n{b['direction_box_2']}")
        archive.writestr('coverage-map.json',json.dumps(mapping,indent=2))
    return warnings

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('ledger');parser.add_argument('--verify-media',action='store_true');parser.add_argument('--bundle');args=parser.parse_args()
    try:
        source=Path(args.ledger);doc=json.loads(source.read_text());warnings=bundle(doc,args.bundle,source.parent) if args.bundle else validate(doc,args.verify_media,source.parent)
        print(json.dumps({'valid':True,'shots':len(doc['recorded_handoff_ledger']),'warnings':warnings,'bundle':args.bundle}))
    except (ValueError,OSError,KeyError,TypeError) as e:parser.exit(1,'Validation failed: '+str(e)+'\n')
