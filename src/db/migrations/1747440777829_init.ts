import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("bsky_auth_sessions")
    .addColumn("key", "text", (col) => col.primaryKey().notNull().unique())
    .addColumn("session", "text", (col) => col.notNull().notNull())
    .addColumn("created_at", "text", (col) =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`)
    )
    .execute();

  await db.schema
    .createTable("bsky_auth_state")
    .addColumn("key", "text", (col) => col.primaryKey().notNull().unique())
    .addColumn("state", "text", (col) => col.notNull())
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {}
