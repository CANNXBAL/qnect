"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Profile = {
  id: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  mode: string | null;
  avatar_url: string | null;
  age: number | null;
  timezone: string | null;
  platform: string | null;
  looking_for: string[] | null;
  games: string[] | null;
  vibes: string[] | null;
  availability: string[] | null;
  voice_chat: boolean | null;
  rp_character_name: string | null;
  rp_experience: string | null;
  rp_styles: string[] | null;
  dating_intent: string | null;
};

const reportReasons = [
  "Harassment",
  "Spam",
  "Fake Profile",
  "Inappropriate Content",
  "Scam",
  "Other",
];

export default function ProfilePage() {
  const params = useParams();
  const id = params.id as string;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");

  const [safetyMessage, setSafetyMessage] = useState("");
  const [blocking, setBlocking] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("Harassment");
  const [reportDetails, setReportDetails] = useState("");
  const [reporting, setReporting] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [id]);

  async function loadProfile() {
    setLoading(true);

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error loading profile:", error.message);
      setProfile(null);
    } else {
      setProfile(data as Profile);
    }

    setLoading(false);
  }

  async function sendMatchRequest() {
  setSendingRequest(true);
  setRequestMessage("");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    setRequestMessage("You need to log in before sending a Qnect request.");
    setSendingRequest(false);
    return;
  }

  if (user.id === profile?.id) {
    setRequestMessage("You cannot Qnect with yourself.");
    setSendingRequest(false);
    return;
  }

  const { data: existingBlocks, error: blockError } = await supabase
    .from("blocks")
    .select("id")
    .or(
      `and(blocker_id.eq.${user.id},blocked_id.eq.${profile?.id}),and(blocker_id.eq.${profile?.id},blocked_id.eq.${user.id})`
    );

  if (blockError) {
    console.error("Block check error:", blockError.message);
    setRequestMessage("Something went wrong checking this profile.");
    setSendingRequest(false);
    return;
  }

  if (existingBlocks && existingBlocks.length > 0) {
    setRequestMessage("You cannot Qnect with this user.");
    setSendingRequest(false);
    return;
  }

  const { error } = await supabase.from("matches").insert({
    sender_id: user.id,
    receiver_id: profile?.id,
    status: "pending",
  });

  if (error) {
    if (error.code === "23505") {
      setRequestMessage("You already sent this user a Qnect request.");
    } else {
      console.error("Match request error:", error.message);
      setRequestMessage("Something went wrong sending the Qnect request.");
    }

    setSendingRequest(false);
    return;
  }

  await supabase.from("notifications").insert({
    user_id: profile?.id,
    actor_id: user.id,
    type: "match_request",
  });

  setRequestMessage("Qnect request sent!");
  setSendingRequest(false);
}

  async function blockUser() {
    setSafetyMessage("");
    setBlocking(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSafetyMessage("You need to be logged in to block someone.");
      setBlocking(false);
      return;
    }

    if (user.id === profile?.id) {
      setSafetyMessage("You cannot block yourself.");
      setBlocking(false);
      return;
    }

    const confirmBlock = window.confirm(
      `Block ${displayName}? They will be hidden from your Discover page.`
    );

    if (!confirmBlock) {
      setBlocking(false);
      return;
    }

    const { error } = await supabase.from("blocks").upsert({
      blocker_id: user.id,
      blocked_id: profile?.id,
    });

    if (error) {
      console.error("Block error:", error.message);
      setSafetyMessage("Something went wrong blocking this user.");
      setBlocking(false);
      return;
    }

    setSafetyMessage("User blocked.");
    setBlocking(false);
  }

  async function submitReport(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setSafetyMessage("");
    setReporting(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSafetyMessage("You need to be logged in to report someone.");
      setReporting(false);
      return;
    }

    if (user.id === profile?.id) {
      setSafetyMessage("You cannot report yourself.");
      setReporting(false);
      return;
    }

    const { error } = await supabase.from("reports").insert({
      reporter_id: user.id,
      reported_id: profile?.id,
      reason: reportReason,
      details: reportDetails.trim() || null,
    });

    if (error) {
      console.error("Report error:", error.message);
      setSafetyMessage("Something went wrong sending the report.");
      setReporting(false);
      return;
    }

    setSafetyMessage("Report submitted. Thanks for helping keep Qnect safe.");
    setReportOpen(false);
    setReportReason("Harassment");
    setReportDetails("");
    setReporting(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#090b12] px-6 py-8 text-white">
        <div className="mx-auto max-w-6xl">
          <Navbar />
          <p className="mt-10 text-white/60">Loading profile...</p>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-[#090b12] px-6 py-8 text-white">
        <div className="mx-auto max-w-6xl">
          <Navbar />

          <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.04] p-8">
            <h1 className="text-3xl font-black">Profile not found</h1>

            <Link
              href="/discover"
              className="mt-6 inline-block rounded-2xl bg-violet-600 px-6 py-3 font-bold hover:bg-violet-500"
            >
              Back to Discover
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const isDating = profile.mode === "Dating";
  const isRP = profile.mode === "RP";
  const displayName = profile.display_name || profile.username || "Unknown";
  const username = profile.username || "unknown";
  const avatarLetter = displayName.charAt(0).toUpperCase() || "?";

  return (
    <main className="min-h-screen bg-[#090b12] px-6 py-8 text-white">
      <div className="mx-auto max-w-6xl">
        <Navbar />

        <section className="grid gap-6 lg:grid-cols-[340px_1fr]">
          <aside className="space-y-5">
            <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] shadow-2xl backdrop-blur">
              <div
                className={
                  isDating
                    ? "h-32 bg-gradient-to-br from-pink-600 via-rose-600 to-purple-900"
                    : "h-32 bg-gradient-to-br from-cyan-700 via-violet-700 to-blue-950"
                }
              />

              <div className="p-6">
                <div className="-mt-20 mb-5 flex h-28 w-28 items-center justify-center overflow-hidden rounded-[2rem] border-4 border-[#090b12] bg-black/40 text-5xl font-black">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={displayName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    avatarLetter
                  )}
                </div>

                <h1 className="break-words text-4xl font-black leading-tight">
                  {displayName}
                </h1>

                <p className="mt-1 text-white/45">@{username}</p>

                {profile.bio && (
                  <p className="mt-5 text-sm leading-6 text-white/60">
                    {profile.bio}
                  </p>
                )}

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <MiniStat label="Mode" value={profile.mode || "Any"} />
                  <MiniStat label="Platform" value={profile.platform || "Any"} />
                  <MiniStat
                    label="Voice"
                    value={profile.voice_chat ? "Yes" : "No"}
                  />
                  <MiniStat label="Age" value={profile.age || "N/A"} />
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <Link
                    href="/discover"
                    className="rounded-2xl border border-white/10 py-4 text-center font-bold text-white/75 hover:bg-white/5 hover:text-white"
                  >
                    Pass
                  </Link>

                  <button
                    onClick={sendMatchRequest}
                    disabled={sendingRequest}
                    className={
                      isDating
                        ? "rounded-2xl bg-pink-500 py-4 text-center font-bold hover:bg-pink-400 disabled:cursor-not-allowed disabled:opacity-60"
                        : "rounded-2xl bg-violet-600 py-4 text-center font-bold hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
                    }
                  >
                    {sendingRequest ? "Sending..." : "Qnect"}
                  </button>
                </div>

                {requestMessage && (
                  <p className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/70">
                    {requestMessage}
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
              <h2 className="text-lg font-black">Safety</h2>

              <p className="mt-2 text-sm leading-6 text-white/45">
                Block or report users who break trust, spam, harass, or make
                Qnect unsafe.
              </p>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={blockUser}
                  disabled={blocking}
                  className="flex-1 rounded-xl border border-white/10 px-4 py-3 text-sm text-white/70 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {blocking ? "Blocking..." : "Block"}
                </button>

                <button
                  onClick={() => setReportOpen((current) => !current)}
                  className="flex-1 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300 hover:bg-red-500/20"
                >
                  Report
                </button>
              </div>

              {reportOpen && (
                <form onSubmit={submitReport} className="mt-5 space-y-3">
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#121521] px-4 py-3 text-sm text-white/80 outline-none"
                  >
                    {reportReasons.map((reason) => (
                      <option key={reason}>{reason}</option>
                    ))}
                  </select>

                  <textarea
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    rows={4}
                    placeholder="Optional details..."
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none placeholder:text-white/35"
                  />

                  <button
                    type="submit"
                    disabled={reporting}
                    className="w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-bold hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {reporting ? "Submitting..." : "Submit Report"}
                  </button>
                </form>
              )}

              {safetyMessage && (
                <p className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/70">
                  {safetyMessage}
                </p>
              )}
            </div>
          </aside>

          <section className="space-y-5">
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                <div>
                  <p className="mb-2 text-sm font-bold uppercase tracking-[0.3em] text-violet-400">
                    Profile
                  </p>

                  <h2 className="text-4xl font-black">About {displayName}</h2>

                  <p className="mt-4 max-w-3xl text-lg leading-8 text-white/60">
                    {profile.bio || "This user has not added a bio yet."}
                  </p>
                </div>

                {profile.mode && (
                  <span
                    className={
                      isDating
                        ? "w-fit rounded-full bg-pink-500/15 px-4 py-2 text-sm font-bold text-pink-200"
                        : "w-fit rounded-full bg-violet-500/15 px-4 py-2 text-sm font-bold text-violet-200"
                    }
                  >
                    {profile.mode}
                  </span>
                )}
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <TagCard title="Playing" items={profile.games || []} />
              <TagCard title="Looking For" items={profile.looking_for || []} />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <TagCard title="Vibes" items={profile.vibes || []} />
              <TagCard title="Availability" items={profile.availability || []} />
            </div>

            {isRP && (
              <div className="grid gap-5 md:grid-cols-2">
                <InfoBox
                  title="RP Character"
                  value={profile.rp_character_name || "Not listed"}
                />

                <InfoBox
                  title="RP Experience"
                  value={profile.rp_experience || "Not listed"}
                />

                <TagCard title="RP Styles" items={profile.rp_styles || []} />
              </div>
            )}

            {isDating && (
              <InfoBox
                title="Dating Intent"
                value={profile.dating_intent || "Not listed"}
              />
            )}
          </section>
        </section>
      </div>
    </main>
  );
}

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl bg-white/[0.05] p-4">
      <p className="text-[10px] uppercase tracking-widest text-white/35">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-bold text-white/80">{value}</p>
    </div>
  );
}

function InfoBox({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur">
      <h2 className="mb-4 text-2xl font-black">{title}</h2>
      <p className="text-white/60">{value}</p>
    </div>
  );
}

function TagCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur">
      <h2 className="mb-4 text-2xl font-black">{title}</h2>

      {items.length === 0 ? (
        <p className="text-sm text-white/40">Not listed</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <span
              key={item}
              className="rounded-full bg-white/10 px-3 py-1 text-sm text-white/75"
            >
              {item}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}