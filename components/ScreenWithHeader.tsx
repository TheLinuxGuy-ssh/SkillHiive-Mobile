import { Header } from '@/components/ui/Header';
import { useTheme } from '@/hooks/useTheme';
import { View, StyleSheet } from 'react-native';

export const ScreenWithHeader = ({ children }: { children: React.ReactNode }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.bg.muted }]} >
      <Header />
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});