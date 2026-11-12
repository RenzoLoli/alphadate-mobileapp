import { View } from "react-native";

import { LogOut } from "lucide-react-native";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";

export interface AccountInfo {
  email?: string;
  lastConnection?: Date;
}

const MONTHS = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

function formatLastConnection(date: Date): string {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()} · ${hours}:${minutes}`;
}

interface Props {
  account?: AccountInfo;
  loading?: boolean;
  signingOut?: boolean;
  onSignOut: () => void;
}

export default function AccountCard({
  account,
  loading = false,
  signingOut = false,
  onSignOut,
}: Props) {
  const displayName = loading
    ? "Cargando cuenta..."
    : (account?.email ?? "Sesión iniciada");
  const detail = account?.lastConnection
    ? `Última conexión ${formatLastConnection(account.lastConnection)}`
    : "";
  const initial = (account?.email ?? "?").charAt(0).toUpperCase();

  return (
    <Card className="gap-4 py-5">
      <CardHeader className="flex-row items-center gap-4">
        <View className="h-12 w-12 items-center justify-center rounded-full bg-primary">
          <Text className="text-lg font-semibold text-primary-foreground">
            {initial}
          </Text>
        </View>

        <View className="flex-1 gap-0.5">
          <CardTitle className="text-base leading-snug">
            {displayName}
          </CardTitle>
          <CardDescription numberOfLines={1}>{detail}</CardDescription>
        </View>
      </CardHeader>

      <CardFooter>
        <Button
          variant="outline"
          size="lg"
          className="w-full"
          onPress={onSignOut}
          disabled={loading || signingOut}
          accessibilityLabel="Cerrar sesión"
        >
          <Icon as={LogOut} size={16} className="text-destructive" />
          <Text className="text-destructive">
            {signingOut ? "Cerrando sesión..." : "Cerrar sesión"}
          </Text>
        </Button>
      </CardFooter>
    </Card>
  );
}
