import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session?.user || !["OWNER","ADMINISTRATOR","TECHNICAL","SUPPORT"].includes((session.user as any).role)) {
    redirect("/admin-login");
  }

  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  const roleBadge = (role: string) => {
    const colors: Record<string, string> = {
      CREATOR: "bg-green-900/50 text-green-400 border-green-800",
      BRAND: "bg-blue-900/50 text-blue-400 border-blue-800",
      ADMIN: "bg-purple-900/50 text-purple-400 border-purple-800",
    };
    return colors[role] || "bg-gray-900/50 text-gray-400 border-gray-800";
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Users</h1>
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Name</th>
              <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Email</th>
              <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Role</th>
              <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                <td className="px-6 py-4 text-white font-medium">{user.name || "—"}</td>
                <td className="px-6 py-4 text-gray-300">{user.email}</td>
                <td className="px-6 py-4">
                  <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium border ${roleBadge(user.role)}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-400 text-sm">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <p className="text-gray-500 text-center py-8">No users found.</p>
        )}
      </div>
    </div>
  );
}
