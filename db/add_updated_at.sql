-- Check if updated_at column exists, if not add it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'notes'
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE notes ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;
