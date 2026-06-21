"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { useEffect, useMemo, useState } from "react";

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
  rp_styles?: string[] | null;
  rp_experience?: string | null;
  gender?: string | null;
  interested_in?: string[] | null;
};

type Block = {
  blocker_id: string;
  blocked_id: string;
};

type SwipeAction = {
  target_user_id: string;
};

type UserPlan = {
  user_id: string;
  plan: string;
};

const FREE_DAILY_QNECT_LIMIT = 20;

const modes = ["All", "Friends", "Gaming", "RP", "Dating"];
const platforms = ["All", "PC", "Xbox", "PlayStation", "Switch", "VR", "Mobile"];
const games = [
  "All",
  "FiveM",
  "RedM",
  "VRChat",
  "GTA Online",
  "Phasmophobia",
  "Dead by Daylight",
  "Minecraft",
  "Fortnite",
  "Call of Duty",
  "Apex Legends",
];

const lookingForOptions = [
  "All",
  "Friends",
  "Duo",
  "Squad",
  "RP Partner",
  "Content Creator",
  "Dating",
  "Community",
];

const vibesOptions = [
  "All",
  "Chill",
  "Competitive",
  "Story Driven",
  "Night Owl",
  "Funny",
  "Mature",
  "Creative",
  "Voice Chat",
  "Serious RP",
];

const rpStyleOptions = [
  "All",
  "Gang RP",
  "Civilian RP",
  "Criminal RP",
  "Business RP",
  "Story RP",
  "Serious RP",
];

const voiceOptions = ["All", "Voice Chat Yes", "Voice Chat No"];

