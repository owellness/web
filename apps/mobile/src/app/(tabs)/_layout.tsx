import { Tabs } from "expo-router";
import { Text } from "react-native";

import { colors } from "@/design-system/tokens";

// 탭 구성은 디자인의 TabBar.dc.html(홈·콘텐츠·코칭·스토어·마이)을 따른다.
// 아이콘은 스켈레톤 단계의 임시 글리프 — 디자인 시스템 구축 시 SVG로 교체.
const TABS = [
  { name: "index", title: "홈", glyph: "⌂" },
  { name: "content", title: "콘텐츠", glyph: "▶" },
  { name: "coaching", title: "코칭", glyph: "☺" },
  { name: "store", title: "스토어", glyph: "◱" },
  { name: "my", title: "마이", glyph: "●" },
] as const;

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: { fontSize: 10.5, fontWeight: "500" },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color }) => (
              <Text style={{ color, fontSize: 18 }}>{tab.glyph}</Text>
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
