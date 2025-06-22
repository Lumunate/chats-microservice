import axios from "axios";
import { IAuthAdapter } from "../interfaces";

export class NextAuthAdapter implements IAuthAdapter {
  private readonly NEXTAUTH_URL: string;

  constructor(
    nextAuthSecret: string = process.env.NEXTAUTH_SECRET ||
      "your-nextauth-secret",
    nextAuthUrl: string = process.env.NEXTAUTH_URL || "http://localhost:3000"
  ) {
    this.NEXTAUTH_URL = nextAuthUrl;
  }

  async verifyToken(
    token: string
  ): Promise<{ userId: string; isValid: boolean }> {
    try {
      // Try to verify as NextAuth JWT token
      // const { payload } = await jwt.verify(
      //   token,
      //   this.JWT_SECRET_KEY.toString()
      // );

      // // NextAuth JWT payload structure
      // if (payload.sub) {
      //   return {
      //     userId: payload.sub as string,
      //     isValid: true,
      //   };
      // }

      // return { userId: "", isValid: false };

      return await this.verifySessionToken(token);
    } catch (error: unknown) {
      console.error(
        "NextAuth token verification failed:",
        error instanceof Error ? error.message : String(error)
      );

      // If JWT verification fails, try session token verification
      return await this.verifySessionToken(token);
    }
  }

  async verifySessionToken(
    sessionToken: string
  ): Promise<{ userId: string; isValid: boolean }> {
    try {
      // Call NextAuth session endpoint to verify session token
      const response = await axios.get(
        `${this.NEXTAUTH_URL}/api/auth/session`,
        {
          headers: {
            Cookie:
              process.env.NODE_ENV === "development"
                ? `next-auth.session-token=${sessionToken}`
                : `__Secure-next-auth.session-token=${sessionToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      const session = await response.data;

      if (session && session.user && session.user.id) {
        return {
          userId: session.user.id,
          isValid: true,
        };
      }

      return { userId: "", isValid: false };
    } catch (error) {
      console.error(
        "Session token verification failed:",
        error instanceof Error ? error.message : String(error)
      );
      return { userId: "", isValid: false };
    }
  }

  async getUserFromToken(
    token: string
  ): Promise<{ id: string; email: string } | null> {
    try {
      // Try JWT first
      // const { payload } = await jwt.verify(
      //   token,
      //   this.JWT_SECRET_KEY.toString()
      // );

      // if (payload.sub && payload.email) {
      //   return {
      //     id: payload.sub as string,
      //     email: payload.email as string,
      //   };
      // }

      // If JWT doesn't have email, try session endpoint
      return await this.getUserFromSession(token);
    } catch (error) {
      console.error(
        "Failed to get user from JWT:",
        error instanceof Error ? error.message : String(error)
      );

      // Try session token
      return await this.getUserFromSession(token);
    }
  }

  async getUserFromSession(
    sessionToken: string
  ): Promise<{ id: string; email: string } | null> {
    try {
      const response = await fetch(`${this.NEXTAUTH_URL}/api/auth/session`, {
        headers: {
          Cookie:
            process.env.NODE_ENV === "development"
              ? `next-auth.session-token=${sessionToken}`
              : `__Secure-next-auth.session-token=${sessionToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        return null;
      }

      const session = await response.json();

      if (session && session.user && session.user.id && session.user.email) {
        return {
          id: session.user.id,
          email: session.user.email,
        };
      }

      return null;
    } catch (error) {
      console.error(
        "Failed to get user from session:",
        error instanceof Error ? error.message : String(error)
      );
      return null;
    }
  }

  async validateRequest(req: any): Promise<{ userId: string } | null> {
    try {
      let token = null;

      // Check Authorization header (JWT)
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }

      // Check cookies for session token
      if (!token && req.headers.cookie) {
        const cookies = this.parseCookies(req.headers.cookie);
        token =
          cookies["next-auth.session-token"] ||
          cookies["__Secure-next-auth.session-token"];
      }

      if (!token) {
        console.log("No token found in request");
        return null;
      }

      const { userId, isValid } = await this.verifyToken(token);
      console.log("Token validation result:", token, userId, isValid);

      if (!isValid) {
        console.log("Token validation failed");
        return null;
      }

      return { userId };
    } catch (error) {
      console.error(
        "Request validation failed:",
        error instanceof Error ? error.message : String(error)
      );
      return null;
    }
  }

  private parseCookies(cookieHeader: string): Record<string, string> {
    const cookies: Record<string, string> = {};
    cookieHeader.split(";").forEach((cookie) => {
      const [name, value] = cookie.trim().split("=");
      if (name && value) {
        cookies[name] = decodeURIComponent(value);
      }
    });
    return cookies;
  }

  // Method to validate user directly with NextAuth app
  async validateWithNextAuth(token: string): Promise<any> {
    try {
      const response = await fetch(`${this.NEXTAUTH_URL}/api/auth/session`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error(
        "NextAuth validation failed:",
        error instanceof Error ? error.message : String(error)
      );
      return null;
    }
  }
}
