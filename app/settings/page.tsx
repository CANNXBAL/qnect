"use client";

import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

const modes = ["Friends", "Gaming", "RP", "Dating"];
const platforms = ["PC", "Xbox", "PlayStation", "Switch", "VR", "Mobile"];
const games = ["FiveM", "RedM", "VRChat", "GTA Online", "Phasmophobia", "Dead by Daylight", "Minecraft", "Fortnite", "Call of Duty", "Apex Legends"];
const lookingFor = ["Friends", "Duo", "Squad", "RP Partner", "Content Creator", "Dating", "Community"];
const vibes = ["Chill", "Competitive", "Story Driven", "Night Owl", "Funny", "Mature", "Creative", "Voice Chat", "Serious RP"];
const availability = ["Morning", "Afternoon", "Evening", "Late Night", "Weekdays", "Weekends"];
const rpStyles = ["Gang RP", "Civilian RP", "Criminal RP", "Business RP", "Story RP", "Serious RP"];
const datingIntent = ["Just seeing", "Casual dating", "Long-term", "Gaming date nights"];

export default function SettingsPage() {
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [age, setAge] = useState("");
  const [timezone, setTimezone] = useState("");
  const [bio, setBio] = useState("");
  const [mode, setMode] = useState("Gaming");
  const [platform, setPlatform] = useState("PC");
  const [voiceChat, setVoiceChat] = useState("No Preference");

  const [selectedGames, setSelectedGames] = useState<string[]>([]);
  const [selectedLookingFor, setSelectedLookingFor] = useState<string[]>([]);
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);
  const [selectedAvailability, setSelectedAvailability] = useState<string[]>([]);
  const [selectedRpStyles, setSelectedRpStyles] = useState<string[]>([]);
  const [selectedDatingIntent, setSelectedDatingIntent] = useState<string[]>([]);

  const [rpCharacterName, setRpCharacterName] = useState("");
  const [rpExperience, setRpExperience] = useState("");

  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!data) return;

    setDisplayName(data.display_name || "");
    setUsername(data.username || "");
    setAge(data.age ? String(data.age) : "");
    setTimezone(data.timezone || "");
    setBio(data.bio || "");
    setMode(data.mode || "Gaming");
    setPlatform(data.platform || "PC");
    setVoiceChat(data.voice_chat || "No Preference");

    setSelectedGames(data.games || []);
    setSelectedLookingFor(data.looking_for || []);
    setSelectedVibes(data.vibes || []);
    setSelectedAvailability(data.availability || []);
    setSelectedRpStyles(data.rp_styles || []);

    if (Array.isArray(data.dating_intent)) {
      setSelectedDatingIntent(data.dating_intent);
    } else if (data.dating_intent) {
      setSelectedDatingIntent([data.dating_intent]);
    }

    setRpCharacterName(data.rp_character_name || "");
    setRpExperience(data.rp_experience || "");
    setAvatarUrl(data.avatar_url || "");
  }

  function toggleValue(
    value: string,
    list: string[],
    setList: (v: string[]) => void
  ) {
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
    setAvatarUrl(URL.createObjectURL(file));
  }

  async function uploadAvatar(userId: string) {
    if (!avatarFile) return avatarUrl || null;

    const ext = avatarFile.name.split(".").pop();
    const path = `${userId}/avatar-${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from("avatars")
      .upload(path, avatarFile, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) throw error;

    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    return data.publicUrl;
  }

  async function saveSettings(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("You need to be logged in.");
      setSaving(false);
      return;
    }

    try {
      const finalAvatarUrl = await uploadAvatar(user.id);

      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        email: user.email,
        display_name: displayName,
        username,
        age: age ? Number(age) : null,
        timezone,
        bio,
        mode,
        platform,
        voice_chat: voiceChat,
        games: selectedGames,
        looking_for: selectedLookingFor,
        vibes: selectedVibes,
        availability: selectedAvailability,
        rp_character_name: rpCharacterName,
        rp_experience: rpExperience,
        rp_styles: selectedRpStyles,
        dating_intent: selectedDatingIntent,
        avatar_url: finalAvatarUrl,
      });

      if (error) {
        setMessage(error.message);
      } else {
        setMessage("Settings saved!");
      }
    } catch (err: any) {
      setMessage(err.message || "Something went wrong.");
    }

    setSaving(false);
  }

  return (
    <main className="min-h-screen bg-[#090b12] px-6 py-8 text-white">
      <div className="mx-auto max-w-5xl">
        <Navbar />

        <header className="mb-8">
          <p className="mb-2 text-sm font-bold uppercase tracking-[0.3em] text-violet-400">
            Settings
          </p>

          <h1 className="text-4xl font-black md:text-6xl">
            Edit your profile.
          </h1>

          <p className="mt-3 max-w-2xl text-white/55">
            Update how people see you across Discover, Matches, and Messages.
          </p>
        </header>

        <form
          onSubmit={saveSettings}
          className="space-y-8 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6"
        >
          <section>
            <h2 className="mb-4 text-2xl font-black">Avatar</h2>

            <div className="flex flex-col gap-5 rounded-[2rem] border border-white/10 bg-white/[0.03] p-5 md:flex-row md:items-center">
              <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-[2rem] bg-gradient-to-br from-cyan-700 via-violet-700 to-blue-950 text-4xl font-black">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  displayName.charAt(0).toUpperCase() || "?"
                )}
              </div>

              <label className="w-fit cursor-pointer rounded-2xl bg-violet-600 px-5 py-3 text-sm font-bold hover:bg-violet-500">
                Upload New Avatar
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-black">Basic Info</h2>

            <div className="grid gap-4 md:grid-cols-2">
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Display Name"
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/35"
              />

              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/35"
              />

              <input
                value={age}
                onChange={(e) => setAge(e.target.value)}
                type="number"
                placeholder="Age"
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/35"
              />

              <input
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                placeholder="Timezone"
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/35"
              />

              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Bio"
                rows={5}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/35 md:col-span-2"
              />
            </div>
          </section>

          <RadioSection title="Primary Mode" items={modes} value={mode} setValue={setMode} />

          <section>
            <h2 className="mb-4 text-2xl font-black">Platform</h2>

            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#121521] px-4 py-3 text-white/80 outline-none md:w-80"
            >
              {platforms.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </section>

          <RadioSection
            title="Voice Chat"
            items={["Required", "Preferred", "Text Only", "No Preference"]}
            value={voiceChat}
            setValue={setVoiceChat}
          />

          <ChoiceSection
            title="Games"
            items={games}
            selected={selectedGames}
            toggle={(item) => toggleValue(item, selectedGames, setSelectedGames)}
          />

          <ChoiceSection
            title="Looking For"
            items={lookingFor}
            selected={selectedLookingFor}
            toggle={(item) =>
              toggleValue(item, selectedLookingFor, setSelectedLookingFor)
            }
          />

          <ChoiceSection
            title="Vibes"
            items={vibes}
            selected={selectedVibes}
            toggle={(item) => toggleValue(item, selectedVibes, setSelectedVibes)}
          />

          <ChoiceSection
            title="Availability"
            items={availability}
            selected={selectedAvailability}
            toggle={(item) =>
              toggleValue(item, selectedAvailability, setSelectedAvailability)
            }
          />

          <section className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-5">
            <h2 className="mb-4 text-2xl font-black">RP Details</h2>

            <div className="mb-5 grid gap-4 md:grid-cols-2">
              <input
                value={rpCharacterName}
                onChange={(e) => setRpCharacterName(e.target.value)}
                placeholder="RP Character Name"
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/35"
              />

              <select
                value={rpExperience}
                onChange={(e) => setRpExperience(e.target.value)}
                className="rounded-xl border border-white/10 bg-[#121521] px-4 py-3 text-white/80 outline-none"
              >
                <option value="">RP Experience</option>
                <option>New</option>
                <option>Intermediate</option>
                <option>Veteran</option>
              </select>
            </div>

            <ChoiceSection
              title="RP Styles"
              items={rpStyles}
              selected={selectedRpStyles}
              toggle={(item) =>
                toggleValue(item, selectedRpStyles, setSelectedRpStyles)
              }
            />
          </section>

          <section className="rounded-[2rem] border border-pink-500/20 bg-pink-500/[0.04] p-5">
            <ChoiceSection
              title="Dating Intent"
              items={datingIntent}
              selected={selectedDatingIntent}
              toggle={(item) =>
                toggleValue(item, selectedDatingIntent, setSelectedDatingIntent)
              }
            />
          </section>

          {message && (
            <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/70">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-2xl bg-violet-600 py-4 font-bold hover:bg-violet-500 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </form>
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
          <label
            key={item}
            className={
              value === item
                ? "cursor-pointer rounded-full border border-violet-500/40 bg-violet-500/20 px-4 py-2 text-sm text-violet-100"
                : "cursor-pointer rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 hover:bg-white/10"
            }
          >
            <input
              type="radio"
              checked={value === item}
              onChange={() => setValue(item)}
              className="mr-2 accent-violet-600"
            />
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
}: {
  title: string;
  items: string[];
  selected: string[];
  toggle: (item: string) => void;
}) {
  return (
    <section>
      <h2 className="mb-4 text-2xl font-black">{title}</h2>

      <div className="flex flex-wrap gap-3">
        {items.map((item) => (
          <label
            key={item}
            className={
              selected.includes(item)
                ? "cursor-pointer rounded-full border border-violet-500/40 bg-violet-500/20 px-4 py-2 text-sm text-violet-100"
                : "cursor-pointer rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 hover:bg-white/10"
            }
          >
            <input
              type="checkbox"
              checked={selected.includes(item)}
              onChange={() => toggle(item)}
              className="mr-2 accent-violet-600"
            />
            {item}
          </label>
        ))}
      </div>
    </section>
  );
}