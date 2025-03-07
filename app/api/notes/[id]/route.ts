import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from '@supabase/supabase-js';

// Fix the route params type to match Next.js expectations
type Params = { id: string };

export async function PUT(
  request: NextRequest, 
  { params }: { params: Params }
) {
  try {
    // Access the ID safely (using optional chaining to be extra safe)
    const noteId = params?.id;
    if (!noteId) {
      return NextResponse.json({ error: "Missing note ID" }, { status: 400 });
    }
    
    console.log(`💾 Save request received for note: ${noteId}`);
    
    // Authentication check
    const { userId } = await auth();
    if (!userId) {
      console.log("❌ Unauthorized - no userId found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Parse request body
    let bodyData;
    try {
      bodyData = await request.json();
    } catch (e) {
      console.error("❌ Failed to parse request body:", e);
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    
    const { title, content } = bodyData;
    
    // Setup Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Missing Supabase config" }, { status: 500 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Update the note WITHOUT the updated_at field since it doesn't exist in the schema
    const updateData = {
      title: title || "Untitled Note",
      content: content || ""
      // Remove updated_at field since it's causing the error
    };
    
    console.log("🔄 Updating note with data:", {
      id: noteId,
      title: updateData.title.substring(0, 20) + (updateData.title.length > 20 ? '...' : ''),
      contentLength: updateData.content.length
    });
    
    const { data, error } = await supabase
      .from('notes')
      .update(updateData)
      .eq('id', noteId)
      .eq('user_id', userId.toString())
      .select()
      .single();
    
    if (error) {
      console.error("❌ Supabase update error:", error);
      return NextResponse.json({ 
        error: "Database update failed",
        message: error.message,
        code: error.code
      }, { status: 500 });
    }
    
    console.log("✅ Note updated successfully");
    return NextResponse.json(data || { 
      id: noteId,
      updated: true
    });
  } catch (error) {
    console.error("❌ Global error in PUT handler:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest, 
  { params }: { params: Params }
) {
  try {
    const noteId = params?.id;
    if (!noteId) {
      return NextResponse.json({ error: "Missing note ID" }, { status: 400 });
    }
    
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
    
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', noteId)
      .eq('user_id', userId.toString());
    
    if (error) {
      console.error("Delete error:", error);
      return NextResponse.json({ error: "Failed to delete note" }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
