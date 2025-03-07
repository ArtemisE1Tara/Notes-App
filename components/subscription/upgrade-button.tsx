"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

export function UpgradeButton() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  
  const handleUpgradeClick = () => {
    setIsLoading(true);
    router.push("/pricing");
  };
  
  return (
    <Button
      onClick={handleUpgradeClick}
      disabled={isLoading}
      variant="outline"
      size="sm"
      className="bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600 border-transparent"
    >
      <Sparkles className="h-3.5 w-3.5 mr-1.5" />
      {isLoading ? "Loading..." : "Upgrade"}
    </Button>
  );
}
