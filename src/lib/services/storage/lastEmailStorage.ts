import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Only the email is remembered, never the password or the session.
 *
 * It lives in AsyncStorage so the login form can prefill after a sign-out and
 * the user does not have to retype it on every sign-in.
 */
const LAST_EMAIL_KEY = "alphadate.auth.lastEmail";

export async function getLastEmail(): Promise<string | undefined> {
  try {
    const value = await AsyncStorage.getItem(LAST_EMAIL_KEY);
    return value ?? undefined;
  } catch {
    // Reading the remembered email is a convenience: never block sign-in.
    return undefined;
  }
}

export async function saveLastEmail(email: string): Promise<void> {
  const value = email.trim();

  if (value.length === 0) {
    return;
  }

  try {
    await AsyncStorage.setItem(LAST_EMAIL_KEY, value);
  } catch {
    // Losing the convenience value must not fail an otherwise valid sign-in.
  }
}

export async function clearLastEmail(): Promise<void> {
  try {
    await AsyncStorage.removeItem(LAST_EMAIL_KEY);
  } catch {
    // Ignored on purpose: the field is already cleared in memory.
  }
}
