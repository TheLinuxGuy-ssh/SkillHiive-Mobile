import { createContext, useContext, useRef } from "react";

type TabNavigationContextType = {
  navigateTo: (tab: string) => void;
  register: (fn: (tab: string) => void) => void;
};

const TabNavigationContext = createContext<TabNavigationContextType>({
  navigateTo: () => {},
  register: () => {},
});

export function useTabNavigation() {
  return useContext(TabNavigationContext);
}

export { TabNavigationContext };