export default function DiscoverPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentUserProfile, setCurrentUserProfile] = useState<Profile | null>(
    null
  );

  const [userPlan, setUserPlan] = useState("free");
  const [dailyQnectCount, setDailyQnectCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [actionMessage, setActionMessage] = useState("");

  const [modeFilter, setModeFilter] = useState("All");
  const [platformFilter, setPlatformFilter] = useState("All");
  const [gameFilter, setGameFilter] = useState("All");
  const [lookingForFilter, setLookingForFilter] = useState("All");
  const [vibeFilter, setVibeFilter] = useState("All");
  const [rpStyleFilter, setRpStyleFilter] = useState("All");
  const [voiceFilter, setVoiceFilter] = useState("All");
  const [search, setSearch] = useState("");

  const isFreePlan = userPlan === "free";
  const qnectsRemaining = isFreePlan
    ? Math.max(FREE_DAILY_QNECT_LIMIT - dailyQnectCount, 0)
    : 999;
  const hasReachedLimit = isFreePlan && qnectsRemaining <= 0;

  useEffect(() => {
    loadProfiles();
  }, []);

  async function ensureUserPlan(userId: string) {
    const { data: existingPlan, error: planError } = await supabase
      .from("user_plans")
      .select("user_id, plan")
      .eq("user_id", userId)
      .single();

    if (planError && planError.code !== "PGRST116") {
      console.error("Plan load error:", planError.message);
    }

    if (existingPlan) {
      setUserPlan((existingPlan as UserPlan).plan || "free");
      return;
    }

    const { data: insertedPlan, error: insertError } = await supabase
      .from("user_plans")
      .insert({
        user_id: userId,
        plan: "free",
      })
      .select("user_id, plan")
      .single();

    if (insertError) {
      console.error("Plan insert error:", insertError.message);
      setUserPlan("free");
      return;
    }

    setUserPlan((insertedPlan as UserPlan).plan || "free");
  }

  async function loadDailyQnectCount(userId: string) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const { count, error } = await supabase
      .from("swipe_actions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("action", "qnect")
      .gte("created_at", startOfDay.toISOString());

    if (error) {
      console.error("Daily Qnect count error:", error.message);
      setDailyQnectCount(0);
      return;
    }

    setDailyQnectCount(count || 0);
  }

  async function loadProfiles() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    let blockedIds: string[] = [];
    let swipedIds: string[] = [];

    if (user) {
      await ensureUserPlan(user.id);
      await loadDailyQnectCount(user.id);

      const { data: myProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setCurrentUserProfile((myProfile as Profile) || null);

      const { data: blocks, error: blocksError } = await supabase
        .from("blocks")
        .select("blocker_id, blocked_id")
        .or(`blocker_id.eq.${user.id},blocked_id.eq.${user.id}`);

      if (blocksError) {
        console.error("Error loading blocks:", blocksError.message);
      } else {
        blockedIds =
          (blocks as Block[] | null)
            ?.map((block) =>
              block.blocker_id === user.id ? block.blocked_id : block.blocker_id
            )
            .filter(Boolean) || [];
      }

      const { data: swipes, error: swipesError } = await supabase
        .from("swipe_actions")
        .select("target_user_id")
        .eq("user_id", user.id);

      if (swipesError) {
        console.error("Error loading swipes:", swipesError.message);
      } else {
        swipedIds =
          (swipes as SwipeAction[] | null)?.map(
            (swipe) => swipe.target_user_id
          ) || [];
      }
    }

    let query = supabase
      .from("profiles")
      .select("*")
      .not("username", "is", null)
      .order("created_at", { ascending: false });

    if (user) {
      query = query.neq("id", user.id);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error loading profiles:", error.message);
      setProfiles([]);
    } else {
      const visibleProfiles = ((data as Profile[]) || []).filter(
        (profile) =>
          !blockedIds.includes(profile.id) && !swipedIds.includes(profile.id)
      );

      setProfiles(visibleProfiles);
    }

    setCurrentIndex(0);
    setLoading(false);
  }

  function genderMatchesDatingPreferences(profile: Profile) {
    if (modeFilter !== "Dating") return true;
    if (!currentUserProfile) return true;

    const myGender = currentUserProfile.gender;
    const myInterestedIn = currentUserProfile.interested_in || [];
    const theirGender = profile.gender;
    const theirInterestedIn = profile.interested_in || [];

    if (!myGender || !theirGender) return true;

    const iWantThem =
      myInterestedIn.includes("Everyone") ||
      (myInterestedIn.includes("Women") && theirGender === "Female") ||
      (myInterestedIn.includes("Men") && theirGender === "Male");

    const theyWantMe =
      theirInterestedIn.includes("Everyone") ||
      (theirInterestedIn.includes("Women") && myGender === "Female") ||
      (theirInterestedIn.includes("Men") && myGender === "Male");

    return iWantThem && theyWantMe;
  }

  const filteredProfiles = useMemo(() => {
    return profiles.filter((profile) => {
      const searchValue = search.toLowerCase().trim();

      const displayName = profile.display_name || "";
      const username = profile.username || "";
      const bio = profile.bio || "";

      const matchesSearch =
        searchValue === "" ||
        displayName.toLowerCase().includes(searchValue) ||
        username.toLowerCase().includes(searchValue) ||
        bio.toLowerCase().includes(searchValue) ||
        profile.games?.some((game) =>
          game.toLowerCase().includes(searchValue)
        ) ||
        profile.vibes?.some((vibe) =>
          vibe.toLowerCase().includes(searchValue)
        ) ||
        profile.looking_for?.some((item) =>
          item.toLowerCase().includes(searchValue)
        ) ||
        profile.rp_styles?.some((style) =>
          style.toLowerCase().includes(searchValue)
        );

      const matchesMode = modeFilter === "All" || profile.mode === modeFilter;

      const matchesPlatform =
        platformFilter === "All" || profile.platform === platformFilter;

      const matchesGame =
        gameFilter === "All" || profile.games?.includes(gameFilter);

      const matchesLookingFor =
        lookingForFilter === "All" ||
        profile.looking_for?.includes(lookingForFilter);

      const matchesVibe =
        vibeFilter === "All" || profile.vibes?.includes(vibeFilter);

      const matchesRpStyle =
        rpStyleFilter === "All" || profile.rp_styles?.includes(rpStyleFilter);

      const matchesVoice =
        voiceFilter === "All" ||
        (voiceFilter === "Voice Chat Yes" && profile.voice_chat === true) ||
        (voiceFilter === "Voice Chat No" && profile.voice_chat === false);

      return (
        matchesSearch &&
        matchesMode &&
        matchesPlatform &&
        matchesGame &&
        matchesLookingFor &&
        matchesVibe &&
        matchesRpStyle &&
        matchesVoice &&
        genderMatchesDatingPreferences(profile)
      );
    });
  }, [
    profiles,
    currentUserProfile,
    search,
    modeFilter,
    platformFilter,
    gameFilter,
    lookingForFilter,
    vibeFilter,
    rpStyleFilter,
    voiceFilter,
  ]);

  const currentProfile = filteredProfiles[currentIndex] || null;

  const activeFilterCount =
    [
      modeFilter,
      platformFilter,
      gameFilter,
      lookingForFilter,
      vibeFilter,
      rpStyleFilter,
      voiceFilter,
    ].filter((item) => item !== "All").length + (search.trim() ? 1 : 0);

  function clearFilters() {
    setModeFilter("All");
    setPlatformFilter("All");
    setGameFilter("All");
    setLookingForFilter("All");
    setVibeFilter("All");
    setRpStyleFilter("All");
    setVoiceFilter("All");
    setSearch("");
    setCurrentIndex(0);
  }

  async function saveSwipeAction(targetUserId: string, action: "pass" | "qnect") {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setActionMessage("You need to log in first.");
      return false;
    }

    const { error } = await supabase.from("swipe_actions").upsert({
      user_id: user.id,
      target_user_id: targetUserId,
      action,
    });

    if (error) {
      console.error("Swipe action error:", error.message);
      setActionMessage("Something went wrong saving this swipe.");
      return false;
    }

    return true;
  }

  async function passProfile() {
    setActionMessage("");

    if (!currentProfile) return;

    const saved = await saveSwipeAction(currentProfile.id, "pass");

    if (!saved) return;

    setCurrentIndex((current) => current + 1);
  }

  async function qnectProfile() {
    setActionMessage("");

    if (!currentProfile) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setActionMessage("You need to log in before sending a Qnect request.");
      return;
    }

    if (hasReachedLimit) {
      setActionMessage(
        "You reached your free daily Qnect limit. Upgrade for unlimited Qnects."
      );
      return;
    }

    const { data: existingBlocks, error: blockError } = await supabase
      .from("blocks")
      .select("id")
      .or(
        `and(blocker_id.eq.${user.id},blocked_id.eq.${currentProfile.id}),and(blocker_id.eq.${currentProfile.id},blocked_id.eq.${user.id})`
      );

    if (blockError) {
      console.error("Block check error:", blockError.message);
      setActionMessage("Something went wrong checking this profile.");
      return;
    }

    if (existingBlocks && existingBlocks.length > 0) {
      setActionMessage("You cannot Qnect with this user.");
      return;
    }

    const { error } = await supabase.from("matches").insert({
      sender_id: user.id,
      receiver_id: currentProfile.id,
      status: "pending",
    });

    if (error) {
      if (error.code === "23505") {
        await saveSwipeAction(currentProfile.id, "qnect");
        setActionMessage("You already sent this user a Qnect request.");
        setCurrentIndex((current) => current + 1);
      } else {
        console.error("Qnect error:", error.message);
        setActionMessage("Something went wrong sending the Qnect request.");
      }

      return;
    }

    await saveSwipeAction(currentProfile.id, "qnect");

    setDailyQnectCount((current) => current + 1);

    await supabase.from("notifications").insert({
      user_id: currentProfile.id,
      actor_id: user.id,
      type: "match_request",
    });

    setActionMessage("Qnect request sent.");
    setCurrentIndex((current) => current + 1);
  }

  return (
    <main className="min-h-screen bg-[#090b12] px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <Navbar />

        <section>
          <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="mb-2 text-sm font-bold uppercase tracking-[0.3em] text-violet-400">
                Discover
              </p>

              <h1 className="text-4xl font-black md:text-6xl">
                Swipe your next Qnect.
              </h1>

              <p className="mt-3 max-w-2xl text-white/55">
                Browse one profile at a time. Pass, view, or send a Qnect
                request.
              </p>
            </div>

            <Link
              href="/settings"
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-bold text-white/80 hover:bg-white/[0.08]"
            >
              Edit Profile
            </Link>
          </div>

          <div className="grid gap-8 lg:grid-cols-[340px_1fr]">
            <aside className="h-fit rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-black">Filters</h2>
                  <p className="mt-1 text-sm text-white/40">
                    Tune your swipe stack.
                  </p>
                </div>

                {activeFilterCount > 0 && (
                  <span className="rounded-full bg-violet-500/15 px-3 py-1 text-xs font-bold text-violet-200">
                    {activeFilterCount}
                  </span>
                )}
              </div>

              <div className="mb-5 rounded-2xl border border-violet-500/20 bg-violet-500/10 p-4">
                <p className="text-xs font-black uppercase tracking-widest text-violet-200">
                  Plan
                </p>

                <p className="mt-2 text-lg font-black capitalize">{userPlan}</p>

                {isFreePlan ? (
                  <p className="mt-1 text-sm text-white/55">
                    {qnectsRemaining} of {FREE_DAILY_QNECT_LIMIT} Qnects left
                    today.
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-white/55">
                    Unlimited Qnects enabled.
                  </p>
                )}

                {hasReachedLimit && (
                  <Link
                    href="/upgrade"
                    className="mt-4 inline-block rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold hover:bg-violet-500"
                  >
                    Upgrade
                  </Link>
                )}
              </div>

              <div className="grid gap-4">
                <input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentIndex(0);
                  }}
                  placeholder="Search name, game, vibe..."
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none placeholder:text-white/35"
                />

                <FilterSelect
                  value={modeFilter}
                  setValue={(value) => {
                    setModeFilter(value);
                    setCurrentIndex(0);
                  }}
                  options={modes}
                  label="Mode"
                />

                <FilterSelect
                  value={platformFilter}
                  setValue={(value) => {
                    setPlatformFilter(value);
                    setCurrentIndex(0);
                  }}
                  options={platforms}
                  label="Platform"
                />

                <FilterSelect
                  value={gameFilter}
                  setValue={(value) => {
                    setGameFilter(value);
                    setCurrentIndex(0);
                  }}
                  options={games}
                  label="Game"
                />

                <FilterSelect
                  value={lookingForFilter}
                  setValue={(value) => {
                    setLookingForFilter(value);
                    setCurrentIndex(0);
                  }}
                  options={lookingForOptions}
                  label="Looking For"
                />

                <FilterSelect
                  value={vibeFilter}
                  setValue={(value) => {
                    setVibeFilter(value);
                    setCurrentIndex(0);
                  }}
                  options={vibesOptions}
                  label="Vibe"
                />

                <FilterSelect
                  value={rpStyleFilter}
                  setValue={(value) => {
                    setRpStyleFilter(value);
                    setCurrentIndex(0);
                  }}
                  options={rpStyleOptions}
                  label="RP Style"
                />

                <FilterSelect
                  value={voiceFilter}
                  setValue={(value) => {
                    setVoiceFilter(value);
                    setCurrentIndex(0);
                  }}
                  options={voiceOptions}
                  label="Voice Chat"
                />

                <button
                  onClick={clearFilters}
                  className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-bold text-white/65 hover:bg-white/10 hover:text-white"
                >
                  Clear Filters
                </button>

                <button
                  onClick={loadProfiles}
                  className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold text-white/75 hover:bg-white/15"
                >
                  Refresh Stack
                </button>

                <p className="text-sm text-white/40">
                  Showing {currentProfile ? currentIndex + 1 : 0} of{" "}
                  {filteredProfiles.length}
                </p>
              </div>
            </aside>

            <section className="flex justify-center">
              {loading ? (
                <div className="w-full max-w-xl rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 text-white/60">
                  Loading profiles...
                </div>
              ) : !currentProfile ? (
                <div className="w-full max-w-xl rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 text-center">
                  <h2 className="text-3xl font-black">No more profiles</h2>
                  <p className="mt-3 text-white/50">
                    Try changing filters or check back later.
                  </p>

                  <button
                    onClick={clearFilters}
                    className="mt-6 rounded-2xl bg-violet-600 px-6 py-3 font-bold hover:bg-violet-500"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <ProfileCard
                  profile={currentProfile}
                  actionMessage={actionMessage}
                  onPass={passProfile}
                  onQnect={qnectProfile}
                  hasReachedLimit={hasReachedLimit}
                />
              )}
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}

