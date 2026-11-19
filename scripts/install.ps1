<#
.SYNOPSIS
  Instala Alify (reproductor musical local, sin red) para el usuario actual. No requiere administrador.

.DESCRIPTION
  1. Consulta el último release de GitHub del repositorio.
  2. Descarga Alify-Portable.exe en %LOCALAPPDATA%\Alify\alify.exe
  3. Crea accesos directos en el Escritorio y el Menú Inicio.
  4. Agrega %LOCALAPPDATA%\Alify al PATH del usuario (comando `alify`).
  5. Lanza la aplicación.

  Única conexión de red: la descarga desde api.github.com / github.com durante la instalación.
  La aplicación en sí nunca usa la red.

.PARAMETER Repo
  Repositorio "usuario/nombre". Por defecto TU_USUARIO/alify (cámbialo al publicar).

.PARAMETER NoLaunch
  No abrir Alify al terminar.

.EXAMPLE
  irm https://raw.githubusercontent.com/TU_USUARIO/alify/main/scripts/install.ps1 | iex
#>
[CmdletBinding()]
param(
    [string]$Repo = $(if ($env:ALIFY_REPO) { $env:ALIFY_REPO } else { "VerVo-Lab/Alify" }),
    [string]$Asset = "Alify-Portable.exe",
    [switch]$NoLaunch
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"   # acelera Invoke-WebRequest
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$InstallDir = Join-Path $env:LOCALAPPDATA "Alify"
$ExePath    = Join-Path $InstallDir "alify.exe"

function Write-Step($msg) { Write-Host "==> $msg" -ForegroundColor Cyan }

try {
    if ($Repo -like "TU_USUARIO/*") {
        throw "Configura el repositorio: usa -Repo usuario/alify o la variable `$env:ALIFY_REPO."
    }

    # 1. Último release
    Write-Step "Buscando el último release de $Repo..."
    $release = Invoke-RestMethod -Uri "https://api.github.com/repos/$Repo/releases/latest" `
        -Headers @{ "User-Agent" = "alify-installer"; "Accept" = "application/vnd.github+json" }
    $asset = $release.assets | Where-Object { $_.name -eq $Asset } | Select-Object -First 1
    if (-not $asset) { throw "El release $($release.tag_name) no contiene '$Asset'." }

    # 2. Descarga (cierra Alify si está abierto para poder actualizar)
    Get-Process -Name "alify" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null
    Write-Step "Descargando Alify $($release.tag_name) ($([math]::Round($asset.size / 1MB, 1)) MB)..."
    $tmp = "$ExePath.download"
    Invoke-WebRequest -Uri $asset.browser_download_url -OutFile $tmp -UseBasicParsing
    Move-Item -Force $tmp $ExePath
    Unblock-File -Path $ExePath -ErrorAction SilentlyContinue

    # 3. Accesos directos
    Write-Step "Creando accesos directos..."
    $shell = New-Object -ComObject WScript.Shell
    $targets = @(
        (Join-Path ([Environment]::GetFolderPath("Desktop")) "Alify.lnk"),
        (Join-Path ([Environment]::GetFolderPath("Programs")) "Alify.lnk")
    )
    foreach ($lnk in $targets) {
        $s = $shell.CreateShortcut($lnk)
        $s.TargetPath       = $ExePath
        $s.WorkingDirectory = $InstallDir
        $s.IconLocation     = "$ExePath,0"
        $s.Description      = "Alify - Música local gratis por siempre"
        $s.Save()
    }

    # 4. PATH del usuario (sin admin)
    Write-Step "Agregando 'alify' al PATH del usuario..."
    $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
    $parts = @($userPath -split ";" | Where-Object { $_ })
    if ($parts -notcontains $InstallDir) {
        [Environment]::SetEnvironmentVariable("Path", (($parts + $InstallDir) -join ";"), "User")
    }
    if (($env:Path -split ";") -notcontains $InstallDir) { $env:Path += ";$InstallDir" }

    Write-Host "Alify instalado en $InstallDir" -ForegroundColor Green
    Write-Host "Datos de usuario (playlists, temas): $InstallDir\webview" -ForegroundColor DarkGray
    Write-Host "Para desinstalar: borra $InstallDir y los accesos directos." -ForegroundColor DarkGray

    # 5. Lanzar
    if (-not $NoLaunch) {
        Write-Step "Abriendo Alify..."
        Start-Process -FilePath $ExePath -WorkingDirectory $InstallDir
    }
}
catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
