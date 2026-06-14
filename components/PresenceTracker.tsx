"use client";

import { supabase } from "@/lib/supabase";
import { useEffect } from "react";

export default function PresenceTracker() {
  useEffect(() => {
    let userId = "";

    async function setOnline() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      userId = user.id;

      await supabase.from("user_presence").upsert({
        user_id: user.id,
        is_online: true,
        last_seen: new Date().toISOString(),
      });
    }

    async function setOffline() {
      if (!userId) return;

      await supabase.from("user_presence").upsert({
        user_id: userId,
        is_online: false,
        last_seen: new Date().toISOString(),
      });
    }

    setOnline();

    const interval = setInterval(() => {
      setOnline();
    }, 30000);

    window.addEventListener("beforeunload", setOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", setOffline);
      setOffline();
    };
  }, []);

  return null;
}