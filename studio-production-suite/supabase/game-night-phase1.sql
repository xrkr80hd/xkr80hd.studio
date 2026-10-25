-- Ultimate Game Night Phase 1: buzzers open after a 3-2-1 countdown,
-- and the fastest phone-measured reaction (not the first network arrival) wins the buzz.
-- A player who lost their session can rejoin under the same name, and the Daily Double team can lock its wager from a phone.
ALTER TABLE public.family_game_rooms ADD COLUMN IF NOT EXISTS revision bigint NOT NULL DEFAULT 0;
CREATE OR REPLACE FUNCTION public.family_game_command(p_code text,p_action text,p_token text,p_data jsonb DEFAULT '{}')
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $function$
declare r public.family_game_rooms; p jsonb; ps jsonb; h text; host boolean; maximum numeric; w numeric; team_id text; target_id text; members jsonb; rep_id text; turn_index integer; now_ms numeric; arrival numeric; reaction numeric; pending boolean; decided boolean:=false; e jsonb;
begin
 if length(coalesce(p_token,'')) not between 32 and 200 then raise exception 'Session token required';end if;
 h:=encode(sha256(convert_to(p_token,'UTF8')),'hex');
 if p_action='read' then
  select * into r from public.family_game_rooms where code=p_code and expires_at>now();
 else
  select * into r from public.family_game_rooms where code=p_code and expires_at>now() for update;
 end if;
 if not found then raise exception 'Room not found or expired';end if;
 now_ms:=floor(extract(epoch from clock_timestamp())*1000);
 pending:=coalesce(r.buzz->>'winner','')='' and jsonb_array_length(coalesce(r.buzz->'entries','[]'::jsonb))>0 and now_ms>=coalesce((r.buzz->>'firstAt')::numeric,0)+800;
 if p_action='read' and pending then
  select * into r from public.family_game_rooms where code=p_code and expires_at>now() for update;
 end if;
 if p_action='read' and not pending and coalesce((p_data->>'knownRevision')::bigint,-1)=r.revision then
  return jsonb_build_object('unchanged',true,'revision',r.revision,'serverTime',floor(extract(epoch from clock_timestamp())*1000));
 end if;
 host:=h=r.host_hash;
 select value into p from jsonb_array_elements(r.players) where value->>'hash'=h;
 if p_action='join' then
  if p is null then
   -- Rejoin: a new session using an existing player's name takes over that player (same team, same turn order).
   select value into p from jsonb_array_elements(r.players) where lower(trim(value->>'name'))=lower(trim(coalesce(p_data->>'name','')));
   if p is not null then
    select jsonb_agg(case when value->>'id'=p->>'id' then value||jsonb_build_object('hash',h) else value end) into r.players from jsonb_array_elements(r.players);
    p:=p||jsonb_build_object('hash',h);
   end if;
  end if;
  if p is null then
   if jsonb_array_length(r.players)>=10 then raise exception 'This room is full';end if;
   if length(trim(coalesce(p_data->>'name',''))) not between 1 and 28 then raise exception 'Enter a name (1–28 characters)';end if;
   p:=jsonb_build_object('id',gen_random_uuid()::text,'hash',h,'name',trim(p_data->>'name'),'photo','');
   r.players:=r.players||jsonb_build_array(p);
  end if;
 elsif p_action='profile' then
  if p is null then raise exception 'Player authentication required';end if;
  if length(trim(coalesce(p_data->>'name',''))) not between 1 and 28 or length(coalesce(p_data->>'photo',''))>250000 then raise exception 'Invalid player card';end if;
  if coalesce(p_data->>'photo','')<>'' and p_data->>'photo' not like 'data:image/jpeg;base64,%' then raise exception 'Use the photo cropper';end if;
  select jsonb_agg(case when value->>'hash'=h then value||jsonb_build_object('name',trim(p_data->>'name'),'photo',coalesce(p_data->>'photo','')) else value end) into r.players from jsonb_array_elements(r.players);
 elsif p_action='assign_team' then
  if not host and p is null then raise exception 'Join the room first';end if;
  if r.public_state->>'phase'<>'board' then raise exception 'Change teams between questions';end if;
  if not coalesce((r.state#>>'{play,teamMode}')::boolean,false) then raise exception 'Host must enable team play first';end if;
  target_id:=case when host then p_data->>'playerId' else p->>'id' end;
  team_id:=p_data->>'teamId';
  if not exists(select 1 from jsonb_array_elements(r.players) where value->>'id'=target_id) then raise exception 'Player not found';end if;
  if not exists(select 1 from jsonb_array_elements(r.public_state->'teams') where value->>'id'=team_id) then raise exception 'Choose an available team';end if;
  select jsonb_agg(case when value->>'id'=target_id then value||jsonb_build_object('teamId',team_id) else value end) into r.players from jsonb_array_elements(r.players);
 elsif p_action='pick_request' then
  if p is null then raise exception 'Join the room first';end if;
  if r.public_state->>'phase'<>'board' or not coalesce((r.public_state->>'started')::boolean,false) then raise exception 'Wait for the host to start the board';end if;
  team_id:=case when coalesce((r.state#>>'{play,teamMode}')::boolean,false) then p->>'teamId' else p->>'id' end;
  if team_id is distinct from r.public_state->>'active' then raise exception 'It is another team’s turn to choose';end if;
  select jsonb_agg(value order by ord) into members from jsonb_array_elements(r.players) with ordinality as players(value,ord) where (not coalesce((r.state#>>'{play,teamMode}')::boolean,false) and value->>'id'=team_id) or value->>'teamId'=team_id;
  turn_index:=coalesce((r.state#>>array['play','turns',team_id])::integer,0);
  rep_id:=members->(turn_index % greatest(1,jsonb_array_length(members)))->>'id';
  if p->>'id' is distinct from rep_id then raise exception 'It is your teammate’s turn';end if;
  if not exists(select 1 from jsonb_array_elements(r.public_state->'board') cat,jsonb_array_elements(cat->'clues') clue where clue->>'id'=p_data->>'clueId') or coalesce(r.public_state->'used','[]') @> jsonb_build_array(p_data->>'clueId') then raise exception 'Choose an unused clue';end if;
  if r.submissions->(p->>'id')->>'pick' is not null then raise exception 'Selection already sent';end if;
  r.submissions:=jsonb_set(r.submissions,array[p->>'id'],coalesce(r.submissions->(p->>'id'),'{}')||jsonb_build_object('pick',p_data->>'clueId'));
 elsif p_action='buzz' then
  if p is null then raise exception 'Join the room first';end if;
  if r.public_state->>'phase'<>'clue' or not coalesce((r.public_state->>'buzzOpen')::boolean,false) or coalesce((r.public_state->>'revealed')::boolean,false) or coalesce((r.state#>>'{play,resolved}')::boolean,false) or coalesce(r.buzz->>'winner','')<>'' or coalesce((r.public_state->>'buzzStartsAt')::numeric,0)>now_ms then raise exception 'Buzzers are locked';end if;
  if coalesce(r.buzz->>'firstAt','')<>'' and now_ms>(r.buzz->>'firstAt')::numeric+800 then raise exception 'Buzzers are locked';end if;
  team_id:=case when coalesce((r.state#>>'{play,teamMode}')::boolean,false) then p->>'teamId' else p->>'id' end;
  if team_id is null or not exists(select 1 from jsonb_array_elements(r.public_state->'teams') where value->>'id'=team_id) then raise exception 'Choose a team before buzzing';end if;
  if coalesce((r.state#>>'{play,teamMode}')::boolean,false) then
   select jsonb_agg(value order by ord) into members from jsonb_array_elements(r.players) with ordinality as players(value,ord) where value->>'teamId'=team_id;
   turn_index:=coalesce((r.state#>>array['play','turns',team_id])::integer,0);
   rep_id:=members->(turn_index % greatest(1,jsonb_array_length(members)))->>'id';
   if p->>'id' is distinct from rep_id then raise exception 'It is your teammate’s turn to answer';end if;
  end if;
  if coalesce(r.state#>'{play,judged}','[]') @> jsonb_build_array(team_id) then raise exception 'You have already answered this clue';end if;
  if exists(select 1 from jsonb_array_elements(coalesce(r.buzz->'entries','[]'::jsonb)) where value->>'id'=p->>'id') then raise exception 'You already buzzed';end if;
  -- Guard: a claimed reaction must be humanly possible (100 ms or more), no longer than the time since buzzers opened,
  -- and imply no more than 1.5 s of network delay. Otherwise the server-measured arrival time is used.
  arrival:=now_ms-coalesce((r.public_state->>'buzzStartsAt')::numeric,now_ms);
  reaction:=case when coalesce(p_data->>'reaction','') ~ '^[0-9]{1,6}(\.[0-9]+)?$' then (p_data->>'reaction')::numeric end;
  if reaction is null or reaction<100 or reaction>arrival or arrival-reaction>1500 then reaction:=arrival;end if;
  if coalesce(r.buzz->>'firstAt','')='' then r.buzz:=jsonb_build_object('firstAt',now_ms,'entries','[]'::jsonb);end if;
  r.buzz:=jsonb_set(r.buzz,'{entries}',(r.buzz->'entries')||jsonb_build_array(jsonb_build_object('id',p->>'id','team',team_id,'reaction',reaction)));
 elsif p_action in ('answer','wager') then
  if p is null then raise exception 'Join the room first';end if;
  team_id:=case when coalesce((r.state#>>'{play,teamMode}')::boolean,false) then p->>'teamId' else p->>'id' end;
  if team_id is null then raise exception 'Choose a team first';end if;
  if coalesce((r.state#>>'{play,teamMode}')::boolean,false) then
   select coalesce(jsonb_agg(value order by ord),'[]') into members from jsonb_array_elements(r.players) with ordinality as a(value,ord) where value->>'teamId'=team_id;
   turn_index:=coalesce((r.state#>>array['play','turns',team_id])::integer,0);
   rep_id:=members->(turn_index%greatest(1,jsonb_array_length(members)))->>'id';
   if rep_id is distinct from p->>'id' then raise exception 'Wait for your team turn';end if;
  end if;
  if p_action='answer' then
   if not coalesce((r.public_state->>'phase'='final-clue' and (r.public_state->>'deadline')::numeric>extract(epoch from clock_timestamp())*1000) or (r.public_state->>'phase'='clue' and not coalesce((r.public_state->>'revealed')::boolean,false) and (r.buzz->>'winner'=p->>'id' or (coalesce(r.buzz->>'winner','')='' and r.state#>>'{play,winner}'=team_id)) and coalesce(r.buzz->>'deadline',r.state#>>'{play,deadline}')::numeric>extract(epoch from clock_timestamp())*1000),false) then raise exception 'Answer entry is closed';end if;
  else
   if r.public_state->>'phase'='double' then
    if team_id is distinct from r.public_state->>'active' then raise exception 'Only the Daily Double team can wager';end if;
   elsif r.public_state->>'phase'<>'final-category' then raise exception 'Wagers are locked';end if;
   if coalesce(p_data->>'text','') !~ '^[0-9]{1,9}$' then raise exception 'Enter a nonnegative whole-point wager';end if;
   w:=(p_data->>'text')::numeric;
   select greatest(0,coalesce((value->>'score')::numeric,0)) into maximum from jsonb_array_elements(r.public_state->'teams') where value->>'id'=team_id;
   if r.public_state->>'phase'='double' then maximum:=greatest(coalesce(maximum,0),500*(coalesce((r.public_state->>'round')::integer,0)+1));end if;
   if w>coalesce(maximum,0) then raise exception 'Wager exceeds your score';end if;
  end if;
  if length(coalesce(p_data->>'text',''))>2000 then raise exception 'Submission too long';end if;
  r.submissions:=jsonb_set(r.submissions,array[p->>'id'],coalesce(r.submissions->(p->>'id'),'{}')||jsonb_build_object(p_action,p_data->>'text'));
 elsif p_action='update' then
  if not host then raise exception 'Host authentication required';end if;
  if (p_data->>'version')::integer is distinct from r.version then raise exception 'Game changed. Refresh the host view and try again.';end if;
  if jsonb_typeof(p_data->'state')<>'object' or jsonb_typeof(p_data->'public')<>'object' then raise exception 'Invalid game state';end if;
  r.state:=p_data->'state';r.public_state:=p_data->'public';r.version:=r.version+1;
  if coalesce((p_data->>'resetBuzz')::boolean,false) then
   r.buzz:='{}';
   if coalesce((r.public_state->>'buzzOpen')::boolean,false) then
    r.public_state:=jsonb_set(r.public_state,'{buzzStartsAt}',to_jsonb(floor(extract(epoch from clock_timestamp())*1000)+3200),true);
    r.state:=jsonb_set(r.state,'{play,buzzStartsAt}',r.public_state->'buzzStartsAt',true);
   end if;
  end if;
  if coalesce((p_data->>'clearSubmissions')::boolean,false) then r.submissions:='{}';end if;
 elsif p_action<>'read' then raise exception 'Unknown action';
 end if;
 pending:=coalesce(r.buzz->>'winner','')='' and jsonb_array_length(coalesce(r.buzz->'entries','[]'::jsonb))>0 and now_ms>=coalesce((r.buzz->>'firstAt')::numeric,0)+800;
 if pending then
  select value into e from jsonb_array_elements(r.buzz->'entries') with ordinality as x(value,ord) order by (value->>'reaction')::numeric,ord limit 1;
  r.buzz:=r.buzz||jsonb_build_object('winner',e->>'id','deadline',now_ms+least(120,greatest(3,coalesce((r.state#>>'{settings,seconds}')::integer,15)))*1000);
  decided:=true;
 end if;
 if p_action<>'read' or decided then r.revision:=r.revision+1;update public.family_game_rooms set state=r.state,public_state=r.public_state,players=r.players,buzz=r.buzz,submissions=r.submissions,version=r.version,revision=r.revision where code=p_code;end if;
 select coalesce(jsonb_agg(value-'hash'),'[]') into ps from jsonb_array_elements(r.players);
 return jsonb_build_object('code',r.code,'version',r.version,'revision',r.revision,'public',r.public_state,'players',ps,'buzz',r.buzz,'serverTime',floor(extract(epoch from clock_timestamp())*1000),'me',p->>'id')||case when host then jsonb_build_object('state',r.state,'submissions',r.submissions) else '{}' end;
end $function$;
REVOKE ALL ON FUNCTION public.family_game_command(text,text,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.family_game_command(text,text,text,jsonb) TO service_role;
