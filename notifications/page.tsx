"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

type Profile = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
};

type Notification = {
  id: string;
  user_id: string;
  actor_id: string | null;
  type: string;
  conversation_id: string | null;
  is_read: boolean;
  created_at: string;
  actor?: Profile | null;
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  async function loadNotifications() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Notifications error:", error.message);
      setLoading(false);
      return;
    }

    const actorIds =
      data
        ?.map((item) => item.actor_id)
        .filter((id): id is string => Boolean(id)) || [];

    let profiles: Profile[] = [];

    if (actorIds.length > 0) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .in("id", actorIds);

      profiles = (profileData as Profile[]) || [];
    }

    const built =
      data?.map((item) => ({
        ...item,
        actor:
          profiles.find((profile) => profile.id === item.actor_id) || null,
      })) || [];

    setNotifications(built as Notification[]);
    setLoading(false);

    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);
  }

  function getText(notification: Notification) {
    const actorName =
      notification.actor?.display_name ||
      notification.actor?.username ||
      "Someone";

    if (notification.type === "match_request") {
      return `${actorName} sent you a Qnect request.`;
    }

    if (notification.type === "match_accepted") {
      return `${actorName} accepted your Qnect request.`;
    }

    if (notification.type === "message") {
      return `${actorName} sent you a new message.`;
    }

    return "You have a new notification.";
  }

  function getHref(notification: Notification) {
    if (notification.type === "match_request") {
      return "/matches";
    }

    if (notification.type === "match_accepted") {
      return "/matches";
    }

    if (notification.type === "message" && notification.conversation_id) {
      return `/messages/${notification.conversation_id}`;
    }

    return "/notifications";
  }

  return (
    <main className="min-h-screen bg-[#090b12] px-6 py-8 text-white">
      <div className="mx-auto max-w-5xl">
        <Navbar />

        <header className="mb-8">
          <p className="mb-2 text-sm font-bold uppercase tracking-[0.3em] text-violet-400">
            Notifications
          </p>

          <h1 className="text-4xl font-black md:text-6xl">
            What&apos;s happening.
          </h1>

          <p className="mt-3 max-w-2xl text-white/55">
            Qnect requests, accepted matches, and new messages will show here.
          </p>
        </header>

        {loading && <p className="text-white/50">Loading notifications...</p>}

        {!loading && notifications.length === 0 && (
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 text-white/50">
            No notifications yet.
          </div>
        )}

        <div className="grid gap-4">
          {notifications.map((notification) => {
            const actorName =
              notification.actor?.display_name ||
              notification.actor?.username ||
              "Someone";

            const avatarLetter = actorName.charAt(0).toUpperCase();

            return (
              <Link
                key={notification.id}
                href={getHref(notification)}
                className={
                  notification.is_read
                    ? "flex items-center gap-4 rounded-[2rem] border border-white/10 bg-white/[0.03] p-5 transition hover:bg-white/[0.07]"
                    : "flex items-center gap-4 rounded-[2rem] border border-violet-500/40 bg-violet-500/10 p-5 transition hover:bg-violet-500/15"
                }
              >
                <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-700 via-violet-700 to-blue-950 text-xl font-black">
                  {notification.actor?.avatar_url ? (
                    <img
                      src={notification.actor.avatar_url}
                      alt={actorName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    avatarLetter
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="font-bold text-white">
                    {getText(notification)}
                  </p>

                  <p className="mt-1 text-sm text-white/40">
                    {new Date(notification.created_at).toLocaleString()}
                  </p>
                </div>

                {!notification.is_read && (
                  <span className="h-3 w-3 rounded-full bg-violet-500" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}