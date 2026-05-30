-- Wrap the profile insert in an exception block so a trigger failure
-- never blocks the auth.users insert. If the insert fails for any reason,
-- a WARNING is raised (visible in Supabase logs) and the auth signup
-- completes normally. The /auth/callback fallback creates the profile.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  counter INTEGER := 0;
BEGIN
  base_username := split_part(coalesce(new.email, ''), '@', 1);
  base_username := regexp_replace(base_username, '[^a-zA-Z0-9_]', '', 'g');
  base_username := left(base_username, 16);

  IF length(base_username) < 3 THEN
    base_username := 'ghost' || floor(random() * 9999)::text;
  END IF;

  final_username := base_username;
  LOOP
    EXIT WHEN NOT EXISTS (SELECT 1 FROM profiles WHERE username = final_username);
    counter := counter + 1;
    final_username := left(base_username, 16) || counter::text;
  END LOOP;

  BEGIN
    INSERT INTO profiles (id, username, username_confirmed, avatar_emoji, avatar_bg, role, banned, is_prime_admin)
    VALUES (new.id, final_username, false, '💀', '#0a0a0f', 'user', false, false);
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user: profile insert failed for user %: % %', new.id, SQLERRM, SQLSTATE;
  END;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
