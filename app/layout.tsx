import "./globals.css";
import PresenceTracker from "@/components/PresenceTracker";

export const metadata = {
  title: "Qnect",
  description: "Find your next Qnect",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <PresenceTracker />
        {children}
      </body>
    </html>
  );
}