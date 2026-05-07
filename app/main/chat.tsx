import { useTheme } from "@/hooks/useTheme";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Chat = () => {
  const { colors } = useTheme();
  return (
    <View style={{ backgroundColor: colors.bg.muted, flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <Text style={{ color: colors.text.primary }}>
          chitty chitty chat chat chit chat
        </Text>
        <View>
          <Text style={{ color: colors.text.primary }}>something else</Text>
        </View>
      </SafeAreaView>
    </View>
  );
};

export default Chat;
