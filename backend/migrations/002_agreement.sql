BEGIN;
ALTER TABLE collaborations ADD COLUMN usage_rights text NOT NULL DEFAULT 'To be agreed';
ALTER TABLE collaborations ADD COLUMN revision_limit integer NOT NULL DEFAULT 1 CHECK(revision_limit BETWEEN 0 AND 10);
ALTER TABLE collaborations ADD COLUMN revisions_used integer NOT NULL DEFAULT 0 CHECK(revisions_used >= 0);
CREATE TABLE submissions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 deliverable_id uuid NOT NULL REFERENCES deliverables(id),
 url text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
COMMIT;
