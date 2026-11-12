import { useEffect, useState } from "react";

import {
  AccessibilityInfo,
  Pressable,
  ScrollView,
  Share,
  View,
} from "react-native";

import * as Dialog from "@rn-primitives/dialog";
import { Check, Copy, Share2, TriangleAlert, X } from "lucide-react-native";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { type AlphabetDate } from "@/lib/services/api/responses/alphabetDatesResponse";
import { cn } from "@/lib/utils";
import {
  SHARE_FORMAT_OPTIONS,
  type ShareFormat,
  alphadateShareTitle,
  buildAlphadateShare,
} from "@/lib/utils/share";
import { type ShareFileStage, shareFile } from "@/lib/utils/shareFile";
import { SafeDialogContent } from "../shared/SafeDialogContent";

/**
 * One message per step that can stop an export. Worded so the next action is
 * obvious instead of naming the step itself.
 */
const SHARE_FILE_ERRORS: Record<ShareFileStage, string> = {
  modules:
    "Este dispositivo no puede compartir archivos todavía. Probá con el formato Texto.",
  write: "No pudimos preparar el archivo. Probá otra vez.",
  share: "No pudimos abrir el menú de compartir. Probá otra vez.",
};

/** How long the copy confirmation stays on screen. */
const COPIED_FEEDBACK_MS = 2000;

interface ShareError {
  /** What failed, in the alert title. */
  title: string;
  /** What to try next. */
  message: string;
  /** Native detail, shown in development only. */
  detail?: string;
}

interface Props {
  dates: AlphabetDate[];
  /** The sheet is open. */
  visible: boolean;
  onClose: () => void;
}

/**
 * Share the Alphadate, as a message or as a real file.
 *
 * The native share sheet is the export mechanism: it needs no dependency, it
 * reaches WhatsApp and every other app the person already has, and it handles
 * long messages better than a URL scheme would. Text leaves as a message;
 * every other format leaves as the file it is, so a `.csv` opens in a
 * spreadsheet and a `.md` keeps its checkboxes. The preview exists so nobody
 * shares something they have not read.
 */
