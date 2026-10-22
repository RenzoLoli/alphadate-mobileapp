import { Pressable, ScrollView } from "react-native";

import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import { Letter } from "@/lib/utils/letters";

export interface LetterInfo {
  letter: Letter;
  count: number;
}

interface Props {
  /** Only letters that actually hold dates. Empty letters are noise. */
  letters: LetterInfo[];
  activeLetter?: Letter;
  onLetterPress: (letter: Letter) => void;
}

/**
 * Horizontal A-Z index.
 *
 * Previous version rendered all 26 letters (24 of them disabled) inside
 * 40x40 targets, which is both below the Android 48dp touch floor and visually
 * noisy. Now only filled letters are rendered, at 48x48.
 */
export default function LetterRail({
  letters,
  activeLetter,
  onLetterPress,
}: Props) {
  if (letters.length === 0) {
    return null;
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="gap-2 px-1 py-1"
    >
      {letters.map(({ letter, count }) => {
        const active = activeLetter === letter;

        return (
          <Pressable
            key={letter}
            onPress={() => onLetterPress(letter)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`Letter ${letter.toUpperCase()}, ${count} ${
              count === 1 ? "date" : "dates"
            }`}
            className={cn(
              "h-12 min-w-12 flex-col items-center justify-center rounded-lg border",
              active
                ? "border-foreground bg-foreground"
                : "border-border bg-background"
            )}
          >
            <Text
              className={cn(
                "text-sm font-semibold uppercase leading-none",
                active ? "text-background" : "text-foreground"
              )}
            >
              {letter}
            </Text>
            <Text
              className={cn(
                "pt-1 text-[10px] font-medium leading-none",
                active ? "text-background" : "text-muted-foreground"
              )}
            >
              {count}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
