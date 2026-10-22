import { useEffect, useState } from "react";

import { View } from "react-native";

import { fetchAuthSession } from "aws-amplify/auth";
import { TriangleAlert, X } from "lucide-react-native";

import AboutCard from "@/components/settings/aboutCard";
import AccountCard, { AccountInfo } from "@/components/settings/accountCard";
import AppearanceCard from "@/components/settings/appearanceCard";
import ScreenLayout from "@/components/shared/ScreenLayout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { useAuth } from "@/hooks/useAuth";

function readAuthTime(payload?: { [key: string]: any }): number | undefined {
  if (typeof payload?.auth_time === "number") {
    return payload.auth_time;
  }

  if (typeof payload?.iat === "number") {
    return payload.iat;
  }

  return undefined;
}

export default function Settings() {
  const { signOut } = useAuth();

  const [account, setAccount] = useState<AccountInfo>();
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    let active = true;

    async function loadAccount() {
      try {
        const session = await fetchAuthSession();
        const idPayload = session.tokens?.idToken?.payload;
        const authTime =
          readAuthTime(session.tokens?.accessToken?.payload) ??
          readAuthTime(session.tokens?.idToken?.payload);

        if (active) {
          setAccount({
            email:
              typeof idPayload?.email === "string"
                ? idPayload.email
                : undefined,
            lastConnection: authTime ? new Date(authTime * 1000) : undefined,
          });
        }
      } catch (loadError: any) {
        console.log("loadAccount error:", loadError);

        if (active) {
          setError("Could not load your account.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadAccount();

    return () => {
      active = false;
    };
  }, []);

  async function handleSignOut() {
    setSigningOut(true);
    setError(undefined);

    try {
      await signOut();
    } catch (signOutError: any) {
      console.log("signOut error:", signOutError);
      setError("Could not sign out. Please try again.");
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <ScreenLayout scroll>
      <View className="gap-6 pb-6">
        <View className="gap-1.5">
          <Text variant="h3">Settings</Text>
          <Text variant="muted">Manage your account and app preferences.</Text>
        </View>

        {!!error && (
          <Alert variant="destructive" icon={TriangleAlert}>
            <View className="flex-row items-start justify-between gap-2">
              <View className="flex-1 gap-0.5">
                <AlertTitle>Something went wrong</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </View>
              <Button
                variant="ghost"
                size="icon"
                onPress={() => setError(undefined)}
                accessibilityLabel="Dismiss"
                className="-mr-2 -mt-1"
              >
                <Icon as={X} className="text-muted-foreground" size={16} />
              </Button>
            </View>
          </Alert>
        )}

        <AccountCard
          account={account}
          loading={loading}
          signingOut={signingOut}
          onSignOut={handleSignOut}
        />

        <View className="gap-2">
          <Text
            variant="muted"
            className="text-xs font-medium uppercase tracking-wider"
          >
            Appearance
          </Text>
          <AppearanceCard />
        </View>

        <View className="gap-2">
          <Text
            variant="muted"
            className="text-xs font-medium uppercase tracking-wider"
          >
            About
          </Text>
          <AboutCard />
        </View>
      </View>
    </ScreenLayout>
  );
}
