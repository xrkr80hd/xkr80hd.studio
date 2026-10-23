-- Enforce the direct-upload ceiling and allowed types at Supabase Storage.
-- This update is intentionally limited to XSTUDIO's private bucket.
do $$
declare
  updated_buckets integer;
begin
  update storage.buckets
  set file_size_limit = 104857600,
      allowed_mime_types = array[
        'image/png', 'image/jpeg', 'image/webp', 'image/gif',
        'video/mp4', 'video/webm', 'video/quicktime',
        'audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/webm',
        'application/pdf'
      ]::text[]
  where id = 'xstudio-assets' and public = false;

  get diagnostics updated_buckets = row_count;
  if updated_buckets <> 1 then
    raise exception 'Expected one private xstudio-assets bucket, updated %', updated_buckets;
  end if;
end
$$;
