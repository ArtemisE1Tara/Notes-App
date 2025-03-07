-- Drop existing table and policies if they exist
drop table if exists notes;

-- Create a table for notes with TEXT user_id to match Clerk IDs
-- and make content type TEXT to handle large HTML content
create table notes (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  content text not null, -- TEXT type can store large amounts of content
  user_id text not null,  -- TEXT type to match Clerk user IDs
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone
);

-- Index for faster user_id lookups
CREATE INDEX idx_notes_user_id ON notes (user_id);
