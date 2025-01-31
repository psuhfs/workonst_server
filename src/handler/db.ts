import type { Sendable } from "./traits.ts";

import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export class Db<T> implements Sendable {
  private readonly table: any;
  private readonly data: T;

  constructor(table: any, data: T) {
    this.table = table;
    this.data = data;
  }

  async send(): Promise<void | Error> {
    if (!this.table || !this.data) {
      throw new Error("Table and data must be defined before sending");
    }

    this.table.create({ data: this.data });
  }
}
