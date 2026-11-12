import { useState } from "react";

import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";

import { useRouter } from "expo-router";
import { Eye, EyeOff, TriangleAlert } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import ThemeToggle from "@/components/theme-toggle";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";
import { useAuth } from "@/hooks/useAuth";
import { saveLastEmail } from "@/lib/services/storage/lastEmailStorage";
import { cn } from "@/lib/utils";

export type AuthFormErrors = {
  email?: string;
  password?: string;
  form?: string;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

export default function Register() {
  const router = useRouter();
  const { signUp } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<AuthFormErrors>({});

  function validate(): AuthFormErrors {
    const nextErrors: AuthFormErrors = {};

    if (email.trim().length === 0) {
      nextErrors.email = "Ingresa tu email.";
    } else if (!EMAIL_REGEX.test(email.trim())) {
      nextErrors.email = "Ingresa un email válido.";
    }

    if (password.length === 0) {
      nextErrors.password = "Ingresa una contraseña.";
    } else if (password.length < MIN_PASSWORD_LENGTH) {
      nextErrors.password = `The password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
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

      await signUp(email.trim(), password);
      // Prefill the login form with the address that was just registered.
      await saveLastEmail(email.trim());
      console.log("register successful");
      router.replace({ pathname: "/login", params: { registered: "1" } });
    } catch (error: any) {
      console.log("error:", error.name);

      // TODO: (HIGH VULNERABILITY) add all errors because if user exists and you submit the error say "incorrect username or password"
      //       but if you submit an incorrect email it says "user not found"
      //       so... it allows you to recognize if an email exists
      const ignoreErrors = [
        "ResourceNotFoundException",
        "InvalidLambdaResponseException",
      ];
      if (!ignoreErrors.includes(error.name)) {
        setErrors({ form: error.message });
      } else {
        setErrors({ form: "Algo salió mal" });
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
                  Crea tu cuenta
                </Text>
                {/* <Text variant="muted" numberOfLines={2} ellipsizeMode="tail"> */}
                {/*   Registra tu email y contraseña para empezar. */}
                {/* </Text> */}
              </View>

              <ThemeToggle />
            </View>

            {!!errors.form && (
              <Alert variant="destructive" icon={TriangleAlert}>
                <AlertTitle>No pudimos crear tu cuenta</AlertTitle>
                <AlertDescription>{errors.form}</AlertDescription>
              </Alert>
            )}

            <View className="gap-5">
              <View className="gap-2">
                <Label nativeID="register-email" htmlFor="register-email">
                  Email
                </Label>
                <Input
                  id="register-email"
                  aria-labelledby="register-email"
                  value={email}
                  onChangeText={setEmail}
                  onBlur={() => setErrors(validate())}
                  placeholder="tu@ejemplo.com"
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
                <Label nativeID="register-password" htmlFor="register-password">
                  Contraseña
                </Label>
                <View className="relative justify-center">
                  <Input
                    id="register-password"
                    aria-labelledby="register-password"
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoComplete="new-password"
                    textContentType="newPassword"
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
                      showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
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
              <Text>{isSubmitting ? "Creando cuenta..." : "Crear cuenta"}</Text>
            </Button>

            <View className="flex-row items-center justify-center gap-1">
              <Text variant="muted" className="text-sm">
                ¿Ya tienes una cuenta?
              </Text>
              <Button
                variant="link"
                size="sm"
                onPress={() => router.push("/login")}
              >
                <Text>Iniciar sesión</Text>
              </Button>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
