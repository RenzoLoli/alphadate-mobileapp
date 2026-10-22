import { useColorScheme } from "nativewind";

export type AppColorScheme = "light" | "dark";

export function useCustomColorScheme() {
  const { colorScheme, setColorScheme, toggleColorScheme } = useColorScheme();

  const resolvedColorScheme: AppColorScheme =
    colorScheme === "dark" ? "dark" : "light";

  return {
    colorScheme: resolvedColorScheme,
    isDark: resolvedColorScheme === "dark",
    setColorScheme,
    toggleTheme: toggleColorScheme,
  };
}