function ProfileCard({
  profile,
  actionMessage,
  onPass,
  onQnect,
  hasReachedLimit,
}: {
  profile: Profile;
  actionMessage: string;
  onPass: () => void;
  onQnect: () => void;
  hasReachedLimit: boolean;
}) {
  const displayName = profile.display_name || profile.username || "Unknown";
  const avatarLetter = displayName.charAt(0).toUpperCase();
  const isDating = profile.mode === "Dating";

  return (
    <div className="w-full max-w-xl overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[0.05] shadow-2xl">
      <div
        className={
          isDating
            ? "h-48 bg-gradient-to-br from-pink-600 via-rose-600 to-purple-900"
            : "h-48 bg-gradient-to-br from-cyan-700 via-violet-700 to-blue-950"
        }
      />

      <div className="relative p-6">
        <div className="-mt-24 mb-5 flex h-36 w-36 items-center justify-center overflow-hidden rounded-[2rem] border-4 border-[#090b12] bg-black/40 text-6xl font-black">
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

        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
          <div>
            <h2 className="text-4xl font-black leading-tight">
              {displayName}
              {profile.age ? (
                <span className="ml-3 text-2xl text-white/55">
                  {profile.age}
                </span>
              ) : null}
            </h2>

            <p className="mt-1 text-white/45">@{profile.username || "unknown"}</p>
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

        <p className="mt-5 min-h-[5rem] text-sm leading-6 text-white/60">
          {profile.bio || "No bio yet."}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-2 text-xs">
          <MiniInfo label="Platform" value={profile.platform} />
          <MiniInfo label="Voice" value={profile.voice_chat ? "Yes" : "No"} />
          <MiniInfo label="Gender" value={profile.gender || "Not listed"} />
          <MiniInfo label="Timezone" value={profile.timezone || "Not listed"} />
        </div>

        <TagRow title="Games" items={profile.games || []} color="cyan" />
        <TagRow
          title="Looking For"
          items={profile.looking_for || []}
          color="green"
        />
        <TagRow title="Vibes" items={profile.vibes || []} color="purple" />

        {actionMessage && (
          <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/70">
            {actionMessage}
          </div>
        )}

        <div className="mt-6 grid grid-cols-3 gap-3">
          <button
            onClick={onPass}
            className="rounded-2xl border border-white/10 py-4 font-black text-white/70 hover:bg-white/10"
          >
            Pass
          </button>

          <Link
            href={`/profile/${profile.id}`}
            className="rounded-2xl border border-white/10 py-4 text-center font-black text-white/80 hover:bg-white/10"
          >
            View
          </Link>

          <button
            onClick={onQnect}
            className={
              hasReachedLimit
                ? "rounded-2xl bg-white/10 py-4 font-black text-white/40"
                : isDating
                ? "rounded-2xl bg-pink-500 py-4 font-black hover:bg-pink-400"
                : "rounded-2xl bg-violet-600 py-4 font-black hover:bg-violet-500"
            }
          >
            {hasReachedLimit ? "Limit" : "Qnect"}
          </button>
        </div>
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  setValue,
  options,
}: {
  label: string;
  value: string;
  setValue: (value: string) => void;
  options: string[];
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2">
      <p className="mb-1 text-[10px] uppercase tracking-widest text-white/35">
        {label}
      </p>

      <select
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full bg-transparent text-sm font-bold text-white outline-none"
      >
        {options.map((option) => (
          <option key={option} value={option} className="bg-[#121521]">
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function MiniInfo({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div className="rounded-2xl bg-white/[0.05] p-3">
      <p className="text-[10px] uppercase tracking-widest text-white/35">
        {label}
      </p>
      <p className="mt-1 truncate font-bold text-white/75">
        {value || "Any"}
      </p>
    </div>
  );
}

function TagRow({
  title,
  items,
  color,
}: {
  title: string;
  items: string[];
  color: "cyan" | "green" | "purple";
}) {
  if (!items || items.length === 0) return null;

  return (
    <div className="mt-5">
      <p className="mb-2 text-xs font-black uppercase tracking-widest text-white/35">
        {title}
      </p>

      <div className="flex flex-wrap gap-2">
        {items.slice(0, 5).map((item) => (
          <span
            key={item}
            className={
              color === "cyan"
                ? "rounded-full bg-cyan-500/10 px-3 py-1 text-xs text-cyan-300"
                : color === "green"
                ? "rounded-full bg-green-500/10 px-3 py-1 text-xs text-green-300"
                : "rounded-full bg-purple-500/10 px-3 py-1 text-xs text-purple-300"
            }
          >
            {item}
          </span>
        ))}

        {items.length > 5 && (
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/50">
            +{items.length - 5}
          </span>
        )}
      </div>
    </div>
  );
}