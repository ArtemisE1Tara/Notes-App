import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

// Helper function to get Supabase client
function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables");
  }
  
  return createClient(supabaseUrl, supabaseKey);
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    let body;
    try {
      body = await req.json();
    } catch (e) {
      console.error("Failed to parse request body:", e);
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    
    const { title, content } = body;
    
    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    
    // Content can be empty for new documents or HTML for rich text
    const safeContent = content || "";
    
    let supabase;
    try {
      supabase = getSupabase();
    } catch (error) {
      console.error("Supabase client creation error:", error);
      return NextResponse.json({ error: "Failed to initialize database client" }, { status: 500 });
    }
    
    console.log("Attempting to create note for user:", userId);
    
    try {
      // Insert note with Clerk userId as a string
      const { data, error } = await supabase
        .from('notes')
        .insert({
          title,
          content: safeContent,
          user_id: userId.toString(), // Ensure it's a string
        })
        .select()
        .single();
      
      if (error) {
        console.error("Supabase insert error:", JSON.stringify(error));
        
        if (error.code === "42P01") {
          return NextResponse.json({ 
            error: "Notes table doesn't exist",
            details: error,
            solution: "Visit /setup to create the proper table schema"
          }, { status: 500 });
        }
        
        if (error.code === "42804" || error.message?.includes("cannot be cast automatically to type uuid")) {
          return NextResponse.json({ 
            error: "Data type mismatch for user_id", 
            details: error,
            solution: "The user_id column is likely defined as UUID but we're sending a string. Visit /setup to fix the schema"
          }, { status: 500 });
        }
        
        return NextResponse.json({ 
          error: "Database error", 
          details: error,
          message: error.message
        }, { status: 500 });
      }
      
      console.log("Note created successfully:", data.id);
      return NextResponse.json(data);
      
    } catch (error) {
      console.error("Unexpected error during note creation:", error);
      return NextResponse.json({ 
        error: "Internal server error", 
        details: JSON.stringify(error)
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Global error handler:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
