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
import { LETTERS, Letter } from "@/lib/utils/letters";

interface Props {
  dates: AlphabetDate[];
  refreshing?: boolean;
  onRefresh: () => void;
  onDelete: (date: AlphabetDate) => void;
  onEdit: (date: AlphabetDate) => void;
  onShowActions: (date: AlphabetDate) => void;
}

export default function AlphabetLayout({
  dates,
  refreshing = false,
  onRefresh,
  onDelete,
  onEdit,
  onShowActions,
}: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const sectionOffsets = useRef<Partial<Record<Letter, number>>>({});
  const openRowRef = useRef<SwipeableMethods | null>(null);
  const [activeLetter, setActiveLetter] = useState<Letter | undefined>();

  const sections = useMemo(
    () =>
      LETTERS.map((letter) => ({
        letter,
        dates: dates.filter((date) => date.letter === letter),
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
      scrollRef.current?.scrollTo({
        y: Math.max(offset - 8, 0),
        animated: true,
      });
    }
  }

  function handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const offsetY = event.nativeEvent.contentOffset.y;
    let nextActive: Letter | undefined;

    for (const section of sections) {
      const offset = sectionOffsets.current[section.letter];

      if (offset !== undefined && offset <= offsetY + 100) {
        nextActive = section.letter;
      }
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
                    {letterDates.length === 1 ? "date" : "dates"}
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
