import { Pressable, View } from "react-native";

import { Moon, Sun } from "lucide-react-native";

import { Icon } from "@/components/ui/icon";
import { useCustomColorScheme } from "@/hooks/useCustomColorScheme";
import { cn } from "@/lib/utils";

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useCustomColorScheme();

  return (
    <Pressable
      onPress={toggleTheme}
      accessibilityLabel={
        isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"
      }
      className="mr-1.5 transition-transform"
    >
      <View
        className={cn(
          "h-10 w-10 items-center justify-center rounded-full border bg-background",
          isDark && "border-white",
          !isDark && "border-black"
        )}
      >
        {isDark ? (
          <Icon as={Moon} size={20} className="text-white" />
        ) : (
          <Icon as={Sun} size={20} className="text-black" />
        )}
      </View>
    </Pressable>
  );
}
