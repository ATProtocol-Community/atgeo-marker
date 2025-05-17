import { defineConfig } from "kysely-ctl";
import SQLite from "better-sqlite3";

export default defineConfig({
  dialect: "better-sqlite3",
  dialectConfig: {
    database: new SQLite("db.sqlite"),
  },
  migrations: {
    migrationFolder: "src/db/migrations",
  },
});
