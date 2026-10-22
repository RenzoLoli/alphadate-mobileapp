import { Redirect } from "expo-router";

export default function NotFound() {
  const isLoggedIn = true;

  if (isLoggedIn) {
    return <Redirect href="/home" />;
  }

  return <Redirect href="/home" />;
}
