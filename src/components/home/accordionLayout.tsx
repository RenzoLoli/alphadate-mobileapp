import { useState } from "react";

import { RefreshControl, ScrollView, View } from "react-native";

import type { SwipeableMethods } from "react-native-gesture-handler/ReanimatedSwipeable";

import DateCard from "@/components/home/dateCard";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Text } from "@/components/ui/text";
import { AlphabetDate } from "@/lib/services/api/responses/alphabetDatesResponse";
import { LETTERS } from "@/lib/utils/letters";

const EMPTY_LETTERS_VALUE = "__empty_letters__";

interface Props {
  dates: AlphabetDate[];
  refreshing?: boolean;
  onRefresh: () => void;
  onDelete: (date: AlphabetDate) => void;
  onEdit: (date: AlphabetDate) => void;
  onShowActions: (date: AlphabetDate) => void;
  onRowOpen: (methods: SwipeableMethods) => void;
}

export default function AccordionLayout({
  dates,
  refreshing = false,
  onRefresh,
  onDelete,
  onEdit,
  onShowActions,
  onRowOpen,
}: Props) {
  const [touched, setTouched] = useState(false);
  const [openValues, setOpenValues] = useState<string[]>([]);

  const groups = LETTERS.map((letter) => ({
    letter,
    dates: dates.filter((date) => date.letter === letter),
  }));

  const filledGroups = groups.filter((group) => group.dates.length > 0);
  const emptyGroups = groups.filter((group) => group.dates.length === 0);

  const values = touched
    ? openValues.filter(
        (value) =>
          value === EMPTY_LETTERS_VALUE ||
          filledGroups.some((group) => group.letter === value)
      )
    : filledGroups.slice(0, 1).map((group) => group.letter);

  function handleValueChange(value: string[]) {
    setTouched(true);
    setOpenValues(value);
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      className="flex-1 bg-background px-1"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="primary"
        />
      }
    >
      <View className="pb-6 pt-2">
        <Accordion
          type="multiple"
          value={values}
          onValueChange={handleValueChange}
        >
          {filledGroups.map(({ letter, dates: letterDates }) => (
            <AccordionItem key={letter} value={letter}>
              <AccordionTrigger>
                <View className="flex-row items-center gap-2">
                  <Text className="text-base font-bold uppercase">
                    {letter}
                  </Text>
                  <View className="rounded-full bg-muted px-2 py-0.5">
                    <Text className="text-xs font-medium text-muted-foreground">
                      {letterDates.length}{" "}
                      {letterDates.length === 1 ? "date" : "dates"}
                    </Text>
                  </View>
                </View>
              </AccordionTrigger>

              <AccordionContent className="gap-3">
                {letterDates.map((date, index) => (
                  <DateCard
                    key={date.dateId}
                    date={date}
                    index={index}
                    onDelete={onDelete}
                    onEdit={onEdit}
                    onShowActions={onShowActions}
                    onRowOpen={onRowOpen}
                  />
                ))}
              </AccordionContent>
            </AccordionItem>
          ))}

          {emptyGroups.length > 0 && (
            <AccordionItem value={EMPTY_LETTERS_VALUE}>
              <AccordionTrigger>
                <View className="flex-row items-center gap-2">
                  <Text variant="muted" className="text-sm font-medium">
                    Letters without dates
                  </Text>
                  <View className="rounded-full border border-border px-2 py-0.5">
                    <Text className="text-xs font-medium text-muted-foreground">
                      {emptyGroups.length}
                    </Text>
                  </View>
                </View>
              </AccordionTrigger>

              <AccordionContent>
                <View className="flex-row flex-wrap gap-2">
                  {emptyGroups.map(({ letter }) => (
                    <View
                      key={letter}
                      className="h-9 min-w-9 items-center justify-center rounded-full border border-dashed border-border px-3"
                    >
                      <Text className="text-sm font-semibold uppercase text-muted-foreground">
                        {letter}
                      </Text>
                    </View>
                  ))}
                </View>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>

        {filledGroups.length === 0 && (
          <View className="items-center gap-2 rounded-lg border border-dashed border-border py-8">
            <Text variant="muted">No dates in your alphabet yet.</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
