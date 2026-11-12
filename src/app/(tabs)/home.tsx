import { useCallback, useState } from "react";

import { useFocusEffect } from "expo-router";

import type { DateFormValues } from "@/components/home/dateFormSheet";
import DateList from "@/components/home/dateList";
import ScreenLayout from "@/components/shared/ScreenLayout";
import { AlphadateService } from "@/lib/services/api/alphadateApiService";
import { AlphabetDate } from "@/lib/services/api/responses/alphabetDatesResponse";
import { BaseResponse } from "@/lib/services/api/responses/base";
import { statusAfterCommand, statusCommandFor } from "@/lib/utils/dates";
import { deriveLetter } from "@/lib/utils/letters";

export default function Home() {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dates, setDates] = useState([] as AlphabetDate[]);

  const loadDates = useCallback(async () => {
    const alphabetService = new AlphadateService();

    const response = await alphabetService.getAlphabetDates();

    return response.dates;
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);

    setDates(await loadDates());

    setRefreshing(false);
  };

  const handleDeleteDate = async (
    date: AlphabetDate
  ): Promise<BaseResponse> => {
    const snapshot = dates;
    setDates((prev) => prev.filter((item) => item.dateId !== date.dateId));

    const alphabetService = new AlphadateService();
    const response = await alphabetService.deleteAlphabetDate(date.dateId);

    if (!response.ok) {
      setDates(snapshot);
    }

    return response;
  };

  const handleUpdateDate = async (
    date: AlphabetDate,
    values: DateFormValues
  ): Promise<BaseResponse> => {
    const alphabetService = new AlphadateService();

    const response = await alphabetService.updateAlphabetDate({
      dateId: date.dateId,
      title: values.title,
      description: values.description,
      tags: values.tags,
    });

    if (response.ok) {
      setDates((prev) =>
        prev.map((item) =>
          item.dateId === date.dateId
            ? {
                ...item,
                title: values.title,
                description: values.description,
                tags: values.tags,
                // The letter is derived from the title, so an edit can move the card.
                letter: deriveLetter(values.title),
              }
            : item
        )
      );
    }

    return response;
  };

  const handleToggleDateStatus = async (
    date: AlphabetDate
  ): Promise<BaseResponse> => {
    const command = statusCommandFor(date.status);

    const alphabetService = new AlphadateService();

    const response = await alphabetService.updateAlphabetDate({
      dateId: date.dateId,
      title: date.title,
      description: date.description,
      tags: date.tags,
      status: command,
    });

    if (response.ok) {
      const nextStatus = statusAfterCommand(command);

      setDates((prev) =>
        prev.map((item) =>
          item.dateId === date.dateId ? { ...item, status: nextStatus } : item
        )
      );
    }

    return response;
  };

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const effect = async () => {
        const nDates = await loadDates();

        if (active) {
          setDates(nDates);
          setLoading(false);
        }
      };

      effect();

      return () => {
        active = false;
      };
    }, [loadDates])
  );

  return (
    <ScreenLayout>
      <DateList
        dates={dates}
        loading={loading}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        deleteDate={handleDeleteDate}
        updateDate={handleUpdateDate}
        toggleStatus={handleToggleDateStatus}
      />
    </ScreenLayout>
  );
}
