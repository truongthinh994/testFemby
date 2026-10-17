import {PGlite, type Transaction} from '@electric-sql/pglite';
import {readFile, readdir} from 'node:fs/promises';

export const ALICE = '11111111-1111-4111-8111-111111111111';
export const BOB = '22222222-2222-4222-8222-222222222222';

export async function createDatabase(dataDir?: string) {
  const db = new PGlite(dataDir);
  try {
    const {rows} = await db.query<{exists: boolean}>("select to_regclass('auth.users') is not null as exists");
    if (!rows[0].exists) await db.exec(`
      create role anon; create role authenticated;
      create schema auth;
      create table auth.users(id uuid primary key, email text);
      create function auth.uid() returns uuid language sql stable as
        $$ select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
      grant usage on schema public, auth to anon, authenticated;
      insert into auth.users values ('${ALICE}','alice@example.test'),('${BOB}','bob@example.test');
    `);
    await db.exec(`create schema if not exists local_demo;
      revoke all on schema local_demo from public,anon,authenticated;
      create table if not exists local_demo.migrations(name text primary key);`);
    const migrations = new URL('../../supabase/migrations/', import.meta.url);
    for (const file of (await readdir(migrations)).filter(file => file.endsWith('.sql')).sort()) {
      const applied = await db.query('select name from local_demo.migrations where name=$1', [file]);
      if (!applied.rows.length) {
        const sql = await readFile(new URL(file, migrations), 'utf8');
        await db.transaction(async tx => {
          await tx.exec(sql);
          await tx.query('insert into local_demo.migrations(name) values($1)', [file]);
        });
      }
    }
    await db.exec(await readFile(new URL('../../supabase/seed.sql', import.meta.url), 'utf8'));
    return db;
  } catch (error) {
    await db.close();
    throw error;
  }
}

export function asUser<T>(db: PGlite, user: string | null, operation: (tx: Transaction) => Promise<T>, role = 'authenticated') {
  return db.transaction(async tx => {
    await tx.exec('set local role ' + (role === 'anon' ? 'anon' : 'authenticated'));
    await tx.query("select set_config('request.jwt.claim.sub',$1,true)", [user || '']);
    return operation(tx);
  });
}

export async function rpc<T = unknown>(db: PGlite, user: string | null, name: string, args: unknown[] = []) {
  if (!/^[a-z_]+$/.test(name)) throw new Error('Invalid function');
  return asUser(db, user, async tx => {
    const {rows} = await tx.query<{value: T}>(`select public.${name}(${args.map((_, i) => '$' + (i + 1)).join(',')}) as value`, args);
    return rows[0].value;
  });
}
