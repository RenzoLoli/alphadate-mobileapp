import { useEffect, useState } from "react";

import { KeyboardAvoidingView, Platform, View } from "react-native";

import * as Dialog from "@rn-primitives/dialog";
import { X } from "lucide-react-native";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";
import { AlphabetDate } from "@/lib/services/api/responses/alphabetDatesResponse";
import { cn } from "@/lib/utils";

export interface DateFormValues {
  title: string;
  description: string;
  tags: string[];
}

interface Props {
  /** The date being edited. `undefined` keeps the sheet closed. */
  date?: AlphabetDate;
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

/**
 * Bottom sheet for editing a date.
 *
 * Built on `@rn-primitives/dialog` so focus handling, dismissal and the
 * accessible title/description come from the primitive instead of a bare Modal.
 */
export default function DateFormSheet({ date, onCancel, onSave }: Props) {
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

    if (title.trim().length === 0) {
      nextErrors.title = "Enter a title.";
    }

    if (description.trim().length === 0) {
      nextErrors.description = "Enter a description.";
    }

    return nextErrors;
  }

  function handleSave() {
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

  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && onCancel()}>
      <Dialog.Portal>
        <Dialog.Overlay className="absolute inset-0 bg-black/50" />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          pointerEvents="box-none"
          className="absolute inset-0 justify-end"
        >
          <Dialog.Content className="gap-5 rounded-t-3xl border-t border-border bg-card p-5 pb-8">
            <View className="flex-row items-start justify-between gap-3">
              <View className="flex-1 gap-1">
                <Dialog.Title className="text-xl font-semibold text-foreground">
                  Edit date
                </Dialog.Title>
                <Dialog.Description className="text-sm text-muted-foreground">
                  Update this entry. Its letter follows the title.
                </Dialog.Description>
              </View>

              <Button
                variant="ghost"
                size="icon"
                onPress={onCancel}
                accessibilityLabel="Close"
                hitSlop={4}
                className="-mr-2 -mt-2"
              >
                <Icon as={X} className="text-muted-foreground" size={18} />
              </Button>
            </View>

            <View className="gap-2">
              <Label nativeID="edit-date-title" htmlFor="edit-date-title">
                Title
              </Label>
              <Input
                id="edit-date-title"
                aria-labelledby="edit-date-title"
                value={title}
                onChangeText={setTitle}
                onBlur={() => setErrors(validate())}
                placeholder="Dinner at sunset"
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
                Description
              </Label>
              <Input
                id="edit-date-description"
                aria-labelledby="edit-date-description"
                value={description}
                onChangeText={setDescription}
                onBlur={() => setErrors(validate())}
                placeholder="What is this date about?"
                multiline
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
                Tags
              </Label>
              <Input
                id="edit-date-tags"
                aria-labelledby="edit-date-tags"
                value={tags}
                onChangeText={setTags}
                placeholder="friends, travel, ideas"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Text variant="muted" className="text-xs">
                Separate tags with commas.
              </Text>
            </View>

            <Text variant="muted" className="text-xs">
              Editing is local for now: the server has no update endpoint yet.
            </Text>

            <View className="flex-row gap-3">
              <Button
                variant="outline"
                size="lg"
                className="flex-1"
                onPress={onCancel}
              >
                <Text>Cancel</Text>
              </Button>
              <Button size="lg" className="flex-1" onPress={handleSave}>
                <Text>Save changes</Text>
              </Button>
            </View>
          </Dialog.Content>
        </KeyboardAvoidingView>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
