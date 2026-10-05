-- A comparison is a named set of products; a product can sit in many comparisons (many-to-many).
-- position keeps the user's column order on the compare page; deleting either side removes the link only.
CREATE TABLE comparisons (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX comparisons_updated_at_idx ON comparisons (updated_at DESC);

CREATE TABLE comparison_products (
  comparison_id uuid NOT NULL REFERENCES comparisons (id) ON DELETE CASCADE,
  product_id    uuid NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  position      integer NOT NULL,
  added_at      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (comparison_id, product_id)
);

-- Answers "which comparisons is this product in?" without scanning every link.
CREATE INDEX comparison_products_product_idx ON comparison_products (product_id);
