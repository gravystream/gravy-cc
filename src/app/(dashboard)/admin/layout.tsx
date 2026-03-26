import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  

  if (!session?.user || !["OWNER","ADMINISTRATOR","TECHNICAL","SUPPORT"].includes((session.user as any).role)) {
    redirect("/admin-login");
  }

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: "" },
    { href: "/admin/users", label: "Users", icon: "" },
    { href: "/admin/disputes", label: "Disputes", icon: "" },
    { href: "/admin/campaigns", label: "Campaigns", icon: "" },
  ];

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <aside className="w-64 border-r border-gray-800 bg-[#111111] flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-xl font-bold text-white">Novaclio Admin</h1>
          <p className="text-xs text-gray-500 mt-1">Management Panel</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/50 transition text-sm font-medium"
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-800">
          <div className="text-xs text-gray-500">
            Signed in as <span className="text-gray-400">{session.user.name || session.user.email}</span>
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
