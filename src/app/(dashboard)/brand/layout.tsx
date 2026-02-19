import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function BrandLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session || (session.user as any)?.role !== "BRAND") redirect("/login");

  return (
    <div className="min-h-screen bg-gray-950 flex">
      <aside className="w-64 bg-gray-900 border-r border-gray-800 p-6 flex flex-col">
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white">Novaclio</h2>
          <p className="text-gray-400 text-sm">Brand Portal</p>
        </div>
        <nav className="flex-1 space-y-2">
          {[
            { href: "/brand", label: "Dashboard", icon: "📊" },
            { href: "/brand/discover", label: "Discover", icon: "🔍" },
            { href: "/brand/campaigns/new", label: "New Campaign", icon: "➕" },
          ].map(item => (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="pt-6 border-t border-gray-800">
          <p className="text-gray-400 text-sm">{session.user?.email}</p>
        </div>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
