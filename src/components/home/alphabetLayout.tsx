import { useCallback, useMemo, useRef, useState } from "react";

import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  RefreshControl,
  ScrollView,
  View,
} from "react-native";

import type { SwipeableMethods } from "react-native-gesture-handler/ReanimatedSwipeable";

import DateCard from "@/components/home/dateCard";
import LetterRail from "@/components/home/letterRail";
import { Text } from "@/components/ui/text";
import { AlphabetDate } from "@/lib/services/api/responses/alphabetDatesResponse";
import { isDateDone } from "@/lib/utils/dates";
import { LETTERS, Letter } from "@/lib/utils/letters";

interface Props {
  dates: AlphabetDate[];
  refreshing?: boolean;
  onRefresh: () => void;
  onDelete: (date: AlphabetDate) => void;
  onEdit: (date: AlphabetDate) => void;
  onShowActions: (date: AlphabetDate) => void;
  onToggleStatus: (date: AlphabetDate) => void;
}

export default function AlphabetLayout({
  dates,
  refreshing = false,
  onRefresh,
  onDelete,
  onEdit,
  onShowActions,
  onToggleStatus,
}: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const sectionOffsets = useRef<Partial<Record<Letter, number>>>({});
  const openRowRef = useRef<SwipeableMethods | null>(null);
  const [activeLetter, setActiveLetter] = useState<Letter | undefined>();
  // A tap on the rail wins until the user drags again: the tap already says
  // which group they want to read, even when the scroll cannot reach it.
  const pressedLetter = useRef<Letter | null>(null);

  const sections = useMemo(
    () =>
      LETTERS.map((letter) => ({
        letter,
        // Finished dates lead their letter group; the rest keep their order.
        dates: dates
          .filter((date) => date.letter === letter)
          .sort((a, b) => Number(isDateDone(b)) - Number(isDateDone(a))),
      })).filter((section) => section.dates.length > 0),
    [dates]
  );

  // Only letters that actually hold dates. Rendering 26 chips where most are
  // disabled added noise without adding navigation.
  const letterInfos = useMemo(
    () =>
      sections.map((section) => ({
        letter: section.letter,
        count: section.dates.length,
      })),
    [sections]
  );

  const handleRowOpen = useCallback((methods: SwipeableMethods) => {
    if (openRowRef.current && openRowRef.current !== methods) {
      openRowRef.current.close();
    }

    openRowRef.current = methods;
  }, []);

  function scrollToLetter(letter: Letter) {
    const offset = sectionOffsets.current[letter];

    if (offset !== undefined) {
      // Highlight on tap instead of waiting for the scroll to report itself.
      pressedLetter.current = letter;
      setActiveLetter(letter);

      scrollRef.current?.scrollTo({
        y: Math.max(offset - 8, 0),
        animated: true,
      });
    }
  }

  function handleScrollBeginDrag() {
    pressedLetter.current = null;
  }

  function handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    if (pressedLetter.current !== null) {
      return;
    }

    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const offsetY = contentOffset.y;
    const maxOffsetY = Math.max(
      contentSize.height - layoutMeasurement.height,
      0
    );
    // The last groups never reach the top of the viewport, so the
    // `offset <= offsetY + 100` test below can never match for them. Hitting
    // the bottom means the last group is the one being read.
    const atBottom = maxOffsetY > 0 && offsetY >= maxOffsetY - 2;
    let nextActive: Letter | undefined;

    for (const section of sections) {
      const offset = sectionOffsets.current[section.letter];

      if (offset !== undefined && offset <= offsetY + 100) {
        nextActive = section.letter;
      }
    }

    if (atBottom) {
      nextActive = sections[sections.length - 1]?.letter ?? nextActive;
    }

    if (nextActive !== activeLetter) {
      setActiveLetter(nextActive);
    }
  }

  const currentActiveLetter =
    activeLetter && sections.some((section) => section.letter === activeLetter)
      ? activeLetter
      : sections[0]?.letter;

  return (
    <View className="flex-1">
      <View className="border-b border-border pb-1">
        <LetterRail
          letters={letterInfos}
          activeLetter={currentActiveLetter}
          onLetterPress={scrollToLetter}
        />
      </View>

      <ScrollView
        ref={scrollRef}
        className="flex-1"
        scrollEventThrottle={16}
        onScroll={handleScroll}
        onScrollBeginDrag={handleScrollBeginDrag}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="gap-6 pb-8 pt-3">
          {sections.map(({ letter, dates: letterDates }) => (
            <View
              key={letter}
              onLayout={(event) => {
                sectionOffsets.current[letter] = event.nativeEvent.layout.y;
              }}
              className="gap-3"
            >
              <View className="flex-row items-center gap-3">
                <Text className="text-2xl font-bold uppercase leading-none">
                  {letter}
                </Text>
                <View className="rounded-full bg-muted px-2 py-0.5">
                  <Text className="text-xs font-medium text-muted-foreground">
                    {letterDates.length}{" "}
                    {letterDates.length === 1 ? "cita" : "citas"}
                  </Text>
                </View>
                <View className="h-px flex-1 bg-border" />
              </View>

              {letterDates.map((date, index) => (
                <DateCard
                  key={date.dateId}
                  date={date}
                  index={index}
                  onDelete={onDelete}
                  onEdit={onEdit}
                  onShowActions={onShowActions}
                  onToggleStatus={onToggleStatus}
                  onRowOpen={handleRowOpen}
                />
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
