"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface HeaderProps {
  email: string;
}

export function Header({ email }: HeaderProps) {
  const pathname = usePathname();

  return (
    <header className="border-b bg-white">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/dashboard" className="font-bold">
          Notes App
        </Link>
        
        <nav>
          <ul className="flex space-x-4">
            <li>
              <Link 
                href="/dashboard" 
                className="text-sm hover:underline"
              >
                Dashboard
              </Link>
            </li>
            <li>
              <Link 
                href="/settings" 
                className="text-sm hover:underline"
              >
                Settings
              </Link>
            </li>
          </ul>
        </nav>
        
        <UserButton afterSignOutUrl="/" />
      </div>
    </header>
  );
}

