# Packt die Erweiterung als .xpi nach dist/ (zum Hochladen bei addons.mozilla.org)
$ErrorActionPreference = "Stop"
$version = (Get-Content "$PSScriptRoot\extension\manifest.json" -Raw | ConvertFrom-Json).version
$dist = "$PSScriptRoot\dist"
New-Item -ItemType Directory -Force $dist | Out-Null
$zip = "$dist\reddit-nur-text-$version.zip"
Push-Location "$PSScriptRoot\extension"
try { & "$env:SystemRoot\System32\tar.exe" -a -c -f $zip * } finally { Pop-Location }
Move-Item -Force $zip "$dist\reddit-nur-text-$version.xpi"
Write-Host "Erstellt: dist\reddit-nur-text-$version.xpi"
