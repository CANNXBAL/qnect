"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";

type ChatMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string | null;
  content: string;
  is_read: boolean | null;
  created_at: string;
};

type Profile = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
};

type Presence = {
  user_id: string;
  is_online: boolean | null;
  last_seen: string | null;
};

type Conversation = {
  id: string;
  otherUser: Profile | null;
  presence: Presence | null;
};

export default function MessagePage() {
  const params = useParams();
  const conversationId = params.id as string;

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [userId, setUserId] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [otherUser, setOtherUser] = useState<Profile | null>(null);
  const [otherUserPresence, setOtherUserPresence] =
    useState<Presence | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState("");
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadChat();
  }, [conversationId]);

  useEffect(() => {
    if (!otherUser?.id) return;

    const presenceChannel = supabase
      .channel(`presence:${otherUser.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_presence",
          filter: `user_id=eq.${otherUser.id}`,
        },
        (payload) => {
          setOtherUserPresence(payload.new as Presence);

          setConversations((current) =>
            current.map((conversation) => {
              if (conversation.otherUser?.id !== otherUser.id) {
                return conversation;
              }

              return {
                ...conversation,
                presence: payload.new as Presence,
              };
            })
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(presenceChannel);
    };
  }, [otherUser?.id]);

  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const newMessage = payload.new as ChatMessage;

          if (newMessage.receiver_id === userId) {
            await markMessageRead(newMessage.id);
            newMessage.is_read = true;
          }

          setMessages((currentMessages) => {
            const alreadyExists = currentMessages.some(
              (item) => item.id === newMessage.id
            );

            if (alreadyExists) return currentMessages;

            return [...currentMessages, newMessage];
          });
        }
      )
      .on("broadcast", { event: "typing" }, (payload) => {
        const payloadUserId = payload.payload?.userId;

        if (payloadUserId && payloadUserId !== userId) {
          setOtherUserTyping(true);

          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }

          typingTimeoutRef.current = setTimeout(() => {
            setOtherUserTyping(false);
          }, 1500);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [conversationId, userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, otherUserTyping]);

  async function markConversationRead(currentUserId: string) {
    const { error } = await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("conversation_id", conversationId)
      .eq("receiver_id", currentUserId);

    if (error) {
      console.error("Mark conversation read error:", error.message);
    }
  }

  async function markMessageRead(messageId: string) {
    const { error } = await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("id", messageId);

    if (error) {
      console.error("Mark message read error:", error.message);
    }
  }

  async function loadChat() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    setUserId(user.id);

    await supabase
      .from("conversation_members")
      .update({
        last_read_at: new Date().toISOString(),
      })
      .eq("conversation_id", conversationId)
      .eq("user_id", user.id);

    await markConversationRead(user.id);

    const { data: myMemberships } = await supabase
      .from("conversation_members")
      .select("conversation_id")
      .eq("user_id", user.id);

    const conversationIds = myMemberships?.map((m) => m.conversation_id) || [];

    const { data: allMembers } = await supabase
      .from("conversation_members")
      .select("conversation_id, user_id")
      .in("conversation_id", conversationIds);

    const otherUserIds =
      allMembers
        ?.filter((member) => member.user_id !== user.id)
        .map((member) => member.user_id) || [];

    let profiles: Profile[] = [];
    let presences: Presence[] = [];

    if (otherUserIds.length > 0) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .in("id", otherUserIds);

      profiles = (profileData as Profile[]) || [];

      const { data: presenceData } = await supabase
        .from("user_presence")
        .select("user_id, is_online, last_seen")
        .in("user_id", otherUserIds);

      presences = (presenceData as Presence[]) || [];
    }

    const builtConversations = conversationIds.map((id) => {
      const otherMember = allMembers?.find(
        (member) => member.conversation_id === id && member.user_id !== user.id
      );

      const foundProfile =
        profiles.find((profile) => profile.id === otherMember?.user_id) || null;

      const foundPresence =
        presences.find(
          (presence) => presence.user_id === otherMember?.user_id
        ) || null;

      return {
        id,
        otherUser: foundProfile,
        presence: foundPresence,
      };
    });

    setConversations(builtConversations);

    const currentConversation = builtConversations.find(
      (conversation) => conversation.id === conversationId
    );

    setOtherUser(currentConversation?.otherUser || null);
    setOtherUserPresence(currentConversation?.presence || null);

    const { data: messageData } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    setMessages((messageData as ChatMessage[]) || []);
    setLoading(false);
  }

  async function sendTypingSignal() {
    if (!userId) return;

    await supabase.channel(`messages:${conversationId}`).send({
      type: "broadcast",
      event: "typing",
      payload: {
        userId,
      },
    });
  }

  function handleMessageChange(value: string) {
    setMessage(value);
    sendTypingSignal();
  }

  async function sendMessage(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const trimmedMessage = message.trim();

    if (!trimmedMessage || !userId) return;

    setSending(true);

    const { data: members } = await supabase
      .from("conversation_members")
      .select("user_id")
      .eq("conversation_id", conversationId);

    const otherMember = members?.find((member) => member.user_id !== userId);

    if (!otherMember) {
      console.error("No receiver found for this conversation.");
      setSending(false);
      return;
    }

    const { data: existingBlocks, error: blockError } = await supabase
      .from("blocks")
      .select("id")
      .or(
        `and(blocker_id.eq.${userId},blocked_id.eq.${otherMember.user_id}),and(blocker_id.eq.${otherMember.user_id},blocked_id.eq.${userId})`
      );

    if (blockError) {
      console.error("Block check error:", blockError.message);
      setSending(false);
      return;
    }

    if (existingBlocks && existingBlocks.length > 0) {
      setMessage("");
      setSending(false);
      alert("You cannot send messages to this user.");
      return;
    }

    const { error } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: userId,
      receiver_id: otherMember.user_id,
      content: trimmedMessage,
      is_read: false,
    });

    if (error) {
      console.error("Send message error:", error.message);
      setSending(false);
      return;
    }

    await supabase.from("notifications").insert({
      user_id: otherMember.user_id,
      actor_id: userId,
      type: "message",
      conversation_id: conversationId,
    });

    setMessage("");
    setOtherUserTyping(false);
    setSending(false);
  }

  function getPresenceText(presence: Presence | null) {
    if (presence?.is_online) return "Online";
    if (!presence?.last_seen) return "Offline";

    const lastSeen = new Date(presence.last_seen);
    const diffMs = Date.now() - lastSeen.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 1) return "Last seen just now";
    if (diffMinutes === 1) return "Last seen 1 min ago";
    if (diffMinutes < 60) return `Last seen ${diffMinutes} mins ago`;

    const diffHours = Math.floor(diffMinutes / 60);

    if (diffHours === 1) return "Last seen 1 hour ago";
    if (diffHours < 24) return `Last seen ${diffHours} hours ago`;

    return `Last seen ${lastSeen.toLocaleDateString()}`;
  }

  const displayName =
    otherUser?.display_name || otherUser?.username || "Conversation";

  const username = otherUser?.username || "unknown";
  const avatarLetter = displayName.charAt(0).toUpperCase();
  const isOtherOnline = Boolean(otherUserPresence?.is_online);

  return (
    <main className="min-h-screen bg-[#090b12] px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <Navbar />

        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] backdrop-blur">
          <div className="grid min-h-[calc(100vh-12rem)] lg:grid-cols-[280px_1fr]">
            <aside className="border-b border-white/10 bg-black/10 lg:border-b-0 lg:border-r">
              <div className="border-b border-white/10 p-5">
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-violet-400">
                  Messages
                </p>

                <h1 className="mt-2 text-2xl font-black">Conversations</h1>
              </div>

              <div className="space-y-2 p-3">
                {conversations.length === 0 && (
                  <p className="p-4 text-sm text-white/40">
                    No conversations yet.
                  </p>
                )}

                {conversations.map((conversation) => {
                  const person = conversation.otherUser;
                  const presence = conversation.presence;
                  const isOnline = Boolean(presence?.is_online);
                  const name =
                    person?.display_name || person?.username || "Unknown";
                  const letter = name.charAt(0).toUpperCase();
                  const active = conversation.id === conversationId;

                  return (
                    <Link
                      key={conversation.id}
                      href={`/messages/${conversation.id}`}
                      className={
                        active
                          ? "flex items-center gap-3 rounded-2xl bg-violet-600/20 p-3"
                          : "flex items-center gap-3 rounded-2xl p-3 hover:bg-white/5"
                      }
                    >
                      <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-700 via-violet-700 to-blue-950 text-lg font-black">
                        {person?.avatar_url ? (
                          <img
                            src={person.avatar_url}
                            alt={name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          letter
                        )}

                        <span
                          className={
                            isOnline
                              ? "absolute bottom-1 right-1 h-3 w-3 rounded-full border-2 border-[#151821] bg-green-500"
                              : "absolute bottom-1 right-1 h-3 w-3 rounded-full border-2 border-[#151821] bg-gray-500"
                          }
                        />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate font-bold">{name}</p>
                        <p className="truncate text-xs text-white/40">
                          {getPresenceText(presence)}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </aside>

            <section className="flex min-h-[600px] flex-col">
              <header className="border-b border-white/10 p-5">
                <Link
                  href={otherUser?.id ? `/profile/${otherUser.id}` : "#"}
                  className="flex w-fit cursor-pointer items-center gap-4 rounded-2xl p-2 transition hover:bg-white/5"
                >
                  <div className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-700 via-violet-700 to-blue-950 text-xl font-black">
                    {otherUser?.avatar_url ? (
                      <img
                        src={otherUser.avatar_url}
                        alt={displayName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      avatarLetter
                    )}

                    <span
                      className={
                        isOtherOnline
                          ? "absolute bottom-1 right-1 h-3 w-3 rounded-full border-2 border-[#151821] bg-green-500"
                          : "absolute bottom-1 right-1 h-3 w-3 rounded-full border-2 border-[#151821] bg-gray-500"
                      }
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={
                          isOtherOnline
                            ? "h-2.5 w-2.5 rounded-full bg-green-500"
                            : "h-2.5 w-2.5 rounded-full bg-gray-500"
                        }
                      />

                      <h2 className="text-2xl font-black transition hover:text-violet-300">
                        {displayName}
                      </h2>
                    </div>

                    <p className="text-sm text-white/45">
                      @{username} · {getPresenceText(otherUserPresence)}
                    </p>
                  </div>
                </Link>
              </header>

              <div className="flex-1 space-y-2 overflow-y-auto p-5">
                {loading && <p className="text-white/50">Loading chat...</p>}

                {!loading && messages.length === 0 && (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center text-white/45">
                    No messages yet. Start the conversation.
                  </div>
                )}

                {messages.map((chat) => {
                  const isMe = chat.sender_id === userId;

                  return (
                    <div
                      key={chat.id}
                      className={
                        isMe ? "flex justify-end" : "flex justify-start"
                      }
                    >
                      <div
                        className={
                          isMe
                            ? "max-w-[75%] rounded-2xl bg-violet-600 px-4 py-3 text-white"
                            : "max-w-[75%] rounded-2xl bg-white/10 px-4 py-3 text-white/80"
                        }
                      >
                        <p>{chat.content}</p>

                        <p className="mt-1 text-right text-[10px] text-white/35">
                          {new Date(chat.created_at).toLocaleTimeString([], {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                          {isMe ? (chat.is_read ? " · Seen" : " · Sent") : ""}
                        </p>
                      </div>
                    </div>
                  );
                })}

                {otherUserTyping && (
                  <div className="flex justify-start">
                    <div className="rounded-2xl bg-white/5 px-4 py-3 text-sm text-white/45">
                      {displayName} is typing...
                    </div>
                  </div>
                )}

                <div ref={bottomRef} />
              </div>

              <form
                onSubmit={sendMessage}
                className="border-t border-white/10 p-5"
              >
                <div className="flex gap-3">
                  <input
                    value={message}
                    onChange={(e) => handleMessageChange(e.target.value)}
                    placeholder={`Message ${displayName}...`}
                    className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 outline-none placeholder:text-white/35"
                  />

                  <button
                    type="submit"
                    disabled={sending}
                    className="rounded-2xl bg-violet-600 px-6 font-bold hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {sending ? "Sending..." : "Send"}
                  </button>
                </div>
              </form>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}