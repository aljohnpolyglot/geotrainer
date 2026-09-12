insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('clue-images', 'clue-images', false, 800000, array['image/jpeg'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Users read their own clue images"
on storage.objects for select to authenticated
using (bucket_id = 'clue-images' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users add their own clue images"
on storage.objects for insert to authenticated
with check (bucket_id = 'clue-images' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users update their own clue images"
on storage.objects for update to authenticated
using (bucket_id = 'clue-images' and (storage.foldername(name))[1] = (select auth.uid())::text)
with check (bucket_id = 'clue-images' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users delete their own clue images"
on storage.objects for delete to authenticated
using (bucket_id = 'clue-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
