import { useEffect, useMemo, useState } from "react";

import { View } from "react-native";

import { useRouter } from "expo-router";
import {
  CalendarPlus,
  CircleCheck,
  Plus,
  Share2,
  TriangleAlert,
  X,
} from "lucide-react-native";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import {
  AlphabetDate,
  DATE_STATUS,
} from "@/lib/services/api/responses/alphabetDatesResponse";
import { BaseResponse } from "@/lib/services/api/responses/base";
import { LETTERS } from "@/lib/utils/letters";

import AlphabetLayout from "./alphabetLayout";
import DateActionsDialog from "./dateActionsDialog";
import DateFormSheet, { DateFormValues } from "./dateFormSheet";
import DeleteDateDialog from "./deleteDateDialog";
import ShareAlphadateSheet from "./shareAlphadateSheet";

interface Props {
  dates: AlphabetDate[];
  loading?: boolean;
  refreshing?: boolean;
  onRefresh: () => void;
  deleteDate: (date: AlphabetDate) => Promise<BaseResponse>;
  /** Persists an edit through the update endpoint. */
  updateDate: (
    date: AlphabetDate,
    values: DateFormValues
  ) => Promise<BaseResponse>;
  /** Moves a date between PUBLISHED and DONE. */
  toggleStatus: (date: AlphabetDate) => Promise<BaseResponse>;
}

export default function DateList({
  dates,
  loading = false,
  refreshing = false,
  onRefresh,
  deleteDate,
  updateDate,
  toggleStatus,
}: Props) {
  const router = useRouter();

  const [deleteTarget, setDeleteTarget] = useState<AlphabetDate | undefined>();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | undefined>();

  const [actionsTarget, setActionsTarget] = useState<
    AlphabetDate | undefined
  >();
  const [editTarget, setEditTarget] = useState<AlphabetDate | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState<string | undefined>();
  const [editNotice, setEditNotice] = useState<string | undefined>();
  const [statusError, setStatusError] = useState<string | undefined>();
  const [shareVisible, setShareVisible] = useState(false);

  const stats = useMemo(() => {
    const filledLetters = LETTERS.filter((letter) =>
      dates.some((date) => date.letter === letter)
    ).length;

    return `${dates.length} ${dates.length === 1 ? "cita" : "citas"} · ${filledLetters}/26 letras`;
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
    setEditError(undefined);
    setEditTarget(date);
  }

  function openDelete(date: AlphabetDate) {
    setActionsTarget(undefined);
    setEditTarget(undefined);
    setDeleteTarget(date);
  }

  async function handleSave(values: DateFormValues) {
    if (!editTarget || isSaving) {
      return;
    }

    setIsSaving(true);
    const response = await updateDate(editTarget, values);
    setIsSaving(false);

    if (!response.ok) {
      setEditError(response.message);
      return;
    }

    setEditTarget(undefined);
    setEditNotice("Tus cambios se guardaron en tu Alphadate.");
  }

  async function handleToggleStatus(date: AlphabetDate) {
    setActionsTarget(undefined);
    setStatusError(undefined);

    const response = await toggleStatus(date);

    if (!response.ok) {
      setStatusError(response.message);
      return;
    }

    setEditNotice(
      date.status === DATE_STATUS.done
        ? "Cita reabierta: vuelve a estar activa."
        : "Cita finalizada: ahora aparece primera en su letra."
    );
  }

  return (
    // The dialogs below are always rendered, and an unmounted portal still
    // counts as a flex item. Keeping them outside the `gap-4` container stops
    // them from injecting 4 x 16dp of dead space under the list.
    <View className="flex-1">
      <View className="flex-1 gap-4">
        <View className="flex-row items-center justify-between gap-3">
          <View className="flex-1 gap-1">
            <Text variant="h3">Tu Alphadate</Text>
            <Text variant="muted" className="text-xs">
              {stats}
            </Text>
          </View>

          <View className="flex-row items-center gap-2">
            {!loading && dates.length > 0 && (
              <Button
                variant="outline"
                size="icon"
                onPress={() => setShareVisible(true)}
                accessibilityLabel="Compartir mi Alphadate"
                hitSlop={4}
              >
                <Icon as={Share2} size={16} />
              </Button>
            )}

            <Button
              onPress={() =>
                router.push({ pathname: "/dates", params: { create: "1" } })
              }
              accessibilityLabel="Crear cita"
              hitSlop={4}
            >
              <Icon as={Plus} size={16} />
              <Text>Nueva</Text>
            </Button>
          </View>
        </View>

        {/* {dates.length > 0 && ( */}
        {/*   <Text variant="muted" className="text-xs"> */}
        {/*     Desliza una tarjeta a la derecha para editar y a la izquierda para */}
        {/*     eliminar. Mantén presionada para finalizar o reabrir. */}
        {/*   </Text> */}
        {/* )} */}
        {/**/}
        {!!editNotice && (
          <Alert icon={CircleCheck} iconClassName="text-foreground">
            <View className="flex-row items-start justify-between gap-2">
              <View className="flex-1 gap-0.5">
                <AlertTitle>Cita actualizada</AlertTitle>
                <AlertDescription>{editNotice}</AlertDescription>
              </View>
              <Button
                variant="ghost"
                size="icon"
                onPress={() => setEditNotice(undefined)}
                accessibilityLabel="Cerrar"
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
                <AlertTitle>No pudimos eliminar la cita</AlertTitle>
                <AlertDescription>{deleteError}</AlertDescription>
              </View>
              <Button
                variant="ghost"
                size="icon"
                onPress={() => setDeleteError(undefined)}
                accessibilityLabel="Cerrar"
                hitSlop={4}
                className="-mr-2 -mt-1"
              >
                <Icon as={X} className="text-muted-foreground" size={16} />
              </Button>
            </View>
          </Alert>
        )}

        {!!statusError && (
          <Alert variant="destructive" icon={TriangleAlert}>
            <View className="flex-row items-start justify-between gap-2">
              <View className="flex-1 gap-0.5">
                <AlertTitle>No pudimos actualizar la cita</AlertTitle>
                <AlertDescription>{statusError}</AlertDescription>
              </View>
              <Button
                variant="ghost"
                size="icon"
                onPress={() => setStatusError(undefined)}
                accessibilityLabel="Cerrar"
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
            <Text variant="muted">Cargando tu Alphadate...</Text>
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
                Tu Alphadate está vacío
              </Text>
              <Text variant="muted" className="text-center text-sm">
                Crea tu primera cita y aparecerá aquí al instante.
              </Text>
            </View>
            <View className="flex-row gap-2">
              <Button
                onPress={() =>
                  router.push({ pathname: "/dates", params: { create: "1" } })
                }
              >
                <Icon as={Plus} size={16} />
                <Text>Crear cita</Text>
              </Button>
              <Button
                variant="outline"
                onPress={onRefresh}
                disabled={refreshing}
              >
                <Text>{refreshing ? "Actualizando..." : "Actualizar"}</Text>
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
            onToggleStatus={handleToggleStatus}
          />
        )}
      </View>

      <DateActionsDialog
        date={actionsTarget}
        onClose={() => setActionsTarget(undefined)}
        onEdit={openEdit}
        onDelete={openDelete}
        onToggleStatus={handleToggleStatus}
      />

      <DateFormSheet
        date={editTarget}
        saving={isSaving}
        error={editError}
        onCancel={() => {
          if (!isSaving) {
            setEditTarget(undefined);
            setEditError(undefined);
          }
        }}
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

      <ShareAlphadateSheet
        dates={dates}
        visible={shareVisible}
        onClose={() => setShareVisible(false)}
      />
    </View>
  );
}
