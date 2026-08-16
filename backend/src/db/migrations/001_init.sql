CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  transcript_text TEXT NOT NULL,
  summary TEXT,
  action_items JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'summarized', 'error')),
  error_message TEXT,
  audio_duration_seconds INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  search_vector TSVECTOR GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(summary, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(transcript_text, '')), 'C')
  ) STORED
);

CREATE INDEX IF NOT EXISTS idx_transcripts_search ON transcripts USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS idx_transcripts_created_at ON transcripts (created_at DESC);
