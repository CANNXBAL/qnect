"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";

const plans = [
  {
    name: "Free",
    price: "$0",
    description: "For testing Qnect and finding a few people.",
    features: [
      "20 Qnects per day",
      "Unlimited passes",
      "Basic Discover filters",
      "Messaging after matching",
    ],
    button: "Current Plan",
    href: "/discover",
    highlight: false,
  },
  {
    name: "Plus",
    price: "$6.99/mo",
    description: "For people who want more daily Qnects.",
    features: [
      "Unlimited Qnects",
      "Priority Discover placement",
      "Advanced filters",
      "Profile boost coming soon",
    ],
    button: "Coming Soon",
    href: "/upgrade",
    highlight: true,
  },
  {
    name: "Pro",
    price: "$12.99/mo",
    description: "For creators, RP leaders, and community builders.",
    features: [
      "Everything in Plus",
      "Community discovery tools",
      "Creator profile badge",
      "Early access features",
    ],
    button: "Coming Soon",
    href: "/upgrade",
    highlight: false,
  },
];

export default function UpgradePage() {
  return (
    <main className="min-h-screen bg-[#090b12] px-6 py-8 text-white">
      <div className="mx-auto max-w-6xl">
        <Navbar />

        <header className="mb-10 text-center">
          <p className="mb-2 text-sm font-bold uppercase tracking-[0.3em] text-violet-400">
            Upgrade
          </p>

          <h1 className="text-4xl font-black md:text-6xl">
            Get more Qnects.
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-white/55">
            Subscriptions are coming soon. For now, this page shows the planned
            Qnect limits and upgrade structure.
          </p>
        </header>

        <section className="grid gap-5 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={
                plan.highlight
                  ? "rounded-[2rem] border border-violet-400/50 bg-violet-500/10 p-6 shadow-2xl"
                  : "rounded-[2rem] border border-white/10 bg-white/[0.04] p-6"
              }
            >
              {plan.highlight && (
                <p className="mb-4 w-fit rounded-full bg-violet-600 px-3 py-1 text-xs font-black">
                  Most Popular
                </p>
              )}

              <h2 className="text-3xl font-black">{plan.name}</h2>
              <p className="mt-2 text-4xl font-black">{plan.price}</p>
              <p className="mt-3 min-h-[3rem] text-sm leading-6 text-white/55">
                {plan.description}
              </p>

              <div className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <div
                    key={feature}
                    className="rounded-2xl bg-white/[0.05] px-4 py-3 text-sm text-white/75"
                  >
                    ✓ {feature}
                  </div>
                ))}
              </div>

              <Link
                href={plan.href}
                className={
                  plan.highlight
                    ? "mt-6 block rounded-2xl bg-violet-600 py-4 text-center font-black hover:bg-violet-500"
                    : "mt-6 block rounded-2xl border border-white/10 py-4 text-center font-black text-white/70 hover:bg-white/10"
                }
              >
                {plan.button}
              </Link>
            </div>
          ))}
        </section>

        <div className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 text-center text-white/55">
          Stripe payments will be added later once the beta flow is stable.
        </div>
      </div>
    </main>
  );
}