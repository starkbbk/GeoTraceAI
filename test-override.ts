import { lookupPhoneTruecaller } from "./lib/connectors/phone-lookup";
import { buildPhoneIntelligence } from "./lib/osint/phone-intel";

async function main() {
  const result1 = await lookupPhoneTruecaller("9831012345", "Tony Stark");
  console.log("lookupPhoneTruecaller:", result1);

  const intel = await buildPhoneIntelligence({
    phone: "9831012345",
    customOverrideName: "Tony Stark",
    normalizedPhone: "+919831012345",
    inferredCountry: "IN",
    phoneNationalNumber: "9831012345",
    signals: [],
    confidence: 0.9,
    authorizationAccepted: true
  });
  console.log("buildPhoneIntelligence:", intel);
}
main();
