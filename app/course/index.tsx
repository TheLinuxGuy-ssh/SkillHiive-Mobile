import { IconButton } from "@/components/ui/IconButton";
import { Text } from "@/components/ui/Text";
import { useTheme } from "@/hooks/useTheme";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Index = () => {
  const { colors } = useTheme();
  const router = useRouter();
  return (
    <View>
      <SafeAreaView>
        <IconButton
          accessibilityLabel="Sign out"
          onPress={() => router.back()}
          variant="filled"
        >
          <Feather name="log-out" size={18} color={colors.text.secondary} />
        </IconButton>
        <Text className="">This is a Index</Text>
      </SafeAreaView>
    </View>
  );
};

export default Index;
