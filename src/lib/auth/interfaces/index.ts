export interface IAuthAdapter {
  verifyToken(token: string): Promise<{ userId: string; isValid: boolean }>;
  getUserFromToken(
    token: string
  ): Promise<{ id: string; email: string } | null>;
  validateRequest(req: any): Promise<{ userId: string } | null>;
}
