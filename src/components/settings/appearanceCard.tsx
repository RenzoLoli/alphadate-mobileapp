import { Switch } from "react-native";

import { Moon } from "lucide-react-native";

import SettingsRow from "@/components/settings/settingsRow";
import { Card } from "@/components/ui/card";
import { useCustomColorScheme } from "@/hooks/useCustomColorScheme";
import { NAV_THEME } from "@/lib/theme";

export default function AppearanceCard() {
  const { colorScheme, setColorScheme } = useCustomColorScheme();

  const isDark = colorScheme === "dark";
  const theme = NAV_THEME[colorScheme];

  return (
    <Card className="gap-0 py-0">
      <SettingsRow
        icon={Moon}
        title="Modo oscuro"
        description="Usa un tema más oscuro en toda la app"
      >
        <Switch
          value={isDark}
          onValueChange={(value) => setColorScheme(value ? "dark" : "light")}
          trackColor={{
            false: theme.colors.border,
            true: theme.colors.primary,
          }}
          ios_backgroundColor={theme.colors.border}
          accessibilityLabel="Modo oscuro"
        />
      </SettingsRow>
    </Card>
  );
}
