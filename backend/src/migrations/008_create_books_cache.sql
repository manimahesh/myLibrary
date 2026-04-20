CREATE TABLE IF NOT EXISTS books (
  book_id     VARCHAR(255) PRIMARY KEY,
  title       VARCHAR(500),
  author      VARCHAR(500),
  thumbnail   TEXT,
  description TEXT,
  published_date VARCHAR(50),
  page_count  INTEGER,
  average_rating NUMERIC(3,1),
  ratings_count  INTEGER,
  publisher   VARCHAR(255),
  categories  TEXT,
  cached_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
