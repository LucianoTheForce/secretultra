const postgres = require("postgres");

if (!process.env.POSTGRES_URL) {
  console.error("POSTGRES_URL environment variable is required");
  process.exit(1);
}

const sql = postgres(process.env.POSTGRES_URL, {
  prepare: false,
});

async function main() {
  const query = process.argv[2];
  if (!query) {
    console.error("Usage: node scripts/run-sql.js \"<SQL>\"");
    process.exit(1);
  }

  try {
    const result = await sql.unsafe(query);
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await sql.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
