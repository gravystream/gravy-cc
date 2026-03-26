import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function ShortlistPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const brandProfile = await db.brandProfile.findUnique({ where: { userId: session.user.id } });
  if (!brandProfile) redirect("/onboarding/brand");
  const shortlists = await db.shortlist.findMany({
    where: { brandId: brandProfile.id },
    include: { creator: { include: { user: { select: { name: true, image: true } } } } },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Saved Creators</h1>
        <p className="text-gray-500 mt-1">Creators you have shortlisted for future campaigns</p>
      </div>
      {shortlists.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No saved creators yet.</p>
          <Link href="/brand/discover" className="text-blue-600 hover:underline mt-2 inline-block">Discover creators</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {shortlists.map((item) => (
            <div key={item.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-lg font-bold text-gray-600">
                  {item.creator.user?.name?.[0] || "?"}
                </div>
                <div>
                  <Link href={"/brand/creators/" + item.creator.id} className="font-semibold hover:text-blue-600">{item.creator.user?.name || "Unknown Creator"}</Link>
                  <p className="text-sm text-gray-500">{item.creator.niche || "Creator"}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-gray-400">Saved {new Date(item.createdAt).toLocaleDateString()}</span>
                <Link href={"/brand/creators/" + item.creator.id} className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">View Profile</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
