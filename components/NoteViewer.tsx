'use client';

import ReactMarkdown from 'react-markdown';

interface NoteViewerProps {
  content: string;
}

export default function NoteViewer({ content }: NoteViewerProps) {
  return (
    <div className="prose max-w-none">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
