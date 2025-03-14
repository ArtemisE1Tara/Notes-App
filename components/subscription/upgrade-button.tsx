"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function UpgradeButton() {
  const router = useRouter();
  
  return (
    <Button onClick={() => router.push("/settings?tab=plans")}>
      Upgrade
    </Button>
  );
}
