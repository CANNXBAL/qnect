import Link from "next/link";

const heroTags = ["FiveM", "VRChat", "Horror Co-op", "RP", "Night Owl"];

const features = [
  ["Match by games", "Find people who actually play what you play."],
  ["Filter by vibe", "Chill, competitive, RP, creator, night owl."],
  ["Chat after matching", "Talk only when both people are interested."],
];

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#090b12] text-white">
      <div className="pointer-events-none fixed inset-0 -z-0">
        <div className="absolute right-[-200px] top-[-200px] h-[700px] w-[700px] rounded-full bg-violet-600/20 blur-[160px]" />
        <div className="absolute left-[-250px] top-[500px] h-[650px] w-[650px] rounded-full bg-blue-500/10 blur-[160px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <nav className="flex items-center justify-between py-6">
          <h1 className="text-3xl font-black tracking-tight">Qnect</h1>

          <div className="flex gap-3">
            <Link href="/login" className="rounded-xl border border-white/10 px-4 py-2">
              Login
            </Link>

            <Link href="/signup" className="rounded-xl bg-violet-600 px-4 py-2 font-semibold">
              Join Beta
            </Link>
          </div>
        </nav>

        <section className="grid min-h-[78vh] items-center gap-14 py-16 lg:grid-cols-2">
          <div>
            <p className="mb-4 font-medium text-violet-400">
              Meet gamers beyond the lobby.
            </p>

            <h2 className="max-w-3xl text-5xl font-black leading-tight md:text-7xl">
              Find your next duo, squad, or story.
            </h2>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/70">
              Qnect helps gamers find friends, RP partners, creators, and
              meaningful connections based on games, schedules, playstyle, and
              personality.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/signup"
                className="rounded-xl bg-violet-600 px-6 py-3 font-semibold transition hover:bg-violet-500"
              >
                Get Started
              </Link>

              <a
                href="#features"
                className="rounded-xl border border-white/10 px-6 py-3 transition hover:bg-white/5"
              >
                See How It Works
              </a>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              {heroTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute -inset-8 rounded-[3rem] bg-violet-600/20 blur-3xl" />

            <div className="relative rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl backdrop-blur">
              <div className="rounded-[1.5rem] bg-gradient-to-br from-violet-600 to-blue-500 p-1">
                <div className="rounded-[1.35rem] bg-[#10131f] p-6">
                  <div className="mb-6 h-64 rounded-3xl bg-gradient-to-br from-[#2a2f45] to-[#11131d] p-5">
                    <div className="flex h-full flex-col justify-between">
                      <div className="flex justify-between">
                        <span className="rounded-full bg-black/30 px-3 py-1 text-sm">
                          Online
                        </span>
                        <span className="rounded-full bg-black/30 px-3 py-1 text-sm">
                          PC
                        </span>
                      </div>

                      <div>
                        <h3 className="text-3xl font-black">Ava, 22</h3>
                        <p className="text-white/70">Story-driven RP player</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="mb-2 text-sm text-white/40">Playing</p>
                      <div className="flex flex-wrap gap-2">
                        {["FiveM", "Phasmophobia", "VRChat"].map((item) => (
                          <span key={item} className="rounded-full bg-white/10 px-3 py-1 text-sm">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="mb-2 text-sm text-white/40">Looking For</p>
                      <div className="flex flex-wrap gap-2">
                        {["RP Friends", "Duo", "Content"].map((item) => (
                          <span
                            key={item}
                            className="rounded-full bg-violet-500/20 px-3 py-1 text-sm text-violet-200"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-3">
                      <button className="rounded-2xl border border-white/10 py-3 font-bold transition hover:bg-white/5">
                        Pass
                      </button>
                      <button className="rounded-2xl bg-violet-600 py-3 font-bold transition hover:bg-violet-500">
                        Qnect
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="relative py-20">
          <div className="mb-12 h-px w-full bg-white/5" />

          <div className="grid gap-4 md:grid-cols-3">
            {features.map(([title, text]) => (
              <div
                key={title}
                className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur"
              >
                <h3 className="text-xl font-bold">{title}</h3>
                <p className="mt-3 text-white/60">{text}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}