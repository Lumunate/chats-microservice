import { JwtAuthAdapter } from "./adapters/jwt-adapter";
import { MockAuthAdapter } from "./adapters/mock-adapter";
import { NextAuthAdapter } from "./adapters/nextauth-adapter";

export default function getAuthAdapter() {
  const authProvider = process.env.AUTH_PROVIDER || "jwt";

  switch (authProvider) {
    case "nextauth":
      return new NextAuthAdapter();
    case "mock":
      console.warn(
        "Using MockAuthAdapter. This should only be used for testing purposes."
      );

      return new MockAuthAdapter();
    default:
      return new NextAuthAdapter();
      return new JwtAuthAdapter();
  }
}
