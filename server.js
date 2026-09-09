const http = require("http");
const fs = require("fs");
const path = require("path");

const port = Number(process.env.PORT || 8080);
const sapServiceUrl = "https://s4hanadev.eastus2.cloudapp.azure.com:44300/sap/opu/odata/sap/API_SALES_ORDER_SRV";
const blockedOrdersQuery = "$filter=OverallSDDocumentRejectionSts ne '' or DeliveryBlockReason ne '' or BillingBlockReason ne ''&$select=SalesOrder,SoldToParty,TotalNetAmount,TransactionCurrency,OverallSDDocumentRejectionSts,DeliveryBlockReason,BillingBlockReason&$format=json";

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { "Content-Type": "application/json" });
  response.end(JSON.stringify(payload));
}

async function getBlockedOrders(response) {
  if (!process.env.SAP_USERNAME || !process.env.SAP_PASSWORD) {
    sendJson(response, 500, { error: "SAP_USERNAME and SAP_PASSWORD must be set in the server environment." });
    return;
  }

  const requestUrl = `${sapServiceUrl}/A_SalesOrder?${blockedOrdersQuery}`;
  const authorization = Buffer.from(`${process.env.SAP_USERNAME}:${process.env.SAP_PASSWORD}`).toString("base64");

  try {
    const sapResponse = await fetch(requestUrl, {
      headers: {
        Accept: "application/json",
        Authorization: `Basic ${authorization}`
      }
    });

    if (!sapResponse.ok) {
      sendJson(response, sapResponse.status, { error: `SAP returned HTTP ${sapResponse.status}.` });
      return;
    }

    const payload = await sapResponse.json();
    const orders = (payload.d?.results || payload.value || []).map((order) => ({
      id: order.SalesOrder,
      customer: order.SoldToParty || "Unknown customer",
      amount: Number(order.TotalNetAmount || 0),
      currency: order.TransactionCurrency || "",
      reason: order.OverallSDDocumentRejectionSts
        ? `Document rejection: ${order.OverallSDDocumentRejectionSts}`
        : order.DeliveryBlockReason
          ? `Delivery block: ${order.DeliveryBlockReason}`
          : `Billing block: ${order.BillingBlockReason}`
    }));

    sendJson(response, 200, { blockedOrders: orders });
  } catch (error) {
    sendJson(response, 502, { error: "Could not reach the SAP system." });
  }
}

function serveFile(request, response) {
  const requestedPath = request.url === "/" ? "/index.html" : request.url;
  const filePath = path.join(__dirname, requestedPath);
  const contentTypes = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css" };

  if (!filePath.startsWith(__dirname) || !fs.existsSync(filePath)) {
    response.writeHead(404);
    response.end("Not found");
    return;
  }

  response.writeHead(200, { "Content-Type": contentTypes[path.extname(filePath)] || "application/octet-stream" });
  fs.createReadStream(filePath).pipe(response);
}

const server = http.createServer((request, response) => {
  if (request.url === "/api/orders") {
    getBlockedOrders(response);
    return;
  }

  serveFile(request, response);
});

server.listen(port, () => {
  console.log(`Blocked Orders app running at http://localhost:${port}`);
});