import { Header } from "@/components/layout/header";
import { SidebarNav } from "@/components/layout/sidebar-nav";

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-neutral-50">
      <Header />

      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Left sidebar */}
          <div className="hidden w-64 shrink-0 lg:block">
            <div className="fixed top-[5rem] w-64">
              <SidebarNav />
            </div>
          </div>

          {/* Main content */}
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
