import copy,hashlib,importlib.util,json,struct,tempfile,unittest,zipfile,zlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]/'plugin/skills/xce-unify'
spec=importlib.util.spec_from_file_location('ledger',ROOT/'scripts/ledger.py');ledger=importlib.util.module_from_spec(spec);spec.loader.exec_module(ledger)
def fixture():
    world={'actors':[{'asset_id':'test_actor','position':'left','orientation':'north','eyeline':'door','posture':'standing','wardrobe_state':'unchanged','active_state_id':'','prop_contact':'none'}],'props':[],'environment':'test room','world_lighting':'fixed west window'}
    camera={'focal_length_mm':35,'lens_profile':'35mm anamorphic','position':'south','axis':'north-south','framing':'wide'}
    shot={'shot_id':'test_shot_1','sequence_order':1,'duration_seconds':4,'aspect_ratio':'16:9','planned_image_file':'Shot_01_16x9.png','start_world_state':copy.deepcopy(world),'end_world_state':copy.deepcopy(world),'camera_start':copy.deepcopy(camera),'camera_end':copy.deepcopy(camera),'camera_transition':{'kind':'none','approved':False,'description':''},'active_beat_execution':{'beat_id':'test_beat','character_id':'test_actor','mood':'Neutral','dialogue':'Wait.','direction_box_1':'Looks at the door.','direction_box_2':''},'grade_id':'','grade_version':0,'grade_prompt':'approved restrained color treatment','image_prompt':'https://xstudio.xrkr80hd.studio 16:9 test frame with verified references','motion_prompt':'https://xstudio.xrkr80hd.studio 16:9 four seconds, holds position','output':{'status':'NOT_GENERATED','file_path':'','width':0,'height':0,'sha256':'','visual_review':'','user_approved':False}}
    routes=json.loads((ROOT/'references/plugin-registry.json').read_text())['routes']
    doc={'schema_version':'2.0.0','handoff_protocol_id':'xce_live_handoff_v2','orchestrator':'@XCE_UNIFY','workspace_origin':'https://xstudio.xrkr80hd.studio','project_id':'test_project','scene_id':'test_scene','project_revision':1,'plan_revision':1,'stage':'PLANNING','continuity_status':'PLAN_CONTINUOUS','mode':'AS','handshake':{'source_verified':False,'source_url':'','checked_at':'','evidence':''},'scene_intent':'Test only','active_team_sheets':[{'asset_id':'test_actor','name':'Test actor','reference_ids':['test_reference'],'reference_status':'UNRESOLVED','sha256':[],'anchor_status':'DRAFT','mcs_reference_id':''}],'global_constraints':{'aspect_ratio':'16:9','min_shot_seconds':3,'max_shot_seconds':6,'default_lens_profile':'35mm anamorphic','negative_prompt_lock':'no watermarks, no logos, no text overlays, no subtitles, no UI frames, no signatures','grade_id':'','grade_version':0,'grade_prompt':'approved restrained color treatment','world_lighting_anchor':'fixed west window'},'approvals':{'script_revision':0,'shots_revision':0,'ff_revision':0,'render_revision':0},'plugin_release_chain':[{'role':r['role'],'invocation_type':'HOST_WORKFLOW','status':'PENDING','operation':'','evidence':'','revision':0} for r in routes],'recorded_handoff_ledger':[shot]}
    angle={'angle_number':1,'label':'Wide','camera_start':copy.deepcopy(camera),'camera_end':copy.deepcopy(camera),'world_state':copy.deepcopy(world),'state_evidence':'PLANNED','image_prompt':shot['image_prompt'],'motion_prompt':shot['motion_prompt'],'output':copy.deepcopy(shot['output'])}
    angles=[]
    for n,label in enumerate(['Wide','Medium','OTS A','Reverse B'],1):
        a=copy.deepcopy(angle);a['angle_number']=n;a['label']=label;a['camera_start']['position']='view '+str(n);a['camera_end']['position']='view '+str(n);angles.append(a)
    shot['coverage']={'mode':'UNIFY_FOUR_ANGLE','status':'SETUP_PENDING','master_reference_id':'','master_reference_confirmed':False,'angles_confirmed':False,'action_focus':'UNCONFIRMED','focus_details':'','focus_confirmed':False,'render_approved_revision':0,'selected_continuation_angle':0,'continuation_confirmed':False,'angles':angles}
    doc['pipeline_telemetry_hud']={'always_display_to_user':True,'current_step_index':1,'total_steps':6,'completed_plugins':[],'active_plugin':'@XCE_UNIFY','next_handoff_plugin':'@XCE_SCRIPT','current_action_summary':'Test planning'}
    audit_names=['source_connection','xstudio_mcs_sheets_attached','script_beats_and_moods_locked','composer_state_and_mounts_verified','mv_reference_confirmed','mv_four_angles_confirmed','mv_action_focus_confirmed','aspect_ratio_16x9_enforced','watermark_suppression_locked','grade_and_lighting_locked','continuation_selected']
    doc['harmonization_audit_engine']={'audit_status':'PENDING','checks_performed':{name:'NOT_CHECKED' for name in audit_names},'detected_contradictions':[],'missing_links':[]}
    second=copy.deepcopy(shot);second.update(shot_id='test_shot_2',sequence_order=2,planned_image_file='Shot_02_16x9.png');second['active_beat_execution']['beat_id']='test_beat_2';doc['recorded_handoff_ledger'].append(second);return doc
