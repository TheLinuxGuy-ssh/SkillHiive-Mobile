import { useCustomAlert } from "@/hooks/useCustomAlert";
import { supabase } from "@/lib/supabase";
import type { Provider } from "@supabase/supabase-js";
import * as Linking from "expo-linking";
import { openAuthSessionAsync } from "expo-web-browser";
import { useState } from "react";

export type SocialAuthStrategy = "oauth_google" | "oauth_apple";

interface UseSocialAuthReturn {
  isLoading: boolean;
  handleSocialAuth: (strategy: SocialAuthStrategy) => Promise<void>;
}

const strategyToProvider: Record<SocialAuthStrategy, Provider> = {
  oauth_google: "google",
  oauth_apple: "apple",
};

export const useSocialAuth = (): UseSocialAuthReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const { showError } = useCustomAlert({ useNative: true });

  const handleSocialAuth = async (
    strategy: SocialAuthStrategy,
  ): Promise<void> => {
    setIsLoading(true);
    try {
      const provider = strategyToProvider[strategy];
      const redirectTo = Linking.createURL("/");

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo },
      });

      if (error) {
        throw error;
      }

      if (data.url) {
        const result = await openAuthSessionAsync(data.url, redirectTo);

        if (result.type === "success" && result.url) {
          const { data: sessionData, error: sessionError } =
            await supabase.auth.exchangeCodeForSession(result.url);

          if (sessionError) {
            throw sessionError;
          }

          if (!sessionData.session) {
            throw new Error("No session returned after OAuth.");
          }
        }
      }
    } catch (err) {
      console.log("Error in social auth", err);
      const providerName = strategy === "oauth_google" ? "Google" : "Apple";
      showError(
        "Sign-in didn't go through",
        `${providerName} couldn't complete the sign-in. Try once more.`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, handleSocialAuth };
};
