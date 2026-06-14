"use client";

import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [userId, setUserId] = useState("");
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    setupNavbar();
  }, []);

  useEffect(() => {
    if (!userId) return;

    const notificationsChannel = supabase
      .channel(`navbar-notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          loadUnreadNotifications(userId);
        }
      )
      .subscribe();

    const messagesChannel = supabase
      .channel(`navbar-messages:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${userId}`,
        },
        () => {
          loadUnreadMessages(userId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notificationsChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, [userId]);

  async function setupNavbar() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    setUserId(user.id);
    loadUnreadNotifications(user.id);
    loadUnreadMessages(user.id);
  }

  async function loadUnreadNotifications(currentUserId: string) {
    const { count } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", currentUserId)
      .eq("is_read", false);

    setUnreadNotifications(count || 0);
  }

  async function loadUnreadMessages(currentUserId: string) {
    const { count } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("receiver_id", currentUserId)
      .eq("is_read", false);

    setUnreadMessages(count || 0);
  }

  return (
    <nav className="mb-8 rounded-[2rem] border border-white/10 bg-white/[0.04] px-5 py-4 backdrop-blur">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <Link href="/" className="text-2xl font-black tracking-tight">
          Qnect
        </Link>

        <div className="flex flex-wrap gap-2">
          <NavLink href="/discover" label="Discover" />
          <NavLink href="/matches" label="Matches" />

          <Link
            href="/messages"
            className="relative rounded-xl px-4 py-2 text-sm font-semibold text-white/65 hover:bg-white/10 hover:text-white"
          >
            Messages

            {unreadMessages > 0 && (
              <span className="ml-2 rounded-full bg-violet-600 px-2 py-0.5 text-xs font-black text-white">
                {unreadMessages}
              </span>
            )}
          </Link>

          <Link
            href="/notifications"
            className="relative rounded-xl px-4 py-2 text-sm font-semibold text-white/65 hover:bg-white/10 hover:text-white"
          >
            Notifications

            {unreadNotifications > 0 && (
              <span className="ml-2 rounded-full bg-violet-600 px-2 py-0.5 text-xs font-black text-white">
                {unreadNotifications}
              </span>
            )}
          </Link>

          <NavLink href="/settings" label="Profile" />
          <NavLink href="/account-settings" label="Settings" />
        </div>
      </div>
    </nav>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-xl px-4 py-2 text-sm font-semibold text-white/65 hover:bg-white/10 hover:text-white"
    >
      {label}
    </Link>
  );
}