import * as Dialog from "@rn-primitives/dialog";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { cn } from "@/lib/utils";

interface Props extends React.ComponentProps<typeof Dialog.Content> {}

export function SafeDialogContent({ className, style, ...props }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Dialog.Content
      {...props}
      className={cn(className)}
      style={[style, { paddingBottom: insets.bottom + 24 }]}
    />
  );
}
