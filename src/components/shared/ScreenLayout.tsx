import { View } from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { cn } from "@/lib/utils";

import Scrollable from "./Scrollable";

type Props = {
  children: React.ReactNode;
  /** Wrap the content in a vertical ScrollView. */
  scroll?: boolean;
  /** Extra classes applied to the content container, not to the safe area. */
  className?: string;
};

/**
 * Single source of page chrome.
 *
 * Previous implementation applied `m-4` on top of the safe-area padding, so the
 * usable area lost 16px on every edge twice: content was squeezed into a small
 * box (the "cramped" complaint). Now the safe area owns the insets, and a single
 * consistent gutter (`px-5`) owns the horizontal rhythm.
 *
 * The top gutter (`pt-4`) is deliberate and separate from the inset: clearing the
 * status bar is not the same as looking detached from it. Without it the first
 * title sits flush against the clock.
 *
 * The bottom edge is intentionally excluded: the tab bar is rendered by the
 * navigator below the screen and owns that inset itself.
 */
export default function ScreenLayout({
  children,
  scroll = false,
  className,
}: Props) {
  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      className="flex-1 bg-background"
    >
      <View className={cn("flex-1 px-5 pt-4", className)}>
        {scroll ? (
          <Scrollable>{children}</Scrollable>
        ) : (
          <View className="flex-1">{children}</View>
        )}
      </View>
    </SafeAreaView>
  );
}
