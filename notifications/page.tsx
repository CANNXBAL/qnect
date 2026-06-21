"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { useEffect, useMemo, useState } from "react";

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
  const [filter, setFilter] = useState("All");

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
      data?.map((item) => item.actor_id).filter((id): id is string => Boolean(id)) || [];

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
        actor: profiles.find((profile) => profile.id === item.actor_id) || null,
      })) || [];

    setNotifications(built as Notification[]);
    setLoading(false);
  }

  const filteredNotifications = useMemo(() => {
    if (filter === "All") return notifications;
    if (filter === "Unread") return notifications.filter((item) => !item.is_read);
    if (filter === "Qnects") {
      return notifications.filter(
        (item) => item.type === "match_request" || item.type === "match_accepted"
      );
    }
    if (filter === "Messages") {
      return notifications.filter((item) => item.type === "message");
    }

    return notifications;
  }, [notifications, filter]);

  const unreadCount = notifications.filter((item) => !item.is_read).length;

  async function markOneRead(id: string) {
    setNotifications((current) =>
      current.map((item) => (item.id === id ? { ...item, is_read: true } : item))
    );

    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
  }

  async function markAllRead() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    setNotifications((current) =>
      current.map((item) => ({
        ...item,
        is_read: true,
      }))
    );

    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);
  }

  function getTypeLabel(type: string) {
    if (type === "match_request") return "Qnect Request";
    if (type === "match_accepted") return "Accepted";
    if (type === "message") return "Message";

    return "Update";
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
    if (notification.type === "match_request") return "/matches";
    if (notification.type === "match_accepted") return "/matches";
    if (notification.type === "message" && notification.conversation_id) {
      return `/messages/${notification.conversation_id}`;
    }

    return "/notifications";
  }

  function getButtonText(notification: Notification) {
    if (notification.type === "match_request") return "View Request";
    if (notification.type === "match_accepted") return "View Match";
    if (notification.type === "message") return "Open Chat";

    return "Open";
  }

  return (
    <main className="min-h-screen bg-[#090b12] px-6 py-8 text-white">
      <div className="mx-auto max-w-5xl">
        <Navbar />

        <header className="mb-8">
          <p className="mb-2 text-sm font-bold uppercase tracking-[0.3em] text-violet-400">
            Notifications
          </p>

          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h1 className="text-4xl font-black md:text-6xl">
                What&apos;s happening.
              </h1>

              <p className="mt-3 max-w-2xl text-white/55">
                Qnect requests, accepted matches, and new messages show here.
              </p>
            </div>

            <button
              onClick={markAllRead}
              disabled={unreadCount === 0}
              className="w-fit rounded-2xl border border-white/10 px-5 py-3 text-sm font-bold text-white/70 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Mark all read
            </button>
          </div>
        </header>

        <div className="mb-6 flex flex-wrap gap-2">
          {["All", "Unread", "Qnects", "Messages"].map((item) => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              className={
                filter === item
                  ? "rounded-full bg-violet-600 px-4 py-2 text-sm font-bold"
                  : "rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-bold text-white/60 hover:bg-white/[0.08]"
              }
            >
              {item}
            </button>
          ))}

          {unreadCount > 0 && (
            <span className="rounded-full bg-violet-500/15 px-4 py-2 text-sm font-bold text-violet-200">
              {unreadCount} unread
            </span>
          )}
        </div>

        {loading && <p className="text-white/50">Loading notifications...</p>}

        {!loading && filteredNotifications.length === 0 && (
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 text-white/50">
            No notifications here.
          </div>
        )}

        <div className="grid gap-4">
          {filteredNotifications.map((notification) => {
            const actorName =
              notification.actor?.display_name ||
              notification.actor?.username ||
              "Someone";

            const avatarLetter = actorName.charAt(0).toUpperCase();

            return (
              <div
                key={notification.id}
                className={
                  notification.is_read
                    ? "rounded-[2rem] border border-white/10 bg-white/[0.03] p-5 transition hover:bg-white/[0.06]"
                    : "rounded-[2rem] border border-violet-500/40 bg-violet-500/10 p-5 transition hover:bg-violet-500/15"
                }
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex min-w-0 items-center gap-4">
                    <Link
                      href={
                        notification.actor?.id
                          ? `/profile/${notification.actor.id}`
                          : "#"
                      }
                      className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-700 via-violet-700 to-blue-950 text-xl font-black"
                    >
                      {notification.actor?.avatar_url ? (
                        <img
                          src={notification.actor.avatar_url}
                          alt={actorName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        avatarLetter
                      )}
                    </Link>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/60">
                          {getTypeLabel(notification.type)}
                        </span>

                        {!notification.is_read && (
                          <span className="rounded-full bg-violet-600 px-2 py-1 text-[10px] font-black">
                            NEW
                          </span>
                        )}
                      </div>

                      <p className="mt-2 font-bold text-white">
                        {getText(notification)}
                      </p>

                      <p className="mt-1 text-sm text-white/40">
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {notification.actor?.id && (
                      <Link
                        href={`/profile/${notification.actor.id}`}
                        className="rounded-xl border border-white/10 px-4 py-2 text-sm font-bold text-white/70 hover:bg-white/10"
                      >
                        Profile
                      </Link>
                    )}

                    <Link
                      href={getHref(notification)}
                      onClick={() => markOneRead(notification.id)}
                      className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold hover:bg-violet-500"
                    >
                      {getButtonText(notification)}
                    </Link>

                    {!notification.is_read && (
                      <button
                        onClick={() => markOneRead(notification.id)}
                        className="rounded-xl border border-white/10 px-4 py-2 text-sm font-bold text-white/60 hover:bg-white/10"
                      >
                        Mark Read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}