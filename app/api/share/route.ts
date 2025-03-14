import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  const { noteId } = await request.json();
  
  const supabase = createRouteHandlerClient({ cookies });
  
  // Check if user owns the note
  const { data: noteData, error: noteError } = await supabase
    .from('notes')
    .select('*')
    .eq('id', noteId)
    .single();
    
  if (noteError || !noteData) {
    return NextResponse.json({ error: 'Note not found' }, { status: 404 });
  }
  
  // Generate a unique share ID
  const shareId = uuidv4();
  
  // Update the note with share information
  const { data, error } = await supabase
    .from('notes')
    .update({ 
      share_id: shareId, 
      is_public: true 
    })
    .eq('id', noteId)
    .select();
    
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  // Get base URL from environment variable or from request
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                 `${request.nextUrl.protocol}//${request.headers.get('host')}`;
  
  return NextResponse.json({
    shareId,
    shareUrl: `${baseUrl}/shared/${shareId}`
  });
}

export async function DELETE(request: NextRequest) {
  const { noteId } = await request.json();
  
  const supabase = createRouteHandlerClient({ cookies });
  
  const { error } = await supabase
    .from('notes')
    .update({
      share_id: null,
      is_public: false
    })
    .eq('id', noteId);
    
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ success: true });
}
