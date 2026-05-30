-- Explicitly set username_confirmed = false on new profile insert
-- so the trigger never relies on the column default.
create or replace function handle_new_user()
returns trigger as $$
declare
  base_username text;
  final_username text;
  counter integer := 0;
begin
  base_username := split_part(new.email, '@', 1);
  base_username := regexp_replace(base_username, '[^a-zA-Z0-9_]', '', 'g');
  if length(base_username) < 3 then
    base_username := 'ghost' || floor(random() * 9999)::text;
  end if;

  final_username := base_username;
  loop
    exit when not exists (select 1 from profiles where username = final_username);
    counter := counter + 1;
    final_username := base_username || counter::text;
  end loop;

  insert into profiles (id, username, username_confirmed)
  values (new.id, final_username, false);
  return new;
end;
$$ language plpgsql security definer;
