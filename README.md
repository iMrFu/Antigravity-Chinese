# Antigravity 界面中文汉化工作流项目

本项目是 Google Antigravity 客户端界面的完整中文化工程资产库与自动化工作流中心。
后续所有 Antigravity 汉化、界面补全及版本适配工作均统一在此项目维护与执行。

---

## 核心审视准则（奥卡姆剃刀与目标对齐）

> **这件事和这个任务的底层目标到底是什么？是真的符合我的目标吗？它真的有价值吗？做这件事真的有意义吗？如无必要，勿增实体。**

* **底层目标**：让使用者在使用 Antigravity IDE / 客户端时，界面语言全面中文化，消除英文障碍，获得最流畅、最沉浸的编程交互体验。
* **极简原则**：避免多重散乱实体，将解包、注入、打包、部署与恢复统摄于统一的工作流脚本中，确保在官方版本升级后能“一键重新对齐”。

---

## 汉化原理与架构设计

Antigravity 是基于 Electron 架构构建的桌面客户端，其界面由两层构成：

```
app.asar (C:\Users\MrFu\AppData\Local\Programs\antigravity\resources\app.asar)
 ├── dist/
 │    ├── menu.js              <- 【原生菜单层】顶部主菜单（文件、编辑、查看、窗口、帮助等）
 │    ├── tray.js              <- 【原生托盘层】系统托盘右键菜单
 │    ├── loadingOverlay.js    <- 【原生加载层】启动 Loading Antigravity 界面
 │    ├── ipcHandlers.js       <- 【原生通信与通知层】系统 Toast 提示（如终端权限请求等）、原生文件选择弹窗
 │    ├── updater.js           <- 【原生更新层】更新下载与安装文案
 │    └── preload.js           <- 【DOM 渲染层】动态注入翻译引擎（核心关键！）
```

### 1. 原生层（Native Layer）
* **顶部主菜单 (`dist/menu.js`)**：直接在 Electron 原生菜单定义中修改为中文。
* **原生通知与弹窗 (`dist/ipcHandlers.js`)**：拦截 `notification:send` 与 `dialog:open-workspace`，将 Windows Toast 权限请求（如终端命令执行、打开网址等）及文件弹窗翻译为中文。

### 2. 动态渲染层（DOM Injection Layer）
* **注入入口 (`dist/preload.js`)**：Antigravity 的主体界面（设置面板、聊天对话流、项目列表）为嵌入的 React Web 界面。
* **双模翻译机制**：
  1. **精确静态词典映射 (`translationMap`)**：毫秒级精准替换标题、标签、按钮与提示文本。
  2. **智能属性翻译**：监控并替换 `title`、`aria-label`、`placeholder`、`data-tooltip`。
  3. **动态正则模式匹配**：支持带变量的时间格式（如 "5 days, 3 hours" $\rightarrow$ "5 天 3 小时"）、含超链接的复合长句等。
  4. **安全保护白名单**：强制跳过 Monaco 编辑器（`monaco-editor`）、`<pre>`、`<code>`、`<input>`、`<textarea>`，坚决不触碰和破坏用户的真实代码与输入内容。
  5. **MutationObserver 实时感知**：监听 DOM 子树与文本变化，无缝覆盖冷启动与动态路由跳转。

---

## 目录结构说明

```
d:\AI\Antigravity\Antigravity汉化\
 ├── extracted_app/           # 已解包的 Antigravity 核心源码库（修改在此进行）
 │    └── dist/
 │         ├── ipcHandlers.js # 系统 Toast 通知与原生弹窗汉化
 │         ├── menu.js        # 原生菜单汉化
 │         └── preload.js     # DOM 动态汉化引擎与词典
 ├── apply_translation.ps1    # 【核心】一键打包、部署、重启自动化脚本
 ├── app.asar                 # 打包生成的汉化核心包
 ├── all_ui_candidates.json   # 界面候选词条分析数据
 ├── clean_candidates.json    # 过滤清洗后的词条池
 ├── extracted_strings.json   # 提取的词条索引
 └── README.md                # 本说明文档
```

---

## 汉化后的应用与日常启动方式

### 方式 A：一键部署与应用（推荐）
在修改了词条或官方推送了版本升级后，直接在 PowerShell 运行：

```powershell
& "d:\AI\Antigravity\Antigravity汉化\apply_translation.ps1"
```

该脚本将自动执行以下完整流水线：
1. **自动打包**：调用 `npx asar pack extracted_app app.asar`，生成最新核心包。
2. **退出进程**：安全终止所有运行中的 Antigravity 进程。
3. **安全备份**：将官方原版 `app.asar` 备份为 `app.asar.bak`。
4. **覆盖部署**：将最新汉化包部署至程序安装目录。
5. **拉起应用**：重新启动 Antigravity，秒级生效。

*参数支持*：
* `-NoPack`：跳过打包步骤，直接使用现有的 `app.asar` 部署。
* `-NoRestart`：部署后不自动启动客户端。

### 方式 B：日常启动
汉化包成功部署后，日常使用**无需重复运行脚本**：
* 直接双击**桌面快捷方式**、**开始菜单图标**即可正常享受全中文环境。
* 或在终端运行：
  ```powershell
  Start-Process "C:\Users\MrFu\AppData\Local\Programs\antigravity\Antigravity.exe"
  ```

---

## 应对官方升级的维护规范

若 Antigravity 发生版本更新，官方安装器可能会重新覆盖 `app.asar`：
1. 若更新后界面恢复为英文，只需重新运行：
   ```powershell
   & "d:\AI\Antigravity\Antigravity汉化\apply_translation.ps1"
   ```
2. 若遇到官方架构升级（类似 v2.1.4 $\rightarrow$ v2.11.0 引入新 Host Bridge 导致的启动异常）：
   * 执行 `npx -y asar extract "C:\Users\MrFu\AppData\Local\Programs\antigravity\resources\app.asar" extracted_official`
   * 将本项目的 `preload.js` 汉化引擎和原生汉化变更同步合并至新版源码中。
   * 重新打包部署即可。

---

## 历史会话溯源

本项目继承并整合了前期两次核心攻坚成果：
* **`4e2716f7-0b6e-4f91-ab64-97a8778a6443`**：确立 Electron + DOM 动态注入技术方案，解决沙箱权限阻断与跨版本启动白屏。
* **`33b14b87-906b-4d37-9f0b-bbd81be9e1a0`**：基于 30+ 轮高频真实使用场景截图，完成深层权限、安全预设、复合长句与下拉菜单的全面汉化与稳定性加固。
