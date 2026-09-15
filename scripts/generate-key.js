const crypto = require("crypto");

const key = crypto.randomBytes(32).toString("hex");

console.log("\n=======================================================");
console.log("Your new secure API Secret Key is:");
console.log(key);
console.log("=======================================================\n");
console.log("Please copy this key and set it in your .dev.vars file");
console.log("and use it when running `npx wrangler secret put API_SECRET_KEY`.\n");
