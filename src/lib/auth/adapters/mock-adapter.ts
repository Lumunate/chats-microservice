import { Request } from "express";
import { IAuthAdapter } from "../interfaces";

export class MockAuthAdapter implements IAuthAdapter {
  private mockUsers: Map<string, { id: string; email: string }> = new Map();

  constructor() {
    // Add mock users for testing
    this.mockUsers.set("mock-token-user123", {
      id: "user123",
      email: "user123@test.com",
    });
    this.mockUsers.set("mock-token-user456", {
      id: "user456",
      email: "user456@test.com",
    });
    this.mockUsers.set("mock-token-user789", {
      id: "user789",
      email: "user789@test.com",
    });
    this.mockUsers.set("test-token-123", {
      id: "user123",
      email: "user123@test.com",
    });
  }

  async verifyToken(
    token: string
  ): Promise<{ userId: string; isValid: boolean }> {
    // Simulate async operation
    await new Promise((resolve) => setTimeout(resolve, 10));

    const user = this.mockUsers.get(token);
    if (user) {
      return { userId: user.id, isValid: true };
    }

    return { userId: "", isValid: false };
  }

  async getUserFromToken(
    token: string
  ): Promise<{ id: string; email: string } | null> {
    await new Promise((resolve) => setTimeout(resolve, 10));

    return this.mockUsers.get(token) || null;
  }

  async validateRequest(req: Request): Promise<{ userId: string } | null> {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.substring(7);
    const { userId, isValid } = await this.verifyToken(token);

    if (!isValid) {
      return null;
    }

    return { userId };
  }

  // Helper method to add mock tokens for testing
  addMockUser(token: string, user: { id: string; email: string }): void {
    this.mockUsers.set(token, user);
  }
}
