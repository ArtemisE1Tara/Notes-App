ALTER TABLE notes ADD COLUMN share_id UUID DEFAULT NULL;
ALTER TABLE notes ADD COLUMN is_public BOOLEAN DEFAULT FALSE;

CREATE POLICY "Anyone can read public notes" 
  ON notes 
  FOR SELECT 
  USING (is_public = TRUE);
