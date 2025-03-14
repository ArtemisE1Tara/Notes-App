import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import NoteViewer from '@/components/NoteViewer';

export const revalidate = 0;

export default async function SharedNote({
  params
}: {
  params: { shareId: string };
}) {
  const supabase = createServerComponentClient({ cookies });

  // Fetch the shared note using the share ID
  const { data: note } = await supabase
    .from('notes')
    .select('*')
    .eq('share_id', params.shareId)
    .single();

  if (!note || !note.is_public) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-5xl mx-auto p-4">
        <div className="mb-4 bg-white p-4 rounded-lg shadow">
          <div className="border-b pb-2 mb-4">
            <h1 className="text-2xl font-bold">{note.title}</h1>
            <p className="text-sm text-gray-500">Shared Note</p>
          </div>
          <NoteViewer content={note.content} />
        </div>
      </div>
    </div>
  );
}
