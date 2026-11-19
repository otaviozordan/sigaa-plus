# Publica uma versão nova do SIGAA+ no GitHub.
# Uso: aumente "version" em extensao/manifest.json, depois rode:  .\publicar.ps1 "o que mudou"
param([string]$Notas = "")
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
$gh = (Get-Command gh -ErrorAction SilentlyContinue).Source
if (-not $gh) { $gh = "C:\Program Files\GitHub CLI\gh.exe" }

$versao = (Get-Content extensao/manifest.json -Raw | ConvertFrom-Json).version
& $gh release view "v$versao" *> $null
if ($LASTEXITCODE -eq 0) { throw "A versão $versao já foi publicada. Aumente 'version' em extensao/manifest.json." }

git add -A
git diff --cached --quiet
if ($LASTEXITCODE -ne 0) { git commit -m "SIGAA+ $versao" }
git push

Remove-Item sigaa-plus.zip -ErrorAction SilentlyContinue
git archive --format=zip -o sigaa-plus.zip HEAD extensao LEIA-ME.txt
if ($Notas) { & $gh release create "v$versao" sigaa-plus.zip --title "SIGAA+ $versao" --notes $Notas }
else { & $gh release create "v$versao" sigaa-plus.zip --title "SIGAA+ $versao" --generate-notes }
Write-Host "Publicado: SIGAA+ $versao. As extensões instaladas vão mostrar o aviso de atualização em até 6 h."
