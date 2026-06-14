"use client";

import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function AccountSettingsPage() {
  const router = useRouter();

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <main className="min-h-screen bg-[#090b12] px-6 py-8 text-white">
      <div className="mx-auto max-w-5xl">
        <Navbar />

        <header className="mb-8">
          <p className="mb-2 text-sm font-bold uppercase tracking-[0.3em] text-violet-400">
            Settings
          </p>

          <h1 className="text-4xl font-black md:text-6xl">
            Account Settings
          </h1>

          <p className="mt-3 text-white/55">
            Manage your account, privacy, and notifications.
          </p>
        </header>

        <div className="space-y-6">
          <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
            <h2 className="mb-4 text-2xl font-black">
              Privacy
            </h2>

            <div className="space-y-4">
              <label className="flex items-center justify-between">
                <span>Show Online Status</span>
                <input type="checkbox" defaultChecked />
              </label>

              <label className="flex items-center justify-between">
                <span>Allow Messages</span>
                <input type="checkbox" defaultChecked />
              </label>

              <label className="flex items-center justify-between">
                <span>Allow Match Requests</span>
                <input type="checkbox" defaultChecked />
              </label>
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
            <h2 className="mb-4 text-2xl font-black">
              Notifications
            </h2>

            <div className="space-y-4">
              <label className="flex items-center justify-between">
                <span>New Match Notifications</span>
                <input type="checkbox" defaultChecked />
              </label>

              <label className="flex items-center justify-between">
                <span>New Message Notifications</span>
                <input type="checkbox" defaultChecked />
              </label>
            </div>
          </section>

          <section className="rounded-[2rem] border border-red-500/20 bg-red-500/[0.04] p-6">
            <h2 className="mb-4 text-2xl font-black text-red-300">
              Danger Zone
            </h2>

            <button
              onClick={logout}
              className="rounded-2xl bg-red-600 px-6 py-3 font-bold hover:bg-red-500"
            >
              Logout
            </button>
          </section>
        </div>
      </div>
    </main>
  );
}