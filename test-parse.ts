import { lookupPhoneTruecaller } from "./lib/connectors/phone-lookup";

async function main() {
  process.env.RAPIDAPI_KEY = "2f394821a3msh59cc939947da9a3p13aa73jsn7f710862342d";
  const result1 = await lookupPhoneTruecaller("9999999999");
  console.log("lookupPhoneTruecaller:", result1);
}
main();
