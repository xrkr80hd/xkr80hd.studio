CREATE OR REPLACE FUNCTION public.family_game_command(p_code text,p_action text,p_token text,p_data jsonb DEFAULT '{}')
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $function$
declare r public.family_game_rooms; p jsonb; ps jsonb; h text; host boolean; maximum numeric; w numeric; team_id text; target_id text; members jsonb; rep_id text; turn_index integer;
begin
 if length(coalesce(p_token,'')) not between 32 and 200 then raise exception 'Session token required';end if;
 h:=encode(sha256(convert_to(p_token,'UTF8')),'hex');
 if p_action='read' then
  select * into r from public.family_game_rooms where code=p_code and expires_at>now();
 else
  select * into r from public.family_game_rooms where code=p_code and expires_at>now() for update;
 end if;
 if not found then raise exception 'Room not found or expired';end if;
 host:=h=r.host_hash;
 select value into p from jsonb_array_elements(r.players) where value->>'hash'=h;
 if p_action='join' then
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
  if r.public_state->>'phase'<>'clue' or not coalesce((r.public_state->>'buzzOpen')::boolean,false) or coalesce((r.public_state->>'revealed')::boolean,false) or coalesce((r.state#>>'{play,resolved}')::boolean,false) or coalesce(r.buzz->>'winner','')<>'' then raise exception 'Buzzers are locked';end if;
  team_id:=case when coalesce((r.state#>>'{play,teamMode}')::boolean,false) then p->>'teamId' else p->>'id' end;
  if team_id is null or not exists(select 1 from jsonb_array_elements(r.public_state->'teams') where value->>'id'=team_id) then raise exception 'Choose a team before buzzing';end if;
  if coalesce((r.state#>>'{play,teamMode}')::boolean,false) then
   select jsonb_agg(value order by ord) into members from jsonb_array_elements(r.players) with ordinality as players(value,ord) where value->>'teamId'=team_id;
   turn_index:=coalesce((r.state#>>array['play','turns',team_id])::integer,0);
   rep_id:=members->(turn_index % greatest(1,jsonb_array_length(members)))->>'id';
   if p->>'id' is distinct from rep_id then raise exception 'It is your teammate’s turn to answer';end if;
  end if;
  if coalesce(r.state#>'{play,judged}','[]') @> jsonb_build_array(team_id) then raise exception 'You have already answered this clue';end if;
  r.buzz:=jsonb_build_object('winner',p->>'id','deadline',floor(extract(epoch from clock_timestamp())*1000)+least(120,greatest(3,coalesce((r.state#>>'{settings,seconds}')::integer,15)))*1000);
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
   if r.public_state->>'phase'<>'final-category' then raise exception 'Wagers are locked';end if;
   if coalesce(p_data->>'text','') !~ '^[0-9]{1,9}$' then raise exception 'Enter a nonnegative whole-point wager';end if;
   w:=(p_data->>'text')::numeric;
   select greatest(0,coalesce((value->>'score')::numeric,0)) into maximum from jsonb_array_elements(r.public_state->'teams') where value->>'id'=team_id;
   if w>coalesce(maximum,0) then raise exception 'Wager exceeds your score';end if;
  end if;
  if length(coalesce(p_data->>'text',''))>2000 then raise exception 'Submission too long';end if;
  r.submissions:=jsonb_set(r.submissions,array[p->>'id'],coalesce(r.submissions->(p->>'id'),'{}')||jsonb_build_object(p_action,p_data->>'text'));
 elsif p_action='update' then
  if not host then raise exception 'Host authentication required';end if;
  if (p_data->>'version')::integer is distinct from r.version then raise exception 'Game changed. Refresh the host view and try again.';end if;
  if jsonb_typeof(p_data->'state')<>'object' or jsonb_typeof(p_data->'public')<>'object' then raise exception 'Invalid game state';end if;
  r.state:=p_data->'state';r.public_state:=p_data->'public';r.version:=r.version+1;
  if coalesce((p_data->>'resetBuzz')::boolean,false) then r.buzz:='{}';end if;
  if coalesce((p_data->>'clearSubmissions')::boolean,false) then r.submissions:='{}';end if;
 elsif p_action<>'read' then raise exception 'Unknown action';
 end if;
 if p_action<>'read' then update public.family_game_rooms set state=r.state,public_state=r.public_state,players=r.players,buzz=r.buzz,submissions=r.submissions,version=r.version where code=p_code;end if;
 select coalesce(jsonb_agg(value-'hash'),'[]') into ps from jsonb_array_elements(r.players);
 return jsonb_build_object('code',r.code,'version',r.version,'public',r.public_state,'players',ps,'buzz',r.buzz,'me',p->>'id')||case when host then jsonb_build_object('state',r.state,'submissions',r.submissions) else '{}' end;
end $function$;
REVOKE ALL ON FUNCTION public.family_game_command(text,text,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.family_game_command(text,text,text,jsonb) TO service_role;