export default function ShareAlphadateSheet({
  dates,
  visible,
  onClose,
}: Props) {
  const [format, setFormat] = useState<ShareFormat>("text");
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<ShareError | undefined>();

  const activeOption =
    SHARE_FORMAT_OPTIONS.find((option) => option.value === format) ??
    SHARE_FORMAT_OPTIONS[0];

  const text = buildAlphadateShare(dates, format);

  // A sheet reopened after a failure starts clean. The chosen format survives,
  // so someone exporting twice for the same spreadsheet does not reselect it.
  useEffect(() => {
    if (visible) {
      setSharing(false);
      setCopied(false);
      setError(undefined);
    }
  }, [visible]);

  // "Copiado" is a confirmation, not a state: it returns to "Copiar" on its own
  // so the next copy still reads as an action.
  useEffect(() => {
    if (!copied) {
      return;
    }

    const timeout = setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS);
    return () => clearTimeout(timeout);
  }, [copied]);

  function handleClose() {
    if (sharing) {
      return;
    }

    onClose();
  }

  async function handleCopy() {
    if (!text) {
      return;
    }

    setError(undefined);

    try {
      // `expo-clipboard` resolves its native module while loading, so the
      // import stays lazy: a binary without it reports an error instead of
      // taking the whole screen down.
      const { setStringAsync } = await import("expo-clipboard");
      await setStringAsync(text);

      setCopied(true);
      AccessibilityInfo.announceForAccessibility("Alphadate copiado");
    } catch (cause) {
      setError({
        title: "No pudimos copiar",
        message: "No pudimos copiar al portapapeles. Probá otra vez.",
        detail: cause instanceof Error ? cause.message : undefined,
      });
      AccessibilityInfo.announceForAccessibility("No pudimos copiar");
    }
  }

  async function handleShare() {
    if (sharing || !text) {
      return;
    }

    setSharing(true);
    setError(undefined);

    try {
      // Text travels as a message; every other format travels as the file it
      // is, so a .csv opens in a spreadsheet instead of arriving as pasted text.
      if (activeOption.extension) {
        const result = await shareFile({
          fileName: `mi-alphadate.${activeOption.extension}`,
          content: text,
          mimeType: activeOption.mimeType,
          uti: activeOption.uti,
          dialogTitle: "Compartir mi Alphadate",
        });

        if (!result.ok) {
          setError({
            title: "No pudimos compartir",
            message: SHARE_FILE_ERRORS[result.stage],
            detail: result.detail,
          });
          AccessibilityInfo.announceForAccessibility(
            "No pudimos compartir el archivo"
          );
          return;
        }
      } else {
        // `dialogTitle` names the Android chooser; `subject` is the mail subject.
        await Share.share(
          { message: text, title: alphadateShareTitle(dates) },
          {
            dialogTitle: "Compartir mi Alphadate",
            subject: alphadateShareTitle(dates),
          }
        );
      }

      onClose();
    } catch (cause) {
      setError({
        title: "No pudimos compartir",
        message: "Algo interrumpió el compartir. Probá otra vez.",
        detail: cause instanceof Error ? cause.message : undefined,
      });
      AccessibilityInfo.announceForAccessibility("No pudimos compartir");
    } finally {
      // Whatever happens, the button must never stay stuck on "Compartiendo".
      setSharing(false);
    }
  }

  return (
    <Dialog.Root open={visible} onOpenChange={(next) => !next && handleClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="absolute inset-0 bg-black/50" />

        <View pointerEvents="box-none" className="absolute inset-0 justify-end">
          <SafeDialogContent className="gap-4 rounded-t-3xl border-t border-border bg-card p-5 pb-8">
            <View className="flex-row items-start justify-between gap-3">
              <View className="flex-1 gap-1">
                <Dialog.Title className="text-xl font-semibold text-foreground">
                  Compartir mi Alphadate
                </Dialog.Title>
                <Dialog.Description className="text-sm text-muted-foreground">
                  Elegí el formato y compartilo por WhatsApp, Telegram o donde
                  quieras.
                </Dialog.Description>
              </View>

              <Button
                variant="ghost"
                size="icon"
                onPress={handleClose}
                disabled={sharing}
                accessibilityLabel="Cerrar"
                hitSlop={4}
                className="-mr-2 -mt-2"
              >
                <Icon as={X} className="text-muted-foreground" size={18} />
              </Button>
            </View>

            {!!error && (
              <Alert variant="destructive" icon={TriangleAlert}>
                <AlertTitle>{error.title}</AlertTitle>
                <AlertDescription>{error.message}</AlertDescription>
                {__DEV__ && !!error.detail && (
                  <Text className="text-xs text-muted-foreground">
                    {error.detail}
                  </Text>
                )}
              </Alert>
            )}

            <View className="gap-2">
              <View className="flex-row gap-2">
                {SHARE_FORMAT_OPTIONS.map((option) => {
                  const active = option.value === format;

                  return (
                    <Pressable
                      key={option.value}
                      onPress={() => {
                        setFormat(option.value);
                        setCopied(false);
                      }}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      accessibilityLabel={`Formato ${option.label}`}
                      className={cn(
                        "h-9 flex-1 items-center justify-center rounded-full border active:opacity-80",
                        active
                          ? "border-primary bg-primary"
                          : "border-border bg-background"
                      )}
                    >
                      <Text
                        className={cn(
                          "text-xs",
                          active
                            ? "font-medium text-primary-foreground"
                            : "text-muted-foreground"
                        )}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text variant="muted" className="text-xs">
                {activeOption.hint}
              </Text>
            </View>

            <Card className="gap-0 rounded-xl py-0 shadow-none">
              <View className="flex-row items-center justify-between border-b border-border px-4 py-2">
                <Text variant="muted" className="text-xs">
                  Vista previa
                </Text>

                <Pressable
                  onPress={handleCopy}
                  disabled={!text}
                  accessibilityRole="button"
                  accessibilityLabel="Copiar la vista previa"
                  accessibilityState={{ disabled: !text }}
                  hitSlop={8}
                  className={cn(
                    "flex-row items-center gap-1.5 rounded-full px-2 py-1 active:opacity-70",
                    copied && "bg-primary/10"
                  )}
                >
                  <Icon
                    as={copied ? Check : Copy}
                    size={14}
                    className={
                      copied ? "text-primary" : "text-muted-foreground"
                    }
                  />
                  <Text
                    className={cn(
                      "text-xs",
                      copied
                        ? "font-medium text-primary"
                        : "text-muted-foreground"
                    )}
                  >
                    {copied ? "Copiado" : "Copiar"}
                  </Text>
                </Pressable>
              </View>

              <ScrollView
                className="max-h-64"
                contentContainerClassName="p-4"
                showsVerticalScrollIndicator={false}
              >
                <Text
                  selectable
                  className={cn(
                    "leading-relaxed",
                    format === "csv" ? "font-mono text-xs" : "text-sm"
                  )}
                >
                  {text}
                </Text>
              </ScrollView>
            </Card>

            <Text variant="muted" className="text-xs">
              {dates.length === 1 ? "1 cita" : `${dates.length} citas`} · se
              comparte el título, la descripción y las etiquetas de cada una.
            </Text>

            <View className="flex-row gap-3">
              <Button
                variant="outline"
                size="lg"
                className="flex-1"
                onPress={handleClose}
                disabled={sharing}
              >
                <Text>Cerrar</Text>
              </Button>
              <Button
                size="lg"
                className="flex-1"
                onPress={handleShare}
                disabled={sharing || !text}
                accessibilityState={{ busy: sharing }}
              >
                <Icon as={Share2} size={18} />
                <Text>{sharing ? "Compartiendo..." : "Compartir"}</Text>
              </Button>
            </View>
          </SafeDialogContent>
        </View>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
