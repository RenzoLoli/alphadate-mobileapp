import { View } from "react-native";

import { Pencil, Plus } from "lucide-react-native";
import Animated, { FadeOut, LinearTransition } from "react-native-reanimated";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import type { AlphabetDate } from "@/lib/services/api/responses/alphabetDatesResponse";
import { cn } from "@/lib/utils";

interface RecommendationCardProps {
  date: AlphabetDate;
  /** This card's request is in flight. */
  adding: boolean;
  /** Any add request is in flight, so every action is blocked. */
  disabled: boolean;
  /** Failure from this card's last add attempt. */
  error?: string;
  /** Tighter card for the roulette sheet, where vertical space is scarce. */
  compact?: boolean;
  onAdd: (date: AlphabetDate) => void;
  onEdit: (date: AlphabetDate) => void;
}

/**
 * A recommendation with its two actions: tweak it first, or add it as-is.
 *
 * Shared by the list and the roulette, so both offer the exact same
 * affordances instead of drifting apart over time.
 */
export default function RecommendationCard({
  date,
  adding,
  disabled,
  error,
  compact = false,
  onAdd,
  onEdit,
}: RecommendationCardProps) {
  const tags = compact ? date.tags.slice(0, 3) : date.tags;

  const editButton = (
    <Button
      variant={compact ? "outline" : "ghost"}
      size={compact ? "sm" : "icon"}
      className={compact ? "h-9 flex-1" : "h-9 w-9"}
      onPress={() => onEdit(date)}
      disabled={disabled}
      hitSlop={4}
      accessibilityLabel={`Editar ${date.title} antes de agregarla`}
    >
      <Icon
        as={Pencil}
        size={16}
        className={compact ? undefined : "text-muted-foreground"}
      />
      {compact && <Text>Editar</Text>}
    </Button>
  );

  const addButton = (
    <Button
      size="sm"
      className={cn("h-9 px-3", compact ? "flex-1" : "rounded-full")}
      onPress={() => onAdd(date)}
      disabled={disabled}
      hitSlop={4}
      accessibilityLabel={`Agregar ${date.title} a tu Alphadate`}
      accessibilityState={{ disabled, busy: adding }}
    >
      <Icon as={Plus} size={14} />
      <Text className="text-xs">{adding ? "Agregando..." : "Agregar"}</Text>
    </Button>
  );

  return (
    <Animated.View
      exiting={FadeOut.duration(160)}
      layout={LinearTransition.duration(200)}
    >
      <Card className="gap-0 rounded-xl py-0 shadow-none">
        <View className="gap-3 p-4">
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
              <CardDescription
                className={cn("py-4", compact && "py-2")}
                numberOfLines={compact ? 2 : undefined}
              >
                {date.description}
              </CardDescription>
            </View>
          </View>

          <View className="flex-row items-center justify-between gap-3">
            <View className="flex-1 flex-row flex-wrap gap-2">
              {tags.map((tag) => (
                <View
                  key={tag}
                  className="rounded-full border border-border px-2.5 py-1"
                >
                  <Text className="text-xs text-muted-foreground">{tag}</Text>
                </View>
              ))}
              {compact && date.tags.length > tags.length && (
                <View className="rounded-full border border-border px-2.5 py-1">
                  <Text className="text-xs text-muted-foreground">
                    +{date.tags.length - tags.length}
                  </Text>
                </View>
              )}
            </View>

            {!compact && (
              <View className="flex-row items-center gap-1">
                {editButton}
                {addButton}
              </View>
            )}
          </View>

          {compact && (
            <View className="flex-row gap-2">
              {editButton}
              {addButton}
            </View>
          )}

          {!!error && <Text className="text-xs text-destructive">{error}</Text>}
        </View>
      </Card>
    </Animated.View>
  );
}
