import { memo, useRef } from "react";

import { Pressable, View } from "react-native";

import { type LucideIcon, Pencil, Trash2 } from "lucide-react-native";
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from "react-native-gesture-handler/ReanimatedSwipeable";
import Animated, {
  Extrapolation,
  FadeInDown,
  LinearTransition,
  type SharedValue,
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";

import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { AlphabetDate } from "@/lib/services/api/responses/alphabetDatesResponse";
import { cn } from "@/lib/utils";

/** Width of a revealed action. Wide enough for an icon plus its label. */
const ACTION_WIDTH = 84;

interface Props {
  date: AlphabetDate;
  index?: number;
  onDelete: (date: AlphabetDate) => void;
  onEdit: (date: AlphabetDate) => void;
  /** Long-press and screen-reader entry point, so swipe is never the only way. */
  onShowActions: (date: AlphabetDate) => void;
  /** Lets the list close the previously opened row. */
  onRowOpen: (methods: SwipeableMethods) => void;
}

interface SwipeActionProps {
  label: string;
  icon: LucideIcon;
  progress: SharedValue<number>;
  onPress: () => void;
  accessibilityLabel: string;
  /** `solid` inverts to foreground: reserved for the destructive action. */
  emphasis?: "solid" | "muted";
  side: "left" | "right";
}

function SwipeAction({
  label,
  icon,
  progress,
  onPress,
  accessibilityLabel,
  emphasis = "muted",
  side,
}: SwipeActionProps) {
  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(
          progress.value,
          [0, 1],
          [0.75, 1],
          Extrapolation.CLAMP
        ),
      },
    ],
  }));

  const solid = emphasis === "solid";

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={{ width: ACTION_WIDTH }}
      className={cn(
        "items-center justify-center gap-1.5",
        solid ? "bg-foreground" : "bg-secondary",
        side === "left" ? "rounded-l-xl" : "rounded-r-xl"
      )}
    >
      <Animated.View style={iconStyle}>
        <Icon
          as={icon}
          size={18}
          className={solid ? "text-background" : "text-foreground"}
        />
      </Animated.View>
      <Text
        className={cn(
          "text-xs font-medium",
          solid ? "text-background" : "text-foreground"
        )}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default memo(function DateCard({
  date,
  index = 0,
  onDelete,
  onEdit,
  onShowActions,
  onRowOpen,
}: Props) {
  const swipeableRef = useRef<SwipeableMethods | null>(null);

  return (
    <Animated.View
      entering={FadeInDown.delay(Math.min(index, 8) * 40).duration(280)}
      layout={LinearTransition.duration(200)}
    >
      <ReanimatedSwipeable
        ref={swipeableRef}
        friction={2}
        leftThreshold={56}
        rightThreshold={56}
        overshootLeft={false}
        overshootRight={false}
        onSwipeableWillOpen={() => {
          const methods = swipeableRef.current;

          if (methods) {
            onRowOpen(methods);
          }
        }}
        // Swipe right reveals Edit; swipe left reveals Delete.
        renderLeftActions={(progress) => (
          <SwipeAction
            label="Edit"
            icon={Pencil}
            progress={progress}
            side="left"
            onPress={() => {
              swipeableRef.current?.close();
              onEdit(date);
            }}
            accessibilityLabel={`Edit ${date.title}`}
          />
        )}
        renderRightActions={(progress) => (
          <SwipeAction
            label="Delete"
            icon={Trash2}
            progress={progress}
            side="right"
            emphasis="solid"
            onPress={() => {
              swipeableRef.current?.close();
              onDelete(date);
            }}
            accessibilityLabel={`Delete ${date.title}`}
          />
        )}
      >
        <Pressable
          onLongPress={() => onShowActions(date)}
          delayLongPress={350}
          accessibilityHint="Swipe right to edit, swipe left to delete. Long press for both actions."
          accessibilityActions={[
            { name: "edit", label: "Edit date" },
            { name: "delete", label: "Delete date" },
          ]}
          onAccessibilityAction={(event) => {
            if (event.nativeEvent.actionName === "edit") {
              onEdit(date);
            }

            if (event.nativeEvent.actionName === "delete") {
              onDelete(date);
            }
          }}
        >
          <Card className="gap-0 rounded-xl py-0 shadow-none">
            <View className="gap-2.5 p-4">
              <View className="flex-row items-start gap-3">
                <View className="h-9 w-9 items-center justify-center rounded-lg bg-primary">
                  <Text className="text-sm font-bold uppercase leading-none text-primary-foreground">
                    {date.letter}
                  </Text>
                </View>

                <View className="flex-1 gap-1">
                  <CardTitle className="text-base leading-snug">
                    {date.title}
                  </CardTitle>
                  <CardDescription>{date.description}</CardDescription>
                </View>
              </View>

              {date.tags.length > 0 && (
                <View className="flex-row flex-wrap gap-2 pl-12">
                  {date.tags.map((tag) => (
                    <View
                      key={tag}
                      className="rounded-full border border-border px-2.5 py-1"
                    >
                      <Text className="text-xs text-muted-foreground">
                        {tag}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </Card>
        </Pressable>
      </ReanimatedSwipeable>
    </Animated.View>
  );
});
