import { useEffect, useRef } from "react";

import { StyleSheet, View, useWindowDimensions } from "react-native";

import { ChevronDown } from "lucide-react-native";
import Animated, {
  Easing,
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { LETTERS, type Letter } from "@/lib/utils/letters";

/** Degrees between two neighbouring letters on the wheel. */
const STEP = 360 / LETTERS.length;
/** How long one spin takes before the wheel settles. */
const SPIN_DURATION = 3000;
/** Full turns before the wheel slows down on the winner. */
const FULL_TURNS = 5;

interface AlphabetWheelProps {
  /** Letters the wheel may land on. Empty means there is nothing to draw. */
  targets: readonly Letter[];
  /** Bump this to start a spin. */
  spinToken: number;
  /** Letter currently drawn, shown in the hub. */
  highlight?: Letter;
  /** Called once the wheel stops, with the letter under the pointer. */
  onResult: (letter: Letter) => void;
}

/**
 * Roulette of the whole alphabet.
 *
 * Every letter is drawn, but only the reachable ones stay at full opacity, so
 * the wheel still reads as the alphabet instead of hiding most of it. The
 * component only turns and reports where it stopped: the caller owns the date
 * and the actions, which keeps it reusable outside the raffle.
 */
export default function AlphabetWheel({
  targets,
  spinToken,
  highlight,
  onResult,
}: AlphabetWheelProps) {
  const { width, height } = useWindowDimensions();

  const size = Math.max(200, Math.min(width - 96, 240, height * 0.32));
  const radius = size / 2 - 18;

  const rotation = useSharedValue(0);

  // The spin must not restart on every parent render, so the token is compared
  // against the last one and the callback is read from a ref.
  const resultRef = useRef(onResult);
  const lastToken = useRef(spinToken);

  useEffect(() => {
    resultRef.current = onResult;
  });

  useEffect(() => {
    return () => {
      cancelAnimation(rotation);
    };
  }, [rotation]);

  useEffect(() => {
    if (spinToken === lastToken.current) {
      return;
    }

    lastToken.current = spinToken;

    if (targets.length === 0) {
      return;
    }

    const picked = targets[Math.floor(Math.random() * targets.length)];
    const targetAngle = (((-LETTERS.indexOf(picked) * STEP) % 360) + 360) % 360;
    const current = rotation.value;
    const currentAngle = ((current % 360) + 360) % 360;
    const delta = (targetAngle - currentAngle + 360) % 360;
    const destination = current + FULL_TURNS * 360 + delta;

    function notify(letter: Letter) {
      resultRef.current(letter);
    }

    // eslint-disable-next-line react-hooks/immutability -- reanimated shared value write
    rotation.value = withTiming(
      destination,
      { duration: SPIN_DURATION, easing: Easing.out(Easing.cubic) },
      (finished) => {
        if (finished) {
          runOnJS(notify)(picked);
        }
      }
    );
    // Only a new token starts a spin; the rest is read from the current render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinToken]);

  const wheelStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={`Ruleta del abecedario, ${targets.length} letras con citas disponibles`}
      className="items-center justify-center rounded-full border-2 border-border bg-muted/30"
      style={{ width: size, height: size }}
    >
      <Animated.View style={[StyleSheet.absoluteFill, wheelStyle]}>
        {LETTERS.map((letter, index) => {
          const available = targets.includes(letter);

          return (
            <View
              key={letter}
              style={{
                position: "absolute",
                left: size / 2 - 13,
                top: size / 2 - 13,
                width: 26,
                height: 26,
                alignItems: "center",
                justifyContent: "center",
                opacity: available ? 1 : 0.28,
                // Rotate around the wheel centre, then push out to the rim. The
                // label turns with the wheel, the way a real roulette does.
                transform: [
                  { rotate: `${index * STEP}deg` },
                  { translateY: -radius },
                ],
              }}
            >
              <Text className="text-[11px] font-semibold uppercase text-foreground">
                {letter}
              </Text>
            </View>
          );
        })}
      </Animated.View>

      <View className="absolute inset-0 items-center justify-center">
        <View className="h-16 w-16 items-center justify-center rounded-full bg-primary shadow-sm shadow-black/10">
          <Text className="text-2xl font-bold uppercase leading-none text-primary-foreground">
            {highlight ?? "?"}
          </Text>
        </View>
      </View>

      <View className="absolute inset-x-0 top-0 items-center">
        <View className="-mt-4 h-6 w-6 items-center justify-center rounded-full bg-primary shadow-sm shadow-black/10">
          <Icon
            as={ChevronDown}
            size={14}
            className="text-primary-foreground"
          />
        </View>
      </View>
    </View>
  );
}
