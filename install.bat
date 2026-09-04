@echo off
chcp 65001 >nul
title Antigravity 中文汉化一键部署 / Antigravity Chinese Localization
echo ========================================================
echo   Antigravity 界面中文汉化一键部署工具
echo ========================================================
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0apply_translation.ps1"
pause
