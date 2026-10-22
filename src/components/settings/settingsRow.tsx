import { View } from "react-native";

import type { LucideIcon } from "lucide-react-native";

import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";

interface Props {
  icon: LucideIcon;
  title: string;
  description?: string;
  value?: string;
  children?: React.ReactNode;
}

export default function SettingsRow({
  icon,
  title,
  description,
  value,
  children,
}: Props) {
  return (
    <View className="flex-row items-center gap-3 px-5 py-3.5">
      <View className="h-9 w-9 items-center justify-center rounded-lg bg-muted">
        <Icon as={icon} size={16} className="text-muted-foreground" />
      </View>

      <View className="flex-1 gap-0.5">
        <Text className="text-sm font-medium">{title}</Text>
        {!!description && (
          <Text variant="muted" className="text-xs">
            {description}
          </Text>
        )}
      </View>

      {!!value && (
        <Text variant="muted" className="text-sm">
          {value}
        </Text>
      )}

      {children}
    </View>
  );
}

export function SettingsDivider() {
  return <View className="ml-[52px] h-px bg-border" />;
}
