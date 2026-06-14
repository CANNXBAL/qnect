import Link from "next/link";
import { getCompatibilityBreakdown } from "@/utils/compatibility";

export type Profile = {
  id: string;
  name: string;
  age: number;
  avatar: string;
  avatarGradient: string;
  platform: string;
  status: string;
  games: string[];
  lookingFor: string[];
  vibes: string[];
  bio: string;
  mode: string;
  match: boolean;
  compatibility: number;
};

export default function ProfileCard({
  profile,
  action,
  onPass,
  onQnect,
}: {
  profile: Profile;
  action: string;
  onPass: () => void;
  onQnect: () => void;
}) {
  return (
    <div
      className={
        action === "pass"
          ? "translate-x-[-60px] rotate-[-4deg] opacity-40 transition duration-200"
          : action === "qnect"
            ? "translate-x-[60px] rotate-[4deg] opacity-40 transition duration-200"
            : "translate-x-0 rotate-0 opacity-100 transition duration-200"
      }
    >
      <div className="relative rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl backdrop-blur">
        <div className="rounded-[1.5rem] bg-gradient-to-br from-violet-600 to-blue-500 p-1">
          <div className="rounded-[1.35rem] bg-[#10131f] p-6">
            <div
              className={`mb-6 h-72 rounded-3xl bg-gradient-to-br ${profile.avatarGradient} p-5`}
            >
              <div className="flex h-full flex-col justify-between">
                <div className="flex justify-between">
                  <span className="rounded-full bg-black/30 px-3 py-1 text-sm">
                    {profile.status}
                  </span>

                  <span className="rounded-full bg-black/30 px-3 py-1 text-sm">
                    {profile.platform}
                  </span>
                </div>

                <div className="flex flex-col items-center text-center">
                  <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-black/20 text-5xl font-black">
                    {profile.avatar}
                  </div>

                  <p
                    className={
                      profile.mode === "Dating"
                        ? "mb-2 rounded-full bg-pink-500/20 px-3 py-1 text-sm text-pink-100"
                        : "mb-2 rounded-full bg-black/20 px-3 py-1 text-sm"
                    }
                  >
                    {profile.mode}
                  </p>

                  <h1 className="text-4xl font-black">
                    {profile.name}, {profile.age}
                  </h1>

                  <p className="mt-2 text-white/85">{profile.bio}</p>
                </div>
              </div>
            </div>

            <CompatibilityBar profile={profile} />

            <VoiceIntro />

            <ProfileTags title="Playing" items={profile.games} />
            <ProfileTags title="Looking For" items={profile.lookingFor} />
            <ProfileTags title="Vibes" items={profile.vibes} />

            <div className="mt-6 space-y-3">
              <Link
                href={`/profile/${profile.id}`}
                className="block rounded-2xl border border-white/10 py-4 text-center font-bold transition hover:bg-white/5"
              >
                View Full Profile
              </Link>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={onPass}
                  className="rounded-2xl border border-white/10 py-4 font-bold transition hover:bg-white/5"
                >
                  Pass
                </button>

                <button
                  onClick={onQnect}
                  className={
                    profile.mode === "Dating"
                      ? "rounded-2xl bg-pink-500 py-4 font-bold transition hover:bg-pink-400"
                      : "rounded-2xl bg-violet-600 py-4 font-bold transition hover:bg-violet-500"
                  }
                >
                  Qnect
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CompatibilityBar({ profile }: { profile: Profile }) {
  const reasons = getCompatibilityBreakdown(profile);

  return (
    <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm text-white/50">Qnect Compatibility</p>
        <p
          className={
            profile.mode === "Dating"
              ? "text-sm font-bold text-pink-300"
              : "text-sm font-bold text-violet-300"
          }
        >
          {profile.compatibility}%
        </p>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className={
            profile.mode === "Dating"
              ? "h-full rounded-full bg-pink-500"
              : "h-full rounded-full bg-violet-600"
          }
          style={{ width: `${profile.compatibility}%` }}
        />
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3">
        <p className="mb-2 text-xs uppercase tracking-wider text-white/40">
          Why You Match
        </p>

        <div className="flex flex-wrap gap-2">
          {reasons.map((reason) => (
            <span
              key={reason}
              className={
                profile.mode === "Dating"
                  ? "rounded-full bg-pink-500/20 px-3 py-1 text-xs text-pink-200"
                  : "rounded-full bg-violet-500/20 px-3 py-1 text-xs text-violet-200"
              }
            >
              {reason}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function VoiceIntro() {
  return (
    <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm text-white/50">Voice Intro</p>
        <span className="text-xs text-white/35">0:15</span>
      </div>

      <button className="w-full rounded-xl border border-white/10 py-3 text-sm font-bold hover:bg-white/5">
        ▶ Play Intro
      </button>
    </div>
  );
}

function ProfileTags({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="mb-4">
      <p className="mb-2 text-sm text-white/40">{title}</p>

      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item} className="rounded-full bg-white/10 px-3 py-1 text-sm">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}