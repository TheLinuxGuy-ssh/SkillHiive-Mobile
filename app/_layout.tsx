import { Session } from "@supabase/supabase-js";
import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => setSession(session),
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const inMain = segments[0] === "main";

    if (!session && inMain) {
      router.replace("/(auth)");
    }

    if (session && !inMain) {
      router.replace("/main");
    }
  }, [session, segments]);

  return <Slot />;
}
