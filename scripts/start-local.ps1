$ErrorActionPreference = "Stop"

$credential = Get-Credential -Message "Enter the read-only SAP credentials for this local test"
if ($null -eq $credential) {
  throw "SAP credentials are required to start the local server."
}

$passwordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($credential.Password)
try {
  $env:SAP_USERNAME = $credential.UserName
  $env:SAP_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPointer)
  $env:NODE_TLS_REJECT_UNAUTHORIZED = "0"

  Write-Host "Starting the SAP proxy at http://localhost:8080"
  Write-Host "Credentials are held only for this process and are not written to disk."
  Write-Host "Local test mode accepts the SAP host certificate; use a trusted certificate in production."
  & npm.cmd start
  if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
  }
}
finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer)
  Remove-Item Env:SAP_USERNAME -ErrorAction SilentlyContinue
  Remove-Item Env:SAP_PASSWORD -ErrorAction SilentlyContinue
  Remove-Item Env:NODE_TLS_REJECT_UNAUTHORIZED -ErrorAction SilentlyContinue
}