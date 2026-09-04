param(
    [switch]$NoPack,
    [switch]$NoRestart
)

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if ([string]::IsNullOrEmpty($ScriptDir)) {
    $ScriptDir = $PSScriptRoot
}
if ([string]::IsNullOrEmpty($ScriptDir)) {
    $ScriptDir = "."
}

$extractedDir = Join-Path $ScriptDir "extracted_app"
$source = Join-Path $ScriptDir "app.asar"
$dest = "C:\Users\MrFu\AppData\Local\Programs\antigravity\resources\app.asar"
$appPath = "C:\Users\MrFu\AppData\Local\Programs\antigravity\Antigravity.exe"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Antigravity 界面中文汉化自动化工作流" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 1. 自动打包（如果存在 extracted_app 并且未指定 -NoPack）
if ((-not $NoPack) -and (Test-Path $extractedDir)) {
    Write-Host "1. 正在将 extracted_app 打包为 app.asar..." -ForegroundColor Yellow
    npx -y asar pack "$extractedDir" "$source"
    if ($LASTEXITCODE -ne 0) {
        Write-Error "错误：asar 打包失败，请检查 Node.js/npx 环境。"
        exit 1
    }
    Write-Host "   打包成功！" -ForegroundColor Green
} else {
    Write-Host "1. 跳过打包（使用已有 app.asar）" -ForegroundColor Gray
}

# 检查源文件是否存在
if (-not (Test-Path $source)) {
    Write-Error "错误：在脚本同级目录下未找到 app.asar 文件 ($source)"
    exit 1
}

Write-Host "2. 正在关闭运行中的 Antigravity 应用程序..." -ForegroundColor Yellow
$proc = Get-Process -Name Antigravity -ErrorAction SilentlyContinue
if ($proc) {
    $proc | Stop-Process -Force
    Start-Sleep -Seconds 2
    Write-Host "   应用已成功关闭。" -ForegroundColor Green
} else {
    Write-Host "   Antigravity 未在运行。" -ForegroundColor Green
}

Write-Host "3. 正在部署汉化文件至程序目录..." -ForegroundColor Yellow
try {
    $backup = $dest + ".bak"
    if (Test-Path $dest) {
        if (-not (Test-Path $backup)) {
            Copy-Item -Path $dest -Destination $backup -Force
            Write-Host "   已备份原文件至 $backup" -ForegroundColor Gray
        }
    }
    Copy-Item -Path $source -Destination $dest -Force
    Write-Host "   中文汉化包已成功部署！" -ForegroundColor Green
} catch {
    Write-Error "错误：复制 app.asar 失败。请确保以管理员身份运行此脚本，或者 Antigravity 进程已完全退出。"
    exit 1
}

if (-not $NoRestart) {
    if (Test-Path $appPath) {
        Write-Host "4. 正在重新启动 Antigravity..." -ForegroundColor Yellow
        Start-Process -FilePath $appPath
        Write-Host "   Antigravity 已重新拉起！" -ForegroundColor Green
    } else {
        Write-Host "   未能在程序目录找到 Antigravity.exe，请手动启动。" -ForegroundColor Yellow
    }
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " 汉化工作流执行完毕，请检查界面语言！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
