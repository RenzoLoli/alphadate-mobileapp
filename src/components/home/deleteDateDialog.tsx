import { View } from "react-native";

import * as AlertDialog from "@rn-primitives/alert-dialog";
import { Trash2 } from "lucide-react-native";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { AlphabetDate } from "@/lib/services/api/responses/alphabetDatesResponse";

import { SafeDialogContent } from "../shared/SafeDialogContent";

interface Props {
  date?: AlphabetDate;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * Destructive confirmation.
 *
 * The monochrome UI cannot lean on red to signal danger, so the weight comes
 * from the explicit question, the description that names the consequence, and
 * the inverted primary button. `--destructive` stays available as a token if
 * that decision is ever reversed.
 */
export default function DeleteDateDialog({
  date,
  loading = false,
  onCancel,
  onConfirm,
}: Props) {
  return (
    <AlertDialog.Root
      open={!!date}
      onOpenChange={(next) => !next && onCancel()}
    >
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="absolute inset-0 bg-black/50" />

        <View className="absolute inset-0 items-center justify-center px-6">
          <SafeDialogContent className="w-full gap-5 rounded-2xl border border-border bg-card p-6">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-secondary">
              <Icon as={Trash2} size={22} className="text-foreground" />
            </View>

            <View className="gap-1.5">
              <AlertDialog.Title className="text-xl font-semibold text-foreground">
                ¿Eliminar esta cita?
              </AlertDialog.Title>
              <Text className="text-sm font-medium text-foreground">
                {date?.title}
              </Text>
              <AlertDialog.Description className="text-sm text-muted-foreground">
                Se quitará de alphadate. Esto no se puede deshacer.
              </AlertDialog.Description>
            </View>

            <View className="flex-row gap-3">
              <Button
                variant="outline"
                size="lg"
                className="flex-1"
                onPress={onCancel}
                disabled={loading}
              >
                <Text>Cancelar</Text>
              </Button>
              <Button
                size="lg"
                className="flex-1"
                onPress={onConfirm}
                disabled={loading}
              >
                <Text>{loading ? "Eliminando..." : "Eliminar"}</Text>
              </Button>
            </View>
          </SafeDialogContent>
        </View>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
