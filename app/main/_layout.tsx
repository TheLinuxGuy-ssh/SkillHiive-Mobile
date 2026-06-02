import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';
import { Platform } from 'react-native';

export default function MainLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        {Platform.OS === 'android'
          ? <Icon drawable="home" />
          : <Icon sf={{ default: 'house', selected: 'house.fill' }} />}
        <Label>Home</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="feedScreen">
        {Platform.OS === 'android'
          ? <Icon drawable="chat_bubble" />
          : <Icon sf={{ default: 'bubble.left.and.bubble.right', selected: 'bubble.left.and.bubble.right.fill' }} />}
        <Label>Feed</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        {Platform.OS === 'android'
          ? <Icon drawable="person" />
          : <Icon sf={{ default: 'person', selected: 'person.fill' }} />}
        <Label>Profile</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}