class PipelineTests(unittest.TestCase):
    def test_valid_plan(self):self.assertEqual(ledger.validate(fixture()),[])
    def test_as_inherits_entire_team(self):
        d=fixture();d['recorded_handoff_ledger'][1]['start_world_state']['actors'][0]['posture']='seated'
        with self.assertRaisesRegex(ValueError,'inherit'):ledger.validate(d)
    def test_ss_never_advances_action(self):
        d=fixture();d['mode']='SS';ledger.validate(d);d['recorded_handoff_ledger'][0]['end_world_state']['actors'][0]['posture']='seated'
        with self.assertRaisesRegex(ValueError,'freeze'):ledger.validate(d)
    def test_camera_cut_is_explicit(self):
        d=fixture();s=d['recorded_handoff_ledger'][1];s['camera_start']['position']='north'
        with self.assertRaisesRegex(ValueError,'Camera'):ledger.validate(d)
        s['camera_transition']={'kind':'cut','approved':True,'description':'Approved reverse angle; original axis preserved'};ledger.validate(d)
    def test_grade_and_world_light_are_locked(self):
        for field in ['grade_prompt','world_lighting']:
            d=fixture();s=d['recorded_handoff_ledger'][1]
            if field=='grade_prompt':s[field]='different'
            else:s['end_world_state'][field]='moved light'
            with self.assertRaises(ValueError):ledger.validate(d)
    def test_no_omitted_roles_or_false_tool_completions(self):
        d=fixture();d['plugin_release_chain'].pop()
        with self.assertRaisesRegex(ValueError,'omitted'):ledger.validate(d)
        d=fixture();d['plugin_release_chain'][0].update(invocation_type='UNAVAILABLE',status='COMPLETE',evidence='none')
        with self.assertRaisesRegex(ValueError,'Unavailable'):ledger.validate(d)
    def test_no_stale_render_authorization(self):
        d=fixture();d.update(stage='READY_TO_RENDER');d['handshake'].update(source_verified=True,source_url=d['workspace_origin'],checked_at='test time',evidence='test evidence, not production')
        with self.assertRaisesRegex(ValueError,'stale'):ledger.validate(d)
    def test_no_unrendered_success_or_placeholder_images(self):
        d=fixture();d['continuity_status']='LOCKED_CONTINUOUS'
        with self.assertRaisesRegex(ValueError,'Unrendered'):ledger.validate(d)
        d=fixture();d['recorded_handoff_ledger'][0]['output']['file_path']='not-created.png'
        with self.assertRaisesRegex(ValueError,'Planned'):ledger.validate(d)
        with self.assertRaisesRegex(ValueError,'missing'):ledger.validate(fixture(),True)
    def test_no_foreign_speakers_or_incomplete_snapshots(self):
        d=fixture();d['recorded_handoff_ledger'][0]['active_beat_execution']['character_id']='foreign'
        with self.assertRaisesRegex(ValueError,'Foreign'):ledger.validate(d)
        d=fixture();d['recorded_handoff_ledger'][0]['end_world_state']['actors']=[]
        with self.assertRaisesRegex(ValueError,'whole selected'):ledger.validate(d)
    def test_shot_bounds_and_dialogue_timing(self):
        for duration in [2,7,'4',True]:
            d=fixture();d['recorded_handoff_ledger'][0]['duration_seconds']=duration
            with self.assertRaises(ValueError):ledger.validate(d)
        d=fixture();d['recorded_handoff_ledger'][0]['active_beat_execution']['dialogue']='word '*40;self.assertEqual(len(ledger.validate(d)),1)
    def test_no_seven_angle_default_or_unanswered_preflight(self):
        d=fixture();d['recorded_handoff_ledger'][0]['coverage']['angles'].pop()
        with self.assertRaisesRegex(ValueError,'four'):ledger.validate(d)
        d=fixture();d['recorded_handoff_ledger'][0]['coverage']['status']='READY'
        with self.assertRaisesRegex(ValueError,'ask and resolve'):ledger.validate(d)
    def test_continuation_selection_needs_actual_reviewed_angle(self):
        d=fixture();c=d['recorded_handoff_ledger'][0]['coverage'];c['selected_continuation_angle']=2
        with self.assertRaisesRegex(ValueError,'actual reviewed'):ledger.validate(d)
    def test_hud_cannot_fake_harmonization_pass(self):
        d=fixture();d['harmonization_audit_engine']['audit_status']='PASS'
        with self.assertRaisesRegex(ValueError,'Audit'):ledger.validate(d)
        d=fixture();d['pipeline_telemetry_hud']['current_step_index']=7
        with self.assertRaises(ValueError):ledger.validate(d)
    def test_real_pngs_are_separate_and_hash_verified(self):
        def chunk(kind,data):return struct.pack('>I',len(data))+kind+data+struct.pack('>I',zlib.crc32(kind+data)&0xffffffff)
        png=b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',16,9,8,2,0,0,0))+chunk(b'IDAT',zlib.compress((b'\x00'+b'\x00'*48)*9))+chunk(b'IEND',b'')
        with tempfile.TemporaryDirectory() as folder:
            p=Path(folder)/'frame.png';p.write_bytes(png);d=fixture();d['approvals']['render_revision']=1
            for i,s in enumerate(d['recorded_handoff_ledger']):
                c=s['coverage'];c.update(status='CONTINUATION_SELECTED',master_reference_id='test_reference',master_reference_confirmed=True,angles_confirmed=True,action_focus='DIRECTION_1',focus_details='Eye line at door',focus_confirmed=True,render_approved_revision=1,selected_continuation_angle=1,continuation_confirmed=True)
                for a in c['angles']:a['output'].update(status='REVIEWED',file_path=str(p),width=16,height=9,sha256=hashlib.sha256(png).hexdigest(),visual_review='Test fixture only',user_approved=True);a['state_evidence']='OBSERVED_REVIEWED'
                s['output']=copy.deepcopy(c['angles'][0]['output']);s['camera_end']=copy.deepcopy(c['angles'][0]['camera_end'])
                if i:s['camera_start']=copy.deepcopy(d['recorded_handoff_ledger'][i-1]['camera_end'])
            ledger.validate(d,True,folder);out=Path(folder)/'scene.zip';ledger.bundle(d,out,folder)
            with zipfile.ZipFile(out) as archive:
                self.assertIn('Shot_01_16x9.png',archive.namelist());self.assertIn('Shot_02_16x9.png',archive.namelist());self.assertIn('prompts/Shot_01_dialogue.txt',archive.namelist());self.assertEqual(archive.read('Shot_01_16x9.png'),png)
            p.write_bytes(b'not a png')
            with self.assertRaises(ValueError):ledger.validate(d,True,folder)
if __name__=='__main__':unittest.main()
