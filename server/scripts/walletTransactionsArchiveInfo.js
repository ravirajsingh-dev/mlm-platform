/**
 * Read-only sizing for old wallet_transactions (no writes, no deletes).
 * From server directory: node scripts/walletTransactionsArchiveInfo.js
 *
 * Env: MONGO_URI (required), ARCHIVE_AGE_DAYS (default 90)
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const mongoose = require("mongoose");

const ARCHIVE_AGE_DAYS = Number(process.env.ARCHIVE_AGE_DAYS) || 90;

async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("MONGO_URI is required");
    process.exit(1);
  }

  await mongoose.connect(uri, { maxPoolSize: 2, minPoolSize: 0 });
  const cutoff = new Date(Date.now() - ARCHIVE_AGE_DAYS * 24 * 60 * 60 * 1000);
  const coll = mongoose.connection.collection("wallet_transactions");
  const [olderThanCutoff, estimatedTotal] = await Promise.all([
    coll.countDocuments({ createdAt: { $lt: cutoff } }),
    coll.estimatedDocumentCount(),
  ]);

  console.log(
    JSON.stringify(
      {
        cutoffIso: cutoff.toISOString(),
        archiveAgeDays: ARCHIVE_AGE_DAYS,
        olderThanCutoff,
        estimatedCollectionTotal: estimatedTotal,
        note:
          "Read-only. Plan archival/TTL separately; do not delete without an explicit ops decision.",
      },
      null,
      2
    )
  );

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
