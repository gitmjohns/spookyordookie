-- Remove duplicate unique constraint on username (keep profiles_username_key)
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_username_unique;

-- Fix handle_new_user: truncate base username to 16 chars so the final
-- username (base + numeric suffix) never exceeds 20 chars. Also insert
-- all NOT NULL columns explicitly instead of relying on column defaults,
-- so the trigger is safe regardless of future column default changes.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  counter INTEGER := 0;
BEGIN
  base_username := split_part(new.email, '@', 1);
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

  INSERT INTO profiles (id, username, username_confirmed, avatar_emoji, avatar_bg, role, banned, is_prime_admin)
  VALUES (new.id, final_username, false, '💀', '#0a0a0f', 'user', false, false);

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
