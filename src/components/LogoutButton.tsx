"use client";
import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-gray-400 hover:bg-red-900/30 hover:text-red-400 transition-colors text-left"
    >
      <span></span>
      <span>Log Out</span>
    </button>
  );
}
