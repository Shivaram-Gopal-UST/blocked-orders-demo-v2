const fs = require("fs");
const path = require("path");

const appPath = path.join(__dirname, "..", "app.js");
const snapshotPath = path.join(__dirname, "..", "blocked-orders.json");
const outputPath = path.join(__dirname, "..", "_site", "app.js");

const snapshot = fs.readFileSync(snapshotPath, "utf8");
const app = fs.readFileSync(appPath, "utf8");
fs.writeFileSync(outputPath, `window.__BLOCKED_ORDERS__ = ${snapshot};\n${app}`);
console.log(`Embedded ${JSON.parse(snapshot).blockedOrders.length} blocked orders in the Pages app.`);