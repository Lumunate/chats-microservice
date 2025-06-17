import { asClass, createContainer, InjectionMode, asValue } from "awilix";
import { PrismaClient } from "@prisma/client";

import { NextAuthAdapter } from "../auth/adapters/nextauth-adapter";

const container = createContainer({
  injectionMode: InjectionMode.CLASSIC,
});

// Register database
const prisma = new PrismaClient();
container.register({
  prisma: asValue(prisma),
});

// Register auth adapters - choose one based on your auth strategy
// For flexibility, we'll expose an interface name so you can swap implementations
container.register({
  IAuthAdapter: asClass(NextAuthAdapter).singleton(), // or CustomAuthAdapter
});

export { container };
