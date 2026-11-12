import { Tabs } from "expo-router";

import { TabBar } from "@/components/ui/tab-bar";

export default function RootLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <TabBar {...props} />}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Inicio",
          href: "/home",
        }}
      />
      <Tabs.Screen name="dates" options={{ title: "Citas", href: "/dates" }} />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Ajustes",
          href: "/settings",
        }}
      />
    </Tabs>
  );
}
