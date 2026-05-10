import { Suspense } from "react";
import NewContractPage from "./client-page";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-950 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" /></div>}>
      <NewContractPage />
    </Suspense>
  );
}
