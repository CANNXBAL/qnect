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
  conversation_id: string | null;
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
  const [userId, setUserId] = useState("");
  const [incoming, setIncoming] = useState<MatchWithProfile[]>([]);
  const [sent, setSent] = useState<MatchWithProfile[]>([]);
  const [accepted, setAccepted] = useState<MatchWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState("");

  useEffect(() => {
    loadMatches();
  }, []);

  async function loadMatches() {
    setLoading(true);
    setActionMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    setUserId(user.id);

    const { data: matches, error } = await supabase
      .from("matches")
      .select("*")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .neq("status", "declined")
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

  async function findExistingConversation(userA: string, userB: string) {
    const { data: memberRows, error } = await supabase
      .from("conversation_members")
      .select("conversation_id, user_id")
      .in("user_id", [userA, userB]);

    if (error) {
      console.error("Find conversation error:", error.message);
      return null;
    }

    const grouped = new Map<string, Set<string>>();

    memberRows?.forEach((row) => {
      if (!grouped.has(row.conversation_id)) {
        grouped.set(row.conversation_id, new Set());
      }

      grouped.get(row.conversation_id)?.add(row.user_id);
    });

    for (const [conversationId, members] of grouped.entries()) {
      if (members.has(userA) && members.has(userB)) {
        return conversationId;
      }
    }

    return null;
  }

  async function getOrCreateConversation(userA: string, userB: string) {
    const existingConversationId = await findExistingConversation(userA, userB);

    if (existingConversationId) {
      return existingConversationId;
    }

    const { data: conversation, error: conversationError } = await supabase
      .from("conversations")
      .insert({})
      .select()
      .single();

    if (conversationError || !conversation) {
      console.error("Conversation error:", conversationError?.message);
      return null;
    }

    const { error: membersError } = await supabase
      .from("conversation_members")
      .insert([
        {
          conversation_id: conversation.id,
          user_id: userA,
        },
        {
          conversation_id: conversation.id,
          user_id: userB,
        },
      ]);

    if (membersError) {
      console.error("Conversation members error:", membersError.message);
      return null;
    }

    return conversation.id as string;
  }

  async function acceptMatch(match: MatchWithProfile) {
    setActionMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const conversationId =
      match.conversation_id ||
      (await getOrCreateConversation(match.sender_id, match.receiver_id));

    if (!conversationId) {
      setActionMessage("Could not create the conversation.");
      return;
    }

    const { error: updateError } = await supabase
      .from("matches")
      .update({
        status: "accepted",
        conversation_id: conversationId,
      })
      .eq("id", match.id);

    if (updateError) {
      console.error("Accept match error:", updateError.message);
      setActionMessage("Something went wrong accepting this request.");
      return;
    }

    await supabase.from("notifications").insert({
      user_id: match.sender_id,
      actor_id: user.id,
      type: "match_accepted",
      conversation_id: conversationId,
    });

    setActionMessage("Qnect accepted.");
    loadMatches();
  }

  async function declineMatch(id: string) {
    setActionMessage("");

    const { error } = await supabase
      .from("matches")
      .update({ status: "declined" })
      .eq("id", id);

    if (error) {
      console.error("Decline match error:", error.message);
      setActionMessage("Something went wrong declining this request.");
      return;
    }

    setActionMessage("Qnect declined.");
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

        {actionMessage && (
          <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/70">
            {actionMessage}
          </div>
        )}

        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-white/60">
            Loading matches...
          </div>
        ) : (
          <div className="space-y-10">
            <MatchSection
              title="Incoming Requests"
              description="People who want to Qnect with you."
              count={incoming.length}
            >
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

            <MatchSection
              title="Sent Requests"
              description="Qnect requests waiting for a response."
              count={sent.length}
            >
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

            <MatchSection
              title="Accepted Matches"
              description="People you can message now."
              count={accepted.length}
            >
              {accepted.length === 0 ? (
                <EmptyState text="No accepted matches yet." />
              ) : (
                accepted.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    actions={
                      match.conversation_id ? (
                        <Link
                          href={`/messages/${match.conversation_id}`}
                          className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold hover:bg-violet-500"
                        >
                          Message
                        </Link>
                      ) : (
                        <button
                          onClick={() => acceptMatch(match)}
                          className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold hover:bg-violet-500"
                        >
                          Create Chat
                        </button>
                      )
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
  description,
  count,
  children,
}: {
  title: string;
  description: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-5">
      <div className="mb-5 flex flex-col justify-between gap-2 md:flex-row md:items-end">
        <div>
          <h2 className="text-2xl font-black">{title}</h2>
          <p className="mt-1 text-sm text-white/45">{description}</p>
        </div>

        <span className="w-fit rounded-full bg-violet-500/15 px-3 py-1 text-xs font-bold text-violet-200">
          {count}
        </span>
      </div>

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
    <div className="flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur transition hover:bg-white/[0.06] md:flex-row md:items-center md:justify-between">
      <Link
        href={profile?.id ? `/profile/${profile.id}` : "#"}
        className="flex min-w-0 items-center gap-4"
      >
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-700 via-violet-700 to-blue-950 text-2xl font-black">
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

        <div className="min-w-0">
          <h3 className="truncate text-xl font-black hover:text-violet-300">
            {displayName}
          </h3>
          <p className="truncate text-sm text-white/45">@{username}</p>

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

            <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/50">
              {match.status}
            </span>
          </div>
        </div>
      </Link>

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