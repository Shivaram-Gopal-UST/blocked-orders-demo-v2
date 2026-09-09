# GitHub Pages data flow

GitHub Pages cannot run `server.js` or use secrets at browser runtime. The deployment workflow therefore fetches blocked orders during the GitHub Actions build with `SAP_USERNAME` and `SAP_PASSWORD`, then publishes `data/blocked-orders.json` with the static site.

Configure both secrets in the repository under **Settings > Secrets and variables > Actions**. Each deployment refreshes the published snapshot. Local development continues to use the credential-protected `/api/orders` endpoint.

The SAP host currently uses a certificate that is not trusted by the GitHub runner, so the workflow enables TLS certificate bypass only for this build-time request. Replace that certificate with a trusted certificate before using this workflow for production data.