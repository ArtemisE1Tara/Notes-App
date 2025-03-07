"use client";

import { useState, useEffect, useRef, MouseEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Note } from "@/types/database.types";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Save,
  CheckCircle,
} from "lucide-react";

interface DocumentEditorProps {
  note: Note;
}

export function DocumentEditor({ note }: DocumentEditorProps) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(
    note.updated_at ? new Date(note.updated_at) : new Date(note.created_at)
  );
  const [hasChanges, setHasChanges] = useState(false);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const router = useRouter();
  const initialContentRef = useRef<string>(note.content);
  const pendingSaveTimeout = useRef<NodeJS.Timeout | null>(null);
  
  // Track if component is mounted
  const isMounted = useRef(true);

  // Initial setup effect
  useEffect(() => {
    let initTimeout: NodeJS.Timeout;
    
    if (editorRef.current) {
      // Set innerHTML immediately
      editorRef.current.innerHTML = note.content;
      
      // Mark editor as ready after a small delay (to allow for DOM updates)
      initTimeout = setTimeout(() => {
        setIsEditorReady(true);
        console.log("Editor fully initialized and ready for input");
      }, 100);
      
      // Capture initial events - even before the editor is "ready"
      const editorElement = editorRef.current;
      
      // Add event listeners for immediate interaction
      const earlyInputHandler = () => {
        setHasChanges(true);
      };
      
      editorElement.addEventListener('input', earlyInputHandler);
      editorElement.addEventListener('keydown', earlyInputHandler);
      
      // Focus the editor to make it ready for immediate typing
      // Only do this on empty notes (new notes) or when specifically requested
      if (!note.content) {
        setTimeout(() => editorElement.focus(), 50);
      }
    }
    
    return () => {
      isMounted.current = false;
      clearTimeout(initTimeout);
      
      if (pendingSaveTimeout.current) {
        clearTimeout(pendingSaveTimeout.current);
      }
    };
  }, []);

  // Watch for changes and save immediately (with minimal debounce to prevent too many requests)
  useEffect(() => {
    if (!hasChanges || isSaving) return;
    
    // Clear any previous pending save
    if (pendingSaveTimeout.current) {
      clearTimeout(pendingSaveTimeout.current);
    }
    
    // Small debounce of 300ms to prevent save spam during rapid typing
    pendingSaveTimeout.current = setTimeout(() => {
      handleSave();
    }, 300);
    
    return () => {
      if (pendingSaveTimeout.current) {
        clearTimeout(pendingSaveTimeout.current);
      }
    };
  }, [hasChanges, title, content]);

  const editorRef = useRef<HTMLDivElement>(null);

  const getCurrentContent = (): string => {
    return editorRef.current ? editorRef.current.innerHTML : content;
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    setHasChanges(true);
  };

  // Enhanced content change handler
  const handleContentChange = () => {
    if (!editorRef.current) return;
    
    // Mark as changed when the editor content changes
    setHasChanges(true);
    
    // Update our content state to match the current editor content
    const currentContent = editorRef.current.innerHTML;
    if (currentContent !== content) {
      setContent(currentContent);
    }
  };

  const handleSave = async () => {
    if (!isMounted.current || !hasChanges) return;
    
    setIsSaving(true);
    
    try {
      // Get current editor content
      const currentContent = getCurrentContent();
      
      const contentSize = new Blob([currentContent]).size;
      
      if (contentSize > 5 * 1024 * 1024) { // 5MB limit
        toast.error("Document is too large to save");
        setIsSaving(false);
        return;
      }
      
      const saveData = { 
        title: title.trim() || "Untitled Note",
        content: currentContent 
      };
      
      const response = await fetch(`/api/notes/${note.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(saveData),
      });
      
      if (!response.ok) {
        // Handle errors
        if (response.status === 500) {
          toast.error("Database schema issue detected. Please run setup to fix it.", {
            action: {
              label: "Go to Setup",
              onClick: () => window.location.href = "/setup"
            }
          });
          return;
        }
        
        let errorMessage = "Failed to save document";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          console.error("Error parsing response");
        }
        
        toast.error(`Error: ${errorMessage}`);
        return;
      }
      
      // Update state after successful save
      setLastSaved(new Date());
      initialContentRef.current = currentContent;
      setHasChanges(false);
    } catch (error) {
      console.error("Error saving document:", error);
      toast.error("Network error while saving");
    } finally {
      if (isMounted.current) {
        setIsSaving(false);
      }
    }
  };

  // Manual save button handler
  const manualSave = async () => {
    await handleSave();
    toast.success("Document saved successfully");
  };

  // Function to handle formatting commands
  const formatDoc = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
      setHasChanges(true);
      setContent(editorRef.current.innerHTML);
    }
  };

  const formatButtons = [
    { icon: <Bold className="h-4 w-4" />, label: "Bold", command: "bold" },
    { icon: <Italic className="h-4 w-4" />, label: "Italic", command: "italic" },
    { icon: <Underline className="h-4 w-4" />, label: "Underline", command: "underline" },
    { icon: <AlignLeft className="h-4 w-4" />, label: "Align Left", command: "justifyLeft" },
    { icon: <AlignCenter className="h-4 w-4" />, label: "Align Center", command: "justifyCenter" },
    { icon: <AlignRight className="h-4 w-4" />, label: "Align Right", command: "justifyRight" },
    { icon: <List className="h-4 w-4" />, label: "Bullet List", command: "insertUnorderedList" },
    { icon: <ListOrdered className="h-4 w-4" />, label: "Number List", command: "insertOrderedList" },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Document toolbar */}
      <div className="bg-white border rounded-t-lg shadow-sm p-2 flex items-center gap-1 overflow-x-auto">
        {formatButtons.map((btn, idx) => (
          <Button
            key={idx}
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            title={btn.label}
            onClick={(e: MouseEvent) => {
              e.preventDefault();
              formatDoc(btn.command);
            }}
          >
            {btn.icon}
          </Button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          {isSaving ? (
            <span className="text-xs text-muted-foreground flex items-center">
              <Save className="h-3 w-3 animate-pulse mr-1" /> Saving...
            </span>
          ) : hasChanges ? (
            <span className="text-xs text-amber-500 flex items-center">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse mr-1"></span> 
              Unsaved changes
            </span>
          ) : lastSaved ? (
            <span className="text-xs text-muted-foreground flex items-center">
              <CheckCircle className="h-3 w-3 text-green-500 mr-1" /> Saved {formatDistanceToNow(lastSaved, { addSuffix: true })}
            </span>
          ) : null}
          
          <Button 
            size="sm"
            variant="outline" 
            onClick={manualSave}
            disabled={isSaving || !hasChanges}
          >
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
      </div>

      {/* Document title */}
      <div className="border-x bg-white px-12 pt-8 shadow-sm">
        <Input
          value={title}
          onChange={handleTitleChange}
          className="text-3xl font-bold border-none px-0 focus-visible:ring-0 focus-visible:outline-none"
          placeholder="Document Title"
        />
      </div>

      {/* Document content */}
      <div className="border rounded-b-lg bg-white px-12 pb-24 pt-4 shadow-sm flex-grow">
        <div
          ref={editorRef}
          contentEditable="true"
          onInput={handleContentChange}
          onBlur={handleContentChange}
          onKeyUp={handleContentChange}
          className="min-h-[60vh] focus:outline-none leading-relaxed"
          style={{ 
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            overflowWrap: 'break-word' 
          }}
          data-editor-ready={isEditorReady}
        />
      </div>
    </div>
  );
}
