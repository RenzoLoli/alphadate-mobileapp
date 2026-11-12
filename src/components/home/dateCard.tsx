import { memo, useRef } from "react";

import { Pressable, View } from "react-native";

import { Check, type LucideIcon, Pencil, Trash2 } from "lucide-react-native";
import { BaseButton } from "react-native-gesture-handler";
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
import {
  AlphabetDate,
  DATE_STATUS,
} from "@/lib/services/api/responses/alphabetDatesResponse";
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
  /** Finishes a PUBLISHED date, or reopens a DONE one. */
  onToggleStatus: (date: AlphabetDate) => void;
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
    <BaseButton
      onPress={onPress}
      style={{ width: ACTION_WIDTH }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      borderless
      rippleColor="transparent"
    >
      <View
        style={{ width: ACTION_WIDTH }}
        className={cn(
          "flex-1 items-center justify-center gap-1.5",
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
      </View>
    </BaseButton>
  );
}

export default memo(function DateCard({
  date,
  index = 0,
  onDelete,
  onEdit,
  onShowActions,
  onToggleStatus,
  onRowOpen,
}: Props) {
  const swipeableRef = useRef<SwipeableMethods | null>(null);
  const done = date.status === DATE_STATUS.done;

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
            label="Editar"
            icon={Pencil}
            progress={progress}
            side="left"
            onPress={() => {
              onEdit(date);
              swipeableRef.current?.close();
            }}
            accessibilityLabel={`Editar ${date.title}`}
          />
        )}
        renderRightActions={(progress) => (
          <SwipeAction
            label="Eliminar"
            icon={Trash2}
            progress={progress}
            side="right"
            emphasis="solid"
            onPress={() => {
              onDelete(date);
              swipeableRef.current?.close();
            }}
            accessibilityLabel={`Eliminar ${date.title}`}
          />
        )}
      >
        <Pressable
          onLongPress={() => onShowActions(date)}
          delayLongPress={350}
          accessibilityHint="Desliza a la derecha para editar y a la izquierda para eliminar. Mantén presionado para ver todas las acciones."
          accessibilityActions={[
            { name: "edit", label: "Editar cita" },
            {
              name: done ? "refresh" : "finish",
              label: done ? "Reabrir cita" : "Finalizar cita",
            },
            { name: "delete", label: "Eliminar cita" },
          ]}
          onAccessibilityAction={(event) => {
            if (event.nativeEvent.actionName === "edit") {
              onEdit(date);
            }

            if (
              event.nativeEvent.actionName === "finish" ||
              event.nativeEvent.actionName === "refresh"
            ) {
              onToggleStatus(date);
            }

            if (event.nativeEvent.actionName === "delete") {
              onDelete(date);
            }
          }}
        >
          <Card
            className={cn(
              "gap-0 rounded-xl py-0 shadow-none",
              done && "bg-secondary"
            )}
          >
            <View className="gap-2.5 p-4">
              <View className="flex-row items-start gap-3">
                <View
                  className={cn(
                    "h-9 w-9 items-center justify-center rounded-lg",
                    done ? "border border-border bg-background" : "bg-primary"
                  )}
                >
                  <Text
                    className={cn(
                      "text-sm font-bold uppercase leading-none",
                      done ? "text-muted-foreground" : "text-primary-foreground"
                    )}
                  >
                    {date.letter}
                  </Text>
                </View>

                <View className="flex-1 gap-1">
                  <View className="flex-row items-start gap-2">
                    <CardTitle
                      className={cn(
                        "flex-1 text-base leading-snug",
                        done && "text-muted-foreground"
                      )}
                    >
                      {date.title}
                    </CardTitle>

                    {done && (
                      <View className="flex-row items-center gap-1 rounded-full border border-border bg-background px-2 py-0.5">
                        <Icon
                          as={Check}
                          size={11}
                          className="text-muted-foreground"
                        />
                        <Text className="text-[10px] font-semibold uppercase text-muted-foreground">
                          Hecha
                        </Text>
                      </View>
                    )}
                  </View>
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
