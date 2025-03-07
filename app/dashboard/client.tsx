"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { createClient } from "@supabase/supabase-js";

type Note = {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at?: string;
};

type Subscription = {
  status: string;
  plan: string;
} | null;

export function DashboardClient({ 
  initialNotes, 
  userId,
  subscription 
}: { 
  initialNotes: Note[],
  userId: string,
  subscription: Subscription
}) {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [isCreatingNote, setIsCreatingNote] = useState(false);

  const createNewNote = async () => {
    if (isCreatingNote) return;
    
    setIsCreatingNote(true);
    
    try {
      // Check if user is on free tier and already has 3 notes
      if (!subscription && notes.length >= 3) {
        // Redirect to pricing page
        window.location.href = "/pricing?reason=limit";
        return;
      }
      
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Untitled Note',
          content: '',
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to create note');
      }

      const newNote = await res.json();
      window.location.href = `/notes/${newNote.id}`;
    } catch (error) {
      console.error('Error creating note:', error);
      alert('Failed to create note. Please try again.');
    } finally {
      setIsCreatingNote(false);
    }
  };

  const isPro = subscription && subscription.status === 'active';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Notes</h1>
          <p className="text-muted-foreground">
            {notes.length === 0
              ? "Create your first note to get started"
              : `You have ${notes.length} note${notes.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isPro && (
            <Badge variant="outline" className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-0">
              Pro
            </Badge>
          )}
          <Button onClick={createNewNote} disabled={isCreatingNote}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Note
          </Button>
        </div>
      </div>

      {notes.length === 0 ? (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center animate-in fade-in-50">
          <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
            <h3 className="mt-4 text-lg font-semibold">No notes created</h3>
            <p className="mb-4 mt-2 text-sm text-muted-foreground">
              You don&apos;t have any notes yet. Create your first note to get started.
            </p>
            <Button onClick={createNewNote} disabled={isCreatingNote}>
              <PlusIcon className="mr-2 h-4 w-4" />
              Create Note
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {notes.map((note) => (
            <Link key={note.id} href={`/notes/${note.id}`} className="group">
              <Card className="overflow-hidden transition-shadow hover:shadow-md">
                <CardHeader className="p-4">
                  <CardTitle className="line-clamp-1 text-base">
                    {note.title || "Untitled Note"}
                  </CardTitle>
                  <CardDescription className="line-clamp-1">
                    {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="line-clamp-2 text-sm text-muted-foreground">
                    {note.content || "No content"}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
      
      {!isPro && notes.length > 0 && notes.length < 3 && (
        <div className="rounded-lg border bg-muted/50 p-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Free Plan</h3>
            <p className="text-sm text-muted-foreground">
              {3 - notes.length} {3 - notes.length === 1 ? 'note' : 'notes'} remaining in your free plan
            </p>
          </div>
          <Link href="/pricing">
            <Button variant="outline">Upgrade</Button>
          </Link>
        </div>
      )}
      
      {!isPro && notes.length >= 3 && (
        <div className="rounded-lg border bg-amber-50 border-amber-200 p-4">
          <h3 className="text-sm font-semibold">Note Limit Reached</h3>
          <p className="text-sm text-muted-foreground mb-4">
            You've reached the limit of 3 notes on the free plan.
          </p>
          <Link href="/pricing">
            <Button>Upgrade to Pro</Button>
          </Link>
        </div>
      )}
    </div>
  );
}

