// Maintenance helper. Credentials are read from stdin, never written to disk.
import { readFile } from "node:fs/promises";
import { createInterface } from "node:readline/promises";

if (process.stdin.isTTY) process.stdin.setRawMode(true);
const input = createInterface({ input: process.stdin, terminal: false });
console.log("Ready for database access JSON on stdin.");
const line = await new Promise((resolve) => input.once("line", resolve));
input.close();
const { token, projectRef = "rivvsywzrmhfqesyervu" } = JSON.parse(line);
const advisor = process.argv[2] === "--security-advisors";
const query = advisor
  ? null
  : process.argv[2]
    ? await readFile(process.argv[2], "utf8")
    : `
select table_name, column_name, data_type from information_schema.columns
where table_schema='public' order by table_name, ordinal_position;
select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies where schemaname='public';`;
const response = await fetch(
  `https://api.supabase.com/v1/projects/${projectRef}/${advisor ? "advisors/security" : "database/query"}`,
  {
    method: advisor ? "GET" : "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    ...(advisor ? {} : { body: JSON.stringify({ query }) }),
  },
);
const result = await response.text();
if (!response.ok) {
  console.error(`Database request failed (${response.status}): ${result}`);
  process.exitCode = 1;
} else console.log(result);
