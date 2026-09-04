"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Preload script — runs in every BrowserWindow before the page loads.
 * Exposes a minimal, secure API via contextBridge so the renderer can
 * communicate with the main-process auto-updater without nodeIntegration.
 */
const electron_1 = require("electron");
const updaterAPI = {
    onStateChanged: (callback) => {
        const handler = (_event, state) => {
            callback(state);
        };
        electron_1.ipcRenderer.on('updater:state-changed', handler);
        // Return unsubscribe function
        return () => {
            electron_1.ipcRenderer.removeListener('updater:state-changed', handler);
        };
    },
    applyUpdate: () => electron_1.ipcRenderer.invoke('updater:apply'),
    quitAndInstall: () => electron_1.ipcRenderer.invoke('updater:quit-and-install'),
    checkForUpdates: () => electron_1.ipcRenderer.invoke('updater:check-for-updates'),
    getState: () => electron_1.ipcRenderer.invoke('updater:get-state'),
};
const dialogAPI = {
    showOpenDialog: () => electron_1.ipcRenderer.invoke('dialog:open-workspace'),
    showOpenMultipleFolderDialog: () => electron_1.ipcRenderer.invoke('dialog:open-workspaces'),
};
const notificationAPI = {
    send: (options) => electron_1.ipcRenderer.invoke('notification:send', options),
    openSystemPreferences: () => electron_1.ipcRenderer.invoke('notification:open-system-preferences'),
    onClicked: (callback) => {
        const handler = (_event, payload) => {
            callback(payload);
        };
        electron_1.ipcRenderer.on('notification:clicked', handler);
        return () => {
            electron_1.ipcRenderer.removeListener('notification:clicked', handler);
        };
    },
};
const storageAPI = {
    getItems: () => electron_1.ipcRenderer.invoke('storage:get-items'),
    updateItems: (changes) => electron_1.ipcRenderer.invoke('storage:update-items', changes),
    onChanged: (callback) => {
        const handler = (_event, changes) => {
            callback(changes);
        };
        electron_1.ipcRenderer.on('storage:changed', handler);
        return () => {
            electron_1.ipcRenderer.removeListener('storage:changed', handler);
        };
    },
};
const logsAPI = {
    getElectronLogs: () => electron_1.ipcRenderer.invoke('logs:electron'),
};
const extensionsAPI = {
    sendAuthorities: (authoritiesMap) => electron_1.ipcRenderer.invoke('extensions:send-authorities', authoritiesMap),
};
const deepLinkAPI = {
    onDeepLink: (callback) => {
        const handler = (_event, url) => {
            callback(url);
        };
        electron_1.ipcRenderer.on('deep-link', handler);
        return () => {
            electron_1.ipcRenderer.removeListener('deep-link', handler);
        };
    },
    getStoredDeepLink: () => electron_1.ipcRenderer.invoke('deep-link:get-stored'),
};
const agentAPI = {
    updateActiveAgentCount: (count) => electron_1.ipcRenderer.invoke('agent:update-active-count', count),
};
const electronNativeAPI = {
    getZoomLevel: () => electron_1.webFrame.getZoomFactor(),
    setTitleBarOverlay: (options) => electron_1.ipcRenderer.invoke('window:set-title-bar-overlay', options),
    minimize: () => electron_1.ipcRenderer.invoke('window:minimize'),
    maximize: () => electron_1.ipcRenderer.invoke('window:maximize'),
    unmaximize: () => electron_1.ipcRenderer.invoke('window:unmaximize'),
    isMaximized: () => electron_1.ipcRenderer.invoke('window:is-maximized'),
    close: () => electron_1.ipcRenderer.invoke('window:close'),
    toggleDevTools: () => electron_1.ipcRenderer.invoke('window:toggle-devtools'),
    zoomIn: () => {
        void electron_1.ipcRenderer.invoke('window:zoom-in');
    },
    zoomOut: () => {
        void electron_1.ipcRenderer.invoke('window:zoom-out');
    },
    resetZoom: () => {
        void electron_1.ipcRenderer.invoke('window:reset-zoom');
    },
    openExternal: (url) => electron_1.ipcRenderer.invoke('shell:open-external', url),
    revealInFilePicker: (path) => electron_1.ipcRenderer.invoke('shell:reveal-in-file-picker', path),
};
const ideAPI = {
    isInstalled: () => electron_1.ipcRenderer.invoke('ide:is-installed'),
};
electron_1.contextBridge.exposeInMainWorld('electronUpdater', updaterAPI);
electron_1.contextBridge.exposeInMainWorld('dialog', dialogAPI);
electron_1.contextBridge.exposeInMainWorld('nativeNotifications', notificationAPI);
electron_1.contextBridge.exposeInMainWorld('nativeStorage', storageAPI);
electron_1.contextBridge.exposeInMainWorld('logs', logsAPI);
electron_1.contextBridge.exposeInMainWorld('extensions', extensionsAPI);
electron_1.contextBridge.exposeInMainWorld('deepLink', deepLinkAPI);
electron_1.contextBridge.exposeInMainWorld('agent', agentAPI);
electron_1.contextBridge.exposeInMainWorld('electronNative', electronNativeAPI);
electron_1.contextBridge.exposeInMainWorld('ide', ideAPI);

