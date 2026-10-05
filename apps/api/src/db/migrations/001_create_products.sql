-- The snapshot is kept whole as jsonb: its shape is owned by @ezshop/catalog's ProductSnapshotSchema,
-- and the PoC only ever reads it back whole. Promote fields to columns once we filter on them.
CREATE TABLE products (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source      text NOT NULL,
  external_id text NOT NULL,
  snapshot    jsonb NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source, external_id)
);

CREATE INDEX products_updated_at_idx ON products (updated_at DESC);
