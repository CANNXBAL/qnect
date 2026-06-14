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

type MessagePreview = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

type Conversation = {
  id: string;
  last_read_at: string | null;
  otherUser: Profile | null;
  lastMessage: MessagePreview | null;
  unreadCount: number;
};

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();
  }, []);

  async function loadConversations() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data: myMemberships, error: myMembershipsError } = await supabase
      .from("conversation_members")
      .select("conversation_id, last_read_at")
      .eq("user_id", user.id);

    if (myMembershipsError) {
      console.error("My memberships error:", myMembershipsError.message);
      setLoading(false);
      return;
    }

    const conversationIds = myMemberships?.map((m) => m.conversation_id) || [];

    if (conversationIds.length === 0) {
      setConversations([]);
      setLoading(false);
      return;
    }

    const { data: allMembers, error: allMembersError } = await supabase
      .from("conversation_members")
      .select("conversation_id, user_id")
      .in("conversation_id", conversationIds);

    if (allMembersError) {
      console.error("All members error:", allMembersError.message);
      setLoading(false);
      return;
    }

    const otherUserIds =
      allMembers
        ?.filter((member) => member.user_id !== user.id)
        .map((member) => member.user_id) || [];

    let profiles: Profile[] = [];

    if (otherUserIds.length > 0) {
      const { data: profileData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .in("id", otherUserIds);

      if (profilesError) {
        console.error("Profiles error:", profilesError.message);
      } else {
        profiles = (profileData as Profile[]) || [];
      }
    }

    const { data: messageData, error: messagesError } = await supabase
      .from("messages")
      .select("id, conversation_id, sender_id, content, created_at")
      .in("conversation_id", conversationIds)
      .order("created_at", { ascending: false });

    if (messagesError) {
      console.error("Messages error:", messagesError.message);
    }

    const messages = (messageData as MessagePreview[]) || [];

    const built = conversationIds.map((conversationId) => {
      const otherMember = allMembers?.find(
        (member) =>
          member.conversation_id === conversationId &&
          member.user_id !== user.id
      );

      const membership = myMemberships?.find(
        (item) => item.conversation_id === conversationId
      );

      const conversationMessages = messages.filter(
        (msg) => msg.conversation_id === conversationId
      );

      const lastMessage = conversationMessages[0] || null;

      const unreadCount = conversationMessages.filter((msg) => {
        if (msg.sender_id === user.id) return false;
        if (!membership?.last_read_at) return true;

        return new Date(msg.created_at) > new Date(membership.last_read_at);
      }).length;

      return {
        id: conversationId,
        last_read_at: membership?.last_read_at || null,
        otherUser:
          profiles.find((profile) => profile.id === otherMember?.user_id) ||
          null,
        lastMessage,
        unreadCount,
      };
    });

    built.sort((a, b) => {
      const aTime = a.lastMessage?.created_at || "";
      const bTime = b.lastMessage?.created_at || "";

      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });

    setConversations(built);
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-[#090b12] px-6 py-8 text-white">
      <div className="mx-auto max-w-6xl">
        <Navbar />

        <header className="mb-8">
          <p className="mb-2 text-sm font-bold uppercase tracking-[0.3em] text-violet-400">
            Messages
          </p>

          <h1 className="text-4xl font-black md:text-6xl">
            Your conversations.
          </h1>

          <p className="mt-3 max-w-2xl text-white/55">
            Chat with users after both sides Qnect.
          </p>
        </header>

        {loading && <p className="text-white/50">Loading messages...</p>}

        {!loading && conversations.length === 0 && (
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 text-white/50">
            No conversations yet.
          </div>
        )}

        <div className="grid gap-4">
          {conversations.map((conversation) => {
            const name =
              conversation.otherUser?.display_name ||
              conversation.otherUser?.username ||
              "Unknown";

            const username = conversation.otherUser?.username || "unknown";
            const avatarLetter = name.charAt(0).toUpperCase();

            const preview = conversation.lastMessage
              ? conversation.lastMessage.sender_id === conversation.otherUser?.id
                ? conversation.lastMessage.content
                : `You: ${conversation.lastMessage.content}`
              : "No messages yet.";

            const previewTime = conversation.lastMessage
              ? new Date(conversation.lastMessage.created_at).toLocaleTimeString(
                  [],
                  {
                    hour: "numeric",
                    minute: "2-digit",
                  }
                )
              : "";

            return (
              <Link
                key={conversation.id}
                href={`/messages/${conversation.id}`}
                className="flex items-center gap-4 rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 transition hover:bg-white/[0.08]"
              >
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-700 via-violet-700 to-blue-950 text-2xl font-black">
                  {conversation.otherUser?.avatar_url ? (
                    <img
                      src={conversation.otherUser.avatar_url}
                      alt={name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    avatarLetter
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-xl font-black">{name}</p>
                      <p className="truncate text-sm text-white/45">
                        @{username}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      {previewTime && (
                        <span className="text-xs text-white/35">
                          {previewTime}
                        </span>
                      )}

                      {conversation.unreadCount > 0 && (
                        <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-violet-600 px-2 text-xs font-black">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>

                  <p
                    className={
                      conversation.unreadCount > 0
                        ? "mt-2 truncate text-sm font-bold text-white/85"
                        : "mt-2 truncate text-sm text-white/45"
                    }
                  >
                    {preview}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}