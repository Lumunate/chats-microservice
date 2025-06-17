import { IAuthAdapter } from "../interfaces";
import jwt from "jsonwebtoken";

export class JwtAuthAdapter implements IAuthAdapter {
  private jwtSecret: string;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || "default-secret";
  }

  async verifyToken(
    token: string
  ): Promise<{ userId: string; isValid: boolean }> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as any;
      return {
        userId: decoded.userId || decoded.sub || decoded.id,
        isValid: true,
      };
    } catch (error) {
      return { userId: "", isValid: false };
    }
  }

  async getUserFromToken(
    token: string
  ): Promise<{ id: string; email: string } | null> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as any;
      return {
        id: decoded.userId || decoded.sub || decoded.id,
        email: decoded.email,
      };
    } catch (error) {
      return null;
    }
  }

  async validateRequest(req: any): Promise<{ userId: string } | null> {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.substring(7);
    const { userId, isValid } = await this.verifyToken(token);

    console.log("Authorization Header:", authHeader, isValid);

    if (!isValid) {
      return null;
    }

    return { userId };
  }
}
