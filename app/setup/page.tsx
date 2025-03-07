"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function SetupPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [details, setDetails] = useState<any>(null);

  const runSetup = async () => {
    setStatus("loading");
    setMessage("Setting up database...");
    
    try {
      const response = await fetch("/api/setup/fix-schema");
      const data = await response.json();
      
      if (response.ok) {
        setStatus("success");
        setMessage(data.message || "Setup completed successfully");
      } else {
        setStatus("error");
        setMessage(data.error || "Setup failed");
        setDetails(data.details || null);
      }
    } catch (error) {
      setStatus("error");
      setMessage("Network error");
      console.error(error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-4">Notes App Database Setup</h1>
        
        <div className="mb-6">
          <p className="mb-2">
            This utility will help fix your database schema for the Notes App.
          </p>
          <p className="mb-2 text-sm text-gray-600">
            To manually run SQL in Supabase, copy the code below and run it in SQL Editor:
          </p>
          
          <div className="bg-gray-100 p-3 rounded my-4 overflow-x-auto text-sm">
            <pre>{`-- Initial table creation
DROP TABLE IF EXISTS notes;

CREATE TABLE notes (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  title text NOT NULL,
  content text NOT NULL,
  user_id text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone
);

-- Create index on user_id
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);`}</pre>
          </div>
        </div>
        
        <div className="space-y-4">
          <Button onClick={runSetup} className="w-full" disabled={status === "loading"}>
            {status === "loading" ? "Setting up..." : "Run Setup"}
          </Button>
          
          <Link href="/dashboard" className="block text-center text-blue-600 hover:underline">
            Return to Dashboard
          </Link>
        </div>
        
        {status === "loading" && (
          <div className="text-center py-4 mt-4">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
            <p>{message}</p>
          </div>
        )}
        
        {status === "success" && (
          <div className="bg-green-50 p-4 rounded-md mt-4">
            <p className="text-green-800">✅ {message}</p>
          </div>
        )}
        
        {status === "error" && (
          <div className="bg-red-50 p-4 rounded-md mt-4">
            <p className="text-red-800">❌ {message}</p>
            {details && (
              <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-40 mt-2">
                {JSON.stringify(details, null, 2)}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
