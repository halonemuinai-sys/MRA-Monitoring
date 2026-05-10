# MRA Agent One-Click Installer
# Script ini akan mem-build aplikasi dan membuat shortcut di Desktop

$projectName = "agent_desktop"
$appDisplayName = "MRA Agent"
$desktopPath = [System.IO.Path]::Combine($env:USERPROFILE, "Desktop")
$shortcutPath = [System.IO.Path]::Combine($desktopPath, "$appDisplayName.lnk")

Write-Host "--- MRA Agent Installer ---" -ForegroundColor Cyan

# 1. Build Aplikasi
Write-Host "Building release executable..." -ForegroundColor Yellow
cd $projectName
flutter build windows --release

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Build failed!" -ForegroundColor Red
    exit
}

# 2. Ambil Path EXE hasil build
$exePath = Join-Path (Get-Location) "build\windows\x64\runner\Release\agent_desktop.exe"
$iconPath = Join-Path (Get-Location) "windows\runner\resources\app_icon.ico"

# 3. Buat Shortcut di Desktop
Write-Host "Creating Desktop shortcut..." -ForegroundColor Yellow
$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $exePath
$shortcut.WorkingDirectory = [System.IO.Path]::GetDirectoryName($exePath)
$shortcut.IconLocation = "$iconPath,0"
$shortcut.Save()

Write-Host "Success! MRA Agent is now installed." -ForegroundColor Green
Write-Host "You can find the '$appDisplayName' icon on your Desktop." -ForegroundColor Green
