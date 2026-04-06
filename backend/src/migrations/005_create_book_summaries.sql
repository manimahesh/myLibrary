CREATE TABLE book_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  book_id VARCHAR(255) NOT NULL,
  summary_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, book_id)
);

CREATE INDEX idx_book_summaries_user_id ON book_summaries(user_id);
