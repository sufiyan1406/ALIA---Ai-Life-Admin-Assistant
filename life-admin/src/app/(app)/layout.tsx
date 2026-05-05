import BrutalSidebar from '@/components/BrutalSidebar';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <BrutalSidebar />
      <main className="min-h-screen w-full flex-1 bg-brutal-offwhite pt-[76px] md:ml-[280px] md:pt-0">
        {children}
      </main>
    </div>
  );
}
