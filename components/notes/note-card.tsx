"use client";

import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, CalendarClock, Clock } from "lucide-react";
import { Note } from "@/types/database.types";
import { formatDistanceToNow, format } from "date-fns";
import { useRouter } from "next/navigation";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface NoteCardProps {
  note: Note;
  onDelete: (id: string) => void;
}

export function NoteCard({ note, onDelete }: NoteCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleting(true);
    await onDelete(note.id);
    setIsDeleting(false);
  };

  const handleViewNote = () => {
    router.push(`/notes/${note.id}`);
  };

  // Format timestamps
  const createdAt = note.created_at 
    ? new Date(note.created_at)
    : null;

  const updatedAt = note.updated_at 
    ? new Date(note.updated_at) 
    : null;

  // Create human-readable time strings
  const createdAgo = createdAt 
    ? formatDistanceToNow(createdAt, { addSuffix: true })
    : "Unknown";

  const updatedAgo = updatedAt 
    ? formatDistanceToNow(updatedAt, { addSuffix: true })
    : null;

  // Format exact date and time for tooltips
  const exactCreatedDate = createdAt
    ? format(createdAt, 'PPP p') // e.g., "April 29, 2023 at 2:30 PM"
    : "Unknown";

  const exactUpdatedDate = updatedAt
    ? format(updatedAt, 'PPP p')
    : null;

  // Create a safe preview from HTML content if needed
  const createPreview = (content: string) => {
    // If content is HTML (from rich text editor)
    if (content.includes('<')) {
      // Create a temporary element to strip HTML tags
      const temp = document.createElement('div');
      temp.innerHTML = content;
      return temp.textContent || temp.innerText || '';
    }
    return content;
  };
  
  // Generate a preview of the content
  const contentPreview = createPreview(note.content);

  return (
    <Card 
      className="h-full flex flex-col hover:shadow-md transition-shadow cursor-pointer border-muted/40"
      onClick={handleViewNote}
    >
      {/* Document Preview */}
      <CardContent className="flex-grow p-0 overflow-hidden">
        <div className="relative">
          {/* Document Header */}
          <div className="p-4 bg-white border-b">
            <h3 className="font-medium text-lg line-clamp-1">{note.title}</h3>
            
            {/* Timestamps */}
            <div className="flex flex-col mt-1 space-y-1 text-xs text-muted-foreground">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center">
                      <CalendarClock className="h-3 w-3 mr-1 text-gray-400" />
                      <span>Created {createdAgo}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Created on {exactCreatedDate}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {updatedAt && createdAt && updatedAt > createdAt && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1 text-gray-400" />
                        <span>Updated {updatedAgo}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Last edited on {exactUpdatedDate}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
          
          {/* Document Preview Content */}
          <div className="p-4 pt-2 text-sm text-muted-foreground h-[140px] overflow-hidden bg-[#fcfcfc]">
            <div 
              className="line-clamp-6"
              style={{ 
                whiteSpace: 'pre-wrap', 
                wordBreak: 'break-word',
                overflowWrap: 'break-word' 
              }}
            >
              {contentPreview}
            </div>
            {/* Gradient overlay to suggest there's more content */}
            <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-[#fcfcfc] to-transparent"></div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="p-2 bg-slate-50 justify-end border-t">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          disabled={isDeleting}
          className="hover:bg-red-100 hover:text-red-700 h-8"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          {isDeleting ? "..." : "Delete"}
        </Button>
      </CardFooter>
    </Card>
  );
}

