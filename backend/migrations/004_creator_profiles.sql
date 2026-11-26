BEGIN;
CREATE TABLE creator_profiles (
 user_id uuid PRIMARY KEY REFERENCES profiles(id),
 niche text NOT NULL DEFAULT '',
 bio text NOT NULL DEFAULT '',
 location text NOT NULL DEFAULT '',
 available boolean NOT NULL DEFAULT true,
 story_paise bigint CHECK(story_paise > 0),
 reel_paise bigint CHECK(reel_paise > 0),
 post_paise bigint CHECK(post_paise > 0),
 youtube_paise bigint CHECK(youtube_paise > 0),
 updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE creator_profiles ENABLE ROW LEVEL SECURITY;
CREATE INDEX creator_profiles_niche ON creator_profiles(niche);
COMMIT;
