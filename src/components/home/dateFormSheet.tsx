import { useEffect, useState } from "react";

import { KeyboardAvoidingView, Platform, View } from "react-native";

import * as Dialog from "@rn-primitives/dialog";
import { TriangleAlert, X } from "lucide-react-native";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";
import { AlphabetDate } from "@/lib/services/api/responses/alphabetDatesResponse";
import { cn } from "@/lib/utils";

import { SafeDialogContent } from "../shared/SafeDialogContent";

export interface DateFormValues {
  title: string;
  description: string;
  tags: string[];
}

interface Props {
  /** The date being edited. `undefined` keeps the sheet closed. */
  date?: AlphabetDate;
  /** The update request is in flight. */
  saving?: boolean;
  /** Server-side failure message shown inside the sheet. */
  error?: string;
  /** Dialog title. Defaults to "Edit date". */
  heading?: string;
  /** One-line explanation under the title. */
  hint?: string;
  /** Failure alert title shown above the fields. */
  errorTitle?: string;
  /** Submit button label while idle. */
  saveLabel?: string;
  /** Submit button label while `saving` is true. */
  savingLabel?: string;
  onCancel: () => void;
  onSave: (values: DateFormValues) => void;
}

type FormErrors = {
  title?: string;
  description?: string;
};

function parseTags(tags: string): string[] {
  return tags
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}

export default function DateFormSheet({
  date,
  saving = false,
  error,
  heading = "Editar cita",
  hint = "Actualiza esta entrada. Su letra sigue al título.",
  errorTitle = "No pudimos guardar los cambios",
  saveLabel = "Guardar cambios",
  savingLabel = "Guardando...",
  onCancel,
  onSave,
}: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    setTitle(date?.title ?? "");
    setDescription(date?.description ?? "");
    setTags(date?.tags.join(", ") ?? "");
    setErrors({});
  }, [date]);

  const open = !!date;

  function validate(): FormErrors {
    const nextErrors: FormErrors = {};

    if (title.trim().length < 3) {
      nextErrors.title = "Usa al menos 3 caracteres.";
    }

    if (description.trim().length < 3) {
      nextErrors.description = "Usa al menos 3 caracteres.";
    }

    return nextErrors;
  }

  function handleSave() {
    if (saving) {
      return;
    }

    const nextErrors = validate();

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    onSave({
      title: title.trim(),
      description: description.trim(),
      tags: parseTags(tags),
    });
  }

  function handleCancel() {
    if (saving) {
      return;
    }

    onCancel();
  }

  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && handleCancel()}>
      <Dialog.Portal>
        <Dialog.Overlay className="absolute inset-0 bg-black/50" />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          pointerEvents="box-none"
          className="absolute inset-0 justify-end"
        >
          <SafeDialogContent className="gap-5 rounded-t-3xl border-t border-border bg-card p-5 pb-8">
            <View className="flex-row items-start justify-between gap-3">
              <View className="flex-1 gap-1">
                <Dialog.Title className="text-xl font-semibold text-foreground">
                  {heading}
                </Dialog.Title>
                <Dialog.Description className="text-sm text-muted-foreground">
                  {hint}
                </Dialog.Description>
              </View>

              <Button
                variant="ghost"
                size="icon"
                onPress={handleCancel}
                disabled={saving}
                accessibilityLabel="Cerrar"
                hitSlop={4}
                className="-mr-2 -mt-2"
              >
                <Icon as={X} className="text-muted-foreground" size={18} />
              </Button>
            </View>

            {!!error && (
              <Alert variant="destructive" icon={TriangleAlert}>
                <AlertTitle>{errorTitle}</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <View className="gap-2">
              <Label nativeID="edit-date-title" htmlFor="edit-date-title">
                Título
              </Label>
              <Input
                id="edit-date-title"
                aria-labelledby="edit-date-title"
                value={title}
                onChangeText={setTitle}
                onBlur={() => setErrors(validate())}
                placeholder="Cenamos? Salimos? Noche de Pelis?"
                editable={!saving}
                aria-invalid={!!errors.title}
                className={cn(errors.title && "border-destructive")}
              />
              {!!errors.title && (
                <Text className="text-sm text-destructive">{errors.title}</Text>
              )}
            </View>

            <View className="gap-2">
              <Label
                nativeID="edit-date-description"
                htmlFor="edit-date-description"
              >
                Descripción
              </Label>
              <Input
                id="edit-date-description"
                aria-labelledby="edit-date-description"
                value={description}
                onChangeText={setDescription}
                onBlur={() => setErrors(validate())}
                placeholder="¿De qué se trata esta cita?"
                multiline
                editable={!saving}
                aria-invalid={!!errors.description}
                className={cn(
                  "h-24 py-2",
                  errors.description && "border-destructive"
                )}
              />
              {!!errors.description && (
                <Text className="text-sm text-destructive">
                  {errors.description}
                </Text>
              )}
            </View>

            <View className="gap-2">
              <Label nativeID="edit-date-tags" htmlFor="edit-date-tags">
                Etiquetas
              </Label>
              <Input
                id="edit-date-tags"
                aria-labelledby="edit-date-tags"
                value={tags}
                onChangeText={setTags}
                placeholder="amigos, viaje, ideas"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!saving}
              />
              <Text variant="muted" className="text-xs">
                Separa las etiquetas con comas.
              </Text>
            </View>

            <View className="flex-row gap-3">
              <Button
                variant="outline"
                size="lg"
                className="flex-1"
                onPress={handleCancel}
                disabled={saving}
              >
                <Text>Cancelar</Text>
              </Button>
              <Button
                size="lg"
                className="flex-1"
                onPress={handleSave}
                disabled={saving}
              >
                <Text>{saving ? savingLabel : saveLabel}</Text>
              </Button>
            </View>
          </SafeDialogContent>
        </KeyboardAvoidingView>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
