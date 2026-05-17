import "dotenv/config";

async function main() {
  console.log("Queue worker placeholder");
  console.log("Recommended production stack: BullMQ + Redis");
  console.log("Queues: investigation.create, connector.lookup, ai.correlate, report.export");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
