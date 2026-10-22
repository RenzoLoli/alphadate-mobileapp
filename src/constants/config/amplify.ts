import { Amplify } from "aws-amplify";
import { ConsoleLogger } from "aws-amplify/utils";

ConsoleLogger.LOG_LEVEL = "DEBUG";

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolClientId: process.env.EXPO_PUBLIC_COGNITO_CLIENT_ID!,
      userPoolId: process.env.EXPO_PUBLIC_COGNITO_POOL_ID!,

      loginWith: {
        email: true,
      },
    },
  },
});

console.log("Auth configured");
