'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from './ui/dialog';
import { Input } from './ui/input';
import { ShareIcon, XIcon, CopyIcon, CheckIcon } from 'lucide-react';
import { toast } from 'sonner';

interface ShareButtonProps {
  noteId: string;
  initialShareId?: string | null;
}

export default function ShareButton({ noteId, initialShareId }: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [shareId, setShareId] = useState<string | null>(initialShareId || null);
  const [shareUrl, setShareUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const toggleShare = async () => {
    setIsLoading(true);
    try {
      if (shareId) {
        // Remove sharing
        const res = await fetch('/api/share', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ noteId })
        });

        if (!res.ok) throw new Error('Failed to remove sharing');
        setShareId(null);
        toast.success('Note is no longer shared');
      } else {
        // Enable sharing
        const res = await fetch('/api/share', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ noteId })
        });

        if (!res.ok) throw new Error('Failed to share note');
        const data = await res.json();
        setShareId(data.shareId);
        setShareUrl(data.shareUrl);
        toast.success('Note shared successfully');
      }
    } catch (error) {
      toast.error('Failed to update sharing settings');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <Button
        variant={shareId ? "secondary" : "outline"}
        size="sm"
        onClick={() => setIsOpen(true)}
      >
        <ShareIcon className="h-4 w-4 mr-2" />
        {shareId ? 'Shared' : 'Share'}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Note</DialogTitle>
            <DialogDescription>
              {shareId 
                ? "Anyone with the link can view this note" 
                : "Generate a link to share this note with others"}
            </DialogDescription>
          </DialogHeader>

          {shareId ? (
            <div className="flex items-center space-x-2">
              <Input 
                value={shareUrl} 
                readOnly 
                className="flex-1"
              />
              <Button size="icon" variant="outline" onClick={copyToClipboard}>
                {copied ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
              </Button>
            </div>
          ) : null}

          <DialogFooter>
            <Button
              variant={shareId ? "destructive" : "default"}
              onClick={toggleShare}
              disabled={isLoading}
            >
              {isLoading 
                ? "Processing..." 
                : shareId 
                ? "Stop Sharing" 
                : "Generate Share Link"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
