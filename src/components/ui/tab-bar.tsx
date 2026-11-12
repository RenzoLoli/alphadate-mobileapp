import * as React from "react";

import { Pressable, Text, View } from "react-native";

import type { BottomTabBarProps } from "expo-router/build/react-navigation/bottom-tabs";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { cn } from "@/lib/utils";

import {
  DatesIcon,
  DotIcon,
  HomeIcon,
  SettingsIcon,
  type TabIcon,
} from "./tab-bar-icons";

const DEFAULT_ICONS: Record<string, TabIcon> = {
  home: HomeIcon,
  dates: DatesIcon,
  settings: SettingsIcon,
};

const FOCUSED_PARTS = { stroke: "border-foreground", fill: "bg-foreground" };
const UNFOCUSED_PARTS = {
  stroke: "border-muted-foreground",
  fill: "bg-muted-foreground",
};

type TabBarProps = BottomTabBarProps & {
  icons?: Record<string, TabIcon>;
  className?: string;
  barClassName?: string;
  itemClassName?: string;
  showLabels?: boolean;
};

type TabBarItemProps = {
  route: { key: string; name: string };
  isFocused: boolean;
  label: string;
  showLabel: boolean;
  IconComponent: TabIcon;
  onPress: () => void;
  onLongPress: () => void;
  className?: string;
};

function TabBarItem({
  route,
  isFocused,
  label,
  showLabel,
  IconComponent,
  onPress,
  onLongPress,
  className,
}: TabBarItemProps) {
  const pressScale = useSharedValue(1);
  const iconScale = useSharedValue(isFocused ? 1 : 0.85);
  const iconOpacity = useSharedValue(isFocused ? 1 : 0.65);

  React.useEffect(() => {
    iconScale.value = withSpring(isFocused ? 1 : 0.85, {
      damping: 12,
      stiffness: 220,
    });
    iconOpacity.value = withTiming(isFocused ? 1 : 0.65, { duration: 160 });
  }, [isFocused, iconScale, iconOpacity]);

  const itemStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    opacity: iconOpacity.value,
    transform: [{ scale: iconScale.value }],
  }));

  const parts = isFocused ? FOCUSED_PARTS : UNFOCUSED_PARTS;

  return (
    <Animated.View style={itemStyle}>
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={() => {
          // eslint-disable-next-line react-hooks/immutability -- reanimated shared value write
          pressScale.value = withSpring(0.94, { damping: 16, stiffness: 320 });
        }}
        onPressOut={() => {
          // eslint-disable-next-line react-hooks/immutability -- reanimated shared value write
          pressScale.value = withSpring(1, { damping: 14, stiffness: 280 });
        }}
        accessibilityRole="tab"
        accessibilityState={{ selected: isFocused }}
        accessibilityLabel={label}
        hitSlop={8}
        className={cn(
          // 24px icon + 12px vertical padding = 48dp, the Android touch floor.
          "min-h-12 flex-row items-center justify-center gap-1 rounded-full px-4 py-3",
          isFocused ? "bg-muted" : "bg-transparent",
          className
        )}
      >
        <Animated.View style={iconStyle} pointerEvents="none">
          <IconComponent parts={parts} />
        </Animated.View>
        {showLabel ? (
          <Text
            numberOfLines={1}
            className={cn(
              "text-sm",
              isFocused
                ? "font-semibold text-foreground"
                : "font-medium text-muted-foreground"
            )}
          >
            {label}
          </Text>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

function TabBar({
  state,
  descriptors,
  navigation,
  insets,
  icons = {},
  barClassName,
  itemClassName,
  showLabels = true,
}: TabBarProps) {
  const routes = state.routes.filter(
    (route) => !route.name.startsWith("+") && !route.name.startsWith("index")
  );

  return (
    <View
      className={cn(
        "my-3 flex-row items-center justify-around gap-2 border-t border-border bg-background px-2 pt-3",
        barClassName
      )}
      style={{ paddingBottom: insets.bottom }}
    >
      {routes.map((route) => {
        const isFocused = state.index === state.routes.indexOf(route);
        const descriptor = descriptors[route.key];
        const { options } = descriptor ?? {};
        const configuredLabel =
          typeof options?.tabBarLabel === "string"
            ? options.tabBarLabel
            : options?.title;
        const label = configuredLabel ?? route.name;
        const iconKey = route.name.split("/").pop() ?? route.name;
        const IconComponent =
          icons[route.name] ??
          icons[iconKey] ??
          DEFAULT_ICONS[iconKey] ??
          DotIcon;
        const showLabel = options?.tabBarShowLabel !== false && showLabels;

        return (
          <TabBarItem
            key={route.key}
            route={route}
            isFocused={isFocused}
            label={label}
            showLabel={showLabel}
            IconComponent={IconComponent}
            className={itemClassName}
            onPress={() => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            }}
            onLongPress={() => {
              navigation.emit({ type: "tabLongPress", target: route.key });
            }}
          />
        );
      })}
    </View>
  );
}

export { TabBar, type TabBarProps };
