import { useEffect, useMemo, useState } from "react";

import { View } from "react-native";

import { useRouter } from "expo-router";
import {
  CalendarPlus,
  CircleCheck,
  Plus,
  TriangleAlert,
  X,
} from "lucide-react-native";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { AlphabetDate } from "@/lib/services/api/responses/alphabetDatesResponse";
import { BaseResponse } from "@/lib/services/api/responses/base";
import { LETTERS, deriveLetter } from "@/lib/utils/letters";

import AlphabetLayout from "./alphabetLayout";
import DateActionsDialog from "./dateActionsDialog";
import DateFormSheet, { DateFormValues } from "./dateFormSheet";
import DeleteDateDialog from "./deleteDateDialog";

interface Props {
  dates: AlphabetDate[];
  loading?: boolean;
  refreshing?: boolean;
  onRefresh: () => void;
  deleteDate: (date: AlphabetDate) => Promise<BaseResponse>;
  /** Applies an edit locally. There is no update endpoint yet. */
  updateDate: (date: AlphabetDate) => void;
}

export default function DateList({
  dates,
  loading = false,
  refreshing = false,
  onRefresh,
  deleteDate,
  updateDate,
}: Props) {
  const router = useRouter();

  const [deleteTarget, setDeleteTarget] = useState<AlphabetDate | undefined>();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | undefined>();

  const [actionsTarget, setActionsTarget] = useState<
    AlphabetDate | undefined
  >();
  const [editTarget, setEditTarget] = useState<AlphabetDate | undefined>();
  const [editNotice, setEditNotice] = useState<string | undefined>();

  const stats = useMemo(() => {
    const filledLetters = LETTERS.filter((letter) =>
      dates.some((date) => date.letter === letter)
    ).length;

    return `${dates.length} ${dates.length === 1 ? "date" : "dates"} · ${filledLetters}/26 letters`;
  }, [dates]);

  useEffect(() => {
    if (!editNotice) {
      return;
    }

    const timer = setTimeout(() => setEditNotice(undefined), 6000);
    return () => clearTimeout(timer);
  }, [editNotice]);

  async function handleDeleteConfirm() {
    if (!deleteTarget) {
      return;
    }

    setIsDeleting(true);
    const response = await deleteDate(deleteTarget);
    setIsDeleting(false);
    setDeleteTarget(undefined);

    if (!response.ok) {
      setDeleteError(response.message);
    }
  }

  function openEdit(date: AlphabetDate) {
    setActionsTarget(undefined);
    setEditTarget(date);
  }

  function openDelete(date: AlphabetDate) {
    setActionsTarget(undefined);
    setEditTarget(undefined);
    setDeleteTarget(date);
  }

  function handleSave(values: DateFormValues) {
    if (!editTarget) {
      return;
    }

    updateDate({
      ...editTarget,
      title: values.title,
      description: values.description,
      tags: values.tags,
      // The letter is derived from the title, so an edit can move the card.
      letter: deriveLetter(values.title),
    });

    setEditTarget(undefined);
    setEditNotice(
      "Updated on this device. Editing isn't saved to the server yet."
    );
  }

  return (
    <View className="flex-1 gap-4">
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-1 gap-1">
          <Text variant="h3">Your alphabet</Text>
          <Text variant="muted" className="text-xs">
            {stats}
          </Text>
        </View>

        <Button
          onPress={() => router.push("/dates")}
          accessibilityLabel="Create date"
          hitSlop={4}
        >
          <Icon as={Plus} size={16} />
          <Text>New</Text>
        </Button>
      </View>

      {dates.length > 0 && (
        <Text variant="muted" className="text-xs">
          Swipe a card right to edit, left to delete. Long press for both.
        </Text>
      )}

      {!!editNotice && (
        <Alert icon={CircleCheck} iconClassName="text-foreground">
          <View className="flex-row items-start justify-between gap-2">
            <View className="flex-1 gap-0.5">
              <AlertTitle>Date updated</AlertTitle>
              <AlertDescription>{editNotice}</AlertDescription>
            </View>
            <Button
              variant="ghost"
              size="icon"
              onPress={() => setEditNotice(undefined)}
              accessibilityLabel="Dismiss"
              hitSlop={4}
              className="-mr-2 -mt-1"
            >
              <Icon as={X} className="text-muted-foreground" size={16} />
            </Button>
          </View>
        </Alert>
      )}

      {!!deleteError && (
        <Alert variant="destructive" icon={TriangleAlert}>
          <View className="flex-row items-start justify-between gap-2">
            <View className="flex-1 gap-0.5">
              <AlertTitle>Couldn&apos;t delete the date</AlertTitle>
              <AlertDescription>{deleteError}</AlertDescription>
            </View>
            <Button
              variant="ghost"
              size="icon"
              onPress={() => setDeleteError(undefined)}
              accessibilityLabel="Dismiss"
              hitSlop={4}
              className="-mr-2 -mt-1"
            >
              <Icon as={X} className="text-muted-foreground" size={16} />
            </Button>
          </View>
        </Alert>
      )}

      {loading ? (
        <View className="flex-1 items-center justify-center pb-10">
          <Text variant="muted">Loading your alphabet...</Text>
        </View>
      ) : dates.length === 0 ? (
        <View className="flex-1 items-center justify-center gap-5 pb-10">
          <View className="h-16 w-16 items-center justify-center rounded-2xl border border-dashed border-border">
            <Icon
              as={CalendarPlus}
              size={26}
              className="text-muted-foreground"
            />
          </View>
          <View className="items-center gap-1.5 px-4">
            <Text className="text-lg font-semibold">
              Your alphabet is empty
            </Text>
            <Text variant="muted" className="text-center text-sm">
              Create your first date and it will show up here right away.
            </Text>
          </View>
          <View className="flex-row gap-2">
            <Button onPress={() => router.push("/dates")}>
              <Icon as={Plus} size={16} />
              <Text>Create date</Text>
            </Button>
            <Button variant="outline" onPress={onRefresh} disabled={refreshing}>
              <Text>{refreshing ? "Refreshing..." : "Refresh"}</Text>
            </Button>
          </View>
        </View>
      ) : (
        <AlphabetLayout
          dates={dates}
          refreshing={refreshing}
          onRefresh={onRefresh}
          onDelete={openDelete}
          onEdit={openEdit}
          onShowActions={setActionsTarget}
        />
      )}

      <DateActionsDialog
        date={actionsTarget}
        onClose={() => setActionsTarget(undefined)}
        onEdit={openEdit}
        onDelete={openDelete}
      />

      <DateFormSheet
        date={editTarget}
        onCancel={() => setEditTarget(undefined)}
        onSave={handleSave}
      />

      <DeleteDateDialog
        date={deleteTarget}
        loading={isDeleting}
        onCancel={() => {
          if (!isDeleting) {
            setDeleteTarget(undefined);
          }
        }}
        onConfirm={handleDeleteConfirm}
      />
    </View>
  );
}
