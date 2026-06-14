"use client";

import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const modes = ["Friends", "Gaming", "RP", "Dating"];
const platforms = ["PC", "Xbox", "PlayStation", "Switch", "VR", "Mobile"];
const lookingFor = ["Friends", "Duo", "Squad", "RP Partner", "Content Creator", "Dating", "Community"];
const games = ["FiveM", "RedM", "VRChat", "GTA Online", "Phasmophobia", "Dead by Daylight", "Minecraft", "Fortnite", "Call of Duty", "Apex Legends"];
const vibes = ["Chill", "Competitive", "Story Driven", "Night Owl", "Funny", "Mature", "Creative", "Voice Chat", "Serious RP"];
const availability = ["Morning", "Afternoon", "Evening", "Late Night", "Weekdays", "Weekends"];
const rpStyles = ["Gang RP", "Civilian RP", "Criminal RP", "Business RP", "Story RP", "Serious RP"];
const datingIntent = ["Just seeing", "Casual dating", "Long-term", "Gaming date nights"];

export default function CompleteProfilePage() {
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [age, setAge] = useState("");
  const [timezone, setTimezone] = useState("");
  const [bio, setBio] = useState("");

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [existingAvatarUrl, setExistingAvatarUrl] = useState("");

  const [mode, setMode] = useState("Gaming");
  const [platform, setPlatform] = useState("PC");
  const [selectedLookingFor, setSelectedLookingFor] = useState<string[]>([]);
  const [selectedGames, setSelectedGames] = useState<string[]>([]);
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);
  const [selectedAvailability, setSelectedAvailability] = useState<string[]>([]);
  const [voiceChat, setVoiceChat] = useState("No Preference");

  const [rpCharacterName, setRpCharacterName] = useState("");
  const [rpExperience, setRpExperience] = useState("");
  const [selectedRpStyles, setSelectedRpStyles] = useState<string[]>([]);
  const [selectedDatingIntent, setSelectedDatingIntent] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadExistingProfile();
  }, []);

  async function loadExistingProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setPageLoading(false);
      return;
    }

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (data) {
      setDisplayName(data.display_name || "");
      setUsername(data.username || "");
      setAge(data.age?.toString() || "");
      setTimezone(data.timezone || "");
      setBio(data.bio || "");

      setExistingAvatarUrl(data.avatar_url || "");
      setAvatarPreview(data.avatar_url || "");

      setMode(data.mode || "Gaming");
      setPlatform(data.platform || "PC");

      setSelectedLookingFor(data.looking_for || []);
      setSelectedGames(data.games || []);
      setSelectedVibes(data.vibes || []);
      setSelectedAvailability(data.availability || []);

      setVoiceChat(data.voice_chat ? "Preferred" : "No Preference");

      setRpCharacterName(data.rp_character_name || "");
      setRpExperience(data.rp_experience || "");
      setSelectedRpStyles(data.rp_styles || []);

      if (Array.isArray(data.dating_intent)) {
        setSelectedDatingIntent(data.dating_intent || []);
      } else if (data.dating_intent) {
        setSelectedDatingIntent([data.dating_intent]);
      }
    }

    setPageLoading(false);
  }

  function toggleValue(value: string, list: string[], setList: (v: string[]) => void) {
    if (list.includes(value)) {
      setList(list.filter((item) => item !== value));
    } else {
      setList([...list, value]);
    }
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];

    if (!file) return;

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function uploadAvatar(userId: string) {
    if (!avatarFile) return existingAvatarUrl || null;

    const fileExt = avatarFile.name.split(".").pop();
    const filePath = `${userId}/avatar-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, avatarFile, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);

    return data.publicUrl;
  }

  async function saveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      setError("You need to be logged in to save your profile.");
      setLoading(false);
      return;
    }

    try {
      const avatarUrl = await uploadAvatar(userData.user.id);

      const { error: updateError } = await supabase.from("profiles").upsert({
        id: userData.user.id,
        email: userData.user.email,
        username,
        display_name: displayName,
        age: age ? Number(age) : null,
        timezone,
        bio,
        avatar_url: avatarUrl,
        mode,
        platform,
        looking_for: selectedLookingFor,
        games: selectedGames,
        vibes: selectedVibes,
        availability: selectedAvailability,
        voice_chat:
          voiceChat === "Required" ||
          voiceChat === "Preferred",
        rp_character_name: rpCharacterName,
        rp_experience: rpExperience,
        rp_styles: selectedRpStyles,
        dating_intent: selectedDatingIntent,
      });

      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }

      router.push("/discover");
    } catch (err: any) {
      setError(err.message || "Avatar upload failed.");
      setLoading(false);
    }
  }

  if (pageLoading) {
    return (
      <main className="min-h-screen bg-[#090b12] px-6 py-10 text-white">
        <div className="mx-auto max-w-5xl">
          <Navbar />
          <p className="text-white/50">Loading profile...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#090b12] px-6 py-10 text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute right-[-250px] top-[-250px] h-[750px] w-[750px] rounded-full bg-violet-600/20 blur-[170px]" />
        <div className="absolute left-[-250px] bottom-[-250px] h-[650px] w-[650px] rounded-full bg-blue-500/10 blur-[160px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl">
        <Navbar />

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 backdrop-blur">
          <div className="mb-8">
            <p className="mb-3 text-violet-400">Build your Qnect profile</p>
            <h1 className="text-5xl font-black">Complete Your Profile</h1>
            <p className="mt-4 max-w-2xl text-white/60">
              Tell people what you play, what you’re looking for, and what kind of vibe you bring to the lobby.
            </p>
          </div>

          <form onSubmit={saveProfile} className="space-y-10">
            <section>
              <h2 className="mb-4 text-2xl font-black">Avatar</h2>

              <div className="flex flex-col gap-5 rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 md:flex-row md:items-center">
                <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-[2rem] bg-gradient-to-br from-cyan-700 via-violet-700 to-blue-950 text-4xl font-black">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    displayName.charAt(0).toUpperCase() || "?"
                  )}
                </div>

                <div>
                  <label className="inline-block cursor-pointer rounded-2xl bg-violet-600 px-5 py-3 text-sm font-bold hover:bg-violet-500">
                    Upload Avatar
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>

                  <p className="mt-3 text-sm text-white/45">
                    This image will appear on Discover, Matches, Messages, and your profile.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-black">Basic Info</h2>

              <div className="grid gap-4 md:grid-cols-2">
                <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} type="text" placeholder="Display Name" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/35" />
                <input value={username} onChange={(e) => setUsername(e.target.value)} type="text" placeholder="Username" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/35" />
                <input value={age} onChange={(e) => setAge(e.target.value)} type="number" placeholder="Age" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/35" />
                <input value={timezone} onChange={(e) => setTimezone(e.target.value)} type="text" placeholder="Timezone" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/35" />
                <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Short bio" rows={5} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/35 md:col-span-2" />
              </div>
            </section>

            <RadioSection title="Primary Mode" items={modes} value={mode} setValue={setMode} />
            <RadioSection title="Platform" items={platforms} value={platform} setValue={setPlatform} />
            <ChoiceSection title="Looking For" items={lookingFor} selected={selectedLookingFor} toggle={(item) => toggleValue(item, selectedLookingFor, setSelectedLookingFor)} />
            <ChoiceSection title="Games" items={games} selected={selectedGames} toggle={(item) => toggleValue(item, selectedGames, setSelectedGames)} />
            <ChoiceSection title="Vibes" items={vibes} selected={selectedVibes} toggle={(item) => toggleValue(item, selectedVibes, setSelectedVibes)} />
            <ChoiceSection title="Availability" items={availability} selected={selectedAvailability} toggle={(item) => toggleValue(item, selectedAvailability, setSelectedAvailability)} />

            <RadioSection title="Voice Chat" items={["Required", "Preferred", "Text Only", "No Preference"]} value={voiceChat} setValue={setVoiceChat} />

            <section className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6">
              <h2 className="mb-5 text-2xl font-black">RP Details</h2>

              <div className="mb-6 grid gap-4 md:grid-cols-2">
                <input value={rpCharacterName} onChange={(e) => setRpCharacterName(e.target.value)} type="text" placeholder="RP Character Name" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/35" />

                <select value={rpExperience} onChange={(e) => setRpExperience(e.target.value)} className="rounded-xl border border-white/10 bg-[#121521] px-4 py-3 text-white/70 outline-none">
                  <option value="">RP Experience</option>
                  <option>New</option>
                  <option>Intermediate</option>
                  <option>Veteran</option>
                </select>
              </div>

              <ChoiceSection title="RP Style" items={rpStyles} selected={selectedRpStyles} toggle={(item) => toggleValue(item, selectedRpStyles, setSelectedRpStyles)} compact />
            </section>

            <section className="rounded-[2rem] border border-pink-500/20 bg-pink-500/[0.04] p-6">
              <h2 className="mb-5 text-2xl font-black">Dating Details</h2>
              <ChoiceSection title="Dating Intent" items={datingIntent} selected={selectedDatingIntent} toggle={(item) => toggleValue(item, selectedDatingIntent, setSelectedDatingIntent)} compact />
            </section>

            <section className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6">
              <h2 className="text-2xl font-black">Voice Intro</h2>
              <p className="mt-2 text-sm text-white/50">
                Voice upload will be connected later with Supabase Storage.
              </p>
            </section>

            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="block w-full rounded-2xl bg-violet-600 py-4 text-center font-bold hover:bg-violet-500 disabled:opacity-60"
            >
              {loading ? "Saving..." : "Save Profile & Continue"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

function RadioSection({
  title,
  items,
  value,
  setValue,
}: {
  title: string;
  items: string[];
  value: string;
  setValue: (value: string) => void;
}) {
  return (
    <section>
      <h2 className="mb-4 text-2xl font-black">{title}</h2>

      <div className="flex flex-wrap gap-3">
        {items.map((item) => (
          <label key={item} className="cursor-pointer rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 hover:bg-white/10">
            <input type="radio" checked={value === item} onChange={() => setValue(item)} className="mr-2 accent-violet-600" />
            {item}
          </label>
        ))}
      </div>
    </section>
  );
}

function ChoiceSection({
  title,
  items,
  selected,
  toggle,
  compact = false,
}: {
  title: string;
  items: string[];
  selected: string[];
  toggle: (item: string) => void;
  compact?: boolean;
}) {
  return (
    <section>
      <h2 className={compact ? "mb-3 text-xl font-black" : "mb-4 text-2xl font-black"}>
        {title}
      </h2>

      <div className="flex flex-wrap gap-3">
        {items.map((item) => (
          <label key={item} className="cursor-pointer rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 hover:bg-white/10">
            <input type="checkbox" checked={selected.includes(item)} onChange={() => toggle(item)} className="mr-2 accent-violet-600" />
            {item}
          </label>
        ))}
      </div>
    </section>
  );
}