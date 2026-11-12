import Constants from "expo-constants";
import { Heart, Info } from "lucide-react-native";

import SettingsRow, {
  SettingsDivider,
} from "@/components/settings/settingsRow";
import { Card } from "@/components/ui/card";

const appVersion = Constants.expoConfig?.version ?? "1.0.0";

export default function AboutCard() {
  return (
    <Card className="gap-0 py-0">
      <SettingsRow icon={Info} title="Versión" value={appVersion} />
      <SettingsDivider />
      <SettingsRow
        icon={Heart}
        title="Alphadate"
        description="Tu alfabeto de citas"
      />
    </Card>
  );
}
