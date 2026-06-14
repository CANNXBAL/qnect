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
};

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
  const [loading, setLoading] = useState(true);

  const [modeFilter, setModeFilter] = useState("All");
  const [platformFilter, setPlatformFilter] = useState("All");
  const [gameFilter, setGameFilter] = useState("All");
  const [lookingForFilter, setLookingForFilter] = useState("All");
  const [vibeFilter, setVibeFilter] = useState("All");
  const [rpStyleFilter, setRpStyleFilter] = useState("All");
  const [voiceFilter, setVoiceFilter] = useState("All");
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadProfiles();
  }, []);

  async function loadProfiles() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

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
      setProfiles((data as Profile[]) || []);
    }

    setLoading(false);
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
        matchesVoice
      );
    });
  }, [
    profiles,
    search,
    modeFilter,
    platformFilter,
    gameFilter,
    lookingForFilter,
    vibeFilter,
    rpStyleFilter,
    voiceFilter,
  ]);

  const activeFilterCount = [
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
                Find your next Qnect.
              </h1>

              <p className="mt-3 max-w-2xl text-white/55">
                Browse real gamers, roleplayers, duo partners, friend groups,
                and people looking for the same vibe as you.
              </p>
            </div>

            <Link
              href="/settings"
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-bold text-white/80 hover:bg-white/[0.08]"
            >
              Edit Profile
            </Link>
          </div>

          <div className="mb-8 rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
            <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
              <div>
                <h2 className="text-2xl font-black">Filters</h2>
                <p className="mt-1 text-sm text-white/40">
                  Narrow down profiles by game, platform, vibe, and RP style.
                </p>
              </div>

              <div className="flex items-center gap-3">
                {activeFilterCount > 0 && (
                  <span className="rounded-full bg-violet-500/15 px-3 py-1 text-xs font-bold text-violet-200">
                    {activeFilterCount} active
                  </span>
                )}

                <button
                  onClick={clearFilters}
                  className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-bold text-white/65 hover:bg-white/10 hover:text-white"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, game, vibe..."
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none placeholder:text-white/35 xl:col-span-2"
              />

              <FilterSelect
                value={modeFilter}
                setValue={setModeFilter}
                options={modes}
                label="Mode"
              />

              <FilterSelect
                value={platformFilter}
                setValue={setPlatformFilter}
                options={platforms}
                label="Platform"
              />

              <FilterSelect
                value={gameFilter}
                setValue={setGameFilter}
                options={games}
                label="Game"
              />

              <FilterSelect
                value={lookingForFilter}
                setValue={setLookingForFilter}
                options={lookingForOptions}
                label="Looking For"
              />

              <FilterSelect
                value={vibeFilter}
                setValue={setVibeFilter}
                options={vibesOptions}
                label="Vibe"
              />

              <FilterSelect
                value={rpStyleFilter}
                setValue={setRpStyleFilter}
                options={rpStyleOptions}
                label="RP Style"
              />

              <FilterSelect
                value={voiceFilter}
                setValue={setVoiceFilter}
                options={voiceOptions}
                label="Voice Chat"
              />
            </div>

            <p className="mt-4 text-sm text-white/40">
              Showing {filteredProfiles.length} of {profiles.length} profiles
            </p>
          </div>

          {loading && (
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-white/60">
              Loading profiles...
            </div>
          )}

          {!loading && profiles.length === 0 && (
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
              <h2 className="text-2xl font-black">No profiles yet</h2>
              <p className="mt-2 text-white/50">
                Once more users complete their profiles, they will show here.
              </p>
            </div>
          )}

          {!loading && profiles.length > 0 && filteredProfiles.length === 0 && (
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
              <h2 className="text-2xl font-black">No matches found</h2>
              <p className="mt-2 text-white/50">
                Try changing your filters or clearing your search.
              </p>

              <button
                onClick={clearFilters}
                className="mt-5 rounded-2xl bg-violet-600 px-5 py-3 text-sm font-bold hover:bg-violet-500"
              >
                Clear Filters
              </button>
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProfiles.map((profile) => {
              const displayName =
                profile.display_name || profile.username || "Unknown";
              const avatarLetter = displayName.charAt(0).toUpperCase();
              const isDating = profile.mode === "Dating";

              return (
                <Link
                  key={profile.id}
                  href={`/profile/${profile.id}`}
                  className="group overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] shadow-xl transition hover:-translate-y-1 hover:border-violet-400/60 hover:bg-white/[0.07]"
                >
                  <div
                    className={
                      isDating
                        ? "h-36 bg-gradient-to-br from-pink-600 via-rose-600 to-purple-900"
                        : "h-36 bg-gradient-to-br from-cyan-700 via-violet-700 to-blue-950"
                    }
                  />

                  <div className="relative p-5">
                    <div className="-mt-16 mb-4 flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl border-4 border-[#090b12] bg-black/40 text-4xl font-black">
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

                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-2xl font-black leading-tight">
                          {displayName}
                        </h2>

                        <p className="text-sm text-white/45">
                          @{profile.username || "unknown"}
                        </p>
                      </div>

                      {profile.mode && (
                        <span
                          className={
                            isDating
                              ? "rounded-full bg-pink-500/15 px-3 py-1 text-xs font-bold text-pink-200"
                              : "rounded-full bg-violet-500/15 px-3 py-1 text-xs font-bold text-violet-200"
                          }
                        >
                          {profile.mode}
                        </span>
                      )}
                    </div>

                    <p className="mt-4 line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-white/55">
                      {profile.bio || "No bio yet."}
                    </p>

                    <div className="mt-5 grid grid-cols-2 gap-2 text-xs">
                      <MiniInfo label="Platform" value={profile.platform} />
                      <MiniInfo
                        label="Voice"
                        value={profile.voice_chat ? "Yes" : "No"}
                      />
                    </div>

                    <TagRow items={profile.games || []} color="cyan" />
                    <TagRow items={profile.looking_for || []} color="green" />
                    <TagRow items={profile.vibes || []} color="purple" />

                    <div className="mt-5 rounded-2xl bg-white/10 py-3 text-center text-sm font-black text-white transition group-hover:bg-violet-600">
                      View Profile
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </main>
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
  items,
  color,
}: {
  items: string[];
  color: "cyan" | "green" | "purple";
}) {
  if (!items || items.length === 0) return null;

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {items.slice(0, 4).map((item) => (
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

      {items.length > 4 && (
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/50">
          +{items.length - 4}
        </span>
      )}
    </div>
  );
}