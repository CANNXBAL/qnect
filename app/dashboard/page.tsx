import Navbar from "@/components/Navbar";

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-[#090b12] px-6 py-8 text-white">
      <div className="mx-auto max-w-6xl">
        <Navbar />

        <h1 className="text-4xl font-black">Dashboard</h1>

        <p className="mt-4 text-white/55">
          Dashboard features will live here later.
        </p>
      </div>
    </main>
  );
}