# Antigravity 界面中文汉化包 / Antigravity Chinese Localization

[中文](#-中文文档) | [English](#-english-documentation)

---

## 🇨🇳 中文文档

欢迎使用 **Google Antigravity 客户端完整中文化工程与自动化工作流**。  
本项目致力于为 Google Antigravity 提供深度、稳定、无侵入的中文本地化体验，覆盖客户端所有功能板块，并配备一键打包与部署工具。

### 🌟 核心特性

1. **全界面深度汉化**：
   * **全局与项目设置**：模型选择、主题模式、AI 额度、防止睡眠、沙箱规则、网络/终端/文件权限等。
   * **智能体行为与预设**：安全预设文案、审查策略、子智能体说明等。
   * **原生菜单与托盘**：顶部原生主菜单（文件、编辑、查看、窗口、帮助）、系统托盘右键菜单。
   * **系统原生 Toast 通知**：Windows 操作系统级权限弹窗（如终端命令权限、URL 打开权限等）全面中文化。
   * **原生文件弹窗**：文件夹选择窗口（“打开工作区”、“打开多个工作区”）。
   * **交互细节**：右键菜单、悬浮提示（Tooltip）、删除确认弹窗、动态时长转换（天/小时/分/秒）等。
2. **非侵入式 DOM 引擎**：
   * 基于 `MutationObserver` 实时监听并精准替换，无缝兼容页面路由跳转。
   * **代码保护机制**：自动识别并跳过 Monaco 代码编辑器（`.monaco-editor`）、`<pre>`、`<code>`、输入框，绝不修改或破坏用户代码。
3. **极简自动化工作流**：
   * 内置 `install.bat` 与 `apply_translation.ps1`，自动打包、备份、热替换并重启客户端。
   * 支持官方自动更新后的“一键重新适配”。

---

### 🚀 快速安装与使用

#### 方式一：一键双击安装（推荐）
1. 克隆或下载本仓库至本地。
2. 双击运行仓库根目录下的 **`install.bat`**。
3. 脚本会自动完成打包、备份原版文件、部署汉化包并重新拉起 Antigravity，即可进入中文界面！

#### 方式二：PowerShell 命令行部署
在终端或 PowerShell 中进入本项目目录，运行：
```powershell
& ".\apply_translation.ps1"
```
*高级参数*：
* `-NoPack`：跳过编译打包步骤，直接使用现有的 `app.asar` 部署。
* `-NoRestart`：部署完成后不自动拉起客户端。

#### 日常启动
汉化包部署完成后，日常使用**无需重复运行脚本**，直接从**桌面快捷方式**或**开始菜单**启动 Antigravity 即可正常使用全中文界面。

---

### 🛠️ 维护与官方更新应对

Antigravity 具有官方后台静默升级机制。若官方推送更新覆盖了 `resources/app.asar`：
1. **轻微更新（界面重置为英文）**：
   直接再次双击运行 `install.bat`，即可将最新汉化包重新覆盖生效。
2. **架构级大版本升级**（如引入新接口或新桥接服务）：
   * 执行 `npx asar extract "$env:LOCALAPPDATA\Programs\antigravity\resources\app.asar" extracted_official` 提取官方最新源码。
   * 将 `extracted_app/dist/preload.js` 中的汉化引擎和原生汉化变更同步至新版本。
   * 运行 `.\apply_translation.ps1` 重新打包部署。

---

### 📂 项目结构

```
Antigravity汉化/
 ├── extracted_app/           # 已解包的源码库（核心修改点：preload.js, ipcHandlers.js, menu.js）
 ├── apply_translation.ps1    # 自动化打包与热部署脚本（带 UTF-8 BOM，全平台兼容）
 ├── install.bat              # Windows 双击一键部署批处理
 ├── app.asar                 # 预编译生成的最新完整汉化核心包
 ├── all_ui_candidates.json   # 词条扫描与候选映射数据
 ├── clean_candidates.json    # 清洗后的词条池
 └── README.md                # 中英双语说明文档
```

---

## 🇺🇸 English Documentation

Welcome to the **Google Antigravity Chinese Localization Project & Automated Workflow**.  
This project provides a comprehensive, stable, and non-intrusive Chinese translation for the Google Antigravity desktop application, complete with automated build and deployment tooling.

### 🌟 Key Features

1. **Comprehensive UI Localization**:
   * **General & Project Settings**: Model selection, themes, AI credits, keep-awake, sandboxing, network/file/terminal permissions, etc.
   * **Agent Behaviors & Safety Presets**: Review policies, action boundaries, subagent descriptions.
   * **Native Menus & Tray**: Top-level menus (File, Edit, View, Window, Help) and system tray context menus.
   * **Native Windows Toast Notifications**: OS-level toast alerts (e.g. terminal execution permissions, URL opening prompts) fully translated.
   * **Native File Dialogs**: Standard workspace selection dialogs ("Open workspace", "Open workspaces").
   * **Interactive Elements**: Context menus, hover tooltips, deletion confirmation modals, dynamic duration formatting (days/hours/minutes/seconds).
2. **Non-Intrusive DOM Engine**:
   * Powered by `MutationObserver` for real-time translation with zero latency across route navigation.
   * **Code Safety**: Explicitly excludes Monaco editor instances (`.monaco-editor`), `<pre>`, `<code>`, inputs, and textareas to ensure user code remains unaltered.
3. **Automated Deployment Workflow**:
   * One-click installation via `install.bat` or `apply_translation.ps1` with automatic backup, packing, and application reload.
   * Resilient to background application updates.

---

### 🚀 Quick Start & Installation

#### Method 1: One-Click Installation (Recommended)
1. Clone or download this repository.
2. Double-click **`install.bat`** in the repository root.
3. The script will automatically pack `extracted_app`, back up the original `app.asar`, deploy the localized bundle, and restart Antigravity with Chinese UI enabled!

#### Method 2: PowerShell Execution
Open a terminal inside the project directory and run:
```powershell
& ".\apply_translation.ps1"
```
*Supported flags*:
* `-NoPack`: Skip repacking and deploy the pre-built `app.asar` directly.
* `-NoRestart`: Deploy files without restarting the Antigravity client.

#### Everyday Launch
Once deployed, you **do not** need to re-run the script for daily use. Launch Antigravity normally via your **Desktop Shortcut** or the **Windows Start Menu**.

---

### 🛠️ Maintenance & Official Upgrades

Antigravity features automatic silent background updates. If an update replaces `resources/app.asar`:
1. **Minor updates (UI reverts to English)**:
   Simply double-click `install.bat` again to reapply the translation.
2. **Major architectural updates** (e.g. new IPC bridge or core changes):
   * Extract the new package: `npx asar extract "$env:LOCALAPPDATA\Programs\antigravity\resources\app.asar" extracted_official`
   * Merge our translation injector (`preload.js`, `ipcHandlers.js`, `menu.js`) into the updated codebase.
   * Run `.\apply_translation.ps1` to re-pack and deploy.

---

### 📄 License & Disclaimer

* This is an unofficial, community-driven localization project for Google Antigravity.
* Antigravity and its respective trademarks belong to Google.
* Released under the [MIT License](LICENSE).
