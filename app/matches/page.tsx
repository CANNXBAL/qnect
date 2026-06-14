"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

type Match = {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: string;
  created_at: string;
};

type Profile = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  mode: string | null;
  platform: string | null;
  bio: string | null;
};

type MatchWithProfile = Match & {
  profile: Profile | null;
};

export default function MatchesPage() {
  const [incoming, setIncoming] = useState<MatchWithProfile[]>([]);
  const [sent, setSent] = useState<MatchWithProfile[]>([]);
  const [accepted, setAccepted] = useState<MatchWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMatches();
  }, []);

  async function loadMatches() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data: matches, error } = await supabase
      .from("matches")
      .select("*")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading matches:", error.message);
      setLoading(false);
      return;
    }

    const otherUserIds =
      matches?.map((match) =>
        match.sender_id === user.id ? match.receiver_id : match.sender_id
      ) || [];

    let profiles: Profile[] = [];

    if (otherUserIds.length > 0) {
      const { data: profileData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url, mode, platform, bio")
        .in("id", otherUserIds);

      if (profilesError) {
        console.error("Error loading match profiles:", profilesError.message);
      } else {
        profiles = (profileData as Profile[]) || [];
      }
    }

    const withProfiles =
      matches?.map((match) => {
        const otherUserId =
          match.sender_id === user.id ? match.receiver_id : match.sender_id;

        return {
          ...match,
          profile:
            profiles.find((profile) => profile.id === otherUserId) || null,
        };
      }) || [];

    setIncoming(
      withProfiles.filter(
        (match) => match.receiver_id === user.id && match.status === "pending"
      )
    );

    setSent(
      withProfiles.filter(
        (match) => match.sender_id === user.id && match.status === "pending"
      )
    );

    setAccepted(withProfiles.filter((match) => match.status === "accepted"));

    setLoading(false);
  }

  async function acceptMatch(match: MatchWithProfile) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error: updateError } = await supabase
      .from("matches")
      .update({ status: "accepted" })
      .eq("id", match.id);

    if (updateError) {
      console.error("Accept match error:", updateError.message);
      return;
    }

    const { data: conversation, error: conversationError } = await supabase
      .from("conversations")
      .insert({})
      .select()
      .single();

    if (conversationError || !conversation) {
      console.error("Conversation error:", conversationError?.message);
      loadMatches();
      return;
    }

    const { error: membersError } = await supabase
      .from("conversation_members")
      .insert([
        {
          conversation_id: conversation.id,
          user_id: match.sender_id,
        },
        {
          conversation_id: conversation.id,
          user_id: match.receiver_id,
        },
      ]);

    if (membersError) {
      console.error("Conversation members error:", membersError.message);
    }

    await supabase.from("notifications").insert({
      user_id: match.sender_id,
      actor_id: user.id,
      type: "match_accepted",
      conversation_id: conversation.id,
    });

    loadMatches();
  }

  async function declineMatch(id: string) {
    await supabase.from("matches").update({ status: "declined" }).eq("id", id);
    loadMatches();
  }

  return (
    <main className="min-h-screen bg-[#090b12] px-6 py-8 text-white">
      <div className="mx-auto max-w-6xl">
        <Navbar />

        <header className="mb-10">
          <p className="mb-2 text-sm font-bold uppercase tracking-[0.3em] text-violet-400">
            Matches
          </p>

          <h1 className="text-4xl font-black md:text-6xl">
            Manage your Qnects.
          </h1>

          <p className="mt-3 max-w-2xl text-white/55">
            Accept incoming requests, check pending Qnects, and message people
            once you both connect.
          </p>
        </header>

        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-white/60">
            Loading matches...
          </div>
        ) : (
          <div className="space-y-10">
            <MatchSection title="Incoming Requests">
              {incoming.length === 0 ? (
                <EmptyState text="No incoming requests yet." />
              ) : (
                incoming.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    actions={
                      <>
                        <button
                          onClick={() => acceptMatch(match)}
                          className="rounded-xl bg-green-600 px-4 py-2 text-sm font-bold hover:bg-green-500"
                        >
                          Accept
                        </button>

                        <button
                          onClick={() => declineMatch(match.id)}
                          className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-bold text-red-300 hover:bg-red-500/20"
                        >
                          Decline
                        </button>
                      </>
                    }
                  />
                ))
              )}
            </MatchSection>

            <MatchSection title="Sent Requests">
              {sent.length === 0 ? (
                <EmptyState text="No pending sent requests." />
              ) : (
                sent.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    actions={
                      <span className="rounded-xl bg-yellow-500/10 px-4 py-2 text-sm font-bold text-yellow-300">
                        Pending
                      </span>
                    }
                  />
                ))
              )}
            </MatchSection>

            <MatchSection title="Accepted Matches">
              {accepted.length === 0 ? (
                <EmptyState text="No accepted matches yet." />
              ) : (
                accepted.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    actions={
                      <Link
                        href="/messages"
                        className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold hover:bg-violet-500"
                      >
                        Message
                      </Link>
                    }
                  />
                ))
              )}
            </MatchSection>
          </div>
        )}
      </div>
    </main>
  );
}

function MatchSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-4 text-2xl font-black">{title}</h2>
      <div className="grid gap-4">{children}</div>
    </section>
  );
}

function MatchCard({
  match,
  actions,
}: {
  match: MatchWithProfile;
  actions: React.ReactNode;
}) {
  const profile = match.profile;
  const displayName = profile?.display_name || profile?.username || "Unknown";
  const username = profile?.username || "unknown";
  const avatarLetter = displayName.charAt(0).toUpperCase();

  return (
    <div className="flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-700 via-violet-700 to-blue-950 text-2xl font-black">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={displayName}
              className="h-full w-full object-cover"
            />
          ) : (
            avatarLetter
          )}
        </div>

        <div>
          <h3 className="text-xl font-black">{displayName}</h3>
          <p className="text-sm text-white/45">@{username}</p>

          <div className="mt-2 flex flex-wrap gap-2">
            {profile?.mode && (
              <span className="rounded-full bg-violet-500/15 px-3 py-1 text-xs font-bold text-violet-200">
                {profile.mode}
              </span>
            )}

            {profile?.platform && (
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/60">
                {profile.platform}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">{actions}</div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 text-white/45">
      {text}
    </div>
  );
}