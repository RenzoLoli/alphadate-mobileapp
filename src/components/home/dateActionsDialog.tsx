import { Pressable, View } from "react-native";

import * as Dialog from "@rn-primitives/dialog";
import { Pencil, Trash2 } from "lucide-react-native";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { AlphabetDate } from "@/lib/services/api/responses/alphabetDatesResponse";

interface Props {
  /** The date whose actions are open. `undefined` keeps the dialog closed. */
  date?: AlphabetDate;
  onClose: () => void;
  onEdit: (date: AlphabetDate) => void;
  onDelete: (date: AlphabetDate) => void;
}

/**
 * Long-press menu for a date card.
 *
 * Swipe alone is not an accessible or discoverable way to reach edit/delete,
 * so this dialog is the explicit alternative entry point.
 */
export default function DateActionsDialog({
  date,
  onClose,
  onEdit,
  onDelete,
}: Props) {
  return (
    <Dialog.Root open={!!date} onOpenChange={(next) => !next && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="absolute inset-0 bg-black/50" />

        <View className="absolute inset-0 items-center justify-center px-6">
          <Dialog.Content className="w-full gap-4 rounded-2xl border border-border bg-card p-5">
            <View className="gap-1">
              <Dialog.Title className="text-lg font-semibold text-foreground">
                {date?.title ?? "Date"}
              </Dialog.Title>
              <Dialog.Description className="text-sm text-muted-foreground">
                Choose an action.
              </Dialog.Description>
            </View>

            <View className="gap-1">
              <Pressable
                onPress={() => date && onEdit(date)}
                accessibilityRole="button"
                accessibilityLabel={date ? `Edit ${date.title}` : "Edit date"}
                className="h-12 flex-row items-center gap-3 rounded-lg px-3 active:bg-accent"
              >
                <Icon as={Pencil} size={18} className="text-foreground" />
                <Text className="text-base">Edit</Text>
              </Pressable>

              <Pressable
                onPress={() => date && onDelete(date)}
                accessibilityRole="button"
                accessibilityLabel={
                  date ? `Delete ${date.title}` : "Delete date"
                }
                className="h-12 flex-row items-center gap-3 rounded-lg px-3 active:bg-accent"
              >
                <Icon as={Trash2} size={18} className="text-foreground" />
                <Text className="text-base">Delete</Text>
              </Pressable>
            </View>

            <Button variant="outline" size="lg" onPress={onClose}>
              <Text>Cancel</Text>
            </Button>
          </Dialog.Content>
        </View>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
