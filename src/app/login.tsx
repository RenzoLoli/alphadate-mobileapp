import { useState } from "react";

import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";

import { useLocalSearchParams, useRouter } from "expo-router";
import {
  CircleCheck,
  Eye,
  EyeOff,
  TriangleAlert,
  X,
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import ThemeToggle from "@/components/theme-toggle";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export type AuthFormErrors = {
  email?: string;
  password?: string;
  form?: string;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const { registered } = useLocalSearchParams<{ registered?: string }>();
  const showRegisteredAlert = registered === "1";

  const router = useRouter();
  const { signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<AuthFormErrors>({});

  function dismissRegisteredAlert() {
    router.setParams({ registered: undefined });
  }

  function validate(): AuthFormErrors {
    const nextErrors: AuthFormErrors = {};

    if (email.trim().length === 0) {
      nextErrors.email = "Enter your email.";
    } else if (!EMAIL_REGEX.test(email.trim())) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (password.length === 0) {
      nextErrors.password = "Enter your password.";
    }

    return nextErrors;
  }

  async function handleSubmit() {
    setIsSubmitting(true);

    try {
      const nextErrors = validate();

      if (Object.keys(nextErrors).length > 0) {
        console.log("nextErrors: ", nextErrors);
        setErrors(nextErrors);
        return;
      }

      await signIn(email.trim(), password);
      console.log("login successful");
      router.push("/");
    } catch (error: any) {
      console.log("error:", JSON.stringify(error));

      // TODO: (HIGH VULNERABILITY) add all errors because if user exists and you submit the error say "incorrect username or password"
      //       but if you submit an incorrect email it says "user not found"
      //       so... it allows you to recognize if an email exists
      const ignoreErrors = ["ResourceNotFoundException"];
      if (!ignoreErrors.includes(error.name)) {
        setErrors({ form: error.message });
      } else {
        setErrors({ form: "Something went wrong" });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="flex-grow justify-center px-6 py-10"
          keyboardShouldPersistTaps="handled"
        >
          <View className="mx-auto w-full max-w-sm gap-8">
            <View className="flex-row items-center justify-between gap-3">
              <View className="min-w-0 flex-1 gap-1.5">
                <Text variant="h3" numberOfLines={1} ellipsizeMode="middle">
                  Sign in
                </Text>
                <Text variant="muted" numberOfLines={2} ellipsizeMode="tail">
                  Enter your email and password to continue.
                </Text>
              </View>

              <ThemeToggle />
            </View>

            {showRegisteredAlert && (
              <Alert icon={CircleCheck} iconClassName="text-primary">
                <View className="flex-row items-start justify-between gap-2">
                  <View className="flex-1 gap-0.5">
                    <AlertTitle>Account created</AlertTitle>
                    <AlertDescription>
                      Your account was created successfully. You can sign in
                      now.
                    </AlertDescription>
                  </View>
                  <Button
                    variant="ghost"
                    size="icon"
                    onPress={dismissRegisteredAlert}
                    accessibilityLabel="Dismiss"
                    className="-mr-2 -mt-1"
                  >
                    <Icon as={X} className="text-muted-foreground" size={16} />
                  </Button>
                </View>
              </Alert>
            )}

            {!!errors.form && (
              <Alert variant="destructive" icon={TriangleAlert}>
                <AlertTitle>We couldn&apos;t sign you in</AlertTitle>
                <AlertDescription>{errors.form}</AlertDescription>
              </Alert>
            )}

            <View className="gap-5">
              <View className="gap-2">
                <Label nativeID="login-email" htmlFor="login-email">
                  Email
                </Label>
                <Input
                  id="login-email"
                  aria-labelledby="login-email"
                  value={email}
                  onChangeText={setEmail}
                  onBlur={() => setErrors(validate())}
                  placeholder="you@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  textContentType="emailAddress"
                  editable={!isSubmitting}
                  aria-invalid={!!errors.email}
                  className={cn("h-12", errors.email && "border-destructive")}
                />
                {!!errors.email && (
                  <Text className="text-sm text-destructive">
                    {errors.email}
                  </Text>
                )}
              </View>

              <View className="gap-2">
                <Label nativeID="login-password" htmlFor="login-password">
                  Password
                </Label>
                <View className="relative justify-center">
                  <Input
                    id="login-password"
                    aria-labelledby="login-password"
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoComplete="password"
                    textContentType="password"
                    editable={!isSubmitting}
                    aria-invalid={!!errors.password}
                    className={cn(
                      "h-12 pr-12",
                      errors.password && "border-destructive"
                    )}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onPress={() => setShowPassword((value) => !value)}
                    accessibilityLabel={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className="absolute right-1"
                  >
                    <Icon
                      as={showPassword ? EyeOff : Eye}
                      className="text-muted-foreground"
                      size={18}
                    />
                  </Button>
                </View>
                {!!errors.password && (
                  <Text className="text-sm text-destructive">
                    {errors.password}
                  </Text>
                )}
              </View>
            </View>

            <Button
              size="lg"
              className="w-full"
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              <Text>{isSubmitting ? "Signing in..." : "Sign in"}</Text>
            </Button>

            <View className="flex-row items-center justify-center gap-1">
              <Text variant="muted" className="text-sm">
                Don&apos;t have an account?
              </Text>
              <Button
                variant="link"
                size="sm"
                onPress={() => router.push("/register")}
              >
                <Text>Sign up</Text>
              </Button>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
