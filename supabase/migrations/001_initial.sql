-- profiles
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  avatar_url text,
  created_at timestamptz default now()
);

alter table profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on profiles for select using (true);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

-- titles (movies + TV shows)
create table titles (
  id uuid primary key default gen_random_uuid(),
  tmdb_id integer unique not null,
  media_type text not null check (media_type in ('movie', 'tv')),
  title text not null,
  overview text,
  poster_path text,
  backdrop_path text,
  release_year integer,
  genres text[],
  rating_avg numeric(4,2) default 0,
  rating_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index titles_media_type_idx on titles(media_type);
create index titles_rating_avg_idx on titles(rating_avg desc);
create index titles_created_at_idx on titles(created_at desc);

alter table titles enable row level security;

create policy "Titles are viewable by everyone"
  on titles for select using (true);

-- ratings
create table ratings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  title_id uuid references titles on delete cascade not null,
  score integer not null check (score >= 1 and score <= 10),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, title_id)
);

create index ratings_title_id_idx on ratings(title_id);

alter table ratings enable row level security;

create policy "Ratings are viewable by everyone"
  on ratings for select using (true);

create policy "Users can insert their own ratings"
  on ratings for insert with check (auth.uid() = user_id);

create policy "Users can update their own ratings"
  on ratings for update using (auth.uid() = user_id);

create policy "Users can delete their own ratings"
  on ratings for delete using (auth.uid() = user_id);

-- comments
create table comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  title_id uuid references titles on delete cascade not null,
  parent_id uuid references comments on delete cascade,
  content text not null check (char_length(content) between 1 and 2000),
  upvote_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index comments_title_id_idx on comments(title_id);
create index comments_parent_id_idx on comments(parent_id);

alter table comments enable row level security;

create policy "Comments are viewable by everyone"
  on comments for select using (true);

create policy "Authenticated users can create comments"
  on comments for insert with check (auth.uid() = user_id);

create policy "Users can update their own comments"
  on comments for update using (auth.uid() = user_id);

create policy "Users can delete their own comments"
  on comments for delete using (auth.uid() = user_id);

-- comment votes
create table comment_votes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  comment_id uuid references comments on delete cascade not null,
  created_at timestamptz default now(),
  unique(user_id, comment_id)
);

alter table comment_votes enable row level security;

create policy "Votes are viewable by everyone"
  on comment_votes for select using (true);

create policy "Authenticated users can vote"
  on comment_votes for insert with check (auth.uid() = user_id);

create policy "Users can remove their own votes"
  on comment_votes for delete using (auth.uid() = user_id);

-- Trigger: recalculate title rating_avg after a rating changes
create or replace function update_title_rating()
returns trigger as $$
begin
  update titles
  set
    rating_avg = coalesce((select avg(score) from ratings where title_id = coalesce(NEW.title_id, OLD.title_id)), 0),
    rating_count = (select count(*) from ratings where title_id = coalesce(NEW.title_id, OLD.title_id)),
    updated_at = now()
  where id = coalesce(NEW.title_id, OLD.title_id);
  return coalesce(NEW, OLD);
end;
$$ language plpgsql security definer;

create trigger on_rating_upsert
  after insert or update or delete on ratings
  for each row execute function update_title_rating();

-- RPC: increment/decrement comment upvote count
create or replace function increment_upvote(comment_id uuid)
returns void as $$
  update comments set upvote_count = upvote_count + 1 where id = comment_id;
$$ language sql security definer;

create or replace function decrement_upvote(comment_id uuid)
returns void as $$
  update comments set upvote_count = greatest(0, upvote_count - 1) where id = comment_id;
$$ language sql security definer;

-- Trigger: create profile on signup
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

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
