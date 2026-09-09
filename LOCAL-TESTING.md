# Local SAP testing

Start the app with a secure interactive prompt:

```powershell
npm run start:local
```

Enter the read-only SAP username and password when prompted. The launcher passes them to `server.js` as process environment variables, does not write them to a file, and removes them when the server exits. Local mode also allows the current SAP host certificate, which is not trusted by this machine; use a trusted certificate in production.

Open <http://localhost:8080> and use **Refresh** to request the blocked orders from SAP.

For non-interactive environments, set `SAP_USERNAME` and `SAP_PASSWORD` in the process environment before running `npm start`. Never commit those values or put them in `.env` files.