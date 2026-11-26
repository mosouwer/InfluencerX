BEGIN;
ALTER TABLE collaboration_events ADD COLUMN note text CHECK (char_length(note) BETWEEN 1 AND 4000);
CREATE TABLE collaboration_comments (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 collaboration_id uuid NOT NULL REFERENCES collaborations(id),
 author_id uuid NOT NULL REFERENCES profiles(id),
 body text NOT NULL CHECK(char_length(body) BETWEEN 1 AND 4000),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX collaboration_comments_thread ON collaboration_comments(collaboration_id,created_at DESC,id);
ALTER TABLE collaboration_comments ENABLE ROW LEVEL SECURITY;
COMMIT;
