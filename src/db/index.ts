import { DB as Database } from "./schema";
import SQLite from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";

const dialect = new SqliteDialect({
  database: new SQLite("db.sqlite"),
});

export const db = new Kysely<Database>({
  dialect,
});