// DOM Translation Injector to localize the embedded React frontend settings and labels to Chinese.
(() => {
    const translationMap = {
        // --- Common & Global Actions ---
        'Settings': '设置',
        'Model Selection': '模型选择',
        'Theme Mode': '主题模式',
        'Use AI Credits': '使用 AI 额度',
        'Run in background': '后台运行',
        'Run in Background': '后台运行',
        'Keep computer awake': '防止电脑睡眠',
        'Keep Computer Awake': '防止电脑睡眠',
        'System Default': '跟随系统',
        'Inherit': '跟随系统',
        'THEME_MODE_INHERIT': '跟随系统',
        'THEME_MODE_LIGHT': '浅色',
        'THEME_MODE_DARK': '深色',
        'Light': '浅色',
        'Dark': '深色',
        'Open Workspace': '打开工作区',
        'Open workspace': '打开工作区',
        'Open Folder': '打开文件夹',
        'Open folder': '打开文件夹',
        'Add Folder': '添加文件夹',
        'Add folder': '添加文件夹',
        'Remove Folder': '移除文件夹',
        'Remove folder': '移除文件夹',
        'Select Folder': '选择文件夹',
        'Select File': '选择文件',
        'New Project': '新建项目',
        'No Workspace Open': '未打开工作区',
        'No Project Selected': '未选择项目',
        'Workspace Settings': '工作区设置',
        'Project Settings': '项目设置',
        'Recent Projects': '最近项目',
        'Recent Conversations': '最近对话',
        'Clear Recent': '清除最近记录',
        'New Window': '新建窗口',
        'Check for Updates': '检查更新',
        'Check for updates': '检查更新',
        'No agents running': '没有运行中的智能体',
        'Open Antigravity': '打开 Antigravity',
        'Quit': '退出',
        'Cancel': '取消',
        'Model': '模型',
        'Credits': '额度',
        'Usage': '使用量',
        'Workspace': '工作区',
        'General': '通用',
        'Appearance': '外观',
        'Advanced': '高级',
        'Theme': '主题',
        'Background': '背景',
        'Foreground': '前景',
        'Accent': '强调色',
        'Accent Color': '强调色',
        'Accent color': '强调色',
        'Border': '边框',
        'Border Color': '边框颜色',
        'Border color': '边框颜色',
        'Font Size': '字体大小',
        'Small': '小',
        'Medium': '中',
        'Large': '大',
        'Execution': '执行',
        'Queue': '排队',
        'Send Immediately': '立即发送',
        'Send immediately': '立即发送',
        'Narrow': '紧凑',
        'Wide': '宽松',
        'Standard': '标准',
        'On': '开启',
        'Off': '关闭',
        'Enabled': '已启用',
        'Disabled': '已禁用',
        'Yes': '是',
        'No': '否',
        'Close': '关闭',
        'Close All': '全部关闭',
        'Close Others': '关闭其他',
        'Close to the Right': '关闭右侧',
        'Save': '保存',
        'Save All': '全部保存',
        'Save As...': '另存为...',
        'Reset': '重置',
        'Apply': '应用',
        'Ok': '确定',
        'OK': '确定',
        'Submit': '提交',
        'Submit (Enter)': '提交 (Enter)',
        'Skip': '跳过',
        'Record Audio': '录制音频',
        'Delete Project': '删除项目',
        'Select Project': '选择项目',
        'Ask anything, @ to mention, / for actions': '输入任何问题，输入 @ 提及，输入 / 执行操作',
        'Message Antigravity...': '给 Antigravity 发送消息...',
        'Type a message...': '输入消息...',
        'Send': '发送',
        'Send message': '发送消息',
        'Send Message': '发送消息',
        'Stop Generating': '停止生成',
        'Stop generating': '停止生成',
        'Stop agent': '停止智能体',
        'Stop Agent': '停止智能体',
        'Stop task': '停止任务',
        'Stop Task': '停止任务',
        'Copy Code': '复制代码',
        'Copy code': '复制代码',
        'Copied to clipboard': '已复制到剪贴板',
        'Accept Changes': '接受更改',
        'Accept changes': '接受更改',
        'Reject Changes': '拒绝更改',
        'Reject changes': '拒绝更改',
        'Apply Changes': '应用更改',
        'Apply changes': '应用更改',
        'Keep Changes': '保留更改',
        'Keep changes': '保留更改',
        'Revert Changes': '还原更改',
        'Revert changes': '还原更改',
        'Discard Changes': '放弃更改',
        'Discard changes': '放弃更改',
        'Pin Conversation': '置顶对话',
        'Pin conversation': '置顶对话',
        'Unpin Conversation': '取消置顶',
        'Unpin conversation': '取消置顶',
        'Rename Conversation': '重命名对话',
        'Rename conversation': '重命名对话',
        'Delete Conversation': '删除对话',
        'Delete conversation': '删除对话',
        'Export Conversation': '导出对话',
        'Export conversation': '导出对话',
        'Share Conversation': '分享对话',
        'Share conversation': '分享对话',
        'Clear Chat': '清空聊天',
        'Clear chat': '清空聊天',
        'New Conversation in Project': '在项目中新建对话',
        'New conversation in project': '在项目中新建对话',
        'Display Options': '显示选项',
        'Display options': '显示选项',
        'Display Options Menu': '显示选项菜单',
        'Toggle Sidebar': '切换侧边栏',
        'Toggle sidebar': '切换侧边栏',
        'Close Sidebar': '关闭侧边栏',
        'Close sidebar': '关闭侧边栏',
        'Open Sidebar': '打开侧边栏',
        'Open sidebar': '打开侧边栏',
        'Collapse all folders': '折叠所有文件夹',
        'Collapse All Folders': '折叠所有文件夹',
        'Expand all folders': '展开所有文件夹',
        'Expand All Folders': '展开所有文件夹',
        'Filter projects': '筛选项目',
        'Filter Projects': '筛选项目',
        'Add Project': '添加项目',
        'Add project': '添加项目',
        'Refresh projects': '刷新项目',
        'Refresh Projects': '刷新项目',
        'Attach Media': '添加附件',
        'Attach media': '添加附件',
        'Add Attachment': '添加附件',
        'Add attachment': '添加附件',
        'Voice Input': '语音输入',
        'Voice input': '语音输入',
        'Record Audio': '录制音频',
        'Record audio': '录制音频',
        'Stop recording': '停止录制',
        'Stop Recording': '停止录制',
        'Copy to Clipboard': '复制到剪贴板',
        'Copy to clipboard': '复制到剪贴板',
        'Good response': '好评',
        'Bad response': '差评',
        'Thumbs up': '好评',
        'Thumbs down': '差评',
        'Retry response': '重试回复',
        'Edit message': '编辑消息',
        'Delete message': '删除消息',
        'More options': '更多选项',
        'More Options': '更多选项',
        'Project actions': '项目操作',
        'Project Actions': '项目操作',
        'Close panel': '关闭面板',
        'Close Panel': '关闭面板',
        'Toggle panel': '切换面板',
        'Toggle Panel': '切换面板',
        'Toggle inspector': '切换审查面板',
        'Toggle Inspector': '切换审查面板',
        'Inspect mode': '审查模式',
        'Inspect Mode': '审查模式',
        'Scroll to bottom': '滚动到底部',
        'Scroll to Bottom': '滚动到底部',
        'Reload window': '重新加载窗口',
        'Reload Window': '重新加载窗口',
        'New window': '新建窗口',
        'New Window': '新建窗口',
        'View Usage': '查看使用量',
        'View usage': '查看使用量',
        'Usage': '使用量',
        'High': '高',
        'Low': '低',
        'Medium': '中',
        'Fast': '快速',
        'Thinking': '思考',
        '(Thinking)': '(思考)',
        '(thinking)': '(思考)',
        '(High)': '(高)',
        '(Medium)': '(中)',
        '(Low)': '(低)',
        '(Fast)': '(快速)',
        'Authenticating...': '正在验证身份...',
        'Working...': '正在处理...',
        'Working': '正在运行',
        'Thinking...': '思考中...',
        'Thinking': '思考中',
        'Review': '审查',
        'Proceed': '继续',
        'Accept': '接受',
        'Reject': '拒绝',
        'Dismiss': '忽略',
        'Copy': '复制',
        'Copied': '已复制',
        'Retry': '重试',
        'Continue': '继续',
        'Stop': '停止',
        'Resume': '恢复',
        'Pause': '暂停',
        'View Diff': '查看差异',
        'Changes': '更改',
        'Terminal': '终端',
        'Output': '输出',
        'Problems': '问题',
        'Debug': '调试',
        'Debug Console': '调试控制台',
        'Clear Terminal': '清除终端',
        'Kill Terminal': '终止终端',
        'New Terminal': '新建终端',
        'Split Terminal': '拆分终端',
        'Run': '运行',
        'Running': '运行中',
        'Completed': '已完成',
        'Failed': '失败',
        'Error': '错误',
        'Success': '成功',
        'Warning': '警告',
        'Info': '信息',
        'Details': '详情',
        'Back': '返回',
        'Next': '下一步',
        'Finish': '完成',
        'Done': '完成',
        'Search': '搜索',
        'Search...': '搜索...',
        'Search conversations...': '搜索对话...',
        'Search conversations': '搜索对话',
        'Search projects...': '搜索项目...',
        'Search projects': '搜索项目',
        'Search files...': '搜索文件...',
        'Search files': '搜索文件',
        'Search history...': '搜索历史记录...',
        'Search history': '搜索历史记录',
        'Search skills...': '搜索技能...',
        'Search skills': '搜索技能',
        'Search plugins...': '搜索插件...',
        'Search plugins': '搜索插件',
        'Search rules...': '搜索规则...',
        'Search rules': '搜索规则',
        'Search settings...': '搜索设置...',
        'Search settings': '搜索设置',
        'Filter': '筛选',
        'Sort': '排序',
        'All': '全部',
        'None': '无',
        'Default': '默认',
        'Custom': '自定义',
        'Automatic': '自动',
        'Manual': '手动',
        'Status': '状态',
        'Action': '操作',
        'Actions': '操作',
        'History': '历史记录',
        'Clear': '清除',
        'Clear History': '清除历史',
        'Export': '导出',
        'Import': '导入',
        'Download': '下载',
        'Upload': '上传',
        'Add': '添加',
        'Remove': '移除',
        'Delete': '删除',
        'Delete Project': '删除项目',
        'Delete project': '删除项目',
        'Delete Conversation': '删除对话',
        'Delete conversation': '删除对话',
        'Delete Task': '删除任务',
        'Delete task': '删除任务',
        'Delete Worktree': '删除工作树',
        'Delete worktree': '删除工作树',
        'Delete Rule': '删除规则',
        'Delete rule': '删除规则',
        'Delete Skill': '删除技能',
        'Delete skill': '删除技能',
        'Delete Plugin': '删除插件',
        'Delete plugin': '删除插件',
        'Delete Folder': '删除文件夹',
        'Delete folder': '删除文件夹',
        'Are you sure you want to delete the project': '您确定要删除项目',
        'Are you sure you want to delete this project?': '您确定要删除此项目吗？',
        'Are you sure you want to delete this project': '您确定要删除此项目吗',
        'Are you sure you want to delete this conversation?': '您确定要删除此对话吗？',
        'Are you sure you want to delete this conversation': '您确定要删除此对话吗',
        'Are you sure you want to delete this task?': '您确定要删除此任务吗？',
        'Are you sure you want to delete this task': '您确定要删除此任务吗',
        'Are you sure you want to delete this scheduled task?': '您确定要删除此定时任务吗？',
        'Are you sure you want to delete this scheduled task': '您确定要删除此定时任务吗',
        'Are you sure you want to delete this worktree?': '您确定要删除此工作树吗？',
        'Are you sure you want to delete this worktree': '您确定要删除此工作树吗',
        'Are you sure you want to delete this rule?': '您确定要删除此规则吗？',
        'Are you sure you want to delete this skill?': '您确定要删除此技能吗？',
        'Are you sure you want to delete this plugin?': '您确定要删除此插件吗？',
        'Are you sure you want to delete this folder?': '您确定要删除此文件夹吗？',
        'This will permanently delete': '这将永久删除',
        'within it.': '。',
        'within it': '',
        'This action cannot be undone.': '此操作无法撤销。',
        'This action cannot be undone': '此操作无法撤销',
        'This will permanently delete this conversation.': '这将永久删除此对话。',
        'This will permanently delete this project.': '这将永久删除此项目。',
        'This will permanently delete this task.': '这将永久删除此任务。',
        'Create': '创建',
        'New': '新建',
        'Duplicate': '创建副本',
        'Rename': '重命名',
        'Pin': '置顶',
        'Unpin': '取消置顶',
        'Archive': '归档',
        'Unarchive': '取消归档',
        'Archive Conversation': '归档对话',
        'Archive conversation': '归档对话',
        'Unarchive Conversation': '取消归档对话',
        'Unarchive conversation': '取消归档对话',
        'Mark Unread': '标记为未读',
        'Mark unread': '标记为未读',
        'Mark Read': '标记为已读',
        'Mark read': '标记为已读',
        'Mark as Unread': '标记为未读',
        'Mark as unread': '标记为未读',
        'Mark as Read': '标记为已读',
        'Mark as read': '标记为已读',
        'Mark All as Read': '全部标记为已读',
        'Mark all as read': '全部标记为已读',
        'Mark All as Unread': '全部标记为未读',
        'Mark all as unread': '全部标记为未读',
        'Mute': '静音',
        'Unmute': '取消静音',
        'Open in New Window': '在新窗口中打开',
        'Open in new window': '在新窗口中打开',
        'Open in New Tab': '在新标签页中打开',
        'Open in new tab': '在新标签页中打开',
        'Conversation Name': '对话名称',
        'Conversation ID': '对话 ID',
        'Project Name': '项目名称',
        'Project Path': '项目路径',
        'Project ID': '项目 ID',
        'Conversation URL': '对话链接',
        'Share Link': '分享链接',
        'Copy Project Name': '复制项目名称',
        'Copy project name': '复制项目名称',
        'Copy Project Path': '复制项目路径',
        'Copy project path': '复制项目路径',
        'Copy Project ID': '复制项目 ID',
        'Copy project ID': '复制项目 ID',
        'Copy Project URL': '复制项目链接',
        'Copy project URL': '复制项目链接',
        'Copy Conversation Name': '复制对话名称',
        'Copy conversation name': '复制对话名称',
        'Copy Conversation ID': '复制对话 ID',
        'Copy conversation ID': '复制对话 ID',
        'Copy Conversation URL': '复制对话链接',
        'Copy conversation URL': '复制对话链接',
        'Copy Branch Name': '复制分支名称',
        'Copy branch name': '复制分支名称',
        'Copy Worktree Path': '复制工作树路径',
        'Copy worktree path': '复制工作树路径',
        'Copy Folder Name': '复制文件夹名称',
        'Copy folder name': '复制文件夹名称',
        'Copy Folder Path': '复制文件夹路径',
        'Copy folder path': '复制文件夹路径',
        'Copy File Name': '复制文件名称',
        'Copy file name': '复制文件名称',
        'Copy File Path': '复制文件路径',
        'Copy file path': '复制文件路径',
        'Copy Relative Path': '复制相对路径',
        'Copy relative path': '复制相对路径',
        'Copy Full Path': '复制完整路径',
        'Copy full path': '复制完整路径',
        'Copy Path': '复制路径',
        'Copy path': '复制路径',
        'Copy Link': '复制链接',
        'Copy link': '复制链接',
        'Copy Name': '复制名称',
        'Copy name': '复制名称',
        'Copy ID': '复制 ID',
        'Copy id': '复制 ID',
        'Reveal in File Explorer': '在文件资源管理器中显示',
        'Reveal in Finder': '在访达中显示',
        'Open in Terminal': '在终端中打开',
        'Open in Editor': '在编辑器中打开',
        'Open in Browser': '在浏览器中打开',
        'Collapse': '折叠',
        'Expand': '展开',
        'Collapse All': '全部折叠',
        'Expand All': '全部展开',
        'Toggle': '切换',
        'More': '更多',
        'More Options': '更多选项',
        'Select All': '全选',
        'Deselect All': '取消全选',
        'Show less': '显示更少',
        'Show Less': '显示更少',
        'Show more': '显示更多',
        'Show More': '显示更多',
        'See all': '查看全部',
        'See All': '查看全部',
        'See less': '收起',
        'See Less': '收起',
        'see less': '收起',
        'See more': '显示更多',
        'See More': '显示更多',
        'see more': '显示更多',
        'View less': '收起',
        'View Less': '收起',
        'view less': '收起',
        'View more': '查看更多',
        'View More': '查看更多',
        'view more': '查看更多',
        'No items found': '未找到任何项',
        'Loading...': '加载中...',
        'Editor': '编辑器',
        'Commit': '提交',
        'commit': '提交',
        'Commits': '提交',
        'Push': '推送',
        'push': '推送',
        'Pull': '拉取',
        'pull': '拉取',
        'Fetch': '获取',
        'fetch': '获取',
        'Sync': '同步',
        'sync': '同步',
        'Commit & Push': '提交并推送',
        'Commit and Push': '提交并推送',
        'Commit and Sync': '提交并同步',
        'Push to...': '推送到...',
        'Pull from...': '从...拉取',
        'No remote configured': '未配置远程仓库',
        'No remote configured.': '未配置远程仓库。',
        'Discard All Changes': '放弃所有更改',
        'Discard Changes': '放弃更改',
        'Stage All Changes': '暂存所有更改',
        'Unstage All Changes': '取消暂存所有更改',
        'No changes to commit': '没有要提交的更改',
        'Commit message': '提交信息',
        'Enter commit message': '输入提交信息',
        'Uncommitted': '未提交',
        'Committed': '已提交',
        'All Changes': '所有更改',
        'Staged': '已暂存',
        'Unstaged': '未暂存',
        'Staged Changes': '已暂存的更改',
        'Staged changes': '已暂存的更改',
        'Working Tree Changes': '工作区更改',
        'Working tree changes': '工作区更改',
        'Staged index changes and working tree changes': '暂存区索引更改与工作区更改',
        'Staged index changes and working tree changes.': '暂存区索引更改与工作区更改。',
        'Agent Edits': '智能体修改',
        'Agent edits': '智能体修改',
        'Files modified by the agent in this conversation': '智能体在本次对话中修改的文件',
        'Files modified by the agent in this conversation.': '智能体在本次对话中修改的文件。',
        'now': '刚刚',
        'Just now': '刚刚',
        'just now': '刚刚',
        'Sort by': '排序方式',
        'Sort by...': '排序方式...',
        'Sort By': '排序方式',
        'Sort Conversations': '会话排序',
        'Sort conversations': '会话排序',
        'Sort Projects': '项目排序',
        'Sort projects': '项目排序',
        'Group by': '分组方式',
        'Group By': '分组方式',
        'Project': '项目',
        'Workspace': '工作区',
        'Workspaces': '工作区',
        'Worktree': '工作树',
        'Worktrees': '工作树',
        'New Worktree': '新建工作树',
        'New worktree': '新建工作树',
        'Worktrees are available for Git repositories': '工作树适用于 Git 代码仓库',
        'Worktrees are available for Git repositories.': '工作树适用于 Git 代码仓库。',
        'Local': '本地',
        'local': '本地',
        'Remote': '远程',
        'remote': '远程',
        'Select branch': '选择分支',
        'Select Branch': '选择分支',
        'Select a branch': '选择一个分支',
        'Select a branch...': '选择一个分支...',
        'Search branches': '搜索分支',
        'Search branches...': '搜索分支...',
        'Create Branch': '创建分支',
        'Create branch': '创建分支',
        'New Branch': '新建分支',
        'New branch': '新建分支',
        'Current Branch': '当前分支',
        'Current branch': '当前分支',
        'Switch Branch': '切换分支',
        'Switch branch': '切换分支',
        'No branches found': '未找到分支',
        'Main Branch': '主分支',
        'Default Branch': '默认分支',
        'Last Updated': '最近更新',
        'Last updated': '最近更新',
        'Last Prompt': '最近提示词',
        'Last prompt': '最近提示词',
        'Alphabetical (A-Z)': '按字母排序 (A-Z)',
        'Alphabetical (Z-A)': '按字母排序 (Z-A)',
        'Date Added': '添加日期',
        'Date added': '添加日期',
        'Date Modified': '修改日期',
        'Date modified': '修改日期',
        'Date Created': '创建日期',
        'Date created': '创建日期',
        'Alphabetical': '按字母排序',
        'Recent': '最近',
        'Subtitles': '副标题',
        'Subtitle': '副标题',
        'Project + Worktree': '项目 + 工作树',
        'Project + Branch': '项目 + 分支',
        'Worktree Only': '仅工作树',
        'Project Only': '仅项目',
        'Branch Only': '仅分支',
        'No Subtitle': '无副标题',
        'No subtitle': '无副标题',
        'No Subtitles': '无副标题',
        'Show Subtitles': '显示副标题',
        'Hide Subtitles': '隐藏副标题',
        'Tree View': '树状视图',
        'Tree view': '树状视图',
        'Flat View': '平铺视图',
        'Flat view': '平铺视图',
        'Compact View': '紧凑视图',
        'Compact view': '紧凑视图',
        'Show Hidden Files': '显示隐藏文件',
        'Hide Hidden Files': '隐藏隐藏文件',
        'Show Archived': '显示已归档',
        'Hide Archived': '隐藏已归档',
        'Show Pinned Only': '仅显示置顶',
        'Only Unread': '仅未读',
        'Only unread': '仅未读',
        'Only Read': '仅已读',
        'Only read': '仅已读',
        'Only Pinned': '仅置顶',
        'Only pinned': '仅置顶',
        'Only Starred': '仅标星',
        'Starred': '已标星',
        'Scheduled': '已定时',
        'Archived': '已归档',
        'Pinned': '已置顶',
        'With Edits': '包含修改',
        'Without Edits': '未修改',
        'Subagents': '子智能体',
        'Subagent': '子智能体',
        'Files Changed': '已更改文件',
        'Files changed': '已更改文件',
        'Artifacts': '生成物',
        'Artifact': '生成物',
        'Uploads': '已上传文件',
        'Upload': '上传',
        'Invalid Media': '无效媒体文件',
        'Invalid media': '无效媒体文件',
        'Invalid File': '无效文件',
        'Invalid file': '无效文件',
        'Invalid Image': '无效图片',
        'Invalid image': '无效图片',
        'Invalid URL': '无效 URL',
        'Invalid url': '无效 URL',
        'Unsupported file format': '不支持的文件格式',
        'Unsupported File Format': '不支持的文件格式',
        'Unsupported media format': '不支持的媒体格式',
        'Unsupported Media Format': '不支持的媒体格式',
        'Unsupported format': '不支持的格式',
        'Unsupported Format': '不支持的格式',
        'File too large': '文件过大',
        'File Too Large': '文件过大',
        'Media too large': '媒体文件过大',
        'Media Too Large': '媒体文件过大',
        'Image too large': '图片过大',
        'Image Too Large': '图片过大',
        'Failed to upload file': '上传文件失败',
        'Failed to upload media': '上传媒体失败',
        'Failed to upload image': '上传图片失败',
        'Upload failed': '上传失败',
        'Upload Failed': '上传失败',
        'Upload completed': '上传完成',
        'Upload Completed': '上传完成',
        'Upload cancelled': '上传已取消',
        'Upload Cancelled': '上传已取消',
        'File size exceeds the limit': '文件大小超出限制',
        'Max file size': '最大文件大小',
        'Maximum file size exceeded': '超出最大文件大小',
        'Background Tasks': '后台任务',
        'Background Task': '后台任务',
        'Terminals': '终端',
        
        // --- Left Sidebar & Nav ---
        'Account': '账号',
        'Permissions': '权限',
        'Models': '模型',
        'Customizations': '自定义',
        'Browser': '浏览器',
        'Application': '应用',
        'App': '应用',
        'Projects': '项目',
        'Pinned Conversations': '已置顶对话',
        'Pinned conversations': '已置顶对话',
        'Pinned Projects': '已置顶项目',
        'Pinned projects': '已置顶项目',
        'Pinned Tasks': '已置顶任务',
        'Pinned tasks': '已置顶任务',
        'Archived Conversations': '已归档对话',
        'Archived conversations': '已归档对话',
        'Archived Projects': '已归档项目',
        'Archived projects': '已归档项目',
        'Recent Conversations': '最近对话',
        'Recent conversations': '最近对话',
        'Recent Projects': '最近项目',
        'Recent projects': '最近项目',
        'All Conversations': '全部会话',
        'All conversations': '全部会话',
        'All Projects': '全部项目',
        'All projects': '全部项目',
        'Other Conversations': '其他对话',
        'Other conversations': '其他对话',
        'Today': '今天',
        'Yesterday': '昨天',
        'Previous 7 Days': '过去 7 天',
        'Previous 7 days': '过去 7 天',
        'Previous 30 Days': '过去 30 天',
        'Previous 30 days': '过去 30 天',
        'Show all': '显示全部',
        'Show All': '显示全部',
        'Not in Project': '不在项目中',
        'Conversations': '会话',
        'Shortcuts': '快捷键',
        'Keyboard shortcuts': '键盘快捷键',
        'Keyboard Shortcuts': '键盘快捷键',
        'Provide Feedback': '提供反馈',
        'New Conversation': '新建对话',
        'Conversation History': '历史会话',
        'Quick Start': '快速开始',
        'Quick start': '快速开始',
        'Instantly create a new project and folder to start building.': '立即创建新项目和文件夹以开始构建。',
        'Instantly create a new project and folder to start building': '立即创建新项目和文件夹以开始构建',
        'Create a new project from an existing folder': '从现有文件夹创建新项目',
        'Open an existing folder': '打开现有文件夹',
        'Create empty project': '创建空项目',
        'Clone repository': '克隆代码仓库',
        'Clone Repository': '克隆代码仓库',
        'Scheduled Tasks': '定时任务',
        'No scheduled tasks': '无定时任务',
        'New Scheduled Task': '新建定时任务',
        'New scheduled task': '新建定时任务',
        'Create Scheduled Task': '创建定时任务',
        'Create scheduled task': '创建定时任务',
        'Add Scheduled Task': '添加定时任务',
        'Add scheduled task': '添加定时任务',
        'Edit Scheduled Task': '编辑定时任务',
        'Edit scheduled task': '编辑定时任务',
        'Save Scheduled Task': '保存定时任务',
        'Save scheduled task': '保存定时任务',
        'Update Scheduled Task': '更新定时任务',
        'Update scheduled task': '更新定时任务',
        'Delete Scheduled Task': '删除定时任务',
        'Delete scheduled task': '删除定时任务',
        'Search tasks...': '搜索任务...',
        'Search tasks': '搜索任务',
        'Schedule Task': '定时任务',
        'Task Name': '任务名称',
        'Task name': '任务名称',
        'Name': '名称',
        'Enter scheduled task name...': '输入定时任务名称...',
        'Enter scheduled task name': '输入定时任务名称',
        'Enter task name...': '输入任务名称...',
        'Enter task name': '输入任务名称',
        'Schedule': '执行周期',
        'Frequency': '频率',
        'Daily': '每天',
        'Hourly': '每小时',
        'Weekly': '每周',
        'Monthly': '每月',
        'Custom Cron': '自定义 Cron',
        'Custom cron': '自定义 Cron',
        'around': '时间：',
        'Around': '时间：',
        'Every Day': '每天',
        'Every Hour': '每小时',
        'Every Week': '每周',
        'Once': '一次',
        'Recurring': '周期性',
        'Next Run': '下次运行',
        'Last Run': '上次运行',
        'Active': '启用',
        'Inactive': '未启用',
        'Cron Expression': 'Cron 表达式',
        'Prompt': '提示词',
        'Enter a prompt for the agent to run...': '输入供智能体运行的提示词...',
        'Enter a prompt for the agent to run': '输入供智能体运行的提示词',
        'Enter a prompt...': '输入提示词...',
        'Enter a prompt': '输入提示词',
        'All scheduled tasks run as Flash.': '所有定时任务均以 Flash 模型运行。',
        'All scheduled tasks run as Flash': '所有定时任务均以 Flash 模型运行',
        'Run now': '立即运行',
        'Run Now': '立即运行',
        'Pause': '暂停',
        'Resume': '恢复',
        'Install IDE': '安装 IDE',
        'Install Antigravity IDE': '安装 Antigravity IDE',

        // --- General / Execution Page ---
        'Browser settings have moved': '浏览器设置已迁移',
        'Browser settings have moved.': '浏览器设置已迁移。',
        'Browser settings have moved to the Browser section of General settings.': '浏览器设置已移动至通用设置的“浏览器”板块。',
        'Browser settings have moved to the Browser section of General settings': '浏览器设置已移动至通用设置的“浏览器”板块',
        'Go to General settings': '前往通用设置',
        'Go to General Settings': '前往通用设置',
        'Go to general settings': '前往通用设置',
        'Go to Project settings': '前往项目设置',
        'Go to project settings': '前往项目设置',
        'Go to Settings': '前往设置',
        'Go to settings': '前往设置',
        'Configure agent execution, queued message delivery, and permissions.': '配置智能体执行、排队消息发送以及权限。',
        'Configure agent execution, queued message delivery, and permissions': '配置智能体执行、排队消息发送以及权限',
        'Queued Messages': '排队消息',
        'Queued messages': '排队消息',
        'Configure when follow-up messages are sent.': '配置何时发送后续消息。',
        'Configure when follow-up messages are sent': '配置何时发送后续消息',
        
        // --- Appearance Page ---
        "Configure the agent's visual theme and display preferences.": '配置智能体的视觉主题和显示偏好。',
        "Configure the agent's visual theme and display preferences": '配置智能体的视觉主题和显示偏好',
        'Chat Settings': '聊天设置',
        'Verbose Agent Chat': '详细智能体聊天',
        'Verbose agent chat': '详细智能体聊天',
        'Display and preserve intermediate thinking steps.': '显示并保留中间思考过程。',
        'Display and preserve intermediate thinking steps': '显示并保留中间思考过程',
        'Conversation Width': '对话宽度',
        'Conversation width': '对话宽度',
        'Configure the maximum width of the conversation panel.': '配置对话面板的最大宽度。',
        'Configure the maximum width of the conversation panel': '配置对话面板的最大宽度',
        'Select light, dark, or inherit system settings.': '选择浅色、深色或继承系统设置。',
        'Select light, dark, or inherit system settings': '选择浅色、深色或继承系统设置',
        'System': '系统',
        'Light Theme': '浅色主题',
        'Preset': '预设',
        'Default Light': '默认浅色',
        'Dark Theme': '深色主题',
        'Default Dark': '默认深色',
        
        // --- Account Page ---
        'Manage your plan, credentials, and general preferences.': '管理您的计划、凭证和通用偏好。',
        'Enable Telemetry': '启用遥测',
        'When toggled on, Antigravity collects usage data to help Google enhance performance and features.': '开启后，Antigravity 将收集使用数据以帮助 Google 提升性能和功能。',
        'Marketing Emails': '营销邮件',
        'Receive product updates, tips, and promotions from Google Antigravity via email.': '通过电子邮件接收来自 Google Antigravity 的产品更新、提示和促销信息。',
        'Your Plan: Google AI Pro': '您的计划：Google AI Pro',
        'Your Plan: Google AI Ultra': '您的计划：Google AI Ultra',
        'Your Plan: Free': '您的计划：免费版',
        'Your Plan: Pro': '您的计划：Pro',
        'Your Plan: Ultra': '您的计划：Ultra',
        'Current Plan': '当前计划',
        'Switch Plan': '切换计划',
        'Manage Models': '管理模型',
        'Select Model': '选择模型',
        'You can upgrade to a Google AI Ultra plan to receive higher rate limits.': '您可以升级到 Google AI Ultra 计划以获得更高的速率限制。',
        'Upgrade': '升级',
        'Email': '电子邮件',
        'Sign In': '登录',
        'Sign Out': '退出登录',
        'Signed in as': '已登录为',
        'Logged in as': '已登录为',
        'By using this app, you agree to its': '使用此应用即表示您同意其',
        'Terms of Service': '服务条款',
        'Privacy Policy': '隐私政策',
        'Documentation': '文档',
        'Docs': '文档',
        'Help & Feedback': '帮助与反馈',
        'Send Feedback': '发送反馈',
        'Report an Issue': '报告问题',
        'About Antigravity': '关于 Antigravity',
        
        // --- Browser Page ---
        'Browser Settings': '浏览器设置',
        'Configure the browser subagent. It requires': '配置浏览器子智能体。它需要安装 ',
        'to be installed. The browser subagent can be invoked by typing /browser in the conversation input box.': '。可以通过在对话输入框中输入 /browser 来调用浏览器子智能体。',
        'Configure the browser subagent. It requires Google Chrome to be installed. The browser subagent can be invoked by typing /browser in the conversation input box.': '配置浏览器子智能体。它需要安装 Google Chrome。可以通过在对话输入框中输入 /browser 来调用浏览器子智能体。',
        'Browser Javascript Execution Policy': '浏览器 Javascript 执行策略',
        'Controls whether the agent can run custom JavaScript to automate complex browser actions.': '控制智能体是否可以运行自定义 JavaScript 来自动执行复杂的浏览器操作。',
        'Always Proceed': '始终允许',
        'Always proceed': '始终允许',
        'Block all browser JavaScript execution.': '阻止所有浏览器 JavaScript 执行。',
        'Block all browser JavaScript execution': '阻止所有浏览器 JavaScript 执行',
        'Prompt for approval before running browser scripts.': '在运行浏览器脚本前提示审核。',
        'Prompt for approval before running browser scripts': '在运行浏览器脚本前提示审核',
        'Allow full browser script execution without prompting.': '允许完全执行浏览器脚本，无需提示。',
        'Allow full browser script execution without prompting': '允许完全执行浏览器脚本，无需提示',
        'Actuation Permissions': '执行权限',
        'Browser Actuation Rules': '浏览器执行规则',
        'Browser Actuation Permissions': '浏览器执行权限',
        'Browser actuation permissions': '浏览器执行权限',
        'Execute URLs': '执行 URL',
        'Execute urls': '执行 URL',
        'Allow/deny agent browser actuation access to specific URLs.': '允许/拒绝智能体对特定 URL 的浏览器执行访问。',
        'Allow/deny agent browser actuation access to specific URLs': '允许/拒绝智能体对特定 URL 的浏览器执行访问',
        'Configure allowed and denied URLs for browser actuation.': '配置允许和拒绝进行浏览器执行的 URL。',
        'File Access Permissions': '文件访问权限',
        'File access permissions': '文件访问权限',
        'Network Access Permissions': '网络访问权限',
        'Network access permissions': '网络访问权限',
        'Terminal Command Permissions': '终端命令权限',
        'Terminal command permissions': '终端命令权限',
        'Commands Outside Sandbox Permissions': '沙箱外命令权限',
        'Commands outside sandbox permissions': '沙箱外命令权限',
        'MCP Tool Permissions': 'MCP 工具权限',
        'MCP tool permissions': 'MCP 工具权限',
        'Read and Write Paths': '读写路径',
        'Read Paths': '只读路径',
        'Write Paths': '只写路径',
        'Read URLs': '读取 URL',
        'Allowed Paths': '允许的路径',
        'Denied Paths': '拒绝的路径',
        'Allowed URLs': '允许的 URL',
        'Denied URLs': '拒绝的 URL',
        'Allowed Commands': '允许的命令',
        'Denied Commands': '拒绝的命令',
        'Allow/deny agent file access to specific paths.': '允许/拒绝智能体访问特定路径的文件。',
        'Allow/deny agent file access to specific paths': '允许/拒绝智能体访问特定路径的文件',
        'Allow/deny agent network read access to specific URLs.': '允许/拒绝智能体读取特定 URL 的网络访问。',
        'Allow/deny agent network read access to specific URLs': '允许/拒绝智能体读取特定 URL 的网络访问',
        'Allow/deny agent terminal execution of specific commands.': '允许/拒绝智能体执行特定的终端命令。',
        'Allow/deny agent terminal execution of specific commands': '允许/拒绝智能体执行特定的终端命令',
        'Allow/deny execution of specific commands outside the sandbox.': '允许/拒绝在沙箱外执行特定命令。',
        'Allow/deny execution of specific commands outside the sandbox': '允许/拒绝在沙箱外执行特定命令',
        'Edit': '编辑',
        
        // --- App / Application Page ---
        'App Settings': '应用设置',
        'Application Settings': '应用设置',
        'Manage Antigravity app settings.': '管理 Antigravity 应用程序设置。',
        'Manage Antigravity app settings': '管理 Antigravity 应用程序设置',
        'Manage application settings.': '管理应用程序设置。',
        'Manage application settings': '管理应用程序设置',
        'Prevent Sleep': '防止休眠',
        'Prevent sleep': '防止休眠',
        'Prevent the computer from sleeping while the app is running.': '在应用程序运行时防止电脑休眠。',
        'Prevent the computer from sleeping while the app is running': '在应用程序运行时防止电脑休眠',
        'Keep In Menu Bar': '保留在菜单栏/系统托盘中',
        'Keep in Menu Bar': '保留在菜单栏/系统托盘中',
        'Keep in menu bar': '保留在菜单栏/系统托盘中',
        'Keep In System Tray': '保留在系统托盘中',
        'Keep in System Tray': '保留在系统托盘中',
        'Keep in system tray': '保留在系统托盘中',
        'Keep the app accessible from the menu bar and running in the background when all windows are closed.': '关闭所有窗口时，保持应用在菜单栏/系统托盘中可访问并在后台运行。',
        'Keep the app accessible from the menu bar and running in the background when all windows are closed': '关闭所有窗口时，保持应用在菜单栏/系统托盘中可访问并在后台运行',
        'The app will be accessible from the menu bar and will keep running in the background when all windows are closed.': '当所有窗口关闭时，应用程序将保持在后台运行，并可从菜单栏/系统托盘中访问。',
        'The app will be accessible from the menu bar and will keep running in the background when all windows are closed': '当所有窗口关闭时，应用程序将保持在后台运行，并可从菜单栏/系统托盘中访问',
        'Remote Control': '远程控制',
        'Remote control': '远程控制',
        'Enable Remote Control': '启用远程控制',
        'Enable remote control': '启用远程控制',
        'Work with local agents from another device.': '从另一台设备使用本地智能体。',
        'Work with local agents from another device': '从另一台设备使用本地智能体',
        'Notifications': '通知',
        'Notification Settings': '通知设置',
        'Notification settings': '通知设置',
        'To modify notification settings, open your operating system\'s system preferences.': '要修改通知设置，请打开您操作系统的系统设置。',
        'To modify notification settings, open your operating system\'s system settings.': '要修改通知设置，请打开您操作系统的系统设置。',
        'Open System Preferences': '打开系统设置',
        'Open System Settings': '打开系统设置',
        'Open system preferences': '打开系统设置',
        'Open system settings': '打开系统设置',
        'Advanced Settings': '高级设置',
        'Advanced Settings >': '高级设置 >',
        'Advanced Settings ›': '高级设置 ›',
        'Advanced settings': '高级设置',
        'Advanced settings >': '高级设置 >',
        'Advanced settings ›': '高级设置 ›',
        'Automatic Check for Updates': '自动检查更新',
        'Automatic check for updates': '自动检查更新',
        'Automatically Check for Updates': '自动检查更新',
        'Automatically check for updates': '自动检查更新',
        'Auto check for updates': '自动检查更新',
        'Auto Check for Updates': '自动检查更新',
        'Automatically prompt you to restart the app when a new update is available. When disabled, you can check for updates manually from the app menu.': '当有新更新可用时，自动提示您重启应用。禁用后，您可以从应用菜单手动检查更新。',
        'Automatically prompt you to restart the app when a new update is available. When disabled, you can check for updates manually from the app menu': '当有新更新可用时，自动提示您重启应用。禁用后，您可以从应用菜单手动检查更新',
        'Hardware Acceleration': '硬件加速',
        'Use hardware acceleration when available': '在可用时使用硬件加速',
        'Proxy Settings': '代理设置',
        'Log Level': '日志级别',
        'Open Log Directory': '打开日志目录',
        'Reset All Settings': '重置所有设置',
        'Reset all settings to default': '将所有设置重置为默认值',
        'Clear Cache': '清除缓存',
        
        // --- Permissions Page ---
        'Configure global allowed and denied resource permissions.': '配置全局允许和拒绝的资源权限。',
        'Configure global allowed and denied resource permissions. Learn more.': '配置全局允许和拒绝的资源权限。了解更多。',
        'Learn more': '了解更多',
        'Learn more.': '了解更多。',
        'Project-Specific Settings': '特定于项目的设置',
        'Modify scoped permissions, folders, and agent settings like Sandbox and Terminal Command Execution.': '修改作用域权限、文件夹以及沙箱和终端命令执行等智能体设置。',
        'Go To Projects': '转到项目',
        'Go to Projects': '转到项目',
        'File Permissions': '文件权限',
        'File Access Rules': '文件访问规则',
        'Configure allowed and denied paths for file reads and writes.': '配置允许和拒绝文件读写的路径。',
        'Configure allowed and denied paths for file reads and writes': '配置允许和拒绝文件读写的路径',
        'Open': '打开',
        'Network Permissions': '网络权限',
        'Network Access Rules': '网络访问规则',
        'Configure allowed and denied URLs for reading.': '配置允许和拒绝读取的 URL。',
        'Configure allowed and denied URLs for reading': '配置允许和拒绝读取的 URL',
        'Terminal & Tooling Permissions': '终端与工具权限',
        'Terminal Commands': '终端命令',
        'Configure allowed terminal commands.': '配置允许的终端命令。',
        'Commands Outside Sandbox': '沙箱外的命令',
        'Configure allowed commands outside the sandbox.': '配置允许在沙箱外运行的命令。',
        'MCP Tools': 'MCP 工具',
        'Configure external tools via Model Context Protocol.': '通过模型上下文协议配置外部工具。',
        'Requesting your permission in Terminal:': '正在终端中请求您的权限：',
        'Requesting your permission in Terminal': '正在终端中请求您的权限',
        'Requesting your permission to open URL:': '正在请求打开网址的权限：',
        'Requesting your permission to open URL': '正在请求打开网址的权限',
        'Requesting your permission to execute JavaScript:': '正在请求执行 JavaScript 的权限：',
        'Requesting your permission to execute JavaScript': '正在请求执行 JavaScript 的权限',
        'Requesting your permission:': '正在请求您的权限：',
        'Requesting your permission': '正在请求您的权限',
        'Command:': '命令：',
        
        // --- Models & Usage Page ---
        'Plan': '订阅计划',
        'Models & Usage': '模型与使用量',
        'Models & usage': '模型与使用量',
        'Manage your model quota and credits.': '管理您的模型配额与额度。',
        'Manage your model quota and credits': '管理您的模型配额与额度',
        'Claude and GPT models': 'Claude 与 GPT 模型',
        'Claude and GPT Models': 'Claude 与 GPT 模型',
        'Weekly Limit Remaining': '剩余每周限制',
        'Weekly limit remaining': '剩余每周限制',
        'Five Hour Limit Remaining': '剩余 5 小时限制',
        'Five hour limit remaining': '剩余 5 小时限制',
        '5-Hour Limit Remaining': '剩余 5 小时限制',
        '5-hour limit remaining': '剩余 5 小时限制',
        'Monthly Limit Remaining': '剩余每月限制',
        'Monthly limit remaining': '剩余每月限制',
        'Daily Limit Remaining': '剩余每日限制',
        'Daily limit remaining': '剩余每日限制',
        'You have not used any of your weekly limit.': '您尚未消耗每周限制。',
        'You have not used any of your 5-hour limit.': '您尚未消耗 5 小时限制。',
        'Model Credits': '模型额度',
        'Enable AI Credit Overages': '启用超出额度使用 AI 积分',
        'When toggled on, Antigravity will use your AI credits to fulfill model requests once you\'re out of model quota. Antigravity will always use your model quota first before using AI credits.': '开启后，当您的模型配额用尽时，Antigravity 将使用您的 AI 积分来满足模型请求。Antigravity 将始终优先使用您的模型配额。',
        'Model Quota': '模型配额',
        'Within each group, models share a weekly limit and a 5-hour limit. Quota is consumed proportionally to the cost of the tokens. Thus, limits will last longer with shorter tasks or using more cost-effective models. The 5-hour limit smooths out aggregate demand to fairly distribute global capacity across all users, while your weekly limit is tied directly to your individual tier.': '在每个组中，模型共享每周限制和 5 小时限制。配额的消耗与 Token 的成本成正比。因此，任务越短或使用性价比更高的模型，限制持续时间越长。5 小时限制可以平滑总体需求，以便在所有用户之间分配全局容量，而您的每周限制直接与您的个人等级绑定。',
        'Gemini Models': 'Gemini 模型',
        'Weekly Limit': '每周限制',
        'Five Hour Limit': '5小时限制',
        '5-Hour Limit': '5小时限制',
        '5-hour limit': '5小时限制',
        'Refresh': '刷新',
        
        // --- Customizations Page ---
        'Configure default behaviors, skills, and MCP servers.': '配置默认行为、技能和 MCP 服务。',
        'Configure default behaviors, skills, and MCP servers. Learn more.': '配置默认行为、技能和 MCP 服务。了解更多。',
        'Token Usage': '令牌使用量',
        'The breakdown below shows token usage from customizations like skills, rules, and MCP. If the budget is exceeded, large customizations will be truncated automatically.': '以下明细显示了技能、规则和 MCP 等自定义项的 Token 使用量。如果超出预算，大型自定义项将自动截断。',
        'The breakdown below shows token usage from customizations like skills, rules, and MCP. If the budget is exceeded, large customizations will be truncated automatically': '以下明细显示了技能、规则和 MCP 等自定义项的 Token 使用量。如果超出预算，大型自定义项将自动截断。',
        'Hide breakdown': '隐藏明细',
        'Hide Breakdown': '隐藏明细',
        'Show breakdown': '显示明细',
        'Show Breakdown': '显示明细',
        'Hide breakdowns': '隐藏明细',
        'Hide Breakdowns': '隐藏明细',
        'Show breakdowns': '显示明细',
        'Show Breakdowns': '显示明细',
        'Global': '全局',
        'global': '全局',
        'Plugin:': '插件：',
        'Builtin': '内置',
        'Built-in': '内置',
        'Customization Budget': '自定义额度',
        'Customization budget': '自定义额度',
        'Skills': '技能',
        'Rules': '规则',
        'Plugins': '插件',
        'Hooks': '钩子',
        'Sidecars': 'Sidecars',
        'Add Skill': '添加技能',
        'Add Rule': '添加规则',
        'Add Plugin': '添加插件',
        'Enable Skill': '启用技能',
        'Disable Skill': '禁用技能',
        'Installed Skills': '已安装技能',
        'Installed Plugins': '已安装插件',
        'Installed Rules': '已配置规则',
        'Configure': '配置',
        'Browse Plugins': '浏览插件',
        'Official Plugins': '官方插件',
        'Community Plugins': '社区插件',
        'Plugin Details': '插件详情',
        'Author': '作者',
        'Version': '版本',
        'Installed MCP Servers': '已安装的 MCP 服务',
        'Add MCP': '添加 MCP',
        'Add MCP Server': '添加 MCP 服务',
        'No MCP Servers': '无 MCP 服务',
        'You currently don\'t have any MCP Servers installed. Add an MCP server above': '您目前没有安装任何 MCP 服务。请在上方添加一个 MCP 服务',
        'Build With Google Plugins': '使用 Google 插件构建',
        'Build with Google Plugins': '使用 Google 插件构建',
        'Customize': '自定义',
        
        // --- Project Settings Page ---
        'Folders': '文件夹',
        'Add Folder': '添加文件夹',
        'Agent Settings': '智能体设置',
        'Security Preset': '安全预设',
        'Security Presets': '安全预设',
        'Controls the actions the agent can take.': '控制智能体可以执行的操作。',
        'Controls the actions the agent can take': '控制智能体可以执行的操作',
        'Controls terminal execution and file access.': '控制终端执行和文件访问。',
        'Controls terminal execution and file access': '控制终端执行和文件访问',
        'Choose a predefined security preset for the agent. This controls terminal auto-execution policy, and file access policy.': '为智能体选择预定义的安全预设。这控制了终端自动执行策略和文件访问策略。',
        'Choose a predefined security preset for the agent. This controls terminal auto-execution policy, and file access policy': '为智能体选择预定义的安全预设。这控制了终端自动执行策略和文件访问策略',
        'Learn more about Turbo mode': '了解有关 Turbo 模式的更多信息',
        'Turbo Mode': 'Turbo 模式',
        'Agent Behavior': '智能体行为',
        'Artifact Review Policy': '生成物审查策略',
        'Whether the agent asks you to review its documents.': '智能体是否请求您审查其文档。',
        'Whether the agent asks you to review its documents': '智能体是否请求您审查其文档',
        'Whether the agent asks to review its documents.': '智能体是否请求审查其文档。',
        'Whether the agent asks to review its documents': '智能体是否请求审查其文档',
        'Whether the agent asks you to review its artifacts.': '智能体是否请求您审查其生成物。',
        'Whether the agent asks you to review its artifacts': '智能体是否请求您审查其生成物',
        'Specifies Agent\'s behavior when asking for review on artifacts, which are documents it creates to enable a richer conversation experience.': '指定智能体在请求审查生成物（智能体创建的旨在实现更丰富对话体验的文档）时的行为。',
        'Specifies Agent\'s behavior': '指定智能体的行为',
        'Always Ask': '总是询问',
        'Always ask': '总是询问',
        'Always Allow': '总是允许',
        'Always allow': '总是允许',
        'Ask Every Time': '每次询问',
        'Never': '从不',
        'Never Ask': '从不询问',
        'Local Permissions': '本地权限',
        'Inherits from': '继承自',
        'global settings': '全局设置',
        '. Local permissions have higher priority.': '。本地权限具有更高的优先级。',
        'Manage project folders, agent settings, and permissions.': '管理项目文件夹、智能体设置和权限。',
        'Agent settings and permissions for conversations outside of projects.': '项目外对话的智能体设置和权限。',
        'Agent settings and permissions for conversations outside of projects': '项目外对话的智能体设置和权限',
        'Also includes': '同时包含',
        'Also includes ': '同时包含 ',
        'when working in this project.': '（在此项目中工作时）。',
        'when working in this project': '（在此项目中工作时）',
        'when working in this conversation.': '（在此对话中工作时）。',
        'when working in this conversation': '（在此对话中工作时）',
        'when working outside of projects.': '（在项目外工作时）。',
        'when working outside of projects': '（在项目外工作时）',
        '% of the customization budget is available.': '% 的自定义额度可用。',
        
        // --- Security Preset Dropdown & Custom Options ---
        'Inherit General': '继承通用设置',
        'Inherit general': '继承通用设置',
        'Inherits your General settings when working in this project.': '在此项目中工作时继承您的通用设置。',
        'Inherits your General settings when working in this project': '在此项目中工作时继承您的通用设置',
        'Inherits your General settings when working in this conversation.': '在此对话中工作时继承您的通用设置。',
        'Inherits your General settings when working in this conversation': '在此对话中工作时继承您的通用设置',
        'Inherits your General settings when working outside of projects.': '在项目外工作时继承您的通用设置。',
        'Inherits your General settings when working outside of projects': '在项目外工作时继承您的通用设置',
        'Default': '默认',
        'Full machine': '整机',
        'Full Machine': '整机',
        'Turbo mode': 'Turbo 模式',
        'Custom': '自定义',
        'Requires manual review for all terminal commands and file accesses outside of the working folders.': '对工作文件夹之外的所有终端命令和文件访问进行人工审查。',
        'All terminal commands require review. The agent can read or write to any file in the machine.': '所有终端命令都需要审核。智能体可以读写机器上的任何文件。',
        'Disables all safety barriers for maximal iteration velocity.': '禁用所有安全屏障以获得最大的迭代速度。',
        'Learn more about': '了解更多关于',
        'Outside of folders file access policy': '工作文件夹外的文件访问策略',
        'Configures how the agent tries to access files outside of its working folders.': '配置智能体如何访问其工作文件夹外部的文件。',
        'Terminal Command Auto Execution': '终端命令自动执行',
        'Controls whether terminal commands require your approval before running.': '控制终端命令在运行前是否需要您的批准。',
        'Require Review': '需要审核',
        'Auto-run': '自动运行',
        'Manual review': '人工审查',
        'Manual Review': '人工审查',
        'Manually customize individual settings.': '手动自定义各项独立设置。',
        'Allow read access to this path?': '允许读取此路径？',
        'Allow read access to these paths?': '允许读取这些路径？',
        'Allow write access to this path?': '允许写入此路径？',
        'Allow write access to these paths?': '允许写入这些路径？',
        'Allow read/write access to this path?': '允许读写此路径？',
        'Allow read and write access to this path?': '允许读写此路径？',
        'Allow access to this path?': '允许访问此路径？',
        'Allow terminal command?': '允许执行终端命令？',
        'Allow running this command?': '允许运行此命令？',
        'Allow running these commands?': '允许运行这些命令？',
        'Allow network access to this URL?': '允许网络访问此 URL？',
        'Allow browser actuation access to this URL?': '允许对该 URL 进行浏览器操作？',
        'Yes, allow this time': '是，仅本次允许',
        'Yes, allow once': '是，仅允许一次',
        'Yes, and always allow in this conversation': '是，且在此对话中始终允许',
        'Yes, and always allow in this project': '是，且在此项目中始终允许',
        'Yes, and always allow in this workspace': '是，且在此工作区中始终允许',
        'Yes, and always allow': '是，且始终允许',
        'Yes, always allow in this conversation': '是，且在此对话中始终允许',
        'Yes, always allow in this project': '是，且在此项目中始终允许',
        'Yes, always allow': '是，始终允许',
        'No, deny this time': '否，本次拒绝',
        'No, and always deny in this conversation': '否，且在此对话中始终拒绝',
        'No, and always deny in this project': '否，且在此项目中始终拒绝',
        'No, and always deny': '否，且始终拒绝',
        'No, always deny': '否，始终拒绝',
        'No (tell the agent what to do instead)': '否（告诉智能体替代操作）',
        '否 (tell the agent what to do instead)': '否（告诉智能体替代操作）',
        '(tell the agent what to do instead)': '（告诉智能体替代操作）',
        'tell the agent what to do instead': '告诉智能体替代操作',
        'in this conversation': '在当前对话中',
        'in this project': '在当前项目中',
        'in this workspace': '在当前工作区中',
        'in this folder': '在此文件夹中',
        'Allow': '允许',
        'allow': '允许',
        'ALLOW': '允许',
        'Deny': '拒绝',
        'deny': '拒绝',
        'DENY': '拒绝',
        'Ask': '询问',
        'ask': '询问',
        'ASK': '询问',
        'Read': '只读',
        'read': '只读',
        'Write': '只写',
        'write': '只写',
        'Read and write': '读写',
        'Read and Write': '读写',
        'read and write': '读写',
        'Read/write': '读写',
        'Read/Write': '读写',
        'read/write': '读写',
        'Read only': '只读',
        'Read Only': '只读',
        'read only': '只读',
        'Write only': '只写',
        'Write Only': '只写',
        'write only': '只写',
    };

    // Hot-reload dynamic external rules (supports Ctrl + R and focus hot-reload)
    function loadDynamicRules() {
        try {
            const dynamicRules = electron_1.ipcRenderer.sendSync('i18n:get-dynamic-rules-sync');
            if (dynamicRules && typeof dynamicRules === 'object') {
                Object.assign(translationMap, dynamicRules);
            }
        } catch (_) {}
    }
    loadDynamicRules();

    function translateDuration(str) {
        return str
            .replace(/(\d+)\s+days?/gi, '$1 天')
            .replace(/(\d+)\s+hours?/gi, '$1 小时')
            .replace(/(\d+)\s+minutes?/gi, '$1 分钟')
            .replace(/(\d+)\s+seconds?/gi, '$1 秒')
            .replace(/,\s*/g, ' ')
            .trim();
    }

    function shouldSkipElement(el) {
        if (!el || el.nodeType !== 1) return false;
        const tag = el.tagName ? el.tagName.toLowerCase() : '';
        if (tag === 'code' || tag === 'pre' || tag === 'input' || tag === 'textarea' || tag === 'script' || tag === 'style') {
            return true;
        }
        const cls = el.className;
        if (typeof cls === 'string' && (
            cls.includes('monaco-editor') ||
            cls.includes('editor-container') ||
            cls.includes('code-block') ||
            cls.includes('mtk') ||
            cls.includes('view-lines')
        )) {
            return true;
        }
        return false;
    }

    function shouldSkipTranslation(node) {
        const parent = node.parentElement;
        if (!parent) return false;
        if (shouldSkipElement(parent)) return true;
        try {
            if (parent.closest('code, pre, input, textarea, script, style, .monaco-editor, .mtk, .view-lines, .editor-container, .code-block')) {
                return true;
            }
        } catch (_) {}
        return false;
    }

    function translateText(text) {
        const normalized = text.replace(/\u00a0/g, ' ');
        const trimmed = normalized.trim();
        if (!trimmed) return null;
        if (translationMap[trimmed]) {
            return text.replace(trimmed, translationMap[trimmed]);
        }
        
        // --- Dynamic String Translation ---
        
        // "Thought for Xs" / "Thought for Xms"
        const thoughtMatch = trimmed.match(/^Thought for (\d+(?:\.\d+)?)\s*(s|ms)$/i);
        if (thoughtMatch) {
            const unit = thoughtMatch[2].toLowerCase() === 's' ? '秒' : '毫秒';
            return `思考耗时 ${thoughtMatch[1]} ${unit}`;
        }

        // --- Inspector Panel & Sidebar Items ---
        // "Subagents [X] [>›v∨]"
        const subagentsMatch = trimmed.match(/^Subagents\s*(\d*)\s*([>›v∨˅]?)$/i);
        if (subagentsMatch) {
            return `子智能体${subagentsMatch[1] ? ' ' + subagentsMatch[1] : ''}${subagentsMatch[2] ? ' ' + subagentsMatch[2] : ''}`;
        }

        // "Files Changed [X] [>›v∨]"
        const filesChangedSectionMatch = trimmed.match(/^Files\s+Changed\s*(\d*)\s*([>›v∨˅]?)$/i);
        if (filesChangedSectionMatch) {
            return `已更改文件${filesChangedSectionMatch[1] ? ' ' + filesChangedSectionMatch[1] : ''}${filesChangedSectionMatch[2] ? ' ' + filesChangedSectionMatch[2] : ''}`;
        }

        // "Artifacts [X] [>›v∨]"
        const artifactsMatch = trimmed.match(/^Artifacts\s*(\d*)\s*([>›v∨˅]?)$/i);
        if (artifactsMatch) {
            return `生成物${artifactsMatch[1] ? ' ' + artifactsMatch[1] : ''}${artifactsMatch[2] ? ' ' + artifactsMatch[2] : ''}`;
        }

        // "Uploads [X] [>›v∨]"
        const uploadsMatch = trimmed.match(/^Uploads\s*(\d*)\s*([>›v∨˅]?)$/i);
        if (uploadsMatch) {
            return `已上传文件${uploadsMatch[1] ? ' ' + uploadsMatch[1] : ''}${uploadsMatch[2] ? ' ' + uploadsMatch[2] : ''}`;
        }

        // "Background Tasks [X] [>›v∨]"
        const bgTasksMatch = trimmed.match(/^Background\s+Tasks\s*(\d*)\s*([>›v∨˅]?)$/i);
        if (bgTasksMatch) {
            return `后台任务${bgTasksMatch[1] ? ' ' + bgTasksMatch[1] : ''}${bgTasksMatch[2] ? ' ' + bgTasksMatch[2] : ''}`;
        }

        // "Terminals [X] [>›v∨]"
        const terminalsMatch = trimmed.match(/^Terminals\s*(\d*)\s*([>›v∨˅]?)$/i);
        if (terminalsMatch) {
            return `终端${terminalsMatch[1] ? ' ' + terminalsMatch[1] : ''}${terminalsMatch[2] ? ' ' + terminalsMatch[2] : ''}`;
        }

        // "See all (X)"
        const seeAllMatch = trimmed.match(/^See\s+all\s*\((.+?)\)$/i);
        if (seeAllMatch) {
            return `查看全部 (${seeAllMatch[1]})`;
        }

        // "Media (Today/Yesterday X:XX PM/AM)"
        const mediaMatch = trimmed.match(/^Media\s*\((.+?)\)$/i);
        if (mediaMatch) {
            const timeStr = mediaMatch[1].replace(/Today/i, '今天').replace(/Yesterday/i, '昨天');
            return `媒体 (${timeStr})`;
        }

        // --- Tool Call Steps ---
        // "Ran X commands [>›v∨]"
        const ranCommandsMatch = trimmed.match(/^Ran\s+(\d+)\s+commands?\s*([>›v∨˅]?)$/i);
        if (ranCommandsMatch) {
            return `运行了 ${ranCommandsMatch[1]} 条命令${ranCommandsMatch[2] ? ' ' + ranCommandsMatch[2] : ''}`;
        }

        // "Explored X files [>›v∨]"
        const exploredMatch = trimmed.match(/^Explored\s+(\d+)\s+files?\s*([>›v∨˅]?)$/i);
        if (exploredMatch) {
            return `已探索 ${exploredMatch[1]} 个文件${exploredMatch[2] ? ' ' + exploredMatch[2] : ''}`;
        }

        // "Exploring X files [>›v∨]"
        const exploringMatch = trimmed.match(/^Exploring\s+(\d+)\s+files?\s*([>›v∨˅]?)$/i);
        if (exploringMatch) {
            return `正在探索 ${exploringMatch[1]} 个文件${exploringMatch[2] ? ' ' + exploringMatch[2] : ''}`;
        }

        // "Edited filename [+X -Y]"
        const editedMatch = trimmed.match(/^Edited\s+(.+?)(?:\s+([+-]\d+.*))?$/i);
        if (editedMatch) {
            return `已编辑 ${editedMatch[1]}${editedMatch[2] ? ' ' + editedMatch[2] : ''}`;
        }

        // "Editing filename"
        const editingMatch = trimmed.match(/^Editing\s+(.+)$/i);
        if (editingMatch) {
            return `正在编辑 ${editingMatch[1]}`;
        }

        // "Analyzed filename [#L...]"
        const analyzedMatch = trimmed.match(/^Analyzed\s+(.+)$/i);
        if (analyzedMatch) {
            return `已分析 ${analyzedMatch[1]}`;
        }

        // "Analyzing filename"
        const analyzingMatch = trimmed.match(/^Analyzing\s+(.+)$/i);
        if (analyzingMatch) {
            return `正在分析 ${analyzingMatch[1]}`;
        }

        // "Running command [>›v∨]"
        const runningCmdMatch = trimmed.match(/^Running\s+command\s*([>›v∨˅]?)$/i);
        if (runningCmdMatch) {
            return `正在运行命令${runningCmdMatch[1] ? ' ' + runningCmdMatch[1] : ''}`;
        }

        // "Ran command [>›v∨]"
        const ranCmdMatch = trimmed.match(/^Ran\s+command\s*([>›v∨˅]?)$/i);
        if (ranCmdMatch) {
            return `运行命令${ranCmdMatch[1] ? ' ' + ranCmdMatch[1] : ''}`;
        }

        // "Executed command [>›v∨]"
        const execCmdMatch = trimmed.match(/^Executed\s+command\s*([>›v∨˅]?)$/i);
        if (execCmdMatch) {
            return `已执行命令${execCmdMatch[1] ? ' ' + execCmdMatch[1] : ''}`;
        }

        // "Searching codebase [>›v∨]"
        const searchingCbMatch = trimmed.match(/^Searching\s+codebase\s*([>›v∨˅]?)$/i);
        if (searchingCbMatch) {
            return `正在搜索代码库${searchingCbMatch[1] ? ' ' + searchingCbMatch[1] : ''}`;
        }

        // "Searched codebase [>›v∨]"
        const searchedCbMatch = trimmed.match(/^Searched\s+codebase\s*([>›v∨˅]?)$/i);
        if (searchedCbMatch) {
            return `已搜索代码库${searchedCbMatch[1] ? ' ' + searchedCbMatch[1] : ''}`;
        }

        // "Viewing file [>›v∨]"
        const viewingFileMatch = trimmed.match(/^Viewing\s+file\s*([>›v∨˅]?)$/i);
        if (viewingFileMatch) {
            return `正在查看文件${viewingFileMatch[1] ? ' ' + viewingFileMatch[1] : ''}`;
        }

        // "Viewed file [>›v∨]"
        const viewedFileMatch = trimmed.match(/^Viewed\s+file\s*([>›v∨˅]?)$/i);
        if (viewedFileMatch) {
            return `已查看文件${viewedFileMatch[1] ? ' ' + viewedFileMatch[1] : ''}`;
        }

        // "X files changed"
        const filesChangedMatch = trimmed.match(/^(\d+)\s+files?\s+changed$/i);
        if (filesChangedMatch) {
            return `${filesChangedMatch[1]} 个文件已更改`;
        }

        // "X insertions(+)" / "X deletions(-)"
        const insMatch = trimmed.match(/^(\d+)\s+insertions?\(\+\)$/i);
        if (insMatch) {
            return `${insMatch[1]} 处添加(+)`;
        }
        const delMatch = trimmed.match(/^(\d+)\s+deletions?\(-\)$/i);
        if (delMatch) {
            return `${delMatch[1]} 处删除(-)`;
        }
        
        // "Learn more about X"
        const learnMoreMatch = trimmed.match(/^Learn more about\s+(.+)$/i);
        if (learnMoreMatch) {
            const target = learnMoreMatch[1].trim();
            const translatedTarget = translationMap[target] || target;
            return `了解更多关于 ${translatedTarget}`;
        }

        // "Advanced Settings [>›]"
        const advMatch = trimmed.match(/^Advanced [Ss]ettings\s*([>›]?)$/);
        if (advMatch) {
            return `高级设置${advMatch[1] ? ' ' + advMatch[1] : ''}`;
        }

        // "X agents running"
        const agentsMatch = trimmed.match(/^(\d+)\s+agents?\s+running$/i);
        if (agentsMatch) {
            return `${agentsMatch[1]} 个智能体运行中`;
        }

        // "X scheduled tasks"
        const tasksMatch = trimmed.match(/^(\d+)\s+scheduled\s+tasks?$/i);
        if (tasksMatch) {
            return `${tasksMatch[1]} 个定时任务`;
        }

        // "X projects"
        const projMatch = trimmed.match(/^(\d+)\s+projects?$/i);
        if (projMatch) {
            return `${projMatch[1]} 个项目`;
        }

        // "X conversations"
        const convMatch = trimmed.match(/^(\d+)\s+conversations?$/i);
        if (convMatch) {
            return `${convMatch[1]} 个对话`;
        }

        // "Last run: X"
        const lastRunMatch = trimmed.match(/^Last run:\s*(.+)$/i);
        if (lastRunMatch) {
            return `上次运行：${lastRunMatch[1]}`;
        }

        // "Next run: X"
        const nextRunMatch = trimmed.match(/^Next run:\s*(.+)$/i);
        if (nextRunMatch) {
            return `下次运行：${nextRunMatch[1]}`;
        }

        // "Updated X days/hours/minutes ago"
        const updDaysMatch = trimmed.match(/^Updated\s+(\d+)\s+days?\s+ago$/i);
        if (updDaysMatch) return `${updDaysMatch[1]} 天前更新`;
        const updHoursMatch = trimmed.match(/^Updated\s+(\d+)\s+hours?\s+ago$/i);
        if (updHoursMatch) return `${updHoursMatch[1]} 小时前更新`;
        const updMinsMatch = trimmed.match(/^Updated\s+(\d+)\s+minutes?\s+ago$/i);
        if (updMinsMatch) return `${updMinsMatch[1]} 分钟前更新`;

        // "Created X days/hours/minutes ago"
        const crtDaysMatch = trimmed.match(/^Created\s+(\d+)\s+days?\s+ago$/i);
        if (crtDaysMatch) return `${crtDaysMatch[1]} 天前创建`;
        const crtHoursMatch = trimmed.match(/^Created\s+(\d+)\s+hours?\s+ago$/i);
        if (crtHoursMatch) return `${crtHoursMatch[1]} 小时前创建`;
        const crtMinsMatch = trimmed.match(/^Created\s+(\d+)\s+minutes?\s+ago$/i);
        if (crtMinsMatch) return `${crtMinsMatch[1]} 分钟前创建`;

        // "Xmo" / "Xd" / "Xh" / "Xm" / "Xs" ago abbreviations
        const relTimeMatch = trimmed.match(/^(\d+)\s*(mo|d|h|m|s)$/i);
        if (relTimeMatch) {
            const unitMap = { 'mo': '个月前', 'd': '天前', 'h': '小时前', 'm': '分钟前', 's': '秒前' };
            const u = unitMap[relTimeMatch[2].toLowerCase()];
            if (u) return `${relTimeMatch[1]} ${u}`;
        }
        
        // "(Thinking)" / "(Medium)" / "(High)" / "(Low)" inside model names
        if (/\((?:Thinking|Medium|High|Low|Fast)\)/i.test(trimmed)) {
            return trimmed
                .replace(/\(Thinking\)/gi, '(思考)')
                .replace(/\(Medium\)/gi, '(中)')
                .replace(/\(High\)/gi, '(高)')
                .replace(/\(Low\)/gi, '(低)')
                .replace(/\(Fast\)/gi, '(快速)');
        }

        // Model suffix "High" / "Low" / "Fast" (e.g. "Gemini 3.7 Flash High")
        const modelSuffixMatch = trimmed.match(/^(.+?)\s+(High|Low|Medium|Fast)$/i);
        if (modelSuffixMatch && !trimmed.startsWith('Learn more')) {
            const levelMap = { 'High': '高', 'Low': '低', 'Medium': '中', 'Fast': '快速' };
            const lvl = levelMap[modelSuffixMatch[2]];
            if (lvl) {
                return `${modelSuffixMatch[1]} ${lvl}`;
            }
        }

        // "You have used some of your weekly limit..." (with or without ellipsis/duration)
        if (/^You have used some of your (?:weekly limit|wee)/i.test(trimmed)) {
            const m = trimmed.match(/^You have used some of your weekly limit,\s*it will fully refresh in\s+(.+?)\.?$/i);
            if (m) {
                return `您已使用了部分每周限制，将在 ${translateDuration(m[1])} 后完全刷新。`;
            }
            return '您已使用了部分每周限制...';
        }
        
        // "You have used some of your 5-hour limit..." (with or without ellipsis/duration)
        if (/^You have used some of your (?:5-hour limit|5-h)/i.test(trimmed)) {
            const m = trimmed.match(/^You have used some of your 5-hour limit,\s*it will fully refresh in\s+(.+?)\.?$/i);
            if (m) {
                return `您已使用了部分 5 小时限制，将在 ${translateDuration(m[1])} 后完全刷新。`;
            }
            return '您已使用了部分 5 小时限制...';
        }
        
        // "X% of the customization budget is available."
        const budgetMatch = trimmed.match(/([\d.]+)%\s+of the customization budget is available\./);
        if (budgetMatch) {
            return `剩余可用自定义额度为 ${budgetMatch[1]}%。`;
        }

        // "Skills (X)"
        const skillsMatch = trimmed.match(/^Skills\s*\((\d+)\)$/i);
        if (skillsMatch) {
            return `技能 (${skillsMatch[1]})`;
        }

        // "Category (X tokens) Y%" / "(X tokens)"
        const tokenBreakdownMatch = trimmed.match(/^(.+?)\s*\(([\d,]+)\s+tokens?\)\s*([\d.]+%?)$/i);
        if (tokenBreakdownMatch) {
            const catMap = { 'Skills': '技能', 'Rules': '规则', 'Plugins': '插件', 'MCP': 'MCP', '技能': '技能', '规则': '规则', '插件': '插件' };
            const cat = catMap[tokenBreakdownMatch[1]] || tokenBreakdownMatch[1];
            return `${cat} (${tokenBreakdownMatch[2]} 个 Token) ${tokenBreakdownMatch[3]}`;
        }
        const tokensOnlyMatch = trimmed.match(/^\(([\d,]+)\s+tokens?\)$/i);
        if (tokensOnlyMatch) {
            return `(${tokensOnlyMatch[1]} 个 Token)`;
        }

        // "Local [^∧>›v∨˅]"
        const localMatch = trimmed.match(/^Local\s*([\^∧>›v∨˅]?)$/i);
        if (localMatch) {
            return `本地${localMatch[1] ? ' ' + localMatch[1] : ''}`;
        }

        // "New Worktree [^∧>›v∨˅]"
        const newWorktreeMatch = trimmed.match(/^New\s+Worktree\s*([\^∧>›v∨˅]?)$/i);
        if (newWorktreeMatch) {
            return `新建工作树${newWorktreeMatch[1] ? ' ' + newWorktreeMatch[1] : ''}`;
        }

        // "Select branch [^∧>›v∨˅]"
        const selectBranchMatch = trimmed.match(/^Select\s+branch\s*([\^∧>›v∨˅]?)$/i);
        if (selectBranchMatch) {
            return `选择分支${selectBranchMatch[1] ? ' ' + selectBranchMatch[1] : ''}`;
        }

        // "Commit/Push/Pull/Sync [^∧>›v∨˅]"
        const gitBtnMatch = trimmed.match(/^(Commit|Push|Pull|Sync)\s*([\^∧>›v∨˅]?)$/i);
        if (gitBtnMatch) {
            const actMap = { 'Commit': '提交', 'Push': '推送', 'Pull': '拉取', 'Sync': '同步' };
            const act = actMap[gitBtnMatch[1]] || gitBtnMatch[1];
            return act + (gitBtnMatch[2] ? ' ' + gitBtnMatch[2] : '');
        }

        // "Show X breakdowns"
        const breakdownMatch = trimmed.match(/^Show\s+(\d+)\s+breakdowns?$/i);
        if (breakdownMatch) {
            return `显示 ${breakdownMatch[1]} 项明细`;
        }

        // "Mark all X conversations as read/unread"
        const markAllConvMatch = trimmed.match(/^Mark\s+all\s+(\d+)\s+conversations?\s+as\s+(read|unread)$/i);
        if (markAllConvMatch) {
            const status = markAllConvMatch[2].toLowerCase() === 'read' ? '已读' : '未读';
            return `将全部 ${markAllConvMatch[1]} 个对话标记为${status}`;
        }
        // "Mark all as read/unread"
        const markAllMatch = trimmed.match(/^Mark\s+all\s+as\s+(read|unread)$/i);
        if (markAllMatch) {
            const status = markAllMatch[1].toLowerCase() === 'read' ? '已读' : '未读';
            return `全部标记为${status}`;
        }

        // "Plugin: plugin_name"
        const pluginMatch = trimmed.match(/^Plugin:\s*(.+)$/i);
        if (pluginMatch) {
            return `插件：${pluginMatch[1]}`;
        }

        // "e.g., example.com"
        const egMatch = trimmed.match(/^e\.g\.,?\s*(.+)$/i);
        if (egMatch) {
            return `例如：${egMatch[1]}`;
        }

        // "(tell the agent what to do instead)"
        if (/^(?:No|否)\s*\((?:tell the agent what to do instead)\)$/i.test(trimmed)) {
            return '否（告诉智能体替代操作）';
        }

        // "Yes, and always allow '<command/path>' in this conversation/project/workspace"
        const allowCmdScopeMatch = trimmed.match(/^Yes,\s+(?:and\s+)?always\s+allow\s+([\s\S]+?)\s+in\s+this\s+(conversation|project|workspace)$/i);
        if (allowCmdScopeMatch) {
            const sMap = { 'conversation': '对话', 'project': '项目', 'workspace': '工作区' };
            const scope = sMap[allowCmdScopeMatch[2].toLowerCase()] || allowCmdScopeMatch[2];
            return `是，且在此${scope}中始终允许 ${allowCmdScopeMatch[1]}`;
        }

        // "Yes, and always allow in this conversation/project/workspace"
        const permScopeMatch = trimmed.match(/^Yes,\s+(?:and\s+)?always\s+allow\s+in\s+this\s+(conversation|project|workspace)$/i);
        if (permScopeMatch) {
            const sMap = { 'conversation': '对话', 'project': '项目', 'workspace': '工作区' };
            return `是，且在此${sMap[permScopeMatch[1].toLowerCase()] || permScopeMatch[1]}中始终允许`;
        }

        // "Yes, and always allow '<command/path>'"
        const allowCmdMatch = trimmed.match(/^Yes,\s+(?:and\s+)?always\s+allow\s+([\s\S]+)$/i);
        if (allowCmdMatch) {
            return `是，且始终允许 ${allowCmdMatch[1]}`;
        }

        // "No, and always deny '<command/path>' in this conversation/project/workspace"
        const denyCmdScopeMatch = trimmed.match(/^No,\s+(?:and\s+)?always\s+deny\s+([\s\S]+?)\s+in\s+this\s+(conversation|project|workspace)$/i);
        if (denyCmdScopeMatch) {
            const sMap = { 'conversation': '对话', 'project': '项目', 'workspace': '工作区' };
            const scope = sMap[denyCmdScopeMatch[2].toLowerCase()] || denyCmdScopeMatch[2];
            return `否，且在此${scope}中始终拒绝 ${denyCmdScopeMatch[1]}`;
        }

        // "No, and always deny '<command/path>'"
        const denyCmdMatch = trimmed.match(/^No,\s+(?:and\s+)?always\s+deny\s+([\s\S]+)$/i);
        if (denyCmdMatch) {
            return `否，且始终拒绝 ${denyCmdMatch[1]}`;
        }

        // "Are you sure you want to delete the project <name>?"
        const delProjMatch = trimmed.match(/^Are you sure you want to delete the project\s+([\s\S]+?)\??$/i);
        if (delProjMatch) {
            return `您确定要删除项目 ${delProjMatch[1]} 吗？`;
        }

        // "This will permanently delete X active/archived conversations within it."
        const delCountMatch = trimmed.match(/^This will permanently delete\s+(\d+)\s+(active|archived)?\s*conversations?\s+within\s+it\.?$/i);
        if (delCountMatch) {
            const type = delCountMatch[2] ? (delCountMatch[2].toLowerCase() === 'active' ? '活跃' : '已归档') : '';
            return `这将永久删除其中的 ${delCountMatch[1]} 个${type}对话。`;
        }

        // "X active/archived conversations"
        const activeConvMatch = trimmed.match(/^(\d+)\s+(active|archived)\s+conversations?$/i);
        if (activeConvMatch) {
            const type = activeConvMatch[2].toLowerCase() === 'active' ? '活跃' : '已归档';
            return `${activeConvMatch[1]} 个${type}对话`;
        }

        // "to be installed. The browser subagent can be invoked by typing /browser in the conversation input box."
        if (/^to be installed\.?\s*(?:The browser subagent can be invoked by typing\s*\/browser\s*in the conversation input box\.?)?$/i.test(trimmed)) {
            if (/browser subagent/i.test(trimmed)) {
                return '。可以通过在对话输入框中输入 /browser 来调用浏览器子智能体。';
            }
            return '。';
        }
        if (/^The browser subagent can be invoked by typing\s*\/browser\s*in the conversation input box\.?$/i.test(trimmed)) {
            return '可以通过在对话输入框中输入 /browser 来调用浏览器子智能体。';
        }

        return null;
    }

    function translateAttributes(el) {
        if (!el || el.nodeType !== Node.ELEMENT_NODE) return;
        const attrs = ['title', 'aria-label', 'data-tooltip', 'placeholder'];
        for (let i = 0; i < attrs.length; i++) {
            const attr = attrs[i];
            if (el.hasAttribute(attr)) {
                const val = el.getAttribute(attr);
                if (val) {
                    const trans = translateText(val);
                    if (trans !== null && val !== trans) {
                        el.setAttribute(attr, trans);
                    }
                }
            }
        }
    }

    function translateNode(node) {
        if (!node) return;
        if (node.nodeType === Node.TEXT_NODE) {
            if (shouldSkipTranslation(node)) {
                return;
            }
            const currentVal = node.nodeValue;
            if (!currentVal) return;
            const translated = translateText(currentVal);
            if (translated !== null && currentVal !== translated) {
                node.nodeValue = translated;
            }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            translateAttributes(node);
            if (shouldSkipElement(node)) {
                return;
            }
            for (let child = node.firstChild; child; child = child.nextSibling) {
                translateNode(child);
            }
        }
    }

    const observer = new MutationObserver((mutations) => {
        for (let i = 0; i < mutations.length; i++) {
            const mutation = mutations[i];
            if (mutation.type === 'childList') {
                for (let j = 0; j < mutation.addedNodes.length; j++) {
                    translateNode(mutation.addedNodes[j]);
                }
            } else if (mutation.type === 'characterData') {
                const target = mutation.target;
                if (!target || shouldSkipTranslation(target)) continue;
                const currentVal = target.nodeValue;
                if (!currentVal) continue;
                const translated = translateText(currentVal);
                if (translated !== null && currentVal !== translated) {
                    target.nodeValue = translated;
                }
            } else if (mutation.type === 'attributes') {
                const target = mutation.target;
                if (!target) continue;
                translateAttributes(target);
            }
        }
    });

    function startTranslation() {
        loadDynamicRules();
        if (!document.body) {
            window.addEventListener('DOMContentLoaded', startTranslation, { once: true });
            return;
        }
        translateNode(document.body);
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true,
            attributes: true,
            attributeFilter: ['title', 'aria-label', 'data-tooltip', 'placeholder']
        });
    }

    try {
        window.addEventListener('focus', () => {
            loadDynamicRules();
            if (document.body) {
                translateNode(document.body);
            }
        });
    } catch (_) {}

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startTranslation, { once: true });
    } else {
        startTranslation();
    }
})();
