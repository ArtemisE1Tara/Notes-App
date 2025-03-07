import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Missing Supabase environment variables" }, { status: 500 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log("Checking database schema...");
    
    // Check if notes table exists
    const { error: tableCheckError } = await supabase
      .from('notes')
      .select('id')
      .limit(1);
    
    if (tableCheckError) {
      if (tableCheckError.code === '42P01') {
        console.log("Notes table doesn't exist, creating it...");
        
        const { error: createError } = await supabase.rpc('execute_sql', {
          sql: `
            CREATE TABLE IF NOT EXISTS notes (
              id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
              title text NOT NULL,
              content text NOT NULL,
              user_id text NOT NULL,
              created_at timestamp with time zone DEFAULT now() NOT NULL,
              updated_at timestamp with time zone
            );
            
            CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
          `
        });
        
        if (createError) {
          console.error("Error creating table:", createError);
          return NextResponse.json({ 
            error: "Failed to create notes table", 
            details: createError 
          }, { status: 500 });
        }
        
        return NextResponse.json({ message: "Notes table created successfully" });
      }
      
      console.error("Error checking table:", tableCheckError);
      return NextResponse.json({ 
        error: "Error checking notes table", 
        details: tableCheckError 
      }, { status: 500 });
    }
    
    // Check if updated_at column exists and add it if it doesn't
    const { error: columnCheckError } = await supabase.rpc('execute_sql', {
      sql: `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'notes' 
        AND column_name = 'updated_at';
      `
    });
    
    if (columnCheckError) {
      console.error("Error checking updated_at column:", columnCheckError);
      return NextResponse.json({ 
        error: "Failed to check schema", 
        details: columnCheckError 
      }, { status: 500 });
    }
    
    const { error: addColumnError } = await supabase.rpc('execute_sql', {
      sql: `
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
      `
    });
    
    if (addColumnError) {
      console.error("Error adding updated_at column:", addColumnError);
      return NextResponse.json({ 
        error: "Failed to add updated_at column", 
        details: addColumnError 
      }, { status: 500 });
    }
    
    return NextResponse.json({ message: "Database schema updated successfully" });
  } catch (e) {
    console.error("Setup error:", e);
    return NextResponse.json({ 
      error: "Setup failed", 
      details: e 
    }, { status: 500 });
  }
}

export async function POST() {
  return GET();
}
