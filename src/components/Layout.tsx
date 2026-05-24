import { Navbar } from "./Navbar";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      <main className="flex-1 pt-20 px-4 md:px-8 pb-8 overflow-y-scroll">
        <div className="max-w-7xl mx-auto pt-4 md:pt-8">
          {children}
        </div>
      </main>
    </div>
  );
}
