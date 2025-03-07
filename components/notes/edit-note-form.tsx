"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Note } from "@/types/database.types";
import { useRouter } from "next/navigation";

interface EditNoteFormProps {
  note: Note;
  onSubmit?: (note: Note) => void;
  isFullPage?: boolean;
}

export function EditNoteForm({ note, onSubmit, isFullPage = false }: EditNoteFormProps) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      toast.error("Please enter both title and content");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/notes/${note.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), content: content.trim() }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        toast.error(`Error: ${errorData.error || "Failed to update note"}`);
        return;
      }
      
      const updatedNote = await response.json();
      toast.success("Note updated successfully!");
      
      if (onSubmit) {
        onSubmit(updatedNote);
      }
      
      // If we're on the full page editor, refresh to show updated data
      if (isFullPage) {
        router.refresh();
      }
    } catch (error) {
      console.error("Error updating note:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Input
          placeholder="Note title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isSubmitting}
          className="text-lg font-medium"
        />
      </div>
      <div className="space-y-2">
        <Textarea
          placeholder="Note content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={isSubmitting}
          rows={isFullPage ? 12 : 6}
          className="resize-none"
        />
      </div>
      <div className="flex justify-end space-x-2">
        {isFullPage && (
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.push("/dashboard")}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
