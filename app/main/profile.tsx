import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Profile = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };

    loadUser();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      },
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  function logOut() {
    supabase.auth.signOut();
    setUser(null);
  }

  return (
    <View style={{ backgroundColor: "#1f1f1f", flex: 1 }}>
      <SafeAreaView>
        <View>
          <Text style={{ color: "#fff" }}>
            Hello there {user?.email ?? "Not Logged in"}
          </Text>
          <Button
            label="Logout"
            style={{ display: user ? "flex" : "none" }}
            onPress={() => logOut()}
          />
        </View>
      </SafeAreaView>
    </View>
  );
};

export default Profile;
