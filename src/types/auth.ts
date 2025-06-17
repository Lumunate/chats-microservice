
// src/validators/authValidator.ts
import { z } from 'zod';

export const authTokenSchema = z.object({
  token: z.string().min(1, 'Auth token is required')
});