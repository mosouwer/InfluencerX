BEGIN;
CREATE TABLE profiles (
 id uuid PRIMARY KEY,
 role text NOT NULL CHECK (role IN ('brand','influencer','admin')),
 display_name text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE campaigns (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 brand_id uuid NOT NULL REFERENCES profiles(id),
 name text NOT NULL
);
CREATE TABLE collaborations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 campaign_id uuid REFERENCES campaigns(id),
 brand_id uuid NOT NULL REFERENCES profiles(id),
 creator_id uuid NOT NULL REFERENCES profiles(id),
 title text NOT NULL,
 brief text NOT NULL,
 amount_paise bigint NOT NULL CHECK(amount_paise > 0),
 commission_bps integer NOT NULL DEFAULT 2000 CHECK(commission_bps BETWEEN 0 AND 10000),
 currency text NOT NULL DEFAULT 'INR' CHECK(currency = 'INR'),
 status text NOT NULL DEFAULT 'proposed' CHECK(status IN ('proposed','declined','awaiting_payment','active','review','revision','completed','disputed','cancelled')),
 deadline date NOT NULL,
 version integer NOT NULL DEFAULT 0,
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK(brand_id <> creator_id)
);
CREATE INDEX collaborations_brand ON collaborations(brand_id,created_at DESC);
CREATE INDEX collaborations_creator ON collaborations(creator_id,created_at DESC);
CREATE TABLE deliverables (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 collaboration_id uuid NOT NULL REFERENCES collaborations(id),
 description text NOT NULL,
 submission_url text,
 approved_at timestamptz
);
CREATE TABLE collaboration_events (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 collaboration_id uuid NOT NULL REFERENCES collaborations(id),
 actor_id uuid NOT NULL REFERENCES profiles(id),
 action text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE payments (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 collaboration_id uuid NOT NULL REFERENCES collaborations(id),
 provider_reference text UNIQUE NOT NULL,
 amount_paise bigint NOT NULL CHECK(amount_paise > 0),
 status text NOT NULL CHECK(status IN ('pending','paid','refunded','failed'))
);
CREATE TABLE provider_events (
 provider text NOT NULL,
 event_id text NOT NULL,
 received_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(provider,event_id)
);
COMMIT;
