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
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function formatLastConnection(date: Date): string {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()} · ${hours}:${minutes}`;
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
    ? "Loading account..."
    : (account?.email ?? "Signed in user");
  const detail = account?.lastConnection
    ? `Last connection ${formatLastConnection(account.lastConnection)}`
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
          accessibilityLabel="Sign out"
        >
          <Icon as={LogOut} size={16} className="text-destructive" />
          <Text className="text-destructive">
            {signingOut ? "Signing out..." : "Sign out"}
          </Text>
        </Button>
      </CardFooter>
    </Card>
  );
}
