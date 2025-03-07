import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export default function HomePage() {
  const features = [
    "Create and edit documents with a Google Docs-like interface",
    "Auto-save functionality keeps your work protected",
    "Clean, distraction-free writing environment",
    "Secure authentication with Clerk",
    "Responsive design works on desktop and mobile",
    "Fast and reliable database with Supabase"
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="h-6 w-6 text-primary"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <line x1="10" y1="9" x2="8" y2="9" />
            </svg>
            <span className="text-xl font-bold">Notes App</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/sign-in" className="text-sm font-medium hover:underline">
              Sign In
            </Link>
            <Button asChild>
              <Link href="/sign-up">Get Started</Link>
            </Button>
          </nav>
        </div>
      </header>
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-b from-white to-slate-50">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="space-y-4">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Document creation and editing made simple
                </h1>
                <p className="text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Create, edit, and organize your documents with our intuitive interface. 
                  Experience a clean, distraction-free environment for all your writing needs.
                </p>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button size="lg" asChild>
                    <Link href="/sign-up">Get Started</Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link href="/sign-in">Sign In</Link>
                  </Button>
                </div>
              </div>
              
              <div className="mx-auto w-full max-w-[500px] aspect-video rounded-xl border bg-white p-2 shadow-lg">
                <div className="rounded-lg border-2 border-dashed p-4 h-full flex items-center justify-center">
                  <div className="text-center">
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      className="mx-auto h-12 w-12 text-muted-foreground"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <line x1="10" y1="9" x2="8" y2="9" />
                    </svg>
                    <h3 className="mt-2 font-medium">Document Preview</h3>
                    <p className="text-sm text-muted-foreground">Sign in to start creating documents</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Features Section */}
        <section className="py-16 bg-slate-50">
          <div className="container px-4 md:px-6">
            <div className="mx-auto grid max-w-[58rem] grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              <h2 className="text-2xl font-bold col-span-full text-center mb-6">
                Features that make document creation easier
              </h2>
              {features.map((feature, index) => (
                <div key={index} className="relative overflow-hidden rounded-lg border bg-white p-4">
                  <div className="flex items-start space-x-2">
                    <Check className="h-5 w-5 text-green-500 mt-0.5" />
                    <p>{feature}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Notes App. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

