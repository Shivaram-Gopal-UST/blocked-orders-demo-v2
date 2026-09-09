const fs = require("fs");
const path = require("path");

const sapServiceUrl = "https://s4hanadev.eastus2.cloudapp.azure.com:44300/sap/opu/odata/sap/API_SALES_ORDER_SRV";
const query = new URLSearchParams({
  "$filter": "(OverallSDDocumentRejectionSts eq 'B' or OverallSDDocumentRejectionSts eq 'C' or DeliveryBlockReason ne '' or HeaderBillingBlockReason ne '')",
  "$select": "SalesOrder,SoldToParty,TotalNetAmount,TransactionCurrency,OverallSDDocumentRejectionSts,DeliveryBlockReason,HeaderBillingBlockReason",
  "$format": "json"
}).toString();

if (!process.env.SAP_USERNAME || !process.env.SAP_PASSWORD) {
  throw new Error("SAP_USERNAME and SAP_PASSWORD are required.");
}

async function fetchOrders() {
  const authorization = Buffer.from(`${process.env.SAP_USERNAME}:${process.env.SAP_PASSWORD}`).toString("base64");
  const response = await fetch(`${sapServiceUrl}/A_SalesOrder?${query}`, {
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${authorization}`
    }
  });

  if (!response.ok) {
    throw new Error(`SAP returned HTTP ${response.status}.`);
  }

  const payload = await response.json();
  const orders = (payload.d?.results || payload.value || []).map((order) => ({
    id: order.SalesOrder,
    customer: order.SoldToParty || "Unknown customer",
    amount: Number(order.TotalNetAmount || 0),
    currency: order.TransactionCurrency || "",
    reason: ["B", "C"].includes(order.OverallSDDocumentRejectionSts)
      ? `Document rejection: ${order.OverallSDDocumentRejectionSts}`
      : order.DeliveryBlockReason
        ? `Delivery block: ${order.DeliveryBlockReason}`
        : `Billing block: ${order.HeaderBillingBlockReason}`
  }));

  const outputPath = path.join(__dirname, "..", "data", "blocked-orders.json");
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify({ blockedOrders: orders }));
  console.log(`Wrote ${orders.length} blocked orders to ${outputPath}`);
}

fetchOrders().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});