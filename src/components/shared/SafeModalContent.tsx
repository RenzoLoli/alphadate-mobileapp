import { Modal, type ModalProps, View, type ViewProps } from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";

import { cn } from "@/lib/utils";

interface Props extends ModalProps {
  children: React.ReactNode;
  contentClassName?: string;
  contentStyle?: ViewProps["style"];
  bottomSpacing?: number;
}

export function SafeModalContent({
  children,
  contentClassName,
  contentStyle,
  bottomSpacing = 0,
  ...modalProps
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal transparent animationType="slide" {...modalProps}>
      <View className="flex-1 justify-end bg-black/50">
        {children}
        <View
          className={cn(contentClassName)}
          style={[
            contentStyle,
            { paddingBottom: insets.bottom + bottomSpacing },
          ]}
        />
      </View>
    </Modal>
  );
}
