-- Multi-user: every product and comparison now belongs to one user. Rows saved before this migration
-- have no owner to give them to, so they are deleted (decided when user accounts were introduced).
TRUNCATE comparison_products, comparisons, products;

-- email is stored lower-cased by the API; the CHECK keeps a hand-written row from creating a case twin.
CREATE TABLE users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text NOT NULL UNIQUE CHECK (email = lower(email)),
  password_hash text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- The cookie carries a random token; only its SHA-256 is stored, so a leaked table grants no live sessions.
CREATE TABLE sessions (
  token_hash bytea PRIMARY KEY,
  user_id    uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);

CREATE INDEX sessions_user_idx ON sessions (user_id);

-- Products are per-user copies: one user's capture (price, availability seen from their own browser)
-- never changes another user's library. The (user_id, id) key is the target of the composite FKs below.
ALTER TABLE products ADD COLUMN user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE;
ALTER TABLE products DROP CONSTRAINT products_source_external_id_key;
ALTER TABLE products ADD CONSTRAINT products_user_listing_key UNIQUE (user_id, source, external_id);
ALTER TABLE products ADD CONSTRAINT products_user_id_id_key UNIQUE (user_id, id);
DROP INDEX products_updated_at_idx;
CREATE INDEX products_user_updated_at_idx ON products (user_id, updated_at DESC);

ALTER TABLE comparisons ADD COLUMN user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE;
ALTER TABLE comparisons ADD CONSTRAINT comparisons_user_id_id_key UNIQUE (user_id, id);
DROP INDEX comparisons_updated_at_idx;
CREATE INDEX comparisons_user_updated_at_idx ON comparisons (user_id, updated_at DESC);

-- Composite FKs: a link row names one user for both sides, so a comparison can only ever hold
-- products of the user who owns it, whatever the application code does.
ALTER TABLE comparison_products ADD COLUMN user_id uuid NOT NULL;
ALTER TABLE comparison_products DROP CONSTRAINT comparison_products_comparison_id_fkey;
ALTER TABLE comparison_products DROP CONSTRAINT comparison_products_product_id_fkey;
ALTER TABLE comparison_products ADD CONSTRAINT comparison_products_comparison_fkey
  FOREIGN KEY (user_id, comparison_id) REFERENCES comparisons (user_id, id) ON DELETE CASCADE;
ALTER TABLE comparison_products ADD CONSTRAINT comparison_products_product_fkey
  FOREIGN KEY (user_id, product_id) REFERENCES products (user_id, id) ON DELETE CASCADE;
