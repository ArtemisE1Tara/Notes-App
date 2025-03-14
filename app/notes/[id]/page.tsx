import { createClient } from "@supabase/supabase-js";
import { Header } from "@/components/layout/header";
import { currentUser } from "@clerk/nextjs/server";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DocumentEditor } from "@/components/notes/document-editor";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { DeleteNoteButton } from "@/components/notes/delete-note-button";
import ShareButton from '@/components/ShareButton';

export default async function NotePage({ params }: { params: { id: string } }) {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) {
    redirect("/sign-in");
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables");
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Fetch the specific note
  const { data: note, error } = await supabase
    .from("notes")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // Note not found or doesn't belong to user
      redirect("/dashboard");
    }
    throw new Error(`Failed to fetch note: ${error.message}`);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header email={user.emailAddresses[0].emailAddress} />
      <nav className="border-b bg-white">
        <div className="container flex h-12 items-center gap-4 px-4">
          <Link 
            href="/dashboard"
            className="flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            All Documents
          </Link>
          <div className="ml-auto">
            <DeleteNoteButton noteId={note.id} />
          </div>
        </div>
      </nav>
      
      <main className="flex-1 container py-6 max-w-4xl mx-auto">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShareButton noteId={params.id} initialShareId={note.share_id} />
          </div>
        </div>
        <DocumentEditor note={note} />
      </main>
    </div>
  );
}
