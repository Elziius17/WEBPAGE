import { execSync } from "node:child_process";
import { Client } from "pg";

/**
 * Prepara la base de pruebas: aplica migraciones (no destructivo) y vacía las tablas.
 * Por seguridad, solo actúa si el nombre de la base termina en "_test".
 */
export default async function setup() {
  const url =
    process.env.DATABASE_URL_TEST ??
    "postgresql://elziius:elziius_dev@localhost:5432/elziius_test?schema=public";
  const dbName = new URL(url).pathname.replace("/", "");
  if (!dbName.endsWith("_test"))
    throw new Error(`La base de pruebas debe terminar en "_test" (recibido: ${dbName})`);
  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: url },
  });
  const client = new Client({ connectionString: url });
  await client.connect();
  const { rows } = await client.query<{ tablename: string }>(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`,
  );
  if (rows.length)
    await client.query(
      `TRUNCATE ${rows.map((r) => `"${r.tablename}"`).join(", ")} RESTART IDENTITY CASCADE`,
    );
  await client.end();
}
