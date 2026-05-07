import { Session } from "@supabase/supabase-js";
import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function RootLayout() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
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
    if (session === undefined) return;

    const inAuth = segments[0] === "(auth)";
    const inMain = segments[0] === "main";

    // ONLY block auth → main transition once
    if (!session && inMain) {
      router.replace("/(auth)");
      return;
    }

    // ONLY block auth screens when logged in
    if (session && inAuth) {
      router.replace("/main");
      return;
    }
  }, [session, segments]);

  return <Slot />;
}
