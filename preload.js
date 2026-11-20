"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WCV_HUB_PROBE_POINT_RESPONSE_CHANNEL = exports.WCV_HUB_PROBE_POINT_CHANNEL = exports.WCV_HUB_CURSOR_HOLE_STATE_CHANNEL = exports.WCV_THREE_LAYER_STACK_ARG = void 0;
exports.isBareBrowserHoleAtDip = isBareBrowserHoleAtDip;
exports.installWcvThreeLayerHoleReporter = installWcvThreeLayerHoleReporter;
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
let deviceChooserSubscriberCount = 0;
const dialogAPI = {
    showOpenDialog: () => electron_1.ipcRenderer.invoke('dialog:open-workspace'),
    showOpenMultipleFolderDialog: () => electron_1.ipcRenderer.invoke('dialog:open-workspaces'),
};
const notificationAPI = {
    send: (options) => {
        if (options) {
            if (typeof options.title === 'string') {
                const t = translateText(options.title);
                if (t) options.title = t;
            }
            if (typeof options.body === 'string') {
                options.body = options.body
                    .replace(/Requesting\s+(?:your\s+)?permission\s+in\s+(?:the\s+)?Terminal[:：]?\s*/gi, '正在终端中请求您的权限：\n')
                    .replace(/Requesting\s+(?:your\s+)?permission\s+to\s+open\s+URL[:：]?\s*/gi, '正在请求打开网址的权限：\n')
                    .replace(/Requesting\s+(?:your\s+)?permission\s+to\s+execute\s+JavaScript[:：]?\s*/gi, '正在请求执行 JavaScript 的权限：\n')
                    .replace(/Requesting\s+(?:your\s+)?permission[:：]?\s*/gi, '正在请求您的权限：\n')
                    .replace(/^Command[:：]?\s*/gim, '命令：')
                    .replace(/\bCommand[:：]?\s*/gi, '命令：')
                    .replace(/^URL[:：]?\s*/gim, '网址：')
                    .replace(/\bURL[:：]?\s*/gi, '网址：');
            }
        }
        return electron_1.ipcRenderer.invoke('notification:send', options);
    },
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
// Native API
// Mirrors utils.ts's WCV_THREE_LAYER_STACK_ARG: a sandboxed preload can't
// import it. Declared before `wcvBrowserAPI`, which reads it at load time.
exports.WCV_THREE_LAYER_STACK_ARG = '--agy-wcv-three-layer-stack=1';
function subscribeIpcChannel(channel, callback) {
    const handler = (_event, payload) => {
        callback(payload);
    };
    electron_1.ipcRenderer.on(channel, handler);
    return () => {
        electron_1.ipcRenderer.removeListener(channel, handler);
    };
}
const wcvBrowserAPI = {
    isThreeLayerStack: Array.isArray(process.argv) &&
        process.argv.includes(exports.WCV_THREE_LAYER_STACK_ARG),
    acquire: (req) => electron_1.ipcRenderer.invoke('wcv:acquire', req),
    show: (tabKey, boundsCss, options) => options !== undefined
        ? electron_1.ipcRenderer.invoke('wcv:show', tabKey, boundsCss, options)
        : electron_1.ipcRenderer.invoke('wcv:show', tabKey, boundsCss),
    hide: (tabKey) => electron_1.ipcRenderer.invoke('wcv:hide', tabKey),
    setBounds: (tabKey, boundsCss, options) => {
        if (options !== undefined) {
            electron_1.ipcRenderer.send('wcv:set-bounds-sync', tabKey, boundsCss, options);
        }
        else {
            electron_1.ipcRenderer.send('wcv:set-bounds-sync', tabKey, boundsCss);
        }
        return Promise.resolve();
    },
    setThemeColor: (color) => electron_1.ipcRenderer.invoke('wcv:set-theme-color', color),
    setPinned: (tabKey, pinned) => electron_1.ipcRenderer.invoke('wcv:set-pinned', tabKey, pinned),
    setAgentControlling: (tabKey, active) => electron_1.ipcRenderer.invoke('wcv:set-agent-controlling', tabKey, active),
    setOverlayActive: (tabKey, active) => electron_1.ipcRenderer.invoke('wcv:set-overlay-active', tabKey, active),
    setPortalOverlayOpen: (open) => electron_1.ipcRenderer.invoke('wcv:set-portal-overlay-open', open),
    elevate: (tabKey, reason, focusBrowser) => electron_1.ipcRenderer.invoke('wcv:elevate', tabKey, reason, focusBrowser),
    setDragOver: (tabKey, active) => electron_1.ipcRenderer.invoke('wcv:set-drag-over', tabKey, active),
    demote: (tabKey, reason) => electron_1.ipcRenderer.invoke('wcv:demote', tabKey, reason),
    find: (tabKey, text, options, token) => electron_1.ipcRenderer.invoke('wcv:find', tabKey, text, options, token),
    stopFind: (tabKey, action) => electron_1.ipcRenderer.invoke('wcv:stop-find', tabKey, action),
    focusHub: (tabKey) => electron_1.ipcRenderer.invoke('wcv:focus-hub', tabKey),
    navigate: (tabKey, url) => electron_1.ipcRenderer.invoke('wcv:navigate', tabKey, url),
    control: (tabKey, action) => electron_1.ipcRenderer.invoke('wcv:control', tabKey, action),
    sendMouse: (tabKey, params, coordSpace) => coordSpace !== undefined
        ? electron_1.ipcRenderer.invoke('wcv:send-mouse', tabKey, params, coordSpace)
        : electron_1.ipcRenderer.invoke('wcv:send-mouse', tabKey, params),
    sendKey: (tabKey, params) => electron_1.ipcRenderer.invoke('wcv:send-key', tabKey, params),
    insertText: (tabKey, text) => electron_1.ipcRenderer.invoke('wcv:insert-text', tabKey, text),
    setViewportSize: (tabKey, size) => electron_1.ipcRenderer.invoke('wcv:set-viewport-size', tabKey, size),
    capturePage: (tabKey) => electron_1.ipcRenderer.invoke('wcv:capture-page', tabKey),
    dispose: (tabKey) => electron_1.ipcRenderer.invoke('wcv:dispose', tabKey),
    onGuestEvent: (cb) => subscribeIpcChannel('wcv:guest-event', cb),
    onZOrderChanged: (cb) => subscribeIpcChannel('wcv:z-order-changed', cb),
    onShortcutForwarded: (cb) => subscribeIpcChannel('wcv:shortcut-forwarded', cb),
    onCursorChanged: (cb) => subscribeIpcChannel('wcv:cursor-changed', cb),
};
let promptRequestSubscriberCount = 0;
const electronNativeAPI = {
    getZoomLevel: () => electron_1.webFrame.getZoomFactor(),
    getPathForFile: (file) => electron_1.webUtils.getPathForFile(file),
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
    onWebviewDeviceChooserEvent: (callback) => {
        if (++deviceChooserSubscriberCount === 1) {
            electron_1.ipcRenderer.send('webview:device-chooser-subscriber-state', true);
        }
        const unsubscribe = subscribeIpcChannel('webview:device-chooser-event', callback);
        let active = true;
        return () => {
            if (!active) {
                return;
            }
            active = false;
            unsubscribe();
            if (--deviceChooserSubscriberCount === 0) {
                electron_1.ipcRenderer.send('webview:device-chooser-subscriber-state', false);
            }
        };
    },
    respondWebviewDeviceChooser: (requestId, resolution) => electron_1.ipcRenderer.invoke('webview:device-chooser-response', requestId, resolution),
    getWebviewMemoryUsage: (webContentsIds) => electron_1.ipcRenderer.invoke('webview:get-memory-usage', webContentsIds),
    getDefaultDownloadDirectory: () => electron_1.ipcRenderer.invoke('dialog:get-default-download-dir'),
    showContextMenu: (items) => electron_1.ipcRenderer.invoke('window:show-context-menu', items),
    closeContextMenu: () => electron_1.ipcRenderer.invoke('window:close-context-menu'),
    executeJavaScriptInIsolatedWorld: (wcId, worldId, code) => electron_1.ipcRenderer.invoke('webview:execute-js-isolated-world', wcId, worldId, code),
    scriptJailProtocol: 2,
    listWebviewFrames: (wcId, options) => electron_1.ipcRenderer.invoke('webview:list-frames', wcId, options),
    executeJavaScriptInFrameIsolatedWorld: (wcId, frameId, code, expectedOrigin, options) => electron_1.ipcRenderer.invoke('webview:execute-js-frame-isolated-world', wcId, frameId, code, expectedOrigin, options),
    runScriptInJail: (req) => electron_1.ipcRenderer.invoke('script-jail:run', req),
    abortScriptJail: (jailId) => electron_1.ipcRenderer.invoke('script-jail:abort', jailId),
    warmScriptJail: () => electron_1.ipcRenderer.invoke('script-jail:warm'),
    subscribeWebviewSecurityState: (webContentsId, callback) => {
        // The push channel and the initial fetch can race; `seq` orders them.
        let latestSeq = 0;
        let subscribed = true;
        const deliver = (state) => {
            if (!subscribed ||
                !state ||
                state.webContentsId !== webContentsId ||
                state.seq <= latestSeq) {
                return;
            }
            latestSeq = state.seq;
            callback(state);
        };
        const handler = (_event, state) => {
            deliver(state);
        };
        electron_1.ipcRenderer.on('webview:security-state-changed', handler);
        void electron_1.ipcRenderer
            .invoke('webview:get-security-state', webContentsId)
            .then(deliver, () => undefined);
        return () => {
            subscribed = false;
            electron_1.ipcRenderer.removeListener('webview:security-state-changed', handler);
        };
    },
    allowWebviewCertificate: (webContentsId, url) => electron_1.ipcRenderer.invoke('webview:allow-certificate', webContentsId, url),
    clearWebviewSiteData: (webContentsId, origin) => electron_1.ipcRenderer.invoke('webview:clear-site-data', webContentsId, origin),
    onWebviewOpenNewTab: (callback) => {
        const handler = (_event, url, webContentsId) => {
            callback(url, webContentsId);
        };
        electron_1.ipcRenderer.on('webview:open-new-tab', handler);
        return () => {
            electron_1.ipcRenderer.removeListener('webview:open-new-tab', handler);
        };
    },
    setWebviewDownloadDirectory: (webContentsId, downloadDir) => electron_1.ipcRenderer.invoke('webview:set-download-dir', webContentsId, downloadDir),
    setWebviewAgentControlled: (webContentsId, active) => electron_1.ipcRenderer.invoke('webview:set-agent-controlled', webContentsId, active),
    openWebviewDownload: (downloadId) => electron_1.ipcRenderer.invoke('webview:open-download', downloadId),
    showWebviewDownloadInFolder: (downloadId) => electron_1.ipcRenderer.invoke('webview:show-download-in-folder', downloadId),
    cancelWebviewDownload: (downloadId) => electron_1.ipcRenderer.invoke('webview:cancel-download', downloadId),
    resolveWebviewDownload: (downloadId, approve) => electron_1.ipcRenderer.invoke('webview:resolve-download', downloadId, approve),
    selectDownloadDirectory: (defaultPath) => electron_1.ipcRenderer.invoke('dialog:select-download-dir', defaultPath),
    onWebviewFaviconUpdated: (callback) => {
        const handler = (_event, payload) => {
            callback(payload);
        };
        electron_1.ipcRenderer.on('webview:favicon-updated', handler);
        return () => {
            electron_1.ipcRenderer.removeListener('webview:favicon-updated', handler);
        };
    },
    onWebviewDownloadProgress: (callback) => {
        const handler = (_event, payload) => {
            callback(payload);
        };
        electron_1.ipcRenderer.on('webview:download-progress', handler);
        return () => {
            electron_1.ipcRenderer.removeListener('webview:download-progress', handler);
        };
    },
    setWebviewDialogPolicy: (webContentsId, policy) => electron_1.ipcRenderer.invoke('webview:set-dialog-policy', webContentsId, policy),
    handleWebviewDialog: (webContentsId, decision) => electron_1.ipcRenderer.invoke('webview:handle-javascript-dialog', webContentsId, decision),
    onWebviewDialogOpening: (callback) => subscribeIpcChannel('webview:javascript-dialog-opening', callback),
    getWebviewNetworkRequests: (webContentsId) => electron_1.ipcRenderer.invoke('webview:get-network-requests', webContentsId),
    clearWebviewNetworkRequests: (webContentsId) => electron_1.ipcRenderer.invoke('webview:clear-network-requests', webContentsId),
    onWebviewNetworkRequest: (callback) => subscribeIpcChannel('webview:network-request-updated', callback),
    onWebviewPromptRequest: (callback) => {
        promptRequestSubscriberCount += 1;
        if (promptRequestSubscriberCount === 1) {
            electron_1.ipcRenderer.send('webview:prompt-subscriber-state', true);
        }
        const unsubscribe = subscribeIpcChannel('webview:prompt-request', callback);
        let active = true;
        return () => {
            if (!active) {
                return;
            }
            active = false;
            unsubscribe();
            promptRequestSubscriberCount = Math.max(0, promptRequestSubscriberCount - 1);
            if (promptRequestSubscriberCount === 0) {
                electron_1.ipcRenderer.send('webview:prompt-subscriber-state', false);
            }
        };
    },
    respondWebviewPrompt: (promptId, value) => electron_1.ipcRenderer.invoke('webview:prompt-response', promptId, value),
    setWebviewFileChooserPolicy: (webContentsId, policy) => electron_1.ipcRenderer.invoke('webview:set-file-chooser-policy', webContentsId, policy),
    handleWebviewFileChooser: (webContentsId, decision) => electron_1.ipcRenderer.invoke('webview:handle-file-chooser', webContentsId, decision),
    setWebviewInputFiles: (webContentsId, request) => electron_1.ipcRenderer.invoke('webview:set-input-files', webContentsId, request),
    resolveWebviewUploadFiles: (request) => electron_1.ipcRenderer.invoke('webview:resolve-upload-files', request),
    onWebviewFileChooserOpened: (callback) => subscribeIpcChannel('webview:file-chooser-opened', callback),
    setWebviewWebMcpEnabled: (enabled) => electron_1.ipcRenderer.invoke('webview:webmcp-set-enabled', enabled),
    listWebviewWebMcpTools: (webContentsId, origin) => electron_1.ipcRenderer.invoke('webview:webmcp-list-tools', webContentsId, origin),
    callWebviewWebMcpTool: (webContentsId, origin, params) => electron_1.ipcRenderer.invoke('webview:webmcp-call-tool', webContentsId, origin, params),
    cancelWebviewWebMcpToolCall: (webContentsId, callId) => electron_1.ipcRenderer.invoke('webview:webmcp-cancel-tool-call', webContentsId, callId),
    wcvBrowser: wcvBrowserAPI,
};
// SSH windows (a switch in additionalArguments): the LS and its paths are
// remote, so laptop file APIs are hidden and the toolkit uses remote ones.
const BACKEND_SWITCH = '--agy-backend=';
const isRemoteWindow = process.argv
    .find((a) => a.startsWith(BACKEND_SWITCH))
    ?.slice(BACKEND_SWITCH.length) === 'ssh';
// SSH windows have no script jail.
if (!isRemoteWindow) {
    electron_1.ipcRenderer.on('agy-script-jail:port', (event, payload) => {
        window.postMessage({
            type: 'agy-script-jail-port',
            jailId: payload?.jailId,
        }, '*', event.ports);
    });
}
const ideAPI = {
    isInstalled: () => electron_1.ipcRenderer.invoke('ide:is-installed'),
};
const wslAPI = {
    getState: () => electron_1.ipcRenderer.invoke('wsl:get-state'),
    connect: (distro) => electron_1.ipcRenderer.invoke('wsl:connect', distro),
};
const desktopMicAPI = {
    getAccessStatus: () => electron_1.ipcRenderer.invoke('mic:get-access-status'),
    requestAccess: () => electron_1.ipcRenderer.invoke('mic:request-access'),
    openSystemPreferences: () => electron_1.ipcRenderer.invoke('mic:open-system-preferences'),
};
function createLocalSshRemoteAPI() {
    const progressCallbacks = new Map();
    // A random start: a connect from before a reload can't match a new call.
    let lastRequestId = Math.floor(Math.random() * 2 ** 30);
    electron_1.ipcRenderer.on('ssh:progress', (_event, progress) => {
        const callback = typeof progress?.requestId === 'number'
            ? progressCallbacks.get(progress.requestId)
            : undefined;
        if (callback && typeof progress?.message === 'string') {
            try {
                callback(progress.message);
            }
            catch {
                // The page's callback failed; the connect goes on.
            }
        }
    });
    return {
        kind: 'local',
        getState: () => electron_1.ipcRenderer.invoke('ssh:get-state'),
        listHosts: (options) => electron_1.ipcRenderer.invoke('ssh:list-hosts', { configFile: options?.configFile }),
        chooseConfigFile: () => electron_1.ipcRenderer.invoke('ssh:choose-config-file'),
        // Only these fields cross, as plain values.
        forgetRecentHost: (entry) => electron_1.ipcRenderer.invoke('ssh:forget-recent-host', {
            host: entry?.host,
            configFile: entry?.configFile,
        }),
        connect: async (host, options) => {
            const requestId = ++lastRequestId;
            const onProgress = options?.onProgress;
            if (typeof onProgress === 'function') {
                progressCallbacks.set(requestId, onProgress);
            }
            try {
                return await electron_1.ipcRenderer.invoke('ssh:connect', host, {
                    requestId,
                    intent: options?.intent,
                    configFile: options?.configFile,
                });
            }
            catch {
                // The main process refused the call: still a result, not a rejection.
                return {
                    ok: false,
                    code: 'UNKNOWN',
                    message: "Couldn't connect to the SSH host. See the app log.",
                };
            }
            finally {
                progressCallbacks.delete(requestId);
            }
        },
    };
}
function createRemoteSshRemoteAPI() {
    const intentCallbacks = new Set();
    const takeIntent = async () => {
        let intent;
        try {
            intent = await electron_1.ipcRenderer.invoke('ssh:take-intent');
        }
        catch {
            // The page is going away, or its window is no longer an SSH window.
            return;
        }
        if (intent !== 'newProject') {
            return;
        }
        for (const callback of [...intentCallbacks]) {
            try {
                callback(intent);
            }
            catch {
                // The page's callback failed.
            }
        }
    };
    electron_1.ipcRenderer.on('ssh:intent', () => {
        if (intentCallbacks.size > 0) {
            void takeIntent();
        }
    });
    return {
        kind: 'ssh',
        getState: () => electron_1.ipcRenderer.invoke('ssh:get-state'),
        stopServer: () => electron_1.ipcRenderer.invoke('ssh:stop-server'),
        onIntent: (callback) => {
            if (typeof callback !== 'function') {
                return () => { };
            }
            intentCallbacks.add(callback);
            void takeIntent();
            return () => {
                intentCallbacks.delete(callback);
            };
        },
        openLocalWindow: async () => {
            try {
                await electron_1.ipcRenderer.invoke('ssh:open-local-window');
            }
            catch {
                // Refused, e.g. while this window isn't focused.
            }
        },
    };
}
function actorIdsOf(v) {
    return Array.isArray(v)
        ? v.filter((x) => typeof x === 'string').slice(0, 32)
        : [];
}
function permissionsOf(v) {
    const o = (v && typeof v === 'object' ? v : {});
    return {
        accessibility: o['accessibility'] === true,
        screenRecording: o['screenRecording'] === true,
        screenRecordingNeedsRelaunch: o['screenRecordingNeedsRelaunch'] === true,
    };
}
const computerPreviewAPI = {
    open: () => electron_1.ipcRenderer.invoke('computer-preview:open'),
    answer: (sessionId, sdp) => electron_1.ipcRenderer.invoke('computer-preview:answer', sessionId, sdp),
    renew: (sessionId) => electron_1.ipcRenderer.invoke('computer-preview:renew', sessionId),
    close: (sessionId) => electron_1.ipcRenderer.invoke('computer-preview:close', sessionId),
    getActive: () => electron_1.ipcRenderer.invoke('computer-preview:get-active'),
    onActive: (callback) => {
        const handler = (_event, active) => {
            callback(active === true);
        };
        electron_1.ipcRenderer.on('computer-preview:active', handler);
        return () => {
            electron_1.ipcRenderer.removeListener('computer-preview:active', handler);
        };
    },
    getActiveAgents: async () => actorIdsOf(await electron_1.ipcRenderer.invoke('computer-preview:get-active-agents')),
    onActiveAgents: (callback) => {
        const handler = (_event, ids) => {
            callback(actorIdsOf(ids));
        };
        electron_1.ipcRenderer.on('computer-preview:active-agents', handler);
        return () => {
            electron_1.ipcRenderer.removeListener('computer-preview:active-agents', handler);
        };
    },
    getPermissions: async () => permissionsOf(await electron_1.ipcRenderer.invoke('computer-permissions:get')),
    openPermissionSettings: async (pane) => {
        if (pane !== 'accessibility' && pane !== 'screenRecording') {
            throw new Error('openPermissionSettings: unknown pane');
        }
        await electron_1.ipcRenderer.invoke('computer-permissions:open-settings', pane);
    },
    relaunchApp: async () => {
        await electron_1.ipcRenderer.invoke('computer-permissions:relaunch');
    },
};
electron_1.contextBridge.exposeInMainWorld('nativeNotifications', notificationAPI);
electron_1.contextBridge.exposeInMainWorld('nativeStorage', storageAPI);
electron_1.contextBridge.exposeInMainWorld('agent', agentAPI);
// Sidecar UIs: the toolkit maps them to plugin:// only where this exists. A
// local window's send sets the laptop's map; an SSH window's only refreshes
// its host's, which main builds from the host's server (remoteSidecars.ts).
electron_1.contextBridge.exposeInMainWorld('extensions', extensionsAPI);
if (isRemoteWindow) {
    // No laptop-only APIs (updater, logs, deep links with auth codes; main
    // refuses them too). Of electronNative, no built-in browser,
    // script jail or getPathForFile: dropped files get uploaded
    // instead of passing laptop paths to the remote agent. Remote paths can't
    // be shown in Finder either.
    // The toolkit uses window.sshRemote only where window.electronNative exists.
    const remoteNative = {
        getZoomLevel: electronNativeAPI.getZoomLevel,
        setTitleBarOverlay: electronNativeAPI.setTitleBarOverlay,
        minimize: electronNativeAPI.minimize,
        maximize: electronNativeAPI.maximize,
        unmaximize: electronNativeAPI.unmaximize,
        isMaximized: electronNativeAPI.isMaximized,
        close: electronNativeAPI.close,
        toggleDevTools: electronNativeAPI.toggleDevTools,
        zoomIn: electronNativeAPI.zoomIn,
        zoomOut: electronNativeAPI.zoomOut,
        resetZoom: electronNativeAPI.resetZoom,
        openExternal: electronNativeAPI.openExternal,
        showContextMenu: electronNativeAPI.showContextMenu,
        closeContextMenu: electronNativeAPI.closeContextMenu,
        revealInFilePicker: () => Promise.resolve(),
    };
    electron_1.contextBridge.exposeInMainWorld('electronNative', remoteNative);
    electron_1.contextBridge.exposeInMainWorld('sshRemote', createRemoteSshRemoteAPI());
    // Read-only, so a mic blocked in the OS settings says so here too: the
    // toolkit takes the bridge only with all three methods. requestAccess reads
    // the status (main refuses mic:request-access): getUserMedia shows the OS
    // prompt once the user allows this host the mic.
    // The toolkit's contract (useVoiceBridge.ts's hostMayAsk): in an SSH window
    // desktopMic means the Hub asks once per host before the mic opens, so
    // voice waits on getUserMedia with no timeout until it first opens. The
    // mic permission reads granted until the user says Don't Allow, and denied
    // after; a refusal that still reads granted is "no answer" (an unfocused
    // window, an answer within the arming time, a closed window or dropped
    // host), which voice offers to try again. The question may also wait for
    // another sheet on the window. Change these and voice in SSH windows breaks.
    // TODO(nathanjuan): An explicit sshRemote.getMicAnswer?() instead.
    const remoteDesktopMic = {
        getAccessStatus: desktopMicAPI.getAccessStatus,
        requestAccess: desktopMicAPI.getAccessStatus,
        openSystemPreferences: desktopMicAPI.openSystemPreferences,
    };
    electron_1.contextBridge.exposeInMainWorld('desktopMic', remoteDesktopMic);
}
else {
    electron_1.contextBridge.exposeInMainWorld('electronUpdater', updaterAPI);
    electron_1.contextBridge.exposeInMainWorld('dialog', dialogAPI);
    electron_1.contextBridge.exposeInMainWorld('logs', logsAPI);
    electron_1.contextBridge.exposeInMainWorld('deepLink', deepLinkAPI);
    electron_1.contextBridge.exposeInMainWorld('electronNative', electronNativeAPI);
    electron_1.contextBridge.exposeInMainWorld('ide', ideAPI);
    electron_1.contextBridge.exposeInMainWorld('wsl', wslAPI);
    electron_1.contextBridge.exposeInMainWorld('desktopMic', desktopMicAPI);
    electron_1.contextBridge.exposeInMainWorld('sshRemote', createLocalSshRemoteAPI());
    // Computer pane live preview: this computer's desktop host, local only.
    electron_1.contextBridge.exposeInMainWorld('agyComputerPreview', computerPreviewAPI);
}
const HEX6_RE = /^#[0-9a-fA-F]{6}$/;
const HEX3_RE = /^#([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])$/;
const RGB_RE = /^rgba?\(\s*(\d{1,3})\s*(?:,|\s)\s*(\d{1,3})\s*(?:,|\s)\s*(\d{1,3})(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/i;
const CSS_VAR_RE = /^var\(\s*(--[^,\s)]+)(?:\s*,\s*(.+))?\)$/;
function parseCssColorToHex6(raw) {
    const s = raw.trim();
    if (!s) {
        return undefined;
    }
    if (HEX6_RE.test(s)) {
        return s.toUpperCase();
    }
    const h3 = HEX3_RE.exec(s);
    if (h3) {
        return `#${h3[1]}${h3[1]}${h3[2]}${h3[2]}${h3[3]}${h3[3]}`.toUpperCase();
    }
    const rgb = RGB_RE.exec(s);
    if (!rgb) {
        return undefined;
    }
    if (rgb[4] !== undefined) {
        const a = rgb[4].endsWith('%')
            ? Number(rgb[4].slice(0, -1)) / 100
            : Number(rgb[4]);
        if (!Number.isFinite(a) || a < 1) {
            return undefined;
        }
    }
    const h2 = (v) => Math.max(0, Math.min(255, Math.round(Number(v))))
        .toString(16)
        .padStart(2, '0');
    return `#${h2(rgb[1])}${h2(rgb[2])}${h2(rgb[3])}`.toUpperCase();
}
// TODO(yushis): Push `wcvBrowser.setThemeColor` directly from toolkit `themeProvider`
// and remove this interim `:root` `--background` MutationObserver bridge.
function installHubSurfaceThemeAutoSync() {
    const g = globalThis;
    if (!g.document ||
        typeof g.getComputedStyle !== 'function' ||
        (g.top && g.self && g.top !== g.self)) {
        return;
    }
    let lastSyncedHex = '';
    let observedRoot = null;
    const syncNow = () => {
        const rootEl = g.document?.documentElement;
        if (!rootEl) {
            return;
        }
        if (observedRoot !== rootEl && typeof g.MutationObserver === 'function') {
            observedRoot = rootEl;
            new g.MutationObserver(syncNow).observe(rootEl, {
                attributes: true,
                attributeFilter: ['style', 'class', 'data-theme'],
            });
        }
        const style = g.getComputedStyle?.(rootEl);
        let cur = style?.getPropertyValue?.('--background')?.trim() ?? '';
        for (let depth = 0; depth < 3 && cur; depth++) {
            const hex = parseCssColorToHex6(cur);
            if (hex) {
                cur = hex;
                break;
            }
            const m = CSS_VAR_RE.exec(cur);
            if (!m) {
                break;
            }
            cur = style?.getPropertyValue?.(m[1])?.trim() || m[2]?.trim() || '';
        }
        const hex = parseCssColorToHex6(cur);
        if (hex && hex !== lastSyncedHex) {
            lastSyncedHex = hex;
            void Promise.resolve(electron_1.ipcRenderer.invoke('wcv:set-theme-color', hex)).catch(() => undefined);
        }
    };
    syncNow();
    g.document.addEventListener?.('DOMContentLoaded', syncNow);
    g.addEventListener?.('load', syncNow);
}
const FLAG_KEY = 'jetski.developer.customFlagOverrides';
const MIG_KEY = `${FLAG_KEY}.migrated`;
const WRITE_EV = 'agy-flag-overrides-write';
const parseFlags = (v) => {
    try {
        const p = typeof v === 'string' ? JSON.parse(v) : null;
        return p && typeof p === 'object' && !Array.isArray(p) ? String(v) : null;
    }
    catch {
        return null;
    }
};
/** Hydrates and mirrors `jetski.developer.customFlagOverrides` via `app_storage.json` across ephemeral LS ports. */
function installCustomFlagOverridesSync() {
    const g = globalThis;
    const h = g.location?.hostname;
    const okHost = !g.location ||
        (/^https?:$/.test(g.location.protocol ?? '') &&
            (h === '127.0.0.1' || h === 'localhost'));
    if (!okHost || (g.top && g.self && g.top !== g.self)) {
        return;
    }
    // Own writes not yet acknowledged; their broadcasts are echoed back before
    // the reply, so any broadcast seen meanwhile is superseded by our write.
    let pending = 0;
    const persist = (v) => {
        pending++;
        void Promise.resolve(electron_1.ipcRenderer.invoke('storage:update-items', {
            [FLAG_KEY]: v,
            [MIG_KEY]: 'true',
        }))
            .catch(() => { })
            .finally(() => pending--);
    };
    const runMain = (js) => void Promise.resolve(electron_1.webFrame.executeJavaScript?.(js)).catch(() => { });
    let s;
    let last = null;
    let suppress = false;
    try {
        if (!g.localStorage?.getItem || !g.localStorage.setItem) {
            return;
        }
        s = g.localStorage;
        const m = electron_1.ipcRenderer.sendSync?.('storage:get-items-sync');
        if (!m || typeof m !== 'object') {
            // Untrusted sender or IPC failure: never treat as a fresh install.
            return;
        }
        const kv = m;
        const migrated = MIG_KEY in kv || FLAG_KEY in kv;
        const disk = parseFlags(kv[FLAG_KEY]);
        const localRaw = s.getItem(FLAG_KEY);
        const local = parseFlags(localRaw);
        last = migrated ? disk : local;
        if (disk !== null && localRaw !== disk) {
            s.setItem(FLAG_KEY, disk);
        }
        else if (!migrated && local !== null) {
            persist(local);
        }
        else if (migrated && disk === null && localRaw !== null) {
            s.removeItem?.(FLAG_KEY);
        }
    }
    catch {
        return;
    }
    const syncOut = () => {
        try {
            const raw = suppress ? undefined : s.getItem(FLAG_KEY);
            const next = raw ? parseFlags(raw) : null;
            const valid = raw === null || next !== null;
            if (raw !== undefined && valid && next !== last) {
                last = next;
                persist(next);
            }
        }
        catch {
            // Ignore storage access errors during unload.
        }
    };
    // Not `storage`: that fires when another window on the same origin wrote
    // the shared localStorage, and that window persists its own change.
    [WRITE_EV, 'pagehide', 'beforeunload'].forEach((ev) => g.addEventListener?.(ev, syncOut));
    g.addEventListener?.('visibilitychange', syncOut);
    const kJson = JSON.stringify(FLAG_KEY);
    runMain(`(()=>{const P=window.Storage?.prototype,L=window.localStorage,K=${kJson},E=${JSON.stringify(WRITE_EV)};if(!P||!L||P.__agyFlagHook)return;Object.defineProperty(P,'__agyFlagHook',{value:1});const n=()=>{window.dispatchEvent(new Event(E))},si=P.setItem,ri=P.removeItem,cl=P.clear;P.setItem=function(k,v){si.call(this,k,v);if(this===L&&String(k)===K)n()};P.removeItem=function(k){ri.call(this,k);if(this===L&&String(k)===K)n()};P.clear=function(){cl.call(this);if(this===L)n()}})()`);
    electron_1.ipcRenderer.on('storage:changed', (_e, changes) => {
        const raw = changes && FLAG_KEY in changes ? changes[FLAG_KEY] : undefined;
        const next = raw === null ? null : parseFlags(raw);
        if (raw === undefined || (raw !== null && next === null)) {
            return;
        }
        try {
            const cur = s.getItem(FLAG_KEY);
            if (cur === next) {
                last = next;
                return;
            }
            // A local value not yet persisted (or a newer write from another window
            // sharing this origin) wins over a possibly stale broadcast.
            if (pending > 0 || cur !== last) {
                return;
            }
            last = next;
            suppress = true;
            if (next === null) {
                s.removeItem?.(FLAG_KEY);
            }
            else {
                s.setItem(FLAG_KEY, next);
            }
            runMain(`window.dispatchEvent(new StorageEvent('storage',{key:${kJson},newValue:${JSON.stringify(next)},storageArea:window.localStorage}))`);
        }
        catch {
            // Ignore teardown write failures.
        }
        finally {
            suppress = false;
        }
    });
}
// wcvZOrderController.ts's WCV_HUB_*: a sandboxed preload can't import them.
exports.WCV_HUB_CURSOR_HOLE_STATE_CHANNEL = 'wcv:hub-cursor-hole-state';
exports.WCV_HUB_PROBE_POINT_CHANNEL = 'wcv:hub-probe-point';
exports.WCV_HUB_PROBE_POINT_RESPONSE_CHANNEL = 'wcv:hub-probe-point-response';
const ACTIVE_HOLE_SEL = '[data-browser-hole]:not([data-browser-hole="false"])';
const CAP_PASSIVE = { capture: true, passive: true };
const OBS_OPTS = { childList: true, subtree: true, attributes: true };
const isFin = (v) => typeof v === 'number' && isFinite(v);
const isPosInt = (v) => isFin(v) && v > 0 && v % 1 === 0;
const normZoom = (z) => (isFin(z) && z > 0 ? z : 1);
/** Returns `true` iff window DIP `(dipX, dipY)` hits a leaf `[data-browser-hole]` placeholder. */
function isBareBrowserHoleAtDip(dipX, dipY, doc, rawZoom) {
    const [efp, qs] = [doc?.elementFromPoint, doc?.querySelector];
    const okArgs = isFin(dipX) && isFin(dipY) && typeof efp === 'function';
    if (!okArgs || (typeof qs === 'function' && !qs.call(doc, ACTIVE_HOLE_SEL))) {
        return false;
    }
    const z = normZoom(rawZoom);
    const [cx, cy] = [dipX / z, dipY / z];
    const el = isFin(cx) && isFin(cy) ? efp.call(doc, cx, cy) : null;
    const attr = el?.hasAttribute?.('data-browser-hole')
        ? (el.getAttribute?.('data-browser-hole') ?? 'false')
        : 'false';
    return attr !== 'false' && attr !== '';
}
/** Installs top-frame bare-hole cursor reporting and point-probe responses in flag-on Hub windows. */
function installWcvThreeLayerHoleReporter(deps) {
    const glob = globalThis;
    const isMain = deps?.isMainFrame ?? process.isMainFrame;
    const argv = deps?.argv ?? process.argv;
    const g = deps && 'win' in deps ? deps.win : (glob.window ?? glob);
    const topOk = g && (g.top === undefined || g.top === (g.self ?? g));
    const hasArg = Array.isArray(argv) && argv.includes(exports.WCV_THREE_LAYER_STACK_ARG);
    const canListen = topOk && typeof g?.addEventListener === 'function';
    if (isMain === false || !hasArg || !canListen) {
        return () => { };
    }
    const ipc = deps?.ipc ?? electron_1.ipcRenderer;
    const readZoom = deps?.getZoomFactor ?? (() => electron_1.webFrame.getZoomFactor?.());
    const getZoom = () => normZoom(readZoom());
    const getDoc = () => (deps && 'doc' in deps ? deps.doc : g.document);
    const Obs = g.MutationObserver ?? glob.MutationObserver;
    const hitAt = (x, y) => isBareBrowserHoleAtDip(x, y, getDoc(), getZoom());
    let [disposed, lastSent, rafId] = [false, false, null];
    let lastDip = null;
    let pending = null;
    let [obs, domTarget] = [null, null];
    const flush = () => {
        const [reason, cur] = [pending, lastDip];
        rafId = pending = null;
        if (!disposed && reason && cur) {
            const isHole = hitAt(cur.dipX, cur.dipY);
            const changed = isHole !== lastSent;
            lastSent = isHole;
            if (changed || (reason !== 'stationary-overlay' && isHole)) {
                ipc.send(exports.WCV_HUB_CURSOR_HOLE_STATE_CHANNEL, { ...cur, isHole, reason });
            }
        }
    };
    const schedule = (reason) => {
        if (!disposed && lastDip) {
            pending = reason !== 'stationary-overlay' ? reason : (pending ?? reason);
            const anim = g.requestAnimationFrame ? g : glob;
            if (rafId === null) {
                rafId = anim.requestAnimationFrame?.(flush) ?? null;
            }
        }
    };
    const updateCursor = (ev, reason) => {
        if (!disposed && isFin(ev?.clientX) && isFin(ev?.clientY)) {
            const z = getZoom();
            const [dipX, dipY] = [ev.clientX * z, ev.clientY * z];
            if (isFin(dipX) && isFin(dipY)) {
                lastDip = { dipX, dipY };
                schedule(reason);
            }
        }
    };
    const onMove = (ev) => updateCursor(ev, 'pointermove');
    const onDrag = (ev) => {
        if (ev?.isTrusted !== false) {
            updateCursor(ev, 'dragover');
        }
    };
    const onStationary = () => schedule('stationary-overlay');
    const onProbe = (_ev, req) => {
        const r = !Array.isArray(req) && typeof req === 'object' ? req : null;
        const [id, x, y] = [r?.requestId, r?.dipX, r?.dipY];
        if (!disposed && isPosInt(id) && isFin(x) && isFin(y)) {
            const isHole = hitAt(x, y);
            [lastDip, lastSent] = [{ dipX: x, dipY: y }, isHole];
            ipc.send(exports.WCV_HUB_PROBE_POINT_RESPONSE_CHANNEL, { requestId: id, isHole });
        }
    };
    const attachObs = () => {
        const root = !disposed && !obs ? getDoc()?.documentElement : null;
        if (root && typeof Obs === 'function') {
            (obs = new Obs(onStationary)).observe(root, OBS_OPTS);
        }
        return Boolean(obs);
    };
    const onReady = () => {
        domTarget?.removeEventListener?.('DOMContentLoaded', onReady);
        domTarget = null;
        attachObs();
    };
    const passive = { passive: true };
    g.addEventListener?.('pointermove', onMove, CAP_PASSIVE);
    g.addEventListener?.('dragenter', onDrag, CAP_PASSIVE);
    g.addEventListener?.('dragover', onDrag, CAP_PASSIVE);
    g.addEventListener?.('resize', onStationary, passive);
    g.addEventListener?.('scroll', onStationary, CAP_PASSIVE);
    ipc.on?.(exports.WCV_HUB_PROBE_POINT_CHANNEL, onProbe);
    if (!attachObs() && typeof Obs === 'function') {
        const curDoc = getDoc();
        domTarget = typeof curDoc?.addEventListener === 'function' ? curDoc : g;
        domTarget.addEventListener?.('DOMContentLoaded', onReady);
    }
    return () => {
        if (!disposed) {
            disposed = true;
            domTarget?.removeEventListener?.('DOMContentLoaded', onReady);
            obs?.disconnect();
            if (rafId !== null) {
                (g.cancelAnimationFrame ? g : glob).cancelAnimationFrame?.(rafId);
            }
            domTarget = obs = rafId = pending = null;
            g.removeEventListener?.('pointermove', onMove, CAP_PASSIVE);
            g.removeEventListener?.('dragenter', onDrag, CAP_PASSIVE);
            g.removeEventListener?.('dragover', onDrag, CAP_PASSIVE);
            g.removeEventListener?.('resize', onStationary, passive);
            g.removeEventListener?.('scroll', onStationary, CAP_PASSIVE);
            const off = ipc.removeListener ?? ipc.off;
            off?.call(ipc, exports.WCV_HUB_PROBE_POINT_CHANNEL, onProbe);
        }
    };
}
// Not SSH windows: no built-in browser tabs; flag overrides are the laptop's.
if (!isRemoteWindow) {
    installHubSurfaceThemeAutoSync();
    installCustomFlagOverridesSync();
    installWcvThreeLayerHoleReporter();
}

// DOM Translation Injector to localize the embedded React frontend settings and labels to Chinese.
(() => {
    const translationMap = {
        // --- Common & Global Actions ---
        'File': '文件',
        'Edit': '编辑',
        'View': '查看',
        'Window': '窗口',
        'Help': '帮助',
        'Create Project': '创建项目',
        'Command Palette': '命令面板',
        'Toggle Auxiliary Pane': '切换辅助窗格',
        'Toggle Auxiliary Pane Ctrl+Alt+B': '切换辅助窗格 Ctrl+Alt+B',
        'Toggle Auxiliary Pane (Ctrl+Alt+B)': '切换辅助窗格 (Ctrl+Alt+B)',
        'Auxiliary Pane': '辅助窗格',
        'Toggle Side Panel': '切换侧边面板',
        'Toggle side panel': '切换侧边面板',
        'toggle side panel': '切换侧边面板',
        'Toggle Maximize Side Panel': '切换最大化侧边面板',
        'Toggle maximize side panel': '切换最大化侧边面板',
        'toggle maximize side panel': '切换最大化侧边面板',
        'Maximize Side Panel': '最大化侧边面板',
        'Maximize side panel': '最大化侧边面板',
        'maximize side panel': '最大化侧边面板',
        'Side Panel': '侧边面板',
        'Side panel': '侧边面板',
        'side panel': '侧边面板',
        'Toggle Primary Side Bar': '切换主侧边栏',
        'Toggle Primary Side Bar Ctrl+B': '切换主侧边栏 Ctrl+B',
        'Toggle Primary Side Bar (Ctrl+B)': '切换主侧边栏 (Ctrl+B)',
        'Primary Side Bar': '主侧边栏',
        'Toggle Secondary Side Bar': '切换辅助侧边栏',
        'Secondary Side Bar': '辅助侧边栏',
        'Toggle Panel': '切换面板',
        'Toggle Panel Ctrl+J': '切换面板 Ctrl+J',
        'Toggle Panel (Ctrl+J)': '切换面板 (Ctrl+J)',
        'Panel': '面板',
        'Toggle Full Screen': '切换全屏',
        'Toggle Full Screen F11': '切换全屏 F11',
        'Toggle Fullscreen': '切换全屏',
        'Fullscreen': '全屏',
        'Full Screen': '全屏',
        'Implementation Plan': '实施计划',
        'Walkthrough': '演练说明',
        'Overview': '概览',
        'File Changes': '文件更改',
        'Maximize Pane': '最大化窗格',
        'Restore Pane': '还原窗格',
        'Minimize Pane': '最小化窗格',
        'Close Pane': '关闭窗格',
        'New Artifact': '新建生成物',
        'Create Artifact': '创建生成物',
        'New Tab': '新建标签页',
        'Zoom In': '放大',
        'Zoom Out': '缩小',
        'Reset Zoom': '重置缩放',
        'Actual Size': '实际大小',
        'Minimize': '最小化',
        'Maximize': '最大化',
        'Create New Project': '创建新项目',
        'Filter Projects': '筛选项目',
        'Filter': '筛选',
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
        'Select folder': '选择文件夹',
        'select folder': '选择文件夹',
        'Select Folder(s)': '选择文件夹',
        'Select folder(s)': '选择文件夹',
        'select folder(s)': '选择文件夹',
        'Select Folders': '选择文件夹',
        'Select folders': '选择文件夹',
        'select folders': '选择文件夹',
        'Select File': '选择文件',
        'Select file': '选择文件',
        'select file': '选择文件',
        'Select File(s)': '选择文件',
        'Select file(s)': '选择文件',
        'select file(s)': '选择文件',
        'Select Files': '选择文件',
        'Select files': '选择文件',
        'select files': '选择文件',
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
        'Enable': '启用',
        'enable': '启用',
        'Disable': '停用',
        'disable': '停用',
        'Access grants': '授予的访问权限',
        'Access Grants': '授予的访问权限',
        'Commands and files these agents can use.': '这些智能体可以使用的命令和文件。',
        'Commands and files these agents can use': '这些智能体可以使用的命令和文件',
        'Review permissions': '审查权限',
        'Review Permissions': '审查权限',
        'Manage Permissions': '管理权限',
        'Manage permissions': '管理权限',
        'Restart': '重启',
        'restart': '重启',
        'Restart automation': '重启自动化',
        'Restart Automation': '重启自动化',
        'Type': '类型',
        'type': '类型',
        'Uptime': '运行时间',
        'uptime': '运行时间',
        'Events': '事件',
        'events': '事件',
        'Event': '事件',
        'event': '事件',
        'No events recorded.': '未记录任何事件。',
        'No events recorded': '未记录任何事件',
        'No events found.': '未找到任何事件。',
        'No events found': '未找到任何事件',
        'No events': '暂无事件',
        'No events yet': '暂无事件',
        'No events yet.': '暂无事件。',
        'No folders added yet.': '尚未添加任何文件夹。',
        'No folders added yet': '尚未添加任何文件夹',
        'No folders added.': '未添加任何文件夹。',
        'No folders added': '未添加任何文件夹',
        'Global Permissions': '全局权限',
        'Global permissions': '全局权限',
        'global permissions': '全局权限',
        'Global Permission': '全局权限',
        'Inherit Global': '继承全局',
        'inherit global': '继承全局',
        'Inherits your Global Permissions when working in this project.': '在此项目中工作时继承您的全局权限。',
        'Inherits your Global Permissions when working in this project': '在此项目中工作时继承您的全局权限',
        'Plan Review Policy': '规划审查策略',
        'Plan review policy': '规划审查策略',
        'Type / and select plan to have the agent generate a plan.': '输入 / 并选择 plan 让智能体生成计划。',
        'Type / and select plan to have the agent generate a plan': '输入 / 并选择 plan 让智能体生成计划',
        'Type / and select plan to have the agent propose a structured plan before executing.': '输入 / 并选择 plan，让智能体在执行前提出结构化计划。',
        'Type / and select plan to have the agent propose a structured plan before executing': '输入 / 并选择 plan，让智能体在执行前提出结构化计划',
        'and select plan to have the agent generate a plan.': '并选择 plan 让智能体生成计划。',
        'and select plan to have the agent generate a plan': '并选择 plan 让智能体生成计划',
        'to have the agent generate a plan.': '让智能体生成计划。',
        'to have the agent generate a plan': '让智能体生成计划',
        'and select': '并选择',
        'and select ': '并选择 ',
        'The breakdown below shows token usage from customizations like rules, skills, and MCP. If a budget is exceeded, large rules are demoted to path pointers and large customizations are excluded automatically.': '下方明细显示了来自规则、技能和 MCP 等自定义项的 Token 使用情况。如果超出预算，大型规则将降级为路径指针，且大型自定义项将自动排除。',
        'Other Customizations': '其他自定义',
        'other customizations': '其他自定义',
        'Mcp Tools': 'MCP 工具',
        'mcp tools': 'MCP 工具',
        'MCP Tools': 'MCP 工具',
        'MCP tools': 'MCP 工具',
        'Global': '全局',
        'global': '全局',
        'Leaving Soon': '即将下线',
        'Leaving soon': '即将下线',
        'leaving soon': '即将下线',
        'Project already exists': '项目已存在',
        'Project already exists.': '项目已存在。',
        'Create New': '新建',
        'Create new': '新建',
        'create new': '新建',
        'Use Existing': '使用现有项目',
        'Use existing': '使用现有项目',
        'use existing': '使用现有项目',
        'already exists for this folder. Would you like to continue using it or make a new one?': '已存在于此文件夹。您想继续使用它还是新建一个？',
        'already exists for this folder. Would you like to continue using it or create a new one?': '已存在于此文件夹。您想继续使用它还是新建一个？',
        'already exists for this folder.': '已存在于此文件夹。',
        'already exists for this folder': '已存在于此文件夹',
        'Would you like to continue using it or make a new one?': '您想继续使用它还是新建一个？',
        'Would you like to continue using it or create a new one?': '您想继续使用它还是新建一个？',
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
        'Delete Project': '删除项目',
        'Delete project': '删除项目',
        'Danger Zone': '危险区域',
        'Danger zone': '危险区域',
        'Permanently delete': '永久删除',
        'Permanently delete ': '永久删除 ',
        'including': '包括',
        'Open MCP Config': '打开 MCP 配置',
        'Open MCP config': '打开 MCP 配置',
        'Open MCP Configuration': '打开 MCP 配置',
        'Open MCP configuration': '打开 MCP 配置',
        'Update Available': '有可用更新',
        'Update Available →': '有可用更新 →',
        'Update Available ->': '有可用更新 →',
        'Update available': '有可用更新',
        'Update available →': '有可用更新 →',
        'Update available ->': '有可用更新 →',
        'Restart to Update': '重启以应用更新',
        'Restart to Update →': '重启以应用更新 →',
        'Restart to Update ->': '重启以应用更新 →',
        'Restart to update': '重启以应用更新',
        'Restart to update →': '重启以应用更新 →',
        'Restart to update ->': '重启以应用更新 →',
        'Downloading Update': '正在下载更新',
        'Downloading Update...': '正在下载更新...',
        'Downloading update': '正在下载更新',
        'Downloading update...': '正在下载更新...',
        'Downloading...': '正在下载...',
        'Checking for Updates...': '正在检查更新...',
        'Checking for updates...': '正在检查更新...',
        'Browse and enable plugins from the Build With Google catalog.': '浏览并启用 Build With Google 目录中的插件。',
        'Browse and enable plugins from the Build With Google catalog': '浏览并启用 Build With Google 目录中的插件',
        'Planning mode has moved to /plan': '规划模式已迁移至 /plan',
        'Planning mode has moved to /plan.': '规划模式已迁移至 /plan。',
        'Planning Mode': '规划模式',
        'Planning mode': '规划模式',
        'planning mode': '规划模式',
        'Plan carefully before executing a task.': '在执行任务前仔细规划。',
        'Plan carefully before executing a task': '在执行任务前仔细规划',
        'Use /plan to explicitly ask your agent to generate a structured plan before implementation.': '在实施前使用 /plan 明确要求智能体生成结构化计划。',
        'Use /plan to explicitly ask your agent to generate a structured plan before implementation': '在实施前使用 /plan 明确要求智能体生成结构化计划',
        'Run a task autonomously until the goal is achieved.': '自主运行任务直至达成目标。',
        'Run a task autonomously until the goal is achieved': '自主运行任务直至达成目标',
        'Run an instruction on a recurring schedule or set a timer.': '按循环计划运行指令或设置定时器。',
        'Run an instruction on a recurring schedule or set a timer': '按循环计划运行指令或设置定时器',
        'Interact with web pages and browse the internet.': '与网页交互并浏览互联网。',
        'Interact with web pages and browse the internet': '与网页交互并浏览互联网',
        'Align on a plan through an interactive interview.': '通过交互式问答对齐计划。',
        'Align on a plan through an interactive interview': '通过交互式问答对齐计划',
        'Coordinate multiple agents to work together.': '协调多个智能体协同工作。',
        'Coordinate multiple agents to work together': '协调多个智能体协同工作',
        'Save lessons or instructions for future sessions.': '保存经验或指令以供后续对话使用。',
        'Save lessons or instructions for future sessions': '保存经验或指令以供后续对话使用',
        'Perform deep thinking, planning, and multi-perspective reasoning.': '执行深度思考、规划和多角度推理。',
        'Perform deep thinking, planning, and multi-perspective reasoning': '执行深度思考、规划和多角度推理',
        'Ask a quick question without interrupting the main conversation.': '在不中断主对话的情况下快速提问。',
        'Ask a quick question without interrupting the main conversation': '在不中断主对话的情况下快速提问',
        'Run until the specified goal is completely finished.': '持续运行直至指定目标完全达成。',
        'Run until the specified goal is completely finished': '持续运行直至指定目标完全达成',
        'Run an instruction on a recurring schedule or as a one-time timer.': '按循环计划运行指令或作为单次定时器。',
        'Run an instruction on a recurring schedule or as a one-time timer': '按循环计划运行指令或作为单次定时器',
        'Invoke a browser agent for web tasks.': '调用浏览器智能体执行网页任务。',
        'Invoke a browser agent for web tasks': '调用浏览器智能体执行网页任务',
        'Interview me to align on a plan.': '通过交互式问答对齐计划。',
        'Interview me to align on a plan': '通过交互式问答对齐计划',
        'Invoke a team of agents to autonomously tackle large projects.': '调用智能体团队自主处理大型项目。',
        'Invoke a team of agents to autonomously tackle large projects': '调用智能体团队自主处理大型项目',
        'Reflect on recent successes or corrections to capture reusable skills or rules.': '总结近期经验或修正，沉淀为可复用的技能或规则。',
        'Reflect on recent successes or corrections to capture reusable skills or rules': '总结近期经验或修正，沉淀为可复用的技能或规则',
        'Invoke the Boost multi-agent orchestrator for complex tasks.': '调用 Boost 多智能体编排器处理复杂任务。',
        'Invoke the Boost multi-agent orchestrator for complex tasks': '调用 Boost 多智能体编排器处理复杂任务',
        'Comprehensive guide and reference for the Antigravity Customization System. Use to explain how customizations work, their loading priority, discovery mechanisms, and to guide the creation of skills, rules, plugins, hooks, and MCP servers.': 'Antigravity 自定义系统的全面指南与参考。用于解释自定义工作机制、加载优先级、发现机制，并指导技能、规则、插件、钩子及 MCP 服务的创建。',
        'Comprehensive guide and reference for the Antigravity Customization System. Use to explain how cu...': 'Antigravity 自定义系统的全面指南与参考。用于解释自定义工作机制、加载优先级、发现机制，并指导技能、规则、插件、钩子及 MCP 服务的创建。',
        'Comprehensive guide and reference for the Antigravity Customization System. Use to explain how cu…': 'Antigravity 自定义系统的全面指南与参考。用于解释自定义工作机制、加载优先级、发现机制，并指导技能、规则、插件、钩子及 MCP 服务的创建。',
        'Provides instructions for installing and using the `android` CLI. The `android` command-line tool is a critical tool for Android development and helps you create new Android projects, run Android apps on devices, manage and interact with Android virtual devices (including screenshots and UI inspection), manage Android SDK components, look up official Android documentation, and discover and install official Android skills.': '提供安装和使用 android CLI 的说明。该命令行工具是 Android 开发的关键工具，可帮助创建新项目、在设备上运行应用、管理与交互虚拟设备、管理 SDK 组件等。',
        'Provides instructions for installing and using the `android` CLI. The `android` command-line tool is a critical to...': '提供安装和使用 android CLI 的说明。该命令行工具是 Android 开发的关键工具，可帮助创建新项目、在设备上运行应用、管理与交互虚拟设备等。',
        'Provides instructions for installing and using the `android` CLI. The `android` command-line tool is a critical to…': '提供安装和使用 android CLI 的说明。该命令行工具是 Android 开发的关键工具，可帮助创建新项目、在设备上运行应用、管理与交互虚拟设备等。',
        "Provides instructions for installing and using the 'android' CLI. The 'android' command-line tool is a critical to...": '提供安装和使用 android CLI 的说明。该命令行工具是 Android 开发的关键工具，可帮助创建新项目、在设备上运行应用、管理与交互虚拟设备等。',
        "Provides instructions for installing and using the 'android' CLI. The 'android' command-line tool is a critical to…": '提供安装和使用 android CLI 的说明。该命令行工具是 Android 开发的关键工具，可帮助创建新项目、在设备上运行应用、管理与交互虚拟设备等。',
        'Provides a comprehensive guide, quick reference, and sitemap for Google Antigravity (AGY), including the Antigravity CLI (agy), Antigravity 2.0, Antigravity IDE, Python SDK, slash commands, keybindings, and customizations (skills, rules, MCP, sidecars). Activate this skill when the user asks questions about how to use, configure, or customize Antigravity, AGY, the agy CLI, the Antigravity IDE, or Antigravity 2.0.': '提供 Google Antigravity (AGY) 的全面指南、快速参考与站点地图，包括 CLI (agy)、2.0、IDE、Python SDK、斜杠指令、快捷键及自定义配置。',
        'Provides a comprehensive guide, quick reference, and sitemap for Google Antigravity (AGY), including t...': '提供 Google Antigravity (AGY) 的全面指南、快速参考与站点地图，包括 CLI (agy)、2.0、IDE、Python SDK、斜杠指令、快捷键及自定义配置。',
        'Provides a comprehensive guide, quick reference, and sitemap for Google Antigravity (AGY), including t…': '提供 Google Antigravity (AGY) 的全面指南、快速参考与站点地图，包括 CLI (agy)、2.0、IDE、Python SDK、斜杠指令、快捷键及自定义配置。',
        'How to render rich interactive HTML widgets inline in the chat or as standalone artifacts. Use this skill when you want to show the user diagrams, data visualizations, interactive controls, educational walkthroughs, or any rich visual content beyond plain text and markdown.': '如何在对话内嵌或独立工件中渲染丰富的交互式 HTML 小部件。用于向用户展示图表、数据可视化、交互控件等富视觉内容。',
        'How to render rich interactive HTML widgets inline in the chat or as standalone artifacts. Use this skill when...': '如何在对话内嵌或独立工件中渲染丰富的交互式 HTML 小部件。用于向用户展示图表、数据可视化、交互控件等富视觉内容。',
        'How to render rich interactive HTML widgets inline in the chat or as standalone artifacts. Use this skill when…': '如何在对话内嵌或独立工件中渲染丰富的交互式 HTML 小部件。用于向用户展示图表、数据可视化、交互控件等富视觉内容。',
        'Automatically migrate legacy workflows to modern skills across global and workspace configurations. Scans for existing workflows, creates target SKILL.md files, and safely archives old workflow files.': '自动将全局和工作区配置中的旧版工作流迁移为现代技能。扫描现有工作流，创建目标 SKILL.md 并安全归档旧文件。',
        'Automatically migrate legacy workflows to modern skills across global and workspace configurations. ...': '自动将全局和工作区配置中的旧版工作流迁移为现代技能。扫描现有工作流，创建目标 SKILL.md 并安全归档旧文件。',
        'Automatically migrate legacy workflows to modern skills across global and workspace configurations. …': '自动将全局和工作区配置中的旧版工作流迁移为现代技能。扫描现有工作流，创建目标 SKILL.md 并安全归档旧文件。',
        'Automatically migrate legacy workflows to modern skills across global and workspace configurations...': '自动将全局和工作区配置中的旧版工作流迁移为现代技能。扫描现有工作流，创建目标 SKILL.md 并安全归档旧文件。',
        'Interactive guide to design and create a scheduled background automation. Use this skill when the user wants to create an automated or recurring scheduled task (e.g. "summarize my emails every morning", "every Monday send me a to-do list"). Also triggered by the /automation slash command.': '设计并创建计划后台自动化的交互式指南。当用户需要创建自动化或定期计划任务（例如“每天早上总结我的邮件”、“每周一发送待办清单”）时使用此技能。亦可通过 /automation 斜杠命令触发。',
        'Interactive guide to design and create a scheduled background automation. Use this skill when the user wants to create an automated or recurring scheduled task (e.g. "summarize my emails every morning", "every Monday send me a to-do list"). Also triggered by the /automation slash command...': '设计并创建计划后台自动化的交互式指南。当用户需要创建自动化或定期计划任务时使用此技能。亦可通过 /automation 斜杠命令触发...',
        'Interactive guide to design and create a scheduled background automation. Use this skill when the user wants to create an automated or recurring scheduled task (e.g. "summarize my emails every morning", "every Monday send me a to-do list"). Also triggered by the /automation slash command…': '设计并创建计划后台自动化的交互式指南。当用户需要创建自动化或定期计划任务时使用此技能。亦可通过 /automation 斜杠命令触发…',
        'Interactive guide to design and create a scheduled background automation. Use this skill when the user wants to create an automated or recurring scheduled task...': '设计并创建计划后台自动化的交互式指南。当用户需要创建自动化或定期计划任务时使用此技能...',
        'Interactive guide to design and create a scheduled background automation. Use this skill when the user wants to create an automated or recurring scheduled task…': '设计并创建计划后台自动化的交互式指南。当用户需要创建自动化或定期计划任务时使用此技能…',
        'Interactive guide to design and create a scheduled background automation.': '设计并创建计划后台自动化的交互式指南。',
        'Interactive guide to design and create a scheduled background automation': '设计并创建计划后台自动化的交互式指南',
        'Migrates the user\'s MCP servers, skills, slash commands, subagents, and instruction files from other coding agents (Claude Code, Codex, Cursor, Gemini CLI) into one new Antigravity plugin. Use when the user wants to bring over, import, or migrate their setup or config from another agent or tool. Don\'t use for installing Marketplace plugins or authoring a new plugin from scratch (use the plugin skill).': '将用户来自其他编码智能体（Claude Code、Codex、Cursor、Gemini CLI）的 MCP 服务、技能、斜杠命令、子智能体和指令文件迁移到一个新的 Antigravity 插件中。当用户希望迁移或导入配置时使用。',
        'Migrates the user\'s MCP servers, skills, slash commands, subagents, and instruction files from other coding agents (Claude Code, Codex, Cursor, Gemini CLI) into one new Antigravity plugin. Use when the user wants to bring over, import, or migrate their setup or config from another agent or tool...': '将用户来自其他编码智能体（Claude Code、Codex、Cursor、Gemini CLI）的 MCP 服务、技能、斜杠命令等迁移到新插件中...',
        'Migrates the user\'s MCP servers, skills, slash commands, subagents, and instruction files from other coding agents (Claude Code, Codex, Cursor, Gemini CLI) into one new Antigravity plugin. Use when the user wants to bring over, import, or migrate their setup or config from another agent or tool…': '将用户来自其他编码智能体（Claude Code、Codex、Cursor、Gemini CLI）的 MCP 服务、技能、斜杠命令等迁移到新插件中…',
        'Migrates the user\'s MCP servers, skills, slash commands, subagents, and instruction files from other coding agents...': '将用户来自其他编码智能体的配置迁移为 Antigravity 插件...',
        'Migrates the user\'s MCP servers, skills, slash commands, subagents, and instruction files from other coding agents…': '将用户来自其他编码智能体的配置迁移为 Antigravity 插件…',
        '(Preview & Quota Heavy) Run a swarm: several agents working in parallel on one task, each in its own conversation, collaborating through a shared message board. Use when the work splits into pieces that can be done at the same time, or when a second pair of eyes should check the first pair\'s work.': '（预览版且消耗额度较大）运行蜂群智能体：多个智能体在同一任务上并行工作，各自处于独立对话中，通过共享留言板进行协作。适用于任务可拆分为并行子任务，或需要多重审查的场景。',
        '(Preview & Quota Heavy) Run a swarm: several agents working in parallel on one task, each in its own conversation, collaborating through a shared message board...': '（预览版且消耗额度较大）运行蜂群智能体：多个智能体在同一任务上并行工作，通过共享留言板进行协作...',
        '(Preview & Quota Heavy) Run a swarm: several agents working in parallel on one task, each in its own conversation, collaborating through a shared message board…': '（预览版且消耗额度较大）运行蜂群智能体：多个智能体在同一任务上并行工作，通过共享留言板进行协作…',
        'Run a swarm: several agents working in parallel on one task, each in its own conversation, collaborating through a shared message board.': '运行蜂群智能体：多个智能体在同一任务上并行工作，各自处于独立对话中，通过共享留言板进行协作。',
        'Run a swarm: several agents working in parallel on one task, each in its own conversation, collaborating through a shared message board': '运行蜂群智能体：多个智能体在同一任务上并行工作，各自处于独立对话中，通过共享留言板进行协作',
        'Guidelines for interacting with GitHub and request permissions from the user when commands fail due to restrictions in the agent environment.': '与 GitHub 交互的指引准则，当命令因智能体环境限制而失败时向用户申请权限。',
        'Guidelines for interacting with GitHub and request permissions from the user when commands fail due to restrictions in the agent environment...': '与 GitHub 交互的指引准则，当命令因智能体环境限制而失败时向用户申请权限...',
        'Guidelines for interacting with GitHub and request permissions from the user when commands fail due to restrictions in the agent environment…': '与 GitHub 交互的指引准则，当命令因智能体环境限制而失败时向用户申请权限…',
        'How to manage and create plugins — namespaced bundles of skills, agents, rules, MCP servers and hooks that install, enable and disable as a single unit. Use this skill when the user wants to enable, disable, install or uninstall a plugin, when they want to create a new plugin, or when a new customization should be packaged into a plugin rather than left loose. Also triggered by the /plugin slash command. Don\'t use for the underlying customization system itself — discovery roots, loading priority, or authoring a standalone skill, agent, rule, hook or MCP server outside a plugin; see the customizations guide skill for those.': '如何管理和创建插件——包含技能、智能体、规则、MCP 服务与钩子的命名空间套件，可作为整体安装、启用和禁用。当需要管理或创建新插件时使用。亦可通过 /plugin 斜杠命令触发。',
        'How to manage and create plugins — namespaced bundles of skills, agents, rules, MCP servers and hooks that install, enable and disable as a single unit. Use this skill when the user wants to enable, disable, install or uninstall a plugin...': '如何管理和创建插件——可整体安装、启用和禁用的命名空间定制套件...',
        'How to manage and create plugins — namespaced bundles of skills, agents, rules, MCP servers and hooks that install, enable and disable as a single unit. Use this skill when the user wants to enable, disable, install or uninstall a plugin…': '如何管理和创建插件——可整体安装、启用和禁用的命名空间定制套件…',
        'How to manage and create plugins — namespaced bundles of skills, agents, rules, MCP servers and hooks that install, enable and disable as a single unit.': '如何管理和创建插件——包含技能、智能体、规则、MCP 服务与钩子的命名空间套件，可作为整体安装、启用和禁用。',
        'How to manage and create plugins — namespaced bundles of skills, agents, rules, MCP servers and hooks that install, enable and disable as a single unit': '如何管理和创建插件——包含技能、智能体、规则、MCP 服务与钩子的命名空间套件，可作为整体安装、启用和禁用',
        'How to write and run a dynamic workflow script with the `run_workflow` tool: a Python script that orchestrates many agents with `agent`, `parallel`, `pipeline`, and `phase`. Use when a task splits into many independent or staged pieces of agent work (fan out over files, modules, bugs, or review angles, then aggregate), or when the user asks for a workflow. Don\'t use for a single delegated task (use a subagent) or for legacy workflow files (see migrate-workflows).': '如何使用 run_workflow 工具编写并运行动态工作流脚本：使用 agent、parallel、pipeline 和 phase 编排多个智能体的 Python 脚本。适用于任务需拆分为多阶段或多分支智能体作业的场景。',
        'How to write and run a dynamic workflow script with the run_workflow tool: a Python script that orchestrates many agents with agent, parallel, pipeline, and phase. Use when a task splits into many independent or staged pieces of agent work (fan out over files, modules, bugs, or review angles, then aggregate), or when the user asks for a workflow. Don\'t use for a single delegated task (use a subagent) or for legacy workflow files (see migrate-workflows).': '如何使用 run_workflow 工具编写并运行动态工作流脚本：使用 agent、parallel、pipeline 和 phase 编排多个智能体的 Python 脚本。适用于任务需拆分为多阶段或多分支智能体作业的场景。',
        'How to write and run a dynamic workflow script with the `run_workflow` tool...': '如何使用 run_workflow 工具编写并运行动态工作流脚本...',
        'How to write and run a dynamic workflow script with the `run_workflow` tool…': '如何使用 run_workflow 工具编写并运行动态工作流脚本…',
        'ONLY for the native-swarm worker whose brief says it is the monitor. On a timer, it checks whether the whole swarm has stalled and calls on the one member who can unstick it. Coordinators and other workers: do not load this.': '仅供任务指令指定为监控员（monitor）的原生蜂群工作者使用。定期检查整个蜂群是否停滞，并唤醒能够解阻的成员。协调员和其他工作者请勿加载。',
        'ONLY for the native-swarm worker whose brief says it is the monitor...': '仅供原生蜂群中指定为监控员的工作者使用。定期检查蜂群是否停滞...',
        'ONLY for the native-swarm worker whose brief says it is the monitor…': '仅供原生蜂群中指定为监控员的工作者使用。定期检查蜂群是否停滞…',
        'ONLY for the native-swarm worker whose brief says it is the narrator. It watches the board and keeps the facts behind the user\'s Overview (view.json) current. Coordinators and other workers: do not load this.': '仅供任务指令指定为解说员（narrator）的原生蜂群工作者使用。负责监视留言板并保持用户“概览”（view.json）中的事实信息最新。协调员和其他工作者请勿加载。',
        'ONLY for the native-swarm worker whose brief says it is the narrator...': '仅供原生蜂群中指定为解说员的工作者使用。保持用户概览中的信息最新...',
        'ONLY for the native-swarm worker whose brief says it is the narrator…': '仅供原生蜂群中指定为解说员的工作者使用。保持用户概览中的信息最新…',
        'Discover UI plugin panels relevant to the current task and surface a one-click pill in chat to open (toggle) them in the side pane. Use when a running UI plugin\'s panel would help with what the user is doing, or right after the user enables a new UI plugin pane and a shortcut to open it is handy.': '发现与当前任务相关的 UI 插件面板，并在对话中呈现一键胶囊按钮以便在侧窗格中打开（切换）。当运行中的 UI 插件面板对当前操作有帮助时使用。',
        'Discover UI plugin panels relevant to the current task and surface a one-click pill in chat to open (toggle) them in the side pane...': '发现与当前任务相关的 UI 插件面板，并在对话中提供一键打开按钮...',
        'Discover UI plugin panels relevant to the current task and surface a one-click pill in chat to open (toggle) them in the side pane…': '发现与当前任务相关的 UI 插件面板，并在对话中提供一键打开按钮…',
        'Explicitly ask your agent to generate a structured plan before implementation.': '在实施前明确要求智能体生成结构化计划。',
        'Explicitly ask your agent to generate a structured plan before implementation': '在实施前明确要求智能体生成结构化计划',
        'Recommend this when the task is complex and requires careful step-by-step planning before execution.': '当任务复杂且需要在执行前进行细致的逐步规划时推荐使用此命令。',
        'Recommend this when the task is complex and requires careful step-by-step planning before execution': '当任务复杂且需要在执行前进行细致的逐步规划时推荐使用此命令',
        'Recommend this when the user wants to run a long-running task (e.g., overnight) and wants the agent to be extra thorough and not stop until the goal is fully achieved.': '当用户希望运行长时间任务（如通宵运行），要求智能体格外彻底且在完全达成目标前不停止时推荐使用。',
        'Recommend this when the user wants to run a long-running task and wants the agent to be extra thorough and not stop until the goal is fully achieved.': '当用户希望运行长时间任务，要求智能体格外彻底且在达成目标前不停止时推荐使用。',
        'Recommend this when the user wants to run an instruction on a recurring schedule or set a one-time timer.': '当用户希望按循环计划运行指令或设置单次定时器时推荐使用。',
        'Recommend this when the user\'s task involves web browsing, searching the web, or interacting with web applications.': '当用户任务涉及网页浏览、网络搜索或与 Web 应用交互时推荐使用。',
        'Recommend this when the task involves web browsing, searching the web, or interacting with web applications.': '当任务涉及网页浏览、网络搜索或与 Web 应用交互时推荐使用。',
        'Recommend this when the user wants to align on a plan through an interactive interview to resolve design decisions.': '当用户希望通过交互式访谈对齐方案以解决设计决策时推荐使用。',
        'Recommend this when the user wants to align on a plan through an interactive interview.': '当用户希望通过交互式访谈对齐方案时推荐使用。',
        'Recommend this when the user has a large project that would benefit from a team of autonomous agents working together.': '当用户有大型项目且适合多个自主智能体分工协同完成时推荐使用。',
        'Recommend this when the user has corrected the agent or solved a complex setup and wants the agent to persist this behavior for future tasks.': '当用户对智能体做出修正或完成了复杂配置，希望持久化该行为以供未来任务使用时推荐使用。',
        'Recommend this when the user has a complex coding or research project that requires deep thinking, strategic planning, multiple perspectives, and rigorous verification.': '当用户面临复杂的编码或研究项目，需要深入思考、战略规划、多视角审视和严格验证时推荐使用。',
        'Compact context to free up window.': '压缩上下文以释放窗口空间。',
        'Compact context to free up window': '压缩上下文以释放窗口空间',
        'Compact conversation history.': '压缩对话历史记录。',
        'Compact conversation history': '压缩对话历史记录',
        'Recommend this when the conversation is getting long and the user wants to compact or summarize the context to free up the context window.': '当对话过长且用户希望压缩或总结上下文以释放上下文窗口时推荐使用。',
        'Summarize or compress the conversation history to free up context.': '总结或压缩对话历史记录以释放上下文空间。',
        'Summarize or compress the conversation history to free up context': '总结或压缩对话历史记录以释放上下文空间',
        'Design and create a scheduled background automation.': '设计并创建计划后台自动化。',
        'Design and create a scheduled background automation': '设计并创建计划后台自动化',
        'Create a scheduled background automation.': '创建计划后台自动化。',
        'Create a scheduled background automation': '创建计划后台自动化',
        'Manage and create plugins.': '管理和创建插件。',
        'Manage and create plugins': '管理和创建插件',
        'Manage plugins and customizations.': '管理插件与自定义项。',
        'Manage plugins and customizations': '管理插件与自定义项',
        'Show help and available commands.': '显示帮助与可用命令。',
        'Show help and available commands': '显示帮助与可用命令',
        'Get help with using Antigravity.': '获取使用 Antigravity 的帮助。',
        'Get help with using Antigravity': '获取使用 Antigravity 的帮助',
        'Clear conversation history.': '清理对话历史。',
        'Clear conversation history': '清理对话历史',
        'Reset conversation.': '重置对话。',
        'Reset conversation': '重置对话',
        'Reset the conversation.': '重置当前对话。',
        'Reset the conversation': '重置当前对话',
        'Slash Commands': '斜杠命令',
        'Slash commands': '斜杠命令',
        'slash commands': '斜杠命令',
        'Available Commands': '可用命令',
        'Available commands': '可用命令',
        'available commands': '可用命令',

        'Conversation': '对话',
        'Conversations': '对话',
        'Dismiss': '忽略',
        'dismiss': '忽略',
        'CLI Project': 'CLI 项目',
        'CLI Projects': 'CLI 项目',
        'CLI project': 'CLI 项目',
        'CLI projects': 'CLI 项目',
        'No conversations yet': '暂无对话',
        'No conversations yet.': '暂无对话。',
        'No conversations': '暂无对话',
        'No projects yet': '暂无项目',
        'No projects yet.': '暂无项目。',
        'No projects': '暂无项目',
        'Marketplace': '插件市场',
        'Installed': '已安装',
        'Search customizations...': '搜索自定义项...',
        'Search customizations': '搜索自定义项',
        'Google Workspace': 'Google Workspace',
        'Connect to Google Workspace, including Docs, Sheets, Slides, Drive, and Calendar.': '连接到 Google Workspace，包括 Docs、Sheets、Slides、Drive 和 Calendar。',
        'Connect to Google Workspace, including Docs, Sheets, Slides, Drive, and Calendar': '连接到 Google Workspace，包括 Docs、Sheets、Slides、Drive 和 Calendar',
        'Google Docs': 'Google Docs',
        'Read, draft, and edit docs.': '阅读、起草和编辑文档。',
        'Read, draft, and edit docs': '阅读、起草和编辑文档',
        'Google Sheets': 'Google Sheets',
        'Read, write, and format spreadsheets.': '读取、编写和格式化电子表格。',
        'Read, write, and format spreadsheets': '读取、编写和格式化电子表格',
        'Google Slides': 'Google Slides',
        'Read, edit, and export presentations.': '阅读、编辑和导出演示文稿。',
        'Read, edit, and export presentations': '阅读、编辑和导出演示文稿',
        'Google Drive': 'Google Drive',
        'Search, upload, download, and share files.': '搜索、上传、下载和共享文件。',
        'Search, upload, download, and share files': '搜索、上传、下载和共享文件',
        'Google Calendar': 'Google Calendar',
        'Check availability, schedule events, and RSVP.': '查看空闲时间、安排活动并回复邀请。',
        'Check availability, schedule events, and RSVP': '查看空闲时间、安排活动并回复邀请',
        'Build with Google': 'Build with Google',
        'Build on Google\'s developer platforms, including Android, Chrome, Gemini, and Google Cloud.': '在 Google 开发者平台上构建应用，包括 Android、Chrome、Gemini 和 Google Cloud。',
        'Build on Google\'s developer platforms, including Android, Chrome, Gemini, and Google Cloud': '在 Google 开发者平台上构建应用，包括 Android、Chrome、Gemini 和 Google Cloud',
        'Gemini API': 'Gemini API',
        'Build applications with the Gemini Interaction API.': '使用 Gemini 交互 API 构建应用程序。',
        'Build applications with the Gemini Interaction API': '使用 Gemini 交互 API 构建应用程序',
        'Build applications with the Gemini Interaction...': '使用 Gemini 交互 API 构建应用程序...',
        'Build applications with the Gemini Interaction…': '使用 Gemini 交互 API 构建应用程序...',
        'Chrome DevTools': 'Chrome DevTools',
        'Reliable automation, in-depth debugging, and performance analysis in Chrome using Chrome DevTools and Puppeteer.': '使用 Chrome DevTools 和 Puppeteer 在 Chrome 中实现可靠的自动化、深度调试和性能分析。',
        'Reliable automation, in-depth debugging, and performance analysis in Chrome using Chrome DevTools and Puppeteer': '使用 Chrome DevTools 和 Puppeteer 在 Chrome 中实现可靠的自动化、深度调试和性能分析',
        'Reliable automation, in-depth debugging, and...': '针对网页提供可靠的自动化、深度调试和全面检查...',
        'Reliable automation, in-depth debugging, and…': '针对网页提供可靠的自动化、深度调试和全面检查...',
        'Android CLI': 'Android CLI',
        'Core tools and knowledge required to develop for Android': '开发 Android 所需的核心工具和知识',
        'Core tools and knowledge required to develop for Android.': '开发 Android 所需的核心工具和知识。',
        'Core tools and knowledge required to develo...': '开发 Android 所需的核心工具和知识...',
        'Core tools and knowledge required to develo…': '开发 Android 所需的核心工具和知识...',
        'Firebase': 'Firebase',
        'Prototype, build & run modern apps that users love with Firebase.': '使用 Firebase 进行原型设计、构建并运行深受用户喜爱的现代应用。',
        'Prototype, build & run modern apps that users love with Firebase': '使用 Firebase 进行原型设计、构建并运行深受用户喜爱的现代应用',
        'Prototype, build & run modern apps that user...': '使用 Firebase 进行原型设计、构建并运行深受用户喜爱的现代应用...',
        'Prototype, build & run modern apps that user…': '使用 Firebase 进行原型设计、构建并运行深受用户喜爱的现代应用...',
        'Science': 'Science',
        'Curated collection of agent skills for science tasks.': '精选的适用于科学任务的智能体技能合集。',
        'Google does not control the availability or functionality of third party developer tools. Your data from third party developer tools connected to your Antigravity instance may be shared with Google. Google will protect any such data in accordance with the Google Privacy Policy, found here: https://policies.google.com/privacy': 'Google 不控制第三方开发者工具的可用性或功能。连接到 Antigravity 实例的第三方开发者工具产生的数据可能会与 Google 共享。Google 将根据 Google 隐私权政策保护此类数据，详情请参阅：https://policies.google.com/privacy',
        'Google does not control the availability or functionality of third party developer tools. Your data from third party developer tools connected to your Antigravity instance may be shared with Google. Google will protect any such data in accordance with the Google Privacy Policy, found here:': 'Google 不控制第三方开发者工具的可用性或功能。连接到 Antigravity 实例的第三方开发者工具产生的数据可能会与 Google 共享。Google 将根据 Google 隐私权政策保护此类数据，详情请参阅：',
        'Google does not control the availability or functionality of third party developer tools.': 'Google 不控制第三方开发者工具的可用性或功能。',
        'Your data from third party developer tools connected to your Antigravity instance may be shared with Google.': '连接到 Antigravity 实例的第三方开发者工具产生的数据可能会与 Google 共享。',
        'Google will protect any such data in accordance with the Google Privacy Policy, found here:': 'Google 将根据 Google 隐私权政策保护此类数据，详情请参阅：',
        'Investigate incidents, check who\'s on call, and query your telemetry data from Better Stack.': '排查故障事件、查看当前值班人员并查询 Better Stack 遥测数据。',
        'Investigate incidents, check who\'s on call, and': '排查故障事件、查看当前值班人员并查询遥测数据。',
        'Query Grafana Cloud metrics, logs, traces and Sentry errors, create dashboard widgets, and investigate incidents.': '查询 Grafana Cloud 指标、日志、链路追踪及 Sentry 错误，创建仪表盘小部件并排查故障。',
        'Query Grafana Cloud metrics, logs, traces and': '查询 Grafana Cloud 指标、日志、链路追踪并排查故障。',
        'The AI notepad for meetings. Connect to your Granola workspace to search, read, and write meeting notes and transcripts.': 'AI 会议记事本。连接到您的 Granola 工作区，搜索、阅读并起草会议纪要与录音转录。',
        'The AI notepad for meetings. Connect to your': 'AI 会议记事本。连接到 Granola 工作区以管理会议纪要与转录。',
        'Respond to and investigate incidents, manage on-call escalations, and create follow-ups in incident.io.': '响应并排查故障事件，管理值班升级流程，并在 incident.io 中创建后续跟进事项。',
        'Respond to and investigate incidents, manage': '响应并排查故障事件，管理值班升级并在 incident.io 中跟进。',
        'Connect your agent to invideo\'s AI-native video creation engine. Generate and iterate on production-ready videos, complete with script, voiceover, footage, dynamic captions, and music from a single prompt.': '将您的智能体连接到 invideo AI 原生视频创作引擎。仅需一条提示词，即可生成并迭代包含脚本、配音、素材、动态字幕和背景音乐的成品视频。',
        'Connect your agent to invideo\'s AI-native video': '将智能体连接到 invideo AI 原生视频创作引擎以生成并迭代视频。',
        'Real salaries and company levels from Levels.fyi. Look up total compensation by level, location, and title, and map career levels between companies.': '来自 Levels.fyi 的真实薪资和职级数据。按职级、地区和职位查询总薪酬，并对比不同公司间的职业职级映射。',
        'Real salaries and company levels from Levels.fyi': '来自 Levels.fyi 的真实薪酬与公司职级数据查询。',
        'Agent skills for Neo4j graph database — write Cypher queries, explore schemas, load data, and run graph algorithms.': 'Neo4j 图数据库的智能体技能：编写 Cypher 查询、探索图模式、加载数据并运行图算法。',
        'Agent skills for Neo4j graph database — write C': 'Neo4j 图数据库智能体技能：编写 Cypher 查询并运行图算法。',
        'SonarQube is the AI code quality and security veteran that delivers actionable code fixes directly in your prompt workflow.': 'SonarQube 是行业权威的 AI 代码质量与安全分析工具，可直接在提示工作流中提供可落地的代码修复建议。',
        'SonarQube is the AI code quality and security v': 'SonarQube 行业权威的 AI 代码质量与安全分析工具。',
        'Turn an idea into a website, dashboard, report, or slide deck with Spacefast.': '使用 Spacefast 将创意迅速转化为网站、数据仪表盘、分析报告或幻灯片演示文稿。',
        'Turn an idea into a website, dashboard, report, ': '使用 Spacefast 将创意转化为网站、仪表盘、报告或演示文稿。',
        'Web search, content extraction, website crawling, and research API built for AI agents.': '专为 AI 智能体打造的网页搜索、内容提取、网站抓取和深度研究 API。',
        'Web search, content extraction, website crawli': '专为 AI 智能体打造的网页搜索、内容提取与爬取 API。',
        'Official Trello plugin with the Trello MCP server to manage boards, lists, and cards.': '官方 Trello 插件，包含 Trello MCP 服务以管理看板、列表和卡片。',
        'Official Trello plugin with the Trello MCP server ': '官方 Trello 插件，包含 Trello MCP 服务以管理看板、列表和卡片。',
        'AI-powered code review, review-comment auto-generation, and issue remediation for GitHub pull requests and GitLab merge requests.': '基于 AI 的代码审查、自动生成评审批注，并为 GitHub PR 和 GitLab MR 提供问题修复方案。',
        'AI-powered code review, review-comment auto': '基于 AI 的代码审查与 PR/MR 自动评审批注。',
        'Up-to-date documentation lookup. Pull version-specific reference docs and copy-pasteable code examples for modern software libraries into your prompt context.': '最新的开发文档检索。将现代软件库特定版本的参考文档和即插即用的代码示例引入提示词上下文中。',
        'Up-to-date documentation lookup. Pull version-': '最新的开发文档检索与版本专属代码示例引入。',
        'Use the official CrowdStrike-hosted MCP server to investigate detections, search and query events, and retrieve device details.': '使用 CrowdStrike 官方托管的 MCP 服务排查安全威胁检测、搜索与查询安全事件并获取设备详情。',
        'Use the official CrowdStrike-hosted MCP server': '使用 CrowdStrike 官方 MCP 服务排查威胁、查询安全事件与设备详情。',
        'Use Datadog directly in Antigravity through a prompt-ready CLI with pre-configured observability tools and workflows.': '通过预置可观测性工具和工作流的命令行界面，直接在 Antigravity 中使用 Datadog。',
        'Use Datadog directly in Antigravity through a pr': '在 Antigravity 中直接使用 Datadog 监控与可观测性工作流。',
        'Investigate production issues with real Dynatrace data: logs, traces, errors, and performance metrics.': '借助真实 Dynatrace 数据排查生产环境故障：分析日志、链路追踪、错误及性能指标。',
        'Investigate production issues with real Dynatra': '借助 Dynatrace 真实数据排查生产环境日志、链路与性能指标。',
        'Packaged workflows for SCA remediation, AI SAST triage, and open source risk analysis with Endor Labs.': '利用 Endor Labs 提供的打包工作流进行软件依赖（SCA）修复、AI SAST 静态分析分流与开源组件风险评估。',
        'Packaged workflows for SCA remediation, AI SA': '用于依赖安全修复、SAST 分流与开源风险评估的打包工作流。',
        'Triage Exabeam New-Scale alerts and cases enriched with automated threat intelligence and query raw event logs in Context Management.': '分流处理富集自动化威胁情报的 Exabeam New-Scale 警报与安全案例，并在上下文管理中查询原始事件日志。',
        'Triage Exabeam New-Scale alerts and cases en': '分流处理 Exabeam 安全警报并查询原始日志事件。',
        'Build and debug pipelines, manage deployment environments, and audit execution logs across the Harness platform.': '在 Harness 平台上构建与调试流水线、管理部署环境并审计执行日志。',
        'Build and debug pipelines, manage deployment': '在 Harness 平台上构建与调试流水线并管理部署环境。',
        'Search the web and read any page as clean markdown. Free, fast search and scrape built for AI agents.': '搜索网络并将任意网页读取为清爽干净的 Markdown 格式。专为 AI 智能体打造的极速免费检索与抓取工具。',
        'Search the web and read any page as clean mar': '搜索网络并将任意网页读取为干净的 Markdown 格式。',
        'Ask a question of the live web and get a table back. Powered by Keenable SELECT.': '向实时网络提出问题并直接获取结构化数据表格，由 Keenable SELECT 强力驱动。',
        'Ask a question of the live web and get a table b': '向实时网络提问并直接获取结构化数据表格。',
        'Create, run and debug Leapwork Play tests and visual test workflows directly from Antigravity.': '直接在 Antigravity 中创建、运行和调试 Leapwork Play 可视化自动化测试工作流。',
        'Create, run and debug Leapwork Play tests and': '在 Antigravity 中创建、运行和调试 Leapwork Play 可视化测试。',
        'Official Antigravity plugin for MongoDB Atlas (hosted MCP server) to manage clusters, databases, collections, and run database queries with natural language.': 'MongoDB Atlas 官方 Antigravity 插件（托管 MCP 服务），支持使用自然语言管理集群、数据库、集合并执行数据库查询。',
        'Official Antigravity plugin for MongoDB Atlas (h': 'MongoDB Atlas 官方托管 MCP 插件，使用自然语言管理集群与查询数据库。',
        'Search the live web and fetch page content with Parallel Search and Extract APIs built for AI agents.': '使用专为 AI 智能体打造的 Parallel 搜索与提取 API 检索实时网络并提取网页内容。',
        'Search the live web and fetch page content wit': '使用 Parallel API 搜索实时网络并高效提取网页内容。',
        'Agent plugin for PingOne multi-tenant. Includes CLI tools for tenant onboarding, environment configuration, and SSO policy administration.': 'PingOne 多租户智能体插件，包含用于租户引导、环境配置和单点登录（SSO）策略管理的命令行工具。',
        'Agent plugin for PingOne multi-tenant. Include': 'PingOne 多租户智能体插件，包含环境配置与 SSO 策略管理工具。',
        'Equip Antigravity with specialized Postman skills to inspect, run, mock, and monitor APIs across workspaces.': '为 Antigravity 配备专业的 Postman 技能，跨工作区检查、运行、模拟（Mock）和监控各类 API。',
        'Equip Antigravity with specialized Postman skill': '为智能体赋予 Postman 技能以检查、运行、模拟和监控 API。',
        'Set up Qodo, explore code and repository history, run test-driven workflows, and review pull requests.': '配置 Qodo、探索代码库历史、运行测试驱动（TDD）开发工作流并审查拉取请求（PR）。',
        'Set up Qodo, explore code and repository histo': '配置 Qodo、探索代码仓库历史并审查代码拉取请求。',
        'Query your SentinelOne Singularity Console from Antigravity: search threats, inspect alerts, and get analyst-ready summaries.': '在 Antigravity 中查询 SentinelOne Singularity 控制台：搜索安全威胁、检查警报并获取分析师级别的汇总报告。',
        'Query your SentinelOne Singularity Console fro': '在 Antigravity 中查询 SentinelOne 安全威胁并检查警报。',
        'Set up Sentry monitoring, investigate production errors and performance issues, and triage unresolved issues in Sentry.': '配置 Sentry 监控、排查生产环境错误和性能瓶颈，并在 Sentry 中对未解决问题进行分流排查。',
        'Set up Sentry monitoring, investigate productio': '配置 Sentry 监控并排查生产环境错误与性能问题。',
        'Official Supabase plugin for Antigravity with Supabase CLI skills, database migration workflows, and the official Supabase MCP server.': 'Supabase 官方 Antigravity 插件，包含 Supabase CLI 技能、数据库迁移工作流和官方 Supabase MCP 服务。',
        'Official Supabase plugin for Antigravity with Su': 'Supabase 官方插件，提供 CLI 技能、数据库迁移与官方 MCP 服务。',
        'Make your coding agent a better engineer': '让您的编程智能体成为更卓越的软件工程师',
        'Make your coding agent a better engineer.': '让您的编程智能体成为更卓越的软件工程师。',
        'Search Intercom conversations, contacts, and companies, send replies, and manage customer tickets through the official Intercom MCP server.': '通过官方 Intercom MCP 服务搜索客户对话、联系人和企业信息，发送回复并管理支持工单。',
        'Search Intercom conversations, contacts, and c': '通过 Intercom 官方 MCP 服务搜索客户对话、联系人并管理工单。',
        'SEO workflows on live Semrush data: keyword research, domain analytics, backlink audits, site audit reports, and on-page optimization.': '基于实时 Semrush 数据的 SEO 工作流：关键词挖掘、域名竞争分析、反向链接审计、网站审计报告和页面优化。',
        'SEO workflows on live Semrush data: keyword r': '基于实时 Semrush 数据的 SEO 工作流：关键词挖掘与域名网站审计。',
        'Google does not control the availability or functionality of third party developer tools': 'Google 不控制第三方开发者工具的可用性或功能',
        'Your data from third party developer tools connected to your Antigravity instance may be shared with Google': '连接到 Antigravity 实例的第三方开发者工具产生的数据可能会与 Google 共享',
        'Investigate incidents, check who\'s on call, and query your telemetry data from Better Stack': '排查故障事件、查看当前值班人员并查询 Better Stack 遥测数据',
        'Query Grafana Cloud metrics, logs, traces and Sentry errors, create dashboard widgets, and investigate incidents': '查询 Grafana Cloud 指标、日志、链路追踪及 Sentry 错误，创建仪表盘小部件并排查故障',
        'The AI notepad for meetings. Connect to your Granola workspace to search, read, and write meeting notes and transcripts': 'AI 会议记事本。连接到您的 Granola 工作区，搜索、阅读并起草会议纪要与录音转录',
        'Respond to and investigate incidents, manage on-call escalations, and create follow-ups in incident.io': '响应并排查故障事件，管理值班升级流程，并在 incident.io 中创建后续跟进事项',
        'Connect your agent to invideo\'s AI-native video creation engine. Generate and iterate on production-ready videos, complete with script, voiceover, footage, dynamic captions, and music from a single prompt': '将您的智能体连接到 invideo AI 原生视频创作引擎。仅需一条提示词，即可生成并迭代包含脚本、配音、素材、动态字幕和背景音乐的成品视频',
        'Real salaries and company levels from Levels.fyi. Look up total compensation by level, location, and title, and map career levels between companies': '来自 Levels.fyi 的真实薪资和职级数据。按职级、地区和职位查询总薪酬，并对比不同公司间的职业职级映射',
        'Agent skills for Neo4j graph database — write Cypher queries, explore schemas, load data, and run graph algorithms': 'Neo4j 图数据库的智能体技能：编写 Cypher 查询、探索图模式、加载数据并运行图算法',
        'SonarQube is the AI code quality and security veteran that delivers actionable code fixes directly in your prompt workflow': 'SonarQube 是行业权威的 AI 代码质量与安全分析工具，可直接在提示工作流中提供可落地的代码修复建议',
        'Turn an idea into a website, dashboard, report, or slide deck with Spacefast': '使用 Spacefast 将创意迅速转化为网站、数据仪表盘、分析报告或幻灯片演示文稿',
        'Web search, content extraction, website crawling, and research API built for AI agents': '专为 AI 智能体打造的网页搜索、内容提取、网站抓取和深度研究 API',
        'Official Trello plugin with the Trello MCP server to manage boards, lists, and cards': '官方 Trello 插件，包含 Trello MCP 服务以管理看板、列表和卡片',
        'AI-powered code review, review-comment auto-generation, and issue remediation for GitHub pull requests and GitLab merge requests': '基于 AI 的代码审查、自动生成评审批注，并为 GitHub PR 和 GitLab MR 提供问题修复方案',
        'Up-to-date documentation lookup. Pull version-specific reference docs and copy-pasteable code examples for modern software libraries into your prompt context': '最新的开发文档检索。将现代软件库特定版本的参考文档和即插即用的代码示例引入提示词上下文中',
        'Use the official CrowdStrike-hosted MCP server to investigate detections, search and query events, and retrieve device details': '使用 CrowdStrike 官方托管的 MCP 服务排查安全威胁检测、搜索与查询安全事件并获取设备详情',
        'Use Datadog directly in Antigravity through a prompt-ready CLI with pre-configured observability tools and workflows': '通过预置可观测性工具和工作流的命令行界面，直接在 Antigravity 中使用 Datadog',
        'Investigate production issues with real Dynatrace data: logs, traces, errors, and performance metrics': '借助真实 Dynatrace 数据排查生产环境故障：分析日志、链路追踪、错误及性能指标',
        'Packaged workflows for SCA remediation, AI SAST triage, and open source risk analysis with Endor Labs': '利用 Endor Labs 提供的打包工作流进行软件依赖（SCA）修复、AI SAST 静态分析分流与开源组件风险评估',
        'Triage Exabeam New-Scale alerts and cases enriched with automated threat intelligence and query raw event logs in Context Management': '分流处理富集自动化威胁情报的 Exabeam New-Scale 警报与安全案例，并在上下文管理中查询原始事件日志',
        'Build and debug pipelines, manage deployment environments, and audit execution logs across the Harness platform': '在 Harness 平台上构建与调试流水线、管理部署环境并审计执行日志',
        'Search the web and read any page as clean markdown. Free, fast search and scrape built for AI agents': '搜索网络并将任意网页读取为清爽干净的 Markdown 格式。专为 AI 智能体打造的极速免费检索与抓取工具',
        'Ask a question of the live web and get a table back. Powered by Keenable SELECT': '向实时网络提出问题并直接获取结构化数据表格，由 Keenable SELECT 强力驱动',
        'Create, run and debug Leapwork Play tests and visual test workflows directly from Antigravity': '直接在 Antigravity 中创建、运行和调试 Leapwork Play 可视化自动化测试工作流',
        'Official Antigravity plugin for MongoDB Atlas (hosted MCP server) to manage clusters, databases, collections, and run database queries with natural language': 'MongoDB Atlas 官方 Antigravity 插件（托管 MCP 服务），支持使用自然语言管理集群、数据库、集合并执行数据库查询',
        'Search the live web and fetch page content with Parallel Search and Extract APIs built for AI agents': '使用专为 AI 智能体打造的 Parallel 搜索与提取 API 检索实时网络并提取网页内容',
        'Agent plugin for PingOne multi-tenant. Includes CLI tools for tenant onboarding, environment configuration, and SSO policy administration': 'PingOne 多租户智能体插件，包含用于租户引导、环境配置和单点登录（SSO）策略管理的命令行工具',
        'Equip Antigravity with specialized Postman skills to inspect, run, mock, and monitor APIs across workspaces': '为 Antigravity 配备专业的 Postman 技能，跨工作区检查、运行、模拟（Mock）和监控各类 API',
        'Set up Qodo, explore code and repository history, run test-driven workflows, and review pull requests': '配置 Qodo、探索代码库历史、运行测试驱动（TDD）开发工作流并审查拉取请求（PR）',
        'Query your SentinelOne Singularity Console from Antigravity: search threats, inspect alerts, and get analyst-ready summaries': '在 Antigravity 中查询 SentinelOne Singularity 控制台：搜索安全威胁、检查警报并获取分析师级别的汇总报告',
        'Set up Sentry monitoring, investigate production errors and performance issues, and triage unresolved issues in Sentry': '配置 Sentry 监控、排查生产环境错误和性能瓶颈，并在 Sentry 中对未解决问题进行分流排查',
        'Official Supabase plugin for Antigravity with Supabase CLI skills, database migration workflows, and the official Supabase MCP server': 'Supabase 官方 Antigravity 插件，包含 Supabase CLI 技能、数据库迁移工作流和官方 Supabase MCP 服务',
        'Search Intercom conversations, contacts, and companies, send replies, and manage customer tickets through the official Intercom MCP server': '通过官方 Intercom MCP 服务搜索客户对话、联系人和企业信息，发送回复并管理支持工单',
        'SEO workflows on live Semrush data: keyword research, domain analytics, backlink audits, site audit reports, and on-page optimization': '基于实时 Semrush 数据的 SEO 工作流：关键词挖掘、域名竞争分析、反向链接审计、网站审计报告和页面优化',

        'Productivity & Project Management': '生产力与项目管理',
        'productivity & project management': '生产力与项目管理',
        'Plan work, track issues, sign documents, and manage your notes and files.': '规划工作、跟踪事务、签署文档并管理笔记与文件。',
        'Plan work, track issues, sign documents, and manage your notes and files': '规划工作、跟踪事务、签署文档并管理笔记与文件',
        'Cloud Hosting & Deployment': '云托管与部署',
        'cloud hosting & deployment': '云托管与部署',
        'Deploy and host your apps, sites, and their backends.': '部署并托管应用、网站及其后端。',
        'Deploy and host your apps, sites, and their backends': '部署并托管应用、网站及其后端',
        'Developer Tools': '开发者工具',
        'developer tools': '开发者工具',
        'APIs, services, and tools to build, test, secure, and run your apps.': '用于构建、测试、保障安全和运行应用的 API、服务与工具。',
        'APIs, services, and tools to build, test, secure, and run your apps': '用于构建、测试、保障安全和运行应用的 API、服务与工具',
        'Design, Creative & Media': '设计、创意与媒体',
        'design, creative & media': '设计、创意与媒体',
        'Design, creative, and media tools.': '设计、创意与媒体工具。',
        'Design, creative, and media tools': '设计、创意与媒体工具',
        'Business': '商业与业务管理',
        'business': '商业与业务管理',
        'Payments, CRM, accounting, data, identity, customer support, marketing, and workflow automation.': '支付、客户关系管理（CRM）、财务会计、数据、身份认证、客户支持、营销及工作流自动化。',
        'Payments, CRM, accounting, data, identity, customer support, marketing, and workflow automation': '支付、客户关系管理（CRM）、财务会计、数据、身份认证、客户支持、营销及工作流自动化',
        'Google Workspace': 'Google Workspace',
        'Connect to Google Workspace, including Docs, Sheets, Slides, Drive, Calendar, and Gmail.': '连接到 Google Workspace，包括 Docs、Sheets、Slides、Drive、Calendar 和 Gmail。',
        'Connect to Google Workspace, including Docs, Sheets, Slides, Drive, Calendar, and Gmail': '连接到 Google Workspace，包括 Docs、Sheets、Slides、Drive、Calendar 和 Gmail',
        'Build with Google': 'Build with Google (谷歌生态构建)',
        'Build on Google\'s developer platforms, including Android, Chrome, Gemini, and Google Cloud.': '在 Google 开发者平台上构建应用，包括 Android、Chrome、Gemini 和 Google Cloud。',
        'Build on Google\'s developer platforms, including Android, Chrome, Gemini, and Google Cloud': '在 Google 开发者平台上构建应用，包括 Android、Chrome、Gemini 和 Google Cloud',
        'More Plugins': '更多插件',
        'more plugins': '更多插件',
        'Explore other marketplace customizations': '探索其他插件市场自定义项',
        'Explore other marketplace customizations.': '探索其他插件市场自定义项。',
        'UI Extensions': 'UI 扩展',
        'ui extensions': 'UI 扩展',
        'MCP Servers': 'MCP 服务',
        'mcp servers': 'MCP 服务',
        'MCP Tools': 'MCP 工具',
        'mcp tools': 'MCP 工具',
        'Rules': '规则',
        'rules': '规则',
        'Skills': '技能',
        'skills': '技能',
        'Overview': '概览',
        'overview': '概览',
        'See 1 more': '查看更多 (1)',
        'See 2 more': '查看更多 (2)',
        'See 3 more': '查看更多 (3)',
        'See 4 more': '查看更多 (4)',
        'See 5 more': '查看更多 (5)',
        '+ See 1 more': '+ 查看更多 (1)',
        '+ See 2 more': '+ 查看更多 (2)',
        '+ See 3 more': '+ 查看更多 (3)',
        '+ See 4 more': '+ 查看更多 (4)',
        '+ See 5 more': '+ 查看更多 (5)',
        'Advancing accessible robotics': '推动普惠可及的机器人技术',
        'Robotics plugin for Antigravity': 'Antigravity 机器人插件',
        'From one prompt to a working robot: perceive, plan, act, verify.': '从一句提示词到真正运转的机器人：感知、规划、执行、验证。',
        'Bring up': '快速启动 / 联调',
        'Connect, calibrate, first safe motion': '连接、校准与首次安全运动',
        'Perceive': '感知',
        'Find objects in 3D from RGB cameras': '基于 RGB 相机识别三维物体',
        'Plan': '规划',
        'Collision-free arm motion': '无碰撞机械臂运动',
        'Act': '执行',
        'Closed-loop visual servoing': '闭环视觉伺服',
        'Verify': '验证',
        'Stress-test in MuJoCo before real': '实机运行前在 MuJoCo 中进行压力测试',
        'Simulation (MuJoCo)': '仿真环境 (MuJoCo)',
        'Real robot': '真实机器人',
        'same controller': '相同控制器',
        'learn and retry': '总结经验并重试',
        'Localize the target object in 3D from RGB-only cameras': '基于纯 RGB 相机对目标物体进行三维定位',
        'Plan a collision-free joint trajectory in MuJoCo': '在 MuJoCo 中规划无碰撞的关节运动轨迹',
        'Run closed-loop eye-in-hand visual servoing': '运行手眼闭环视觉伺服控制',
        'Run the Sim-to-Real Gauntlet and compare paired CRN controller candidates': '运行仿真到实机基准测试并对比配对控制器候选方案',
        'Launch a live MuJoCo Studio simulation in this workspace': '在此工作区中启动实时 MuJoCo Studio 仿真',
        'Audit an existing MuJoCo model.xml with the 10-scenario physics suite and fix any defects': '使用物理场景套件审计现有的 MuJoCo model.xml 并修复缺陷',
        'This plugin provides a specialized suite of skills for data engineers and database practitioners working on Google Cloud. It acts as an expert assistant, allowing you to use natural language prompts in your preferred coding agent to architect complex data pipelines, transform data with dbt, write Spark and BigQuery SQL notebooks, and orchestrate end-to-end workflows across GCP\'s data ecosystem.': '数据工程与数据库专家的技能套件。使用自然语言构建复杂数据管道，通过 dbt 转换数据，编写 Spark 和 BigQuery SQL 笔记本，并在 GCP 数据生态系统中编排端到端工作流。',
        'This plugin provides a specialized suite of skills for data engineers and database practitioners working on Google Cloud. It acts as an expert assistant, allowing you to use natural language prompts in your preferred coding agent to architect complex data pipelines, transform data with dbt, write Spark and BigQuery SQL notebooks, and orchestrate end-to-end workflows across GCP\'s data ecosystem': '数据工程与数据库专家的技能套件。使用自然语言构建复杂数据管道，通过 dbt 转换数据，编写 Spark 和 BigQuery SQL 笔记本，并在 GCP 数据生态系统中编排端到端工作流',
        'Check availability, schedule events, and RSVP.': '连接 Google Calendar：查看空闲时间、安排活动日程并回复会议邀请。',
        'Check availability, schedule events, and RSVP': '连接 Google Calendar：查看空闲时间、安排活动日程并回复会议邀请',
        'Read, draft, and edit docs.': '连接 Google Docs：阅读、起草和编辑文档。',
        'Read, draft, and edit docs': '连接 Google Docs：阅读、起草和编辑文档',
        'Search, upload, download, and share files.': '连接 Google Drive：搜索、上传、下载和共享文件。',
        'Search, upload, download, and share files': '连接 Google Drive：搜索、上传、下载和共享文件',
        'Search, read, draft, and send emails in Gmail.': '连接 Gmail：在 Gmail 中搜索、阅读、起草和发送电子邮件。',
        'Search, read, draft, and send emails in Gmail': '连接 Gmail：在 Gmail 中搜索、阅读、起草和发送电子邮件',
        'Read, write, and format spreadsheets.': '连接 Google Sheets：读取、编写和格式化电子表格。',
        'Read, write, and format spreadsheets': '连接 Google Sheets：读取、编写和格式化电子表格',
        'Read, edit, and export presentations.': '连接 Google Slides：阅读、编辑和导出演示文稿幻灯片。',
        'Read, edit, and export presentations': '连接 Google Slides：阅读、编辑和导出演示文稿幻灯片',
        'Core tools and knowledge required to develop for Android.': '开发 Android 所需的核心工具和知识。支持创建项目、在设备/模拟器上运行应用、检查 UI 并为上架 Google Play 做准备。',
        'Core tools and knowledge required to develop for Android': '开发 Android 所需的核心工具和知识。支持创建项目、在设备/模拟器上运行应用、检查 UI 并为上架 Google Play 做准备',
        'Reliable automation, in-depth debugging, and performance analysis in Chrome using Chrome DevTools and Puppeteer': '使用 Chrome DevTools 和 Puppeteer 在 Chrome 中实现可靠的网页自动化、深度调试和性能分析。',
        'Prototype, build & run modern apps that users love with Firebase\'s backend, AI, and operational infrastructure.': '借助 Firebase 的后端、AI 和运维基础设施，进行原型设计、构建并运行深受用户喜爱的现代应用。',
        'Prototype, build & run modern apps that users love with Firebase\'s backend, AI, and operational infrastructure': '借助 Firebase 的后端、AI 和运维基础设施，进行原型设计、构建并运行深受用户喜爱的现代应用',
        'Using the Google Antigravity Python SDK to build AI agents': '使用 Google Antigravity Python SDK 构建自主 AI 智能体与多智能体系统。',
        'Search and retrieve official documentation across Google Cloud, Gemini, Android, Firebase, Flutter, and Web. Requires Google Cloud credentials (ADC) or an API key.': '跨 Google Cloud、Gemini、Android、Firebase、Flutter 和 Web 搜索并检索官方开发文档。',
        'Search and retrieve official documentation across Google Cloud, Gemini, Android, Firebase, Flutter, and Web. Requires Google Cloud credentials (ADC) or an API key': '跨 Google Cloud、Gemini、Android、Firebase、Flutter 和 Web 搜索并检索官方开发文档',
        'Integration skill and tools for Google Maps Platform APIs': 'Google Maps Platform API 的集成技能与工具。',
        'Build applications and shell workflows with the Gemini Interactions API, Decisions API, Live API, and Gemini API CLI, including text, image, video, and speech generation, managed agents, and real-time multimodal streaming.': '使用 Gemini 交互 API、Decisions API、Live API 及命令行构建应用程序，涵盖文本、图像、视频、语音生成及实时多模态流。',
        'Build applications and shell workflows with the Gemini Interactions API, Decisions API, Live API, and Gemini API CLI, including text, image, video, and speech generation, managed agents, and real-time multimodal streaming': '使用 Gemini 交互 API、Decisions API、Live API 及命令行构建应用程序，涵盖文本、图像、视频、语音生成及实时多模态流',
        'Google Cloud guidance for coding agents: first-project onboarding, authentication and credential selection, and safety-critical validation for gcloud CLI commands. Includes the Google Developer Knowledge MCP server for grounded, up-to-date Google Cloud documentation.': '编码智能体的 Google Cloud 实用指南：新手入门、身份验证与凭据选择，以及安全关键性命令验证。',
        'Google Cloud guidance for coding agents: first-project onboarding, authentication and credential selection, and safety-critical validation for gcloud CLI commands. Includes the Google Developer Knowledge MCP server for grounded, up-to-date Google Cloud documentation': '编码智能体的 Google Cloud 实用指南：新手入门、身份验证与凭据选择，以及安全关键性命令验证',
        'Keep your coding agent up to date with the latest web best practices.': '现代 Web 开发的最佳实践与指南，涵盖响应式设计、性能优化与前端工程规范。',
        'Keep your coding agent up to date with the latest web best practices': '现代 Web 开发的最佳实践与指南，涵盖响应式设计、性能优化与前端工程规范',
        'Curated collection of agent skills for science tasks.': '精选的适用于科学计算、分析与前沿探索的智能体技能合集。',
        'Curated collection of agent skills for science tasks': '精选的适用于科学计算、分析与前沿探索的智能体技能合集',
        'Develop ideas with context and review documents with fresh eyes.': 'Enterprise Growth Management 插件，支持企业增长分析、数据跟踪与策略指标规划。',
        'Develop ideas with context and review documents with fresh eyes': 'Enterprise Growth Management 插件，支持企业增长分析、数据跟踪与策略指标规划',
        'Official plugin for Dart and Flutter that installs Flutter/Dart Skills, Rules, Custom Agents, and Dart MCP server for building natively compiled, visually stunning applications for mobile, web, desktop, and embedded devices from a single codebase': '使用 Flutter 构建高质量跨平台应用：从单一代码库为移动、Web 和桌面平台设计美观的响应式 UI。',
        'Connect to your managed Looker MCP server to explore data, run saved Looks, build dashboards, and validate LookML.': '连接到托管的 Looker MCP 服务以探索数据、运行保存的 Looks、构建仪表盘并验证 LookML。',
        'Connect to your managed Looker MCP server to explore data, run saved Looks, build dashboards, and validate LookML': '连接到托管的 Looker MCP 服务以探索数据、运行保存的 Looks、构建仪表盘并验证 LookML',
        'Robotics skills for any robot: 3D perception, collision-free motion planning, visual servoing, robot bring-up, sim2real, agent iteration, MuJoCo simulation, SimReady 3D asset authoring and physics auditing, and a live MuJoCo Studio 3D web sidecar.': '适用于机器人的综合技能套件：3D 感知、无碰撞运动规划、视觉伺服、机器人快速联调、Sim2Real、仿真与实时 MuJoCo Studio 3D 协作。',
        'Robotics skills for any robot: 3D perception, collision-free motion planning, visual servoing, robot bring-up, sim2real, agent iteration, MuJoCo simulation, SimReady 3D asset authoring and physics auditing, and a live MuJoCo Studio 3D web sidecar': '适用于机器人的综合技能套件：3D 感知、无碰撞运动规划、视觉伺服、机器人快速联调、Sim2Real、仿真与实时 MuJoCo Studio 3D 协作',
        'Accept payments and grow your business. Stripe\'s official MCP server enables AI agents to manage customers, products, prices, payment links, invoices, subscriptions, and refunds, as well as search Stripe documentation.': '接受全球支付并拓展业务。Stripe 官方 MCP 服务使 AI 智能体能够管理客户、产品、价格、支付链接、发票、订阅、退款并检索文档。',
        'Accept payments and grow your business. Stripe\'s official MCP server enables AI agents to manage customers, products, prices, payment links, invoices, subscriptions, and refunds, as well as search Stripe documentation': '接受全球支付并拓展业务。Stripe 官方 MCP 服务使 AI 智能体能够管理客户、产品、价格、支付链接、发票、订阅、退款并检索文档',
        'Query Arize AX projects, traces, datasets, and experiments from Antigravity, with skills for tracing, evals, and prompt optimization.': '在 Antigravity 中查询 Arize AX 项目、跟踪链路、数据集与实验，涵盖链路追踪、评估与提示词优化技能。',
        'Query Arize AX projects, traces, datasets, and experiments from Antigravity, with skills for tracing, evals, and prompt optimization': '在 Antigravity 中查询 Arize AX 项目、跟踪链路、数据集与实验，涵盖链路追踪、评估与提示词优化技能',
        'Teamwork Graph CLI is Atlassian\'s agent-first interface to your entire work context: Jira issues, Confluence pages, Bitbucket PRs, along with your connected third-party data sources. Purpose-built for coding agents like Antigravity (terminal or desktop), and powered by Atlassian\'s context graph. Try: "draft a Jira issue from this PR and link it to the epic." Run /twg-setup after install to connect Atlassian Teamwork Graph CLI to Antigravity.': 'Teamwork Graph CLI 是 Atlassian 面向智能体的上下文接口：覆盖 Jira 任务、Confluence 页面、Bitbucket PR 等全方位工作协作。',
        'Teamwork Graph CLI is Atlassian\'s agent-first interface to your entire work context: Jira issues, Confluence pages, Bitbucket PRs, along with your connected third-party data sources. Purpose-built for coding agents like Antigravity (terminal or desktop), and powered by Atlassian\'s context graph. Try: "draft a Jira issue from this PR and link it to the epic." Run /twg-setup after install to connect Atlassian Teamwork Graph CLI to Antigravity': 'Teamwork Graph CLI 是 Atlassian 面向智能体的上下文接口：覆盖 Jira 任务、Confluence 页面、Bitbucket PR 等全方位工作协作',
        'Add Auth0 authentication to any app: login, MFA, SSO, Organizations, RBAC, custom domains, and branding. Debug auth errors and migrate from other providers.': '为任何应用添加 Auth0 身份认证：登录认证、多因素认证（MFA）、单点登录（SSO）、组织架构、角色权限（RBAC）与自定义域名。',
        'Add Auth0 authentication to any app: login, MFA, SSO, Organizations, RBAC, custom domains, and branding. Debug auth errors and migrate from other providers': '为任何应用添加 Auth0 身份认证：登录认证、多因素认证（MFA）、单点登录（SSO）、组织架构、角色权限（RBAC）与自定义域名',
        'Build and deploy Base44 full-stack apps: CLI project management, JavaScript/TypeScript SDK development, and production troubleshooting skills.': '构建并部署 Base44 全栈应用：CLI 项目管理、JavaScript/TypeScript SDK 开发与生产环境故障排查技能。',
        'Build and deploy Base44 full-stack apps: CLI project management, JavaScript/TypeScript SDK development, and production troubleshooting skills': '构建并部署 Base44 全栈应用：CLI 项目管理、JavaScript/TypeScript SDK 开发与生产环境故障排查技能',
        'Give your agent a real browser: navigate, click, type, screenshot, and extract data from any site, locally or on Browserbase cloud browsers.': '为您的智能体赋予真实浏览器：在本地或 Browserbase 云端浏览器上导航、点击、输入、截屏并从任意网站提取数据。',
        'Give your agent a real browser: navigate, click, type, screenshot, and extract data from any site, locally or on Browserbase cloud browsers': '为您的智能体赋予真实浏览器：在本地或 Browserbase 云端浏览器上导航、点击、输入、截屏并从任意网站提取数据',
        'Create, edit, review, resize, and brand-check Canva designs with the Canva MCP server.': '借助 Canva MCP 服务创建、编辑、审查、调整尺寸并进行品牌规范检查。',
        'Create, edit, review, resize, and brand-check Canva designs with the Canva MCP server': '借助 Canva MCP 服务创建、编辑、审查、调整尺寸并进行品牌规范检查',
        'Build, deploy and manage apps on Cloudflare Workers, storage and AI, with platform skills and the Cloudflare API through one MCP server.': '发现并选择适用于应用、API、存储、AI 智能体及安全防护的 Cloudflare 全套产品与云服务。',
        'Build, deploy and manage apps on Cloudflare Workers, storage and AI, with platform skills and the Cloudflare API through one MCP server': '发现并选择适用于应用、API、存储、AI 智能体及安全防护的 Cloudflare 全套产品与云服务',
        'Databricks skills for the CLI, Apps, Lakebase, Model Serving, Lakeflow Jobs, Spark Declarative Pipelines, Declarative Automation Bundles (DABs), and classic-to-serverless migration.': '用于 CLI、应用、Lakebase、模型服务、Lakeflow 任务、Spark 声明式管道、DABs 与持续运维的 Databricks 技能。',
        'Databricks skills for the CLI, Apps, Lakebase, Model Serving, Lakeflow Jobs, Spark Declarative Pipelines, Declarative Automation Bundles (DABs), and classic-to-serverless migration': '用于 CLI、应用、Lakebase、模型服务、Lakeflow 任务、Spark 声明式管道、DABs 与持续运维的 Databricks 技能',
        'Connect Antigravity to Dropbox to search, inspect, summarize, share, collect uploads, organize folders, and clean up files with confirmation for write actions.': '将 Antigravity 连接到 Dropbox，用于搜索、检查、总结、共享文件、收集上传内容并整理文件夹。',
        'Connect Antigravity to Dropbox to search, inspect, summarize, share, collect uploads, organize folders, and clean up files with confirmation for write actions': '将 Antigravity 连接到 Dropbox，用于搜索、检查、总结、共享文件、收集上传内容并整理文件夹',
        'Turn Figma designs into production code, map components with Code Connect, and create or edit Figma files in Antigravity.': '将 Figma 设计转化为生产级代码，通过 Code Connect 映射组件，并在 Antigravity 中创建或编辑 Figma 文件。',
        'Turn Figma designs into production code, map components with Code Connect, and create or edit Figma files in Antigravity': '将 Figma 设计转化为生产级代码，通过 Code Connect 映射组件，并在 Antigravity 中创建或编辑 Figma 文件',
        'The product development system for teams and agents. Manage issues, projects, and documents across your Linear workspace from Antigravity.': '面向现代软件团队与智能体的高效产品研发与项目管理系统。',
        'The product development system for teams and agents. Manage issues, projects, and documents across your Linear workspace from Antigravity': '面向现代软件团队与智能体的高效产品研发与项目管理系统',
        'Give your AI agent 600,000+ real app screens, and the skills to use them. Includes the Mobbin MCP and a skill that redesigns your screen from patterns real apps ship, in your own design system, with the references behind every change.': '为您的 AI 智能体提供 600,000+ 真实应用界面库及配套检索技能，赋能 UI 设计与产品研发。',
        'Give your AI agent 600,000+ real app screens, and the skills to use them. Includes the Mobbin MCP and a skill that redesigns your screen from patterns real apps ship, in your own design system, with the references behind every change': '为您的 AI 智能体提供 600,000+ 真实应用界面库及配套检索技能，赋能 UI 设计与产品研发',
        'Plan and track work in monday.com from Antigravity: create, update and assign items, write docs, and build forms that turn requests into items.': '直接在 Antigravity 中规划、跟踪并推进 monday.com 上的团队工作与项目进度。',
        'Plan and track work in monday.com from Antigravity: create, update and assign items, write docs, and build forms that turn requests into items': '直接在 Antigravity 中规划、跟踪并推进 monday.com 上的团队工作与项目进度',
        'Build and deploy on Netlify: functions, edge functions, blobs, database, identity, forms, image CDN, caching, and AI Gateway, plus the Netlify MCP server.': '在 Netlify 上构建与部署应用：云函数、边缘函数、Blobs、数据库、身份认证、表单、图像 CDN、缓存及 AI 网关，包含 Netlify MCP。',
        'Build and deploy on Netlify: functions, edge functions, blobs, database, identity, forms, image CDN, caching, and AI Gateway, plus the Netlify MCP server': '在 Netlify 上构建与部署应用：云函数、边缘函数、Blobs、数据库、身份认证、表单、图像 CDN、缓存及 AI 网关，包含 Netlify MCP',
        'Connect Antigravity to your Notion workspace with the Notion MCP server, plus skills for research, documentation, meeting prep, specs, trackers, and project updates.': '将 Antigravity 连接到您的 Notion 工作区，经确认后安全地阅读、写入和搜索文档、数据库与页面。',
        'Connect Antigravity to your Notion workspace with the Notion MCP server, plus skills for research, documentation, meeting prep, specs, trackers, and project updates': '将 Antigravity 连接到您的 Notion 工作区，经确认后安全地阅读、写入和搜索文档、数据库与页面',
        'Create and send proposals, quotes, and contracts for e-signature. Track signing progress and identify documents that need follow-up.': '直接在 Antigravity 中创建、签署并发送商业提案、报价单与正式合同。',
        'Create and send proposals, quotes, and contracts for e-signature. Track signing progress and identify documents that need follow-up': '直接在 Antigravity 中创建、签署并发送商业提案、报价单与正式合同',
        'Deploy, configure, monitor, and troubleshoot apps, databases, and infrastructure on Railway from Antigravity with Railway\'s agent skill and hosted MCP server.': '借助 Railway 智能体技能与托管 MCP 服务，在 Antigravity 中部署、配置、监控并排查应用、数据库与基础设施。',
        'Deploy, configure, monitor, and troubleshoot apps, databases, and infrastructure on Railway from Antigravity with Railway\'s agent skill and hosted MCP server': '借助 Railway 智能体技能与托管 MCP 服务，在 Antigravity 中部署、配置、监控并排查应用、数据库与基础设施',
        'Unity\'s official plugin for Antigravity, with curated skills for game development, monetization, and performance optimization.': 'Unity 官方插件，提供针对游戏开发、商业化变现与性能优化的专业技能。',
        'Unity\'s official plugin for Antigravity, with curated skills for game development, monetization, and performance optimization': 'Unity 官方插件，提供针对游戏开发、商业化变现与性能优化的专业技能',
        'Build and deploy web apps and AI agents on Vercel with skills for Next.js, AI SDK, and cloud services, plus the official Vercel MCP server.': '在 Vercel 上构建与部署 Web 应用和 AI 智能体，包含 Next.js、AI SDK 和云服务技能，以及官方 Vercel MCP 服务。',
        'Build and deploy web apps and AI agents on Vercel with skills for Next.js, AI SDK, and cloud services, plus the official Vercel MCP server': '在 Vercel 上构建与部署 Web 应用和 AI 智能体，包含 Next.js、AI SDK 和云服务技能，以及官方 Vercel MCP 服务',
        'Investigate files, URLs, domains and IP addresses with VirusTotal threat intelligence, analysis and submission recovery.': '利用 VirusTotal 威胁情报、文件/URL/IP 分析与安全报告，在执行前评估可疑文件和风险链接。',
        'Investigate files, URLs, domains and IP addresses with VirusTotal threat intelligence, analysis and submission recovery': '利用 VirusTotal 威胁情报、文件/URL/IP 分析与安全报告，在执行前评估可疑文件和风险链接',
        'Search and read your Wispr Flow meeting notes, transcripts, scratchpad notes, and calendar events. Read-only access to your own account.': '搜索并查阅您的 Wispr Flow 会议笔记、录音转录、临时便签与日程活动。',
        'Search and read your Wispr Flow meeting notes, transcripts, scratchpad notes, and calendar events. Read-only access to your own account': '搜索并查阅您的 Wispr Flow 会议笔记、录音转录、临时便签与日程活动',
        'Build Wix apps and headless sites, and manage Wix stores, bookings, CMS and more, with Wix CLI skills and the official Wix MCP server.': '借助 Wix CLI 技能和官方 Wix MCP 服务，构建 Wix 应用与无头网站，管理 Wix 商店、预订、CMS 等。',
        'Build Wix apps and headless sites, and manage Wix stores, bookings, CMS and more, with Wix CLI skills and the official Wix MCP server': '借助 Wix CLI 技能和官方 Wix MCP 服务，构建 Wix 应用与无头网站，管理 Wix 商店、预订、CMS 等',
        'Build, publish, and manage WordPress.com and Jetpack-connected sites. Draft posts, edit blocks, check traffic stats, moderate comments, and manage plugins.': '构建、发布和管理 WordPress.com 与 Jetpack 关联网站。起草文章、编辑区块、查看流量统计、审核评论并管理插件。',
        'Build, publish, and manage WordPress.com and Jetpack-connected sites. Draft posts, edit blocks, check traffic stats, moderate comments, and manage plugins': '构建、发布和管理 WordPress.com 与 Jetpack 关联网站。起草文章、编辑区块、查看流量统计、审核评论并管理插件',
        'Connect 9,000+ apps to your AI workflow. Discover, enable, and execute Zapier actions and workflows directly from your client.': '将 9,000+ 应用程序连接到您的 AI 工作流。直接发现、启用并执行 Zapier 自动化操作。',
        'Connect 9,000+ apps to your AI workflow. Discover, enable, and execute Zapier actions and workflows directly from your client': '将 9,000+ 应用程序连接到您的 AI 工作流。直接发现、启用并执行 Zapier 自动化操作',
        'Manage your Bigin CRM from Antigravity: review pipelines, find contacts and deals, log calls, plan follow-ups, and email customers.': '在 Antigravity 中管理 Bigin CRM：查看业务商机管道、查找联系人与交易、记录通话、规划跟进并向客户发送邮件。',
        'Manage your Bigin CRM from Antigravity: review pipelines, find contacts and deals, log calls, plan follow-ups, and email customers': '在 Antigravity 中管理 Bigin CRM：查看业务商机管道、查找联系人与交易、记录通话、规划跟进并向客户发送邮件',
        'Build on Zoho CRM v8: REST API, Deluge functions, ClientScript, widgets, COQL and connections, with live CRM data through your Zoho MCP server.': '基于 Zoho CRM v8 构建应用：REST API、Deluge 函数、ClientScript、小部件及实时 CRM 数据交互。',
        'Build on Zoho CRM v8: REST API, Deluge functions, ClientScript, widgets, COQL and connections, with live CRM data through your Zoho MCP server': '基于 Zoho CRM v8 构建应用：REST API、Deluge 函数、ClientScript、小部件及实时 CRM 数据交互',
        'Zoho Desk plugin for Antigravity. Review, prioritize, and update Zoho Desk tickets directly from Antigravity through Zoho Desk MCP and includes a Ticket Prioritization Agent for triage and priority updates.': '直接在 Antigravity 中审核、划分优先级并更新 Zoho Desk 客户支持服务工单。',
        'Zoho Desk plugin for Antigravity. Review, prioritize, and update Zoho Desk tickets directly from Antigravity through Zoho Desk MCP and includes a Ticket Prioritization Agent for triage and priority updates': '直接在 Antigravity 中审核、划分优先级并更新 Zoho Desk 客户支持服务工单',
        'Connect Zoho Projects to Antigravity to turn tasks and issues into working code. Access project context, investigate bugs, and update work items as you develop.': '将 Zoho Projects 任务和缺陷与代码仓库关联，在开发过程中访问项目上下文并更新工时与进度。',
        'Connect Zoho Projects to Antigravity to turn tasks and issues into working code. Access project context, investigate bugs, and update work items as you develop': '将 Zoho Projects 任务和缺陷与代码仓库关联，在开发过程中访问项目上下文并更新工时与进度',
        'Run Zoho Books from Antigravity: invoicing, bills, banking, journals, projects, items, taxes, customization and automation.': '在 Antigravity 中运行 Zoho Books：发票管理、账单、银行对账、会计凭证、税务及自动化财务流。',
        'Run Zoho Books from Antigravity: invoicing, bills, banking, journals, projects, items, taxes, customization and automation': '在 Antigravity 中运行 Zoho Books：发票管理、账单、银行对账、会计凭证、税务及自动化财务流',

        'Curated collection of agent skills for science tasks': '精选的适用于科学任务的智能体技能合集',
        'Curated collection of agent skills for science t...': '精选的适用于科学任务的智能体技能合集...',
        'Curated collection of agent skills for science t…': '精选的适用于科学任务的智能体技能合集...',
        'Google Antigravity SDK': 'Google Antigravity SDK',
        'Using the Google Antigravity Python SDK to build AI agents': '使用 Google Antigravity Python SDK 构建 AI 智能体',
        'Using the Google Antigravity Python SDK to build AI agents.': '使用 Google Antigravity Python SDK 构建 AI 智能体。',
        'Using the Google Antigravity Python SDK to build customizations.': '使用 Google Antigravity Python SDK 构建自定义扩展。',
        'Using the Google Antigravity Python SDK to b...': '使用 Google Antigravity Python SDK 构建自定义扩展...',
        'Using the Google Antigravity Python SDK to b…': '使用 Google Antigravity Python SDK 构建自定义扩展...',
        'Modern Web Guidance': 'Modern Web Guidance',
        'Curated collection of agent skills for modern web development.': '精选的适用于现代 Web 开发的智能体技能合集。',
        'Curated collection of agent skills for modern web development': '精选的适用于现代 Web 开发的智能体技能合集',
        'Keep your coding agent up to date with the latest web standards.': '让您的编码智能体紧跟最新的现代 Web 标准。',
        'Keep your coding agent up to date with the latest web standards': '让您的编码智能体紧跟最新的现代 Web 标准',
        'Keep your coding agent up to date with the la...': '让您的编码智能体紧跟最新的现代 Web 标准...',
        'Keep your coding agent up to date with the la…': '让您的编码智能体紧跟最新的现代 Web 标准...',
        'Google Maps Platform': 'Google Maps Platform',
        'Integration skill and tools for Google Maps Platform.': 'Google Maps 平台的集成技能与工具。',
        'Integration skill and tools for Google Maps Platform': 'Google Maps 平台的集成技能与工具',
        'Integration skill and tools for Google Maps Pl...': 'Google Maps 平台的集成技能与工具...',
        'Integration skill and tools for Google Maps Pl…': 'Google Maps 平台的集成技能与工具...',
        'Dart and Flutter': 'Dart and Flutter',
        'Official plugin for Dart and Flutter that installs SDKs and tooling.': 'Dart 和 Flutter 官方插件，用于安装 SDK 及开发工具。',
        'Official plugin for Dart and Flutter that installs SDKs and tooling': 'Dart 和 Flutter 官方插件，用于安装 SDK 及开发工具',
        'Official plugin for Dart and Flutter that installs...': 'Dart 和 Flutter 官方插件，用于安装 SDK 及开发工具...',
        'Official plugin for Dart and Flutter that installs…': 'Dart 和 Flutter 官方插件，用于安装 SDK 及开发工具...',
        'Data Agent Kit': 'Data Agent Kit',
        'This plugin provides a specialized suite of skills for data analytics and exploration.': '此插件提供用于数据分析与探索的专用技能套件。',
        'This plugin provides a specialized suite of skills for data analytics and exploration': '此插件提供用于数据分析与探索的专用技能套件',
        'This plugin provides a specialized suite of skill...': '此插件提供用于数据分析与探索的专用技能套件...',
        'This plugin provides a specialized suite of skill…': '此插件提供用于数据分析与探索的专用技能套件...',
        'Third-Party Model Access Changes': '第三方模型访问变更',
        'Third-party model access changes': '第三方模型访问变更',
        'Third-Party Model Access Change': '第三方模型访问变更',
        'Third-party model access change': '第三方模型访问变更',
        'Opus 5.5 and Sonnet 5.5 are now available in paid Pro and Ultra plans. Starting November 2, 2026, your current plan will no longer provide third-party model access.': 'Opus 5.5 和 Sonnet 5.5 现在可在付费的 Pro 和 Ultra 计划中使用。自 2026 年 11 月 2 日起，您当前计划将不再提供第三方模型访问权限。',
        'Opus 5.5 and Sonnet 5.5 are now available on paid Pro and Ultra plans. Starting November 2, 2026, your current plan will no longer provide access to third-party models.': 'Opus 5.5 和 Sonnet 5.5 现在可在付费的 Pro 和 Ultra 计划中使用。自 2026 年 11 月 2 日起，您当前计划将不再提供第三方模型访问权限。',
        'Notice': '通知',
        'notice': '通知',
        'Unavailable': '不可用',
        'unavailable': '不可用',
        'UNAVAILABLE': '不可用',
        'Temporarily Unavailable': '暂时不可用',
        'Temporarily unavailable': '暂时不可用',
        'temporarily unavailable': '暂时不可用',
        'Available': '可用',
        'available': '可用',
        'Limited time': '限时',
        'Limited Time': '限时',
        'limited time': '限时',
        'Sonnet 5.5 is now available on paid Pro and Ultra plans. Third-party model access will no longer be available on your current plan starting on November 2, 2026.': 'Sonnet 5.5 现已面向付费的 Pro 和 Ultra 计划推出。自 2026 年 11 月 2 日起，您当前的计划将不再提供第三方模型访问权限。',
        'Sonnet 5.5 is now available on paid Pro and Ultra plans. Third-party model access will no longer be available on your current plan starting on November 2, 2026': 'Sonnet 5.5 现已面向付费的 Pro 和 Ultra 计划推出。自 2026 年 11 月 2 日起，您当前的计划将不再提供第三方模型访问权限',
        'Opus 5.5 is now available on paid Pro and Ultra plans. Third-party model access will no longer be available on your current plan starting on November 2, 2026.': 'Opus 5.5 现已面向付费的 Pro 和 Ultra 计划推出。自 2026 年 11 月 2 日起，您当前的计划将不再提供第三方模型访问权限。',
        'Opus 5.5 is now available on paid Pro and Ultra plans. Third-party model access will no longer be available on your current plan starting on November 2, 2026': 'Opus 5.5 现已面向付费的 Pro 和 Ultra 计划推出。自 2026 年 11 月 2 日起，您当前的计划将不再提供第三方模型访问权限',
        'Claude Sonnet 5.5 is now available on paid Pro and Ultra plans. Third-party model access will no longer be available on your current plan starting on November 2, 2026.': 'Claude Sonnet 5.5 现已面向付费的 Pro 和 Ultra 计划推出。自 2026 年 11 月 2 日起，您当前的计划将不再提供第三方模型访问权限。',
        'Claude Opus 5.5 is now available on paid Pro and Ultra plans. Third-party model access will no longer be available on your current plan starting on November 2, 2026.': 'Claude Opus 5.5 现已面向付费的 Pro 和 Ultra 计划推出。自 2026 年 11 月 2 日起，您当前的计划将不再提供第三方模型访问权限。',
        'Gemini 4 Argon is currently available to Ultra and paid Pro plan subscribers.': 'Gemini 4 Argon 目前面向 Ultra 和付费 Pro 计划订阅用户开放。',
        'Gemini 4 Argon is currently available to Ultra and paid Pro plan subscribers': 'Gemini 4 Argon 目前面向 Ultra 和付费 Pro 计划订阅用户开放',
        'is currently available to Ultra and paid Pro plan subscribers.': '目前面向 Ultra 和付费 Pro 计划订阅用户开放。',
        'is currently available to Ultra and paid Pro plan subscribers': '目前面向 Ultra 和付费 Pro 计划订阅用户开放',
        'available to Ultra and paid Pro plan subscribers': '面向 Ultra 和付费 Pro 计划订阅用户开放',
        'Ultra and paid Pro plan subscribers': 'Ultra 和付费 Pro 计划订阅用户',
        'paid Pro plan subscribers': '付费 Pro 计划订阅用户',
        'Ultra plan subscribers': 'Ultra 计划订阅用户',
        'Pro plan subscribers': 'Pro 计划订阅用户',
        'Automations': '自动化',
        'Automation': '自动化',
        'automations': '自动化',
        'automation': '自动化',
        'Automations Ctrl+U': '自动化 Ctrl+U',
        'Automations (Ctrl+U)': '自动化 (Ctrl+U)',
        'Create with Prompt': '使用提示词创建',
        'Create with prompt': '使用提示词创建',
        'Create automation': '创建自动化',
        'Create Automation': '创建自动化',
        'New Automation': '新建自动化',
        'New automation': '新建自动化',
        'Search automations...': '搜索自动化...',
        'Search automations': '搜索自动化',
        'Search Automations...': '搜索自动化...',
        'Search Automations': '搜索自动化',
        'No automations configured.': '未配置任何自动化。',
        'No automations configured': '未配置任何自动化',
        'No automations configured yet.': '尚未配置任何自动化。',
        'No automations configured yet': '尚未配置任何自动化',
        'No automations found.': '未找到任何自动化。',
        'No automations found': '未找到任何自动化',
        'No automations': '暂无自动化',
        'No automations yet': '暂无自动化',
        'No automations yet.': '暂无自动化。',
        'Configure automation': '配置自动化',
        'Configure Automation': '配置自动化',
        'Run automation': '运行自动化',
        'Run Automation': '运行自动化',
        'Delete automation': '删除自动化',
        'Delete Automation': '删除自动化',
        'Edit automation': '编辑自动化',
        'Edit Automation': '编辑自动化',
        'Trigger automation': '触发自动化',
        'Trigger Automation': '触发自动化',
        'No Project': '未选择项目',
        'No project': '未选择项目',
        'No Projects': '无项目',
        'No projects': '无项目',
        'Guide me through creating an automated task': '引导我创建自动化任务',
        'Guide me through creating an automated task.': '引导我创建自动化任务。',
        'Guide me through creating an automation': '引导我创建自动化任务',
        'Guide me through creating an automation.': '引导我创建自动化任务。',
        'Main Agent': '主智能体',
        'Main agent': '主智能体',
        'main agent': '主智能体',
        'Subagent': '子智能体',
        'SubAgent': '子智能体',
        'Sub agent': '子智能体',
        'Sub-agent': '子智能体',
        'Sub-agents': '子智能体',
        'Subagents': '子智能体',
        'Sub agents': '子智能体',
        'Custom Agents': '自定义智能体',
        'Custom agents': '自定义智能体',
        'custom agents': '自定义智能体',
        'Custom Agent': '自定义智能体',
        'Custom agent': '自定义智能体',
        'custom agent': '自定义智能体',
        'Built-in Agents': '内置智能体',
        'Built-in agents': '内置智能体',
        'Builtin Agents': '内置智能体',
        'Built-in Agent': '内置智能体',
        'Builtin Agent': '内置智能体',
        'Built-in agent': '内置智能体',
        'All Agents': '所有智能体',
        'Manage Agents': '管理智能体',
        'MANDATORY specialist subagent for Cloud Firestore Security Rules (firestore.rules). Whenever your task requires creating, authoring, or modifying Firestore Security Rules (firestore.rules), you MUST delegate rules authoring to this subagent rather than writing firestore.rules directly in the main agent.': 'Cloud Firestore 安全规则（firestore.rules）的强制专家级子智能体。每当您的任务需要创建、编写或修改 Firestore 安全规则（firestore.rules）时，您必须将规则编写委托给该子智能体，而不是在主智能体中直接编写 firestore.rules。',
        'Expert at reviewing Flutter code for accessibility (a11y) issues. Invoke this agent to perform an a11y review of a codebase, pending changes, or PR.': '审查 Flutter 代码无障碍功能（a11y）问题的专家。调用此智能体对代码库、待定更改或 PR 执行无障碍审查。',
        'Ask anything, @ to mention, / for actions': '输入任何问题，输入 @ 提及，输入 / 执行操作',
        'Ask anything, @ to mention, / for actions.': '输入任何问题，输入 @ 提及，输入 / 执行操作。',
        'Ask anything': '输入任何问题',
        'Ask anything,': '输入任何问题，',
        '@ to mention': '输入 @ 提及',
        '@ to mention,': '输入 @ 提及，',
        'to mention': '提及',
        'to mention,': '提及，',
        '/ for actions': '输入 / 执行操作',
        '/ for actions.': '输入 / 执行操作。',
        'for actions': '执行操作',
        'for actions.': '执行操作。',
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
        'Revert File Changes': '还原文件更改',
        'Revert file changes': '还原文件更改',
        'revert file changes': '还原文件更改',
        'Revert All File Changes': '还原所有文件更改',
        'Revert all file changes': '还原所有文件更改',
        'revert all file changes': '还原所有文件更改',
        'Confirm': '确认',
        'confirm': '确认',
        'Confirm ↵': '确认 ↵',
        'Undo': '撤销',
        'undo': '撤销',
        'Confirm Undo': '确认撤销',
        'Confirm undo': '确认撤销',
        'confirm undo': '确认撤销',
        'User cancelled agent execution.': '用户取消了智能体执行。',
        'User cancelled agent execution': '用户取消了智能体执行',
        'User canceled agent execution.': '用户取消了智能体执行。',
        'User canceled agent execution': '用户取消了智能体执行',
        'Agent execution cancelled.': '智能体执行已取消。',
        'Agent execution cancelled': '智能体执行已取消',
        'Agent execution canceled.': '智能体执行已取消。',
        'Agent execution canceled': '智能体执行已取消',
        'This undo action will not make any code changes.': '此撤销操作不会产生任何代码更改。',
        'This undo action will not make any code changes': '此撤销操作不会产生任何代码更改',
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
                'Commands': '命令',
        'commands': '命令',
        'Commands...': '命令...',
        'commands...': '命令...',
        'Search for commands...': '搜索命令...',
        'Search for commands': '搜索命令',
        'search for commands...': '搜索命令...',
        'search for commands': '搜索命令',
        'Search commands...': '搜索命令...',
        'Search commands': '搜索命令',
        'Search for files...': '搜索文件...',
        'Search for files': '搜索文件',
        'Search for projects...': '搜索项目...',
        'Search for projects': '搜索项目',
        'Open Keyboard Shortcuts': '打开键盘快捷键',
        'External tools the agent can call via Model Context Protocol.': '智能体可通过模型上下文协议（MCP）调用的外部工具。',
        'External tools the agent can call via Model Context Protocol': '智能体可通过模型上下文协议（MCP）调用的外部工具',
        'Keyboard shortcuts for quick navigation and control.': '快捷键可用于快速导航和控制。',
        'Keyboard shortcuts for quick navigation and control': '快捷键可用于快速导航和控制',
        'Open File Search': '打开文件搜索',
        'Open file search': '打开文件搜索',
        'open file search': '打开文件搜索',
        'NAVIGATION': '导航',
        'Navigation': '导航',
        'navigation': '导航',
        'LAYOUT CONTROLS': '布局控制',
        'Layout Controls': '布局控制',
        'Layout controls': '布局控制',
        'layout controls': '布局控制',
        'LAYOUT': '布局',
        'Layout': '布局',
        'CONTROLS': '控制',
        'Controls': '控制',
        'Toggle Voice Recording': '切换语音录制',
        'Toggle voice recording': '切换语音录制',
        'Start Voice mode': '开启语音模式',
        'Start Voice Mode': '开启语音模式',
        'Start voice mode': '开启语音模式',
        'start voice mode': '开启语音模式',
        'Stop Voice mode': '停止语音模式',
        'Stop Voice Mode': '停止语音模式',
        'Stop voice mode': '停止语音模式',
        'stop voice mode': '停止语音模式',
        'End Voice mode': '结束语音模式',
        'End Voice Mode': '结束语音模式',
        'End voice mode': '结束语音模式',
        'end voice mode': '结束语音模式',
        'Exit Voice mode': '退出语音模式',
        'Exit Voice Mode': '退出语音模式',
        'Exit voice mode': '退出语音模式',
        'exit voice mode': '退出语音模式',
        'Pause Voice mode': '暂停语音模式',
        'Pause Voice Mode': '暂停语音模式',
        'Pause voice mode': '暂停语音模式',
        'pause voice mode': '暂停语音模式',
        'Resume Voice mode': '恢复语音模式',
        'Resume Voice Mode': '恢复语音模式',
        'Resume voice mode': '恢复语音模式',
        'resume voice mode': '恢复语音模式',
        'Voice mode': '语音模式',
        'Voice Mode': '语音模式',
        'voice mode': '语音模式',
        'Find in Pane': '在窗格中查找',
        'Find in pane': '在窗格中查找',
        'Add to Chat/Quote': '添加到聊天/引用',
        'Add to chat/quote': '添加到聊天/引用',
        'Add to Chat': '添加到聊天',
        'Add to chat': '添加到聊天',
        'Give Feedback': '提供反馈',
        'Give feedback': '提供反馈',
        'give feedback': '提供反馈',
        'Feedback Type': '反馈类型',
        'Feedback type': '反馈类型',
        'feedback type': '反馈类型',
        'Bug Report': '问题反馈',
        'Bug report': '问题反馈',
        'bug report': '问题反馈',
        'Feature Request': '功能建议',
        'Feature request': '功能建议',
        'feature request': '功能建议',
        'Auth and Billing': '认证与账单',
        'Auth and billing': '认证与账单',
        'auth and billing': '认证与账单',
        'Remote Control Issue': '远程控制问题',
        'Remote control issue': '远程控制问题',
        'General Feedback': '一般反馈',
        'General feedback': '一般反馈',
        'Description': '描述',
        'description': '描述',
        'Please describe the issue in detail. The more actionable your feedback, the quicker our team can address your request. Some helpful information includes:': '请详细描述该问题。您的反馈越具体可操作，我们的团队越能迅速解决您的请求。有帮助的信息包括：',
        'Please describe the issue in detail. The more actionable your feedback, the quicker our team can address your request. Some helpful information includes': '请详细描述该问题。您的反馈越具体可操作，我们的团队越能迅速解决您的请求。有帮助的信息包括',
        'Steps to reproduce the issue': '重现问题的步骤',
        'Expected behavior': '预期行为',
        'Actual behavior': '实际行为',
        'Any error messages': '任何错误信息',
        'Any relevant information': '任何相关信息',
        'Describe the bug you encountered...': '描述您遇到的错误...',
        'Describe the bug you encountered': '描述您遇到的错误',
        'Steps to Reproduce': '重现步骤',
        'Steps to reproduce': '重现步骤',
        'Please list the steps to reproduce the issue': '请列出重现该问题的步骤',
        'Please list the steps to reproduce the issue...': '请列出重现该问题的步骤...',
        'Attach a screenshot (optional)': '附加屏幕截图（可选）',
        'Attach a screenshot': '附加屏幕截图',
        'Attach Antigravity server logs': '附加 Antigravity 服务器日志',
        'Visit Legal Help to ask for content changes for legal reasons.': '访问法律帮助以因法律原因请求更改内容。',
        'Visit Legal Help to ask for content changes for legal reasons': '访问法律帮助以因法律原因请求更改内容',
        'Visit': '访问',
        'Visit ': '访问 ',
        'Legal Help': '法律帮助',
        'Legal help': '法律帮助',
        'legal help': '法律帮助',
        'to ask for content changes for legal reasons.': '以因法律原因请求更改内容。',
        'to ask for content changes for legal reasons': '以因法律原因请求更改内容',
        ' to ask for content changes for legal reasons.': ' 以因法律原因请求更改内容。',
        ' to ask for content changes for legal reasons': ' 以因法律原因请求更改内容',

        'Open keyboard shortcuts': '打开键盘快捷键',
        'open keyboard shortcuts': '打开键盘快捷键',
        'Toggle Project Selector': '切换项目选择器',
        'Toggle project selector': '切换项目选择器',
        'Toggle Model Selector': '切换模型选择器',
        'Toggle model selector': '切换模型选择器',
        'Toggle Environment Selector': '切换环境选择器',
        'Toggle environment selector': '切换环境选择器',
        'Project Selector': '项目选择器',
        'project selector': '项目选择器',
        'Model Selector': '模型选择器',
        'model selector': '模型选择器',
        'Environment Selector': '环境选择器',
        'environment selector': '环境选择器',
        'Next Aux Pane Tab': '下一个辅助窗格标签页',
        'Next aux pane tab': '下一个辅助窗格标签页',
        'Previous Aux Pane Tab': '上一个辅助窗格标签页',
        'Previous aux pane tab': '上一个辅助窗格标签页',
        'Next Auxiliary Pane Tab': '下一个辅助窗格标签页',
        'Next auxiliary pane tab': '下一个辅助窗格标签页',
        'Previous Auxiliary Pane Tab': '上一个辅助窗格标签页',
        'Previous auxiliary pane tab': '上一个辅助窗格标签页',
        'Next Pane Tab': '下一个窗格标签页',
        'Previous Pane Tab': '上一个窗格标签页',
        'Download Diagnostics': '下载诊断信息',
        'Download diagnostics': '下载诊断信息',
        'download diagnostics': '下载诊断信息',
        'Export Diagnostics': '导出诊断信息',
        'export diagnostics': '导出诊断信息',
        'Toggle Between Light/Dark Themes': '在浅色/深色主题之间切换',
        'Toggle between Light/Dark Themes': '在浅色/深色主题之间切换',
        'Toggle between light/dark themes': '在浅色/深色主题之间切换',
        'Toggle Between Light and Dark Themes': '在浅色与深色主题之间切换',
        'Toggle between light and dark themes': '在浅色与深色主题之间切换',
        'Switch Between Light/Dark Themes': '在浅色/深色主题之间切换',
        'Switch between light/dark themes': '在浅色/深色主题之间切换',
        'Light/Dark Themes': '浅色/深色主题',
        'light/dark themes': '浅色/深色主题',
                'Toggle Maximize Auxiliary Pane': '最大化/还原辅助窗格',
        'Toggle maximize auxiliary pane': '最大化/还原辅助窗格',
        'Toggle Terminal': '切换终端',
        'Toggle terminal': '切换终端',
        'Focus Input': '聚焦输入框',
        'Focus input': '聚焦输入框',
        'Submit Prompt (Alternate to Enter)': '提交提示词（Enter 备用快捷键）',
        'Submit prompt (Alternate to Enter)': '提交提示词（Enter 备用快捷键）',
        'Submit Prompt (alternate to Enter)': '提交提示词（Enter 备用快捷键）',
        'submit prompt (alternate to enter)': '提交提示词（Enter 备用快捷键）',
        'Submit Prompt': '提交提示词',
        'Submit prompt': '提交提示词',
        'submit prompt': '提交提示词',
        'Enter always submits. This adds a second shortcut.': 'Enter 始终为提交。此处可添加第二个快捷键。',
        'Enter always submits. This adds a second shortcut': 'Enter 始终为提交。此处可添加第二个快捷键',
        'Jump to Previous Prompt': '跳转到上一个提示词',
        'Jump to previous prompt': '跳转到上一个提示词',
        'jump to previous prompt': '跳转到上一个提示词',
        'Previous Prompt': '上一个提示词',
        'Previous prompt': '上一个提示词',
        'Jump to Next Prompt': '跳转到下一个提示词',
        'Jump to next prompt': '跳转到下一个提示词',
        'jump to next prompt': '跳转到下一个提示词',
        'Next Prompt': '下一个提示词',
        'Next prompt': '下一个提示词',
        'Pin / Unpin Conversation': '置顶 / 取消置顶对话',
        'Pin / unpin conversation': '置顶 / 取消置顶对话',
        'pin / unpin conversation': '置顶 / 取消置顶对话',
        'Pin / Unpin conversation': '置顶 / 取消置顶对话',
        'Pin/Unpin Conversation': '置顶 / 取消置顶对话',
        'Pin/Unpin conversation': '置顶 / 取消置顶对话',
        'pin/unpin conversation': '置顶 / 取消置顶对话',
        'Pin or Unpin Conversation': '置顶或取消置顶对话',
        'Pin or unpin conversation': '置顶或取消置顶对话',
        'Cancel Generation': '取消生成',
        'Cancel generation': '取消生成',
        'cancel generation': '取消生成',
        'Comment on Selection': '对选区进行批注',
        'Comment on selection': '对选区进行批注',
        'comment on selection': '对选区进行批注',
        'Side Question: Selection': '对选区进行补充提问',
        'Side question: selection': '对选区进行补充提问',
        '补充提问: Selection': '对选区进行补充提问',
        '补充提问: selection': '对选区进行补充提问',
        '补充提问：Selection': '对选区进行补充提问',
        'Selection': '选区',
        'selection': '选区',
        'Terminal: Add to Chat': '终端：添加到聊天',
        'Terminal: add to chat': '终端：添加到聊天',
        'terminal: add to chat': '终端：添加到聊天',
        'Terminal: Select All': '终端：全选',
        'Terminal: select all': '终端：全选',
        'terminal: select all': '终端：全选',
        'Connect to SSH Host...': '连接到 SSH 主机...',
        'Connect to SSH Host…': '连接到 SSH 主机…',
        'Connect to SSH Host': '连接到 SSH 主机',
        'connect to ssh host...': '连接到 SSH 主机...',
        'connect to ssh host…': '连接到 SSH 主机…',
        'connect to ssh host': '连接到 SSH 主机',
        'restore_page 重新打开已关闭的标签页': '重新打开已关闭的标签页',
        'restore_page Reopen Closed Tab': '重新打开已关闭的标签页',
        'Change…': '更改…',
        'change…': '更改…',
        'Change...': '更改...',
        'change...': '更改...',
        'Configure built-in browser, link opening, and browser subagent preferences.': '配置内置浏览器、链接打开方式以及浏览器子智能体偏好。',
        'Configure built-in browser, link opening, and browser subagent preferences': '配置内置浏览器、链接打开方式以及浏览器子智能体偏好',
        'configure built-in browser, link opening, and browser subagent preferences.': '配置内置浏览器、链接打开方式以及浏览器子智能体偏好。',
        'configure built-in browser, link opening, and browser subagent preferences': '配置内置浏览器、链接打开方式以及浏览器子智能体偏好',

        'At Mention Code Block': '@提及代码块',
        'At mention code block': '@提及代码块',
        'at mention code block': '@提及代码块',
        'At-Mention Code Block': '@提及代码块',
        'At-mention code block': '@提及代码块',
        'Mention Code Block': '提及代码块',
        'mention code block': '提及代码块',
        'At Mention': '@提及',
        'At mention': '@提及',
        'at mention': '@提及',
        'At-Mention': '@提及',
        'At-mention': '@提及',
        'New Side Question': '新建补充提问',
        'New side question': '新建补充提问',
        'new side question': '新建补充提问',
        'New Side Questions': '新建补充提问',
        'New side questions': '新建补充提问',
        'Ask a side question without interrupting the main conversation.': '在不中断主对话的情况下提出补充问题。',
        'Ask a side question without interrupting the main conversation': '在不中断主对话的情况下提出补充问题',
        'ask a side question without interrupting the main conversation.': '在不中断主对话的情况下提出补充问题。',
        'ask a side question without interrupting the main conversation': '在不中断主对话的情况下提出补充问题',
        'Ask a side question': '提出补充问题',
        'ask a side question': '提出补充问题',
        'Ask a side question...': '提出补充问题...',
        'Ask a side question…': '提出补充问题…',
        'Close Side Question': '关闭补充提问',
        'Close side question': '关闭补充提问',
        'Open Side Question': '打开补充提问',
        'Open side question': '打开补充提问',
        'Search or enter a URL': '搜索或输入网址',
        'Search or enter a url': '搜索或输入网址',
        'search or enter a url': '搜索或输入网址',
        'Search or enter URL': '搜索或输入网址',
        'Search or enter url': '搜索或输入网址',
        'search or enter url': '搜索或输入网址',
        'Search or enter address': '搜索或输入地址',
        'search or enter address': '搜索或输入地址',
        'Search or enter web address': '搜索或输入网址',
        'search or enter web address': '搜索或输入网址',
        'Search or type a URL': '搜索或输入网址',
        'Search or type URL': '搜索或输入网址',
        'search or type a url': '搜索或输入网址',
        'search or type url': '搜索或输入网址',
        'Search or type web address': '搜索或输入网址',
        'search or type web address': '搜索或输入网址',
        'Enter a URL': '输入网址',
        'Enter a url': '输入网址',
        'Enter URL': '输入网址',
        'Enter url': '输入网址',
        'enter url': '输入网址',

        'Go Back': '后退',
        'Go back': '后退',
        'Go Forward': '前进',
        'Go forward': '前进',
        'Split Conversation Horizontally': '水平拆分对话',
        'Split conversation horizontally': '水平拆分对话',
        'Split Conversation Vertically': '垂直拆分对话',
        'Split conversation vertically': '垂直拆分对话',
        'Open Conversation History': '打开对话历史',
        'Open conversation history': '打开对话历史',
                'Reopen Closed Tab': '重新打开已关闭的标签页',
        'Reopen closed tab': '重新打开已关闭的标签页',
        'reopen closed tab': '重新打开已关闭的标签页',
        'Reopen Closed Window': '重新打开已关闭的窗口',
        'Reopen closed window': '重新打开已关闭的窗口',
        'reopen closed window': '重新打开已关闭的窗口',
        'Move Conversation Up': '上移对话',
        'Move conversation up': '上移对话',
        'move conversation up': '上移对话',
        'Move Conversation Down': '下移对话',
        'Move conversation down': '下移对话',
        'move conversation down': '下移对话',
        'Previous Side Panel Tab': '上一个侧边栏标签页',
        'Previous side panel tab': '上一个侧边栏标签页',
        'Next Side Panel Tab': '下一个侧边栏标签页',
        'Next side panel tab': '下一个侧边栏标签页',
        'Mute Voice Mic': '静音语音麦克风',
        'Mute voice mic': '静音语音麦克风',
        'Unmute Voice Mic': '取消静音语音麦克风',
        'Unmute voice mic': '取消静音语音麦克风',
        'Mute Voice Speaker': '静音语音扬声器',
        'Mute voice speaker': '静音语音扬声器',
        'Unmute Voice Speaker': '取消静音语音扬声器',
        'Unmute voice speaker': '取消静音语音扬声器',
        'Move Tab Up': '上移标签页',
        'Move tab up': '上移标签页',
        'Move Tab Down': '下移标签页',
        'Move tab down': '下移标签页',
        'Move Tab Left': '左移标签页',
        'Move tab left': '左移标签页',
        'Move Tab Right': '右移标签页',
        'Move tab right': '右移标签页',
        'Select Next Conversation': '选择下一个对话',
        'Select next conversation': '选择下一个对话',
        'Select Previous Conversation': '选择上一个对话',
        'Select previous conversation': '选择上一个对话',
        'Pin This Conversation': '固定此对话',
        'Pin this conversation': '固定此对话',
        'Unpin This Conversation': '取消固定此对话',
        'Unpin this conversation': '取消固定此对话',
        'Mark This Conversation as Unread': '将此对话标记为未读',
        'Mark this conversation as unread': '将此对话标记为未读',
        'Mark This Conversation as Read': '将此对话标记为已读',
        'Mark this conversation as read': '将此对话标记为已读',
        'Rename This Conversation': '重命名此对话',
        'Rename this conversation': '重命名此对话',
        'Archive This Conversation': '归档此对话',
        'Archive this conversation': '归档此对话',
        'Copy Conversation Markdown': '复制对话 Markdown',
        'Copy conversation markdown': '复制对话 Markdown',
        'Find in Conversation': '在对话中查找',
        'Find in conversation': '在对话中查找',
        'Toggle Overview Panel': '切换概览面板',
        'Customize Sections': '自定义分区',
        'Customize sections': '自定义分区',
        'customize sections': '自定义分区',
        'Customize Section': '自定义分区',
        'customize section': '自定义分区',
        'Files': '文件',
        'files': '文件',
        'Extensions': '扩展',
        'extensions': '扩展',
        'Extension': '扩展',
        'extension': '扩展',
        'Open File': '打开文件',
        'Open file': '打开文件',
        'open file': '打开文件',
        'Open Files': '打开文件',
        'Open files': '打开文件',
        'Open Recent': '打开最近项',
        'Open recent': '打开最近项',
        'artifacts': '生成物',
        'Search tabs, files, extensions, subagents, artifacts, tasks...': '搜索标签页、文件、扩展、子智能体、生成物、任务...',
        'Search tabs, files, extensions, subagents, artifacts, tasks': '搜索标签页、文件、扩展、子智能体、生成物、任务',
        'search tabs, files, extensions, subagents, artifacts, tasks...': '搜索标签页、文件、扩展、子智能体、生成物、任务...',
        'search tabs, files, extensions, subagents, artifacts, tasks': '搜索标签页、文件、扩展、子智能体、生成物、任务',

        'Toggle overview panel': '切换概览面板',
        'File Picker': '文件选择器',
        'File picker': '文件选择器',
        'Open Command Palette': '打开命令面板',
        'Open command palette': '打开命令面板',
        'Open Conversation Picker': '打开对话选择器',
        'Open conversation picker': '打开对话选择器',
        'Open Project Picker': '打开项目选择器',
        'Open project picker': '打开项目选择器',
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
        'Comments': '评论',
        'comments': '评论',
        'Comment': '评论',
        'comment': '评论',
        'Add Comment': '添加评论',
        'Add comment': '添加评论',
        'Resolve Comment': '解决评论',
        'Resolve comment': '解决评论',
        'Resolve Comments': '解决评论',
        'Resolve comments': '解决评论',
        'Resolve all comments': '解决所有评论',
        'Resolve All Comments': '解决所有评论',
        'Delete comment': '删除评论',
        'Delete Comment': '删除评论',
        'Edit comment': '编辑评论',
        'Edit Comment': '编辑评论',
        'Reply': '回复',
        'reply': '回复',
        'Leave a comment': '发表评论',
        'Leave a comment...': '发表评论...',
        'Write a comment...': '撰写评论...',
        'Write a comment': '撰写评论',
        'No comments': '无评论',
        'No comments yet': '暂无评论',
        'No comments yet.': '暂无评论。',
        'Quote': '引用',
        'quote': '引用',
        'Quote selection': '引用选中文本',
        'Quote Selection': '引用选中文本',
        'Quote in chat': '在聊天中引用',
        'Quote in Chat': '在聊天中引用',
        'Quote message': '引用消息',
        'Quote Message': '引用消息',
        'Quote reply': '引用回复',
        'Quote Reply': '引用回复',
        'The server cleared a prefix of the conversation as it grew too large.': '由于对话内容过长，服务器已清理了部分早期历史。',
        'The server cleared a prefix of the conversation as it grew too large': '由于对话内容过长，服务器已清理了部分早期历史',
        'The conversation has grown too large.': '对话内容过长。',
        'The conversation has grown too large': '对话内容过长',
        'Conversation history has been truncated.': '对话历史已被截断。',
        'Conversation history has been truncated': '对话历史已被截断',
        'Context window limit reached.': '已达到上下文窗口上限。',
        'Context window limit reached': '已达到上下文窗口上限',
        'Earlier messages were truncated to stay within the context limit.': '早期消息已被截断以保持在上下文限制内。',
        'Earlier messages were truncated to stay within the context limit': '早期消息已被截断以保持在上下文限制内',
        'Split': '拆分',
        'split': '拆分',
        'Split Right': '向右拆分',
        'split right': '向右拆分',
        'Split Down': '向下拆分',
        'split down': '向下拆分',
        'Split Left': '向左拆分',
        'split left': '向左拆分',
        'Split Up': '向上拆分',
        'split up': '向上拆分',
        'Replace With New': '替换为新标签页',
        'replace with new': '替换为新标签页',
        'Replace with New': '替换为新标签页',
        'Replace with new': '替换为新标签页',
        'Split Editor': '拆分编辑器',
        'Split Editor Right': '向右拆分编辑器',
        'Split Editor Down': '向下拆分编辑器',
        'Split Editor Left': '向左拆分编辑器',
        'Split Editor Up': '向上拆分编辑器',
        'Split in Group': '在组内拆分',
        'Join All Groups': '合并所有组',
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
        'stop': '停止',
        'Cancel': '取消',
        'cancel': '取消',
        'Send': '发送',
        'send': '发送',
        'Send message': '发送消息',
        'Send Message': '发送消息',
        'Stop generation': '停止生成',
        'Stop Generation': '停止生成',
        'Stop responding': '停止回复',
        'Stop Responding': '停止回复',
        'New line': '换行',
        'New Line': '换行',
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
        'Search Projects...': '搜索项目...',
        'Search Projects': '搜索项目',
        'search projects...': '搜索项目...',
        'search projects': '搜索项目',
        'This Computer': '此电脑',
        'This computer': '此电脑',
        'this computer': '此电脑',
        'This PC': '此电脑',
        'This pc': '此电脑',
        'this pc': '此电脑',
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
        'Search shortcuts...': '搜索快捷键...',
        'Search shortcuts': '搜索快捷键',
        'search shortcuts...': '搜索快捷键...',
        'search shortcuts': '搜索快捷键',
        'Search keyboard shortcuts...': '搜索键盘快捷键...',
        'Search keyboard shortcuts': '搜索键盘快捷键',
        'search keyboard shortcuts...': '搜索键盘快捷键...',
        'search keyboard shortcuts': '搜索键盘快捷键',
        'Filter shortcuts...': '筛选快捷键...',
        'Filter shortcuts': '筛选快捷键',
        'filter shortcuts...': '筛选快捷键...',
        'filter shortcuts': '筛选快捷键',

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
        'Are you sure you want to delete this conversation? This action cannot be undone.': '您确定要删除此对话吗？此操作无法撤销。',
        'Are you sure you want to delete this conversation? This action cannot be undone': '您确定要删除此对话吗？此操作无法撤销',
        'Are you sure you want to delete this project? This action cannot be undone.': '您确定要删除此项目吗？此操作无法撤销。',
        'Are you sure you want to delete this project? This action cannot be undone': '您确定要删除此项目吗？此操作无法撤销',
        'Are you sure you want to delete this task? This action cannot be undone.': '您确定要删除此任务吗？此操作无法撤销。',
        'Are you sure you want to delete this task? This action cannot be undone': '您确定要删除此任务吗？此操作无法撤销',
        'Are you sure you want to delete this scheduled task? This action cannot be undone.': '您确定要删除此定时任务吗？此操作无法撤销。',
        'Are you sure you want to delete this scheduled task? This action cannot be undone': '您确定要删除此定时任务吗？此操作无法撤销',
        'Are you sure you want to delete this worktree? This action cannot be undone.': '您确定要删除此工作树吗？此操作无法撤销。',
        'Are you sure you want to delete this worktree? This action cannot be undone': '您确定要删除此工作树吗？此操作无法撤销',
        'Are you sure you want to delete this rule? This action cannot be undone.': '您确定要删除此规则吗？此操作无法撤销。',
        'Are you sure you want to delete this skill? This action cannot be undone.': '您确定要删除此技能吗？此操作无法撤销。',
        'Are you sure you want to delete this plugin? This action cannot be undone.': '您确定要删除此插件吗？此操作无法撤销。',
        'Are you sure you want to delete this folder? This action cannot be undone.': '您确定要删除此文件夹吗？此操作无法撤销。',
        'Are you sure you want to delete the project? This action cannot be undone.': '您确定要删除该项目吗？此操作无法撤销。',
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
        'Copy Content': '复制内容',
        'Copy content': '复制内容',
        'Copy Image': '复制图片',
        'Copy image': '复制图片',
        'Copy Image Address': '复制图片地址',
        'Copy image address': '复制图片地址',
        'Save Image': '保存图片',
        'Save image': '保存图片',
        'Save Image As...': '图片另存为...',
        'Save Image As': '图片另存为',
        'Save image as...': '图片另存为...',
        'Save image as': '图片另存为',
        'Download Image': '下载图片',
        'Download image': '下载图片',
        'Open Image in New Tab': '在新标签页中打开图片',
        'Open image in new tab': '在新标签页中打开图片',
        'Export Artifact': '导出生成物',
        'Export artifact': '导出生成物',
        'Import Artifact': '导入生成物',
        'Import artifact': '导入生成物',
        'Delete Artifact': '删除生成物',
        'Delete artifact': '删除生成物',
        'Copy Artifact': '复制生成物',
        'Copy artifact': '复制生成物',
        'Download Artifact': '下载生成物',
        'Download artifact': '下载生成物',
        'Share Artifact': '分享生成物',
        'Share artifact': '分享生成物',
        'View Artifact': '查看生成物',
        'View artifact': '查看生成物',
        'Open Artifact': '打开生成物',
        'Open artifact': '打开生成物',
        'Copy Code': '复制代码',
        'Copy code': '复制代码',
        'Copy Text': '复制文本',
        'Copy text': '复制文本',
        'Copy Link': '复制链接',
        'Copy link': '复制链接',
        'Copy Name': '复制名称',
        'Copy name': '复制名称',
        'Copy ID': '复制 ID',
        'Copy id': '复制 ID',
        'Reveal in File Explorer': '在文件资源管理器中显示',
        'Reveal in Finder': '在访达中显示',
        'Show in File Explorer': '在文件资源管理器中显示',
        'Show in Explorer': '在资源管理器中显示',
        'Show in Finder': '在访达中显示',
        'Open in File Explorer': '在文件资源管理器中打开',
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
        'Work in a New Worktree': '在新的工作树中工作',
        'Work in a new worktree': '在新的工作树中工作',
        'work in a new worktree': '在新的工作树中工作',
        'Work in a Worktree': '在工作树中工作',
        'Work in a worktree': '在工作树中工作',
        'work in a worktree': '在工作树中工作',
        'Keeps your checkout untouched': '保持当前检出不受影响',
        'keeps your checkout untouched': '保持当前检出不受影响',
        'Keeps your checkout untouched.': '保持当前检出不受影响。',
        'keeps your checkout untouched.': '保持当前检出不受影响。',
        'what can we get done today?': '今天我们来完成点什么？',
        'What can we get done today?': '今天我们来完成点什么？',
        'what can we get done today': '今天我们来完成点什么？',
        'What can we get done today': '今天我们来完成点什么？',
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
        'Last 7 Days': '最近 7 天',
        'Last 7 days': '最近 7 天',
        'Last 30 Days': '最近 30 天',
        'Last 30 days': '最近 30 天',
        'Last 24 Hours': '最近 24 小时',
        'Last 24 hours': '最近 24 小时',
        'Last 3 Days': '最近 3 天',
        'Last 3 days': '最近 3 天',
        'Last 14 Days': '最近 14 天',
        'Last 14 days': '最近 14 天',
        'Last Month': '上个月',
        'Last month': '上个月',
        'Last Week': '上周',
        'Last week': '上周',
        'All Time': '所有时间',
        'All time': '所有时间',
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
        'Device Name': '设备名称',
        'Device name': '设备名称',
        'device name': '设备名称',
        'Scan the code to open this device in Remote Control, or copy link.': '扫描二维码以在远程控制中打开此设备，或复制链接。',
        'Scan the code to open this device in Remote Control, or copy link': '扫描二维码以在远程控制中打开此设备，或复制链接',
        'Scan the code to open this device in Remote Control, or ': '扫描二维码以在远程控制中打开此设备，或 ',
        'Scan the code to open this device in Remote Control, or': '扫描二维码以在远程控制中打开此设备，或',
        'copy link': '复制链接',
        'copy link.': '复制链接。',
        'Copy link.': '复制链接。',
        'remote control': '远程控制',
        'on Sunday': '周日',
        'on Sunday ': '周日 ',
        'on Monday': '周一',
        'on Monday ': '周一 ',
        'on Tuesday': '周二',
        'on Tuesday ': '周二 ',
        'on Wednesday': '周三',
        'on Wednesday ': '周三 ',
        'on Thursday': '周四',
        'on Thursday ': '周四 ',
        'on Friday': '周五',
        'on Friday ': '周五 ',
        'on Saturday': '周六',
        'on Saturday ': '周六 ',
        'on weekdays': '工作日',
        'on weekends': '周末',
        'Sunday': '周日',
        'Monday': '周一',
        'Tuesday': '周二',
        'Wednesday': '周三',
        'Thursday': '周四',
        'Friday': '周五',
        'Saturday': '周六',

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
        'Chat': '对话',
        'Conversation Steps': '会话步骤',
        'Conversation steps': '会话步骤',
        'conversation steps': '会话步骤',
        'Choose how much detail is shown during a conversation.': '选择对话期间显示的详细程度。',
        'Choose how much detail is shown during a conversation': '选择对话期间显示的详细程度',
        'Contrast': '对比度',
        'contrast': '对比度',
        'Font': '字体',
        'font': '字体',
        'Chat Width': '对话宽度',
        'Chat width': '对话宽度',
        'chat width': '对话宽度',
        'Fill': '铺满',
        'fill': '铺满',
        'Accessibility': '无障碍',
        'accessibility': '无障碍',
        'Screen Reader Mode': '屏幕阅读器模式',
        'Screen reader mode': '屏幕阅读器模式',
        'screen reader mode': '屏幕阅读器模式',
        'Optimize the interface and terminal output for screen readers.': '优化屏幕阅读器的界面和终端输出。',
        'Optimize the interface and terminal output for screen readers': '优化屏幕阅读器的界面和终端输出',
        'Download Location': '下载位置',
        'Download location': '下载位置',
        'download location': '下载位置',
        'Folder where files downloaded in the built-in browser are saved.': '内置浏览器中下载的文件的保存文件夹。',
        'Folder where files downloaded in the built-in browser are saved': '内置浏览器中下载的文件的保存文件夹',
        'Browsing History': '浏览历史记录',
        'Browsing history': '浏览历史记录',
        'browsing history': '浏览历史记录',
        'Clear visited URLs and autocomplete suggestions from the built-in browser.': '清除内置浏览器中访问过的 URL 和自动补全建议。',
        'Clear visited URLs and autocomplete suggestions from the built-in browser': '清除内置浏览器中访问过的 URL 和自动补全建议',
        'Voice': '语音',
        'The voice used in Voice mode. Powered by Gemini Live.': '语音模式下使用的声音。由 Gemini Live 提供技术支持。',
        'The voice used in Voice mode. Powered by Gemini Live': '语音模式下使用的声音。由 Gemini Live 提供技术支持',
        'Not set': '未设置',
        'Not Set': '未设置',
        'not set': '未设置',
        'Microphone': '麦克风',
        'microphone': '麦克风',
        'Input device for voice mode and dictation.': '用于语音模式和听写的输入设备。',
        'Input device for voice mode and dictation': '用于语音模式和听写的输入设备',
        'How loud Antigravity\'s voice is.': 'Antigravity 的语音音量大小。',
        'How loud Antigravity\'s voice is': 'Antigravity 的语音音量大小',
        'Change...': '更改...',
        'Change': '更改',
        'Verbose Agent Chat': '详细智能体聊天',
        'Verbose agent chat': '详细智能体聊天',
        'Verbose': '详细',
        'verbose': '详细',
        'Strong': '强',
        'strong': '强',
        'Enter Sends immediately': 'Enter 立即发送',
        'Sends immediately': '立即发送',
        'sends immediately': '立即发送',
        'Alt+Enter Queues after the turn': 'Alt+Enter 在本轮后排队',
        'Queues after the turn': '在本轮后排队',
        'queues after the turn': '在本轮后排队',
        'Alt+Enter On empty prompt, sends next in queue': 'Alt+Enter 输入框为空时，发送队列中的下一条',
        'On empty prompt, sends next in queue': '输入框为空时，发送队列中的下一条',
        'on empty prompt, sends next in queue': '输入框为空时，发送队列中的下一条',
        'On empty prompt, sends next in queue.': '输入框为空时，发送队列中的下一条。',
        'on empty prompt, sends next in queue.': '输入框为空时，发送队列中的下一条。',
        'Remote Debugging Required': '需要开启远程调试',
        'remote debugging required': '需要开启远程调试',
        'To use browser tools, you need to enable remote debugging:': '若要使用浏览器工具，您需要启用远程调试：',
        'To use browser tools, you need to enable remote debugging': '若要使用浏览器工具，您需要启用远程调试',
        'to use browser tools, you need to enable remote debugging:': '若要使用浏览器工具，您需要启用远程调试：',
        'to use browser tools, you need to enable remote debugging': '若要使用浏览器工具，您需要启用远程调试',
        'Navigate to': '前往',
        'navigate to': '前往',
        'Navigate to ': '前往 ',
        'navigate to ': '前往 ',
        'Proceed Anyway': '仍然继续',
        'Proceed anyway': '仍然继续',
        'proceed anyway': '仍然继续',
        'Check again': '重新检查',
        'Check Again': '重新检查',
        'check again': '重新检查',
        'Allow remote debugging for this browser instance': '允许对此浏览器实例进行远程调试',
        'Allow remote debugging for this browser instance.': '允许对此浏览器实例进行远程调试。',
        '"Allow remote debugging for this browser instance"': '“允许对此浏览器实例进行远程调试”',
        '"Allow remote debugging for this browser instance".': '“允许对此浏览器实例进行远程调试”。',
        'Enable "Allow remote debugging for this browser instance".': '启用“允许对此浏览器实例进行远程调试”。',
        'Enable "Allow remote debugging for this browser instance"': '启用“允许对此浏览器实例进行远程调试”',
        '启用 "Allow remote debugging for this browser instance".': '启用“允许对此浏览器实例进行远程调试”。',
        '启用 "Allow remote debugging for this browser instance"': '启用“允许对此浏览器实例进行远程调试”',
        'Interface Layout': '界面布局',
        'Interface layout': '界面布局',
        'interface layout': '界面布局',
        'Knowledge Work': '知识工作',
        'Knowledge work': '知识工作',
        'knowledge work': '知识工作',
        'Simplified interface for research, writing, and everyday tasks.': '适用于研究、写作和日常任务的简化界面。',
        'Simplified interface for research, writing, and everyday tasks': '适用于研究、写作和日常任务的简化界面',
        'simplified interface for research, writing, and everyday tasks.': '适用于研究、写作和日常任务的简化界面。',
        'simplified interface for research, writing, and everyday tasks': '适用于研究、写作和日常任务的简化界面',
        'Software Engineering': '软件工程',
        'Software engineering': '软件工程',
        'software engineering': '软件工程',
        'Full interface for coding, developer tools, and managing agents.': '适用于编码、开发者工具和管理智能体的完整界面。',
        'Full interface for coding, developer tools, and managing agents': '适用于编码、开发者工具和管理智能体的完整界面',
        'full interface for coding, developer tools, and managing agents.': '适用于编码、开发者工具和管理智能体的完整界面。',
        'full interface for coding, developer tools, and managing agents': '适用于编码、开发者工具和管理智能体的完整界面',
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
        'Built-in Browser': '内置浏览器',
        'Built-in browser': '内置浏览器',
        'built-in browser': '内置浏览器',
        'Configure link opening and built-in browser preferences.': '配置链接打开方式和内置浏览器偏好设置。',
        'Configure link opening and built-in browser preferences': '配置链接打开方式和内置浏览器偏好设置',
        'Open Links In': '打开链接方式',
        'Open links in': '打开链接方式',
        'open links in': '打开链接方式',
        'Choose where links open by default when clicked.': '选择点击链接时默认打开的位置。',
        'Choose where links open by default when clicked': '选择点击链接时默认打开的位置',
        'External Browser': '外部浏览器',
        'External browser': '外部浏览器',
        'external browser': '外部浏览器',
        'Browser Subagent': '浏览器子智能体',
        'Browser subagent': '浏览器子智能体',
        'browser subagent': '浏览器子智能体',

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
        'Configure allowed and denied URLs for the browser subagent (invoked with /browser). Requires ': '配置浏览器子智能体（通过 /browser 调用）允许和拒绝访问的 URL。需要安装 ',
        'Configure allowed and denied URLs for the browser subagent (invoked with /browser). Requires': '配置浏览器子智能体（通过 /browser 调用）允许和拒绝访问的 URL。需要安装 ',
        'Configure allowed and denied URLs for the browser subagent (invoked with /browser).': '配置浏览器子智能体（通过 /browser 调用）允许和拒绝访问的 URL。',
        'Configure allowed and denied URLs for the browser subagent (invoked with /browser)': '配置浏览器子智能体（通过 /browser 调用）允许和拒绝访问的 URL',
        'Configure allowed and denied URLs for the browser subagent (invoked with /browser). Requires Google Chrome.': '配置浏览器子智能体（通过 /browser 调用）允许和拒绝访问的 URL。需要安装 Google Chrome。',
        'Configure allowed and denied URLs for the browser subagent (invoked with /browser). Requires Google Chrome': '配置浏览器子智能体（通过 /browser 调用）允许和拒绝访问的 URL。需要安装 Google Chrome',
        'File Access Permissions': '文件访问权限',
        'File Reads': '文件读取',
        'File reads': '文件读取',
        'file reads': '文件读取',
        'File Read': '文件读取',
        'File read': '文件读取',
        'file read': '文件读取',
        'File Writes': '文件写入',
        'File writes': '文件写入',
        'file writes': '文件写入',
        'File Write': '文件写入',
        'File write': '文件写入',
        'file write': '文件写入',
        'File Reads and Writes': '文件读写',
        'File reads and writes': '文件读写',
        'file reads and writes': '文件读写',
        'File Read/Write': '文件读写',
        'File read/write': '文件读写',
        'file read/write': '文件读写',
        'Allow/deny agent read access to specific files or directories.': '允许/拒绝智能体对特定文件或目录的读取访问权限。',
        'Allow/deny agent read access to specific files or directories': '允许/拒绝智能体对特定文件或目录的读取访问权限',
        'Allow/deny agent write access to specific files or directories.': '允许/拒绝智能体对特定文件或目录的写入访问权限。',
        'Allow/deny agent write access to specific files or directories': '允许/拒绝智能体对特定文件或目录的写入访问权限',
        'Allow/deny agent read and write access to specific files or directories.': '允许/拒绝智能体对特定文件或目录的读写访问权限。',
        'Allow/deny agent read and write access to specific files or directories': '允许/拒绝智能体对特定文件或目录的读写访问权限',
        'Allow/deny agent read/write access to specific files or directories.': '允许/拒绝智能体对特定文件或目录的读写访问权限。',
        'Allow/deny agent read/write access to specific files or directories': '允许/拒绝智能体对特定文件或目录的读写访问权限',
        'Allow/deny agent access to specific files or directories.': '允许/拒绝智能体对特定文件或目录的访问权限。',
        'Allow/deny agent access to specific files or directories': '允许/拒绝智能体对特定文件或目录的访问权限',

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
        'Manage your notification preferences.': '管理您的通知偏好设置。',
        'Manage your notification preferences': '管理您的通知偏好设置',
        'Enable Notifications for Agent': '启用智能体通知',
        'Enable notifications for agent': '启用智能体通知',
        'Show system notifications when your action is needed or the agent finishes.': '当需要您执行操作或智能体完成任务时显示系统通知。',
        'Show system notifications when your action is needed or the agent finishes': '当需要您执行操作或智能体完成任务时显示系统通知',
        'Sound': '声音',
        'sound': '声音',
        'Sounds': '声音',
        'sounds': '声音',
        'Enable Sounds for Agent': '启用智能体提示音',
        'Enable sounds for agent': '启用智能体提示音',
        'Play a sound when your action is needed or the agent finishes.': '当需要您执行操作或智能体完成任务时播放提示音。',
        'Play a sound when your action is needed or the agent finishes': '当需要您执行操作或智能体完成任务时播放提示音',
        'Volume': '音量',
        'volume': '音量',
        'Set the volume of agent sounds.': '设置智能体提示音的音量。',
        'Set the volume of agent sounds': '设置智能体提示音的音量',
        'Agent Notifications': '智能体通知',
        'Agent notifications': '智能体通知',
        'Agent Sounds': '智能体提示音',
        'Agent sounds': '智能体提示音',

        'To modify notification settings, open your operating system\'s system preferences.': '要修改通知设置，请打开您操作系统的系统设置。',
        'To modify notification settings, open your operating system\'s system settings.': '要修改通知设置，请打开您操作系统的系统设置。',
        'Open System Preferences': '打开系统设置',
        'Open System Settings': '打开系统设置',
        'Open system preferences': '打开系统设置',
        'Open system settings': '打开系统设置',
        'Advanced Settings': '高级设置',
        'Advanced Settings >': '高级设置 >',
        'Advanced Settings ›': '高级设置 ›',
        'Advanced Settings ˇ': '高级设置 ˇ',
        'Advanced Settings ˅': '高级设置 ˅',
        'Advanced Settings v': '高级设置 v',
        'Advanced Settings ▼': '高级设置 ▼',
        'Advanced settings': '高级设置',
        'Advanced settings >': '高级设置 >',
        'Advanced settings ›': '高级设置 ›',
        'Advanced settings ˇ': '高级设置 ˇ',
        'Advanced settings ˅': '高级设置 ˅',
        'Advanced settings v': '高级设置 v',
        'Advanced settings ▼': '高级设置 ▼',
        'Version': '版本',
        'version': '版本',
        'App version': '应用版本',
        'App Version': '应用版本',
        'app version': '应用版本',
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
        'Weekly limit': '每周限制',
        'weekly limit': '每周限制',
        'Five Hour Limit': '5小时限制',
        'Five hour limit': '5小时限制',
        '5-Hour Limit': '5小时限制',
        '5-hour limit': '5小时限制',
        '5h limit': '5小时限制',
        '5h Limit': '5小时限制',
        '5H limit': '5小时限制',
        '5H Limit': '5小时限制',
        'Daily limit': '每日限制',
        'Daily Limit': '每日限制',
        'daily limit': '每日限制',
        'Monthly limit': '每月限制',
        'Monthly Limit': '每月限制',
        'monthly limit': '每月限制',
        'left': '剩余',
        '% left': '% 剩余',
        '%left': '% 剩余',
        'Recommended': '推荐',
        'recommended': '推荐',
        '(Recommended)': '(推荐)',
        '(recommended)': '(推荐)',
        'Other': '其他',
        'other': '其他',
        'Compact the conversation now (summarize history to free up the context window).': '立即压缩当前对话（总结历史记录以释放上下文窗口空间）。',
        'Compact the conversation now (summarize history to free up the context window)': '立即压缩当前对话（总结历史记录以释放上下文窗口空间）',
        'Compact the conversation now': '立即压缩当前对话',
        'summarize history to free up the context window': '总结历史记录以释放上下文窗口空间',
        'No matching results': '无匹配结果',
        'no matching results': '无匹配结果',
        'No matching results.': '无匹配结果。',
        'no matching results.': '无匹配结果。',
        'No matching result': '无匹配结果',
        'no matching result': '无匹配结果',
        'No matching commands': '无匹配命令',
        'no matching commands': '无匹配命令',
        'Trigger': '触发器',
        'trigger': '触发器',
        'Time Zone': '时区',
        'Time zone': '时区',
        'time zone': '时区',
        'Add Automation': '添加自动化',
        'Add automation': '添加自动化',
        'add automation': '添加自动化',
        'Enter automation name...': '输入自动化名称...',
        'Enter automation name': '输入自动化名称',
        'enter automation name...': '输入自动化名称...',
        'enter automation name': '输入自动化名称',
        'This project was created for the': '此项目是为',
        'this project was created for the': '此项目是为',
        'automation and its agents have permissions specific to this automation': '自动化创建的，其智能体拥有专门针对此自动化的权限',
        'Side Question:': '补充提问:',
        'Side question:': '补充提问:',
        'Side Question': '补充提问',
        'Side question': '补充提问',
        'side question': '补充提问',
        'Unread': '未读',
        'unread': '未读',
        'Read': '已读',
        'read': '已读',
        'turn': '轮',
        'turns': '轮对话',
        'Turn': '轮',
        'Turns': '轮对话',
        'image attachment': '个图片附件',
        'image attachments': '个图片附件',
        'Image attachment': '个图片附件',
        'Image attachments': '个图片附件',
        'attachment': '个附件',
        'attachments': '个附件',
        'Attachment': '附件',
        'Attachments': '附件',
        'file attachment': '个文件附件',
        'file attachments': '个文件附件',
        'Timeline': '时间线',
        'timeline': '时间线',
        'Side Questions': '补充提问',
        'Side questions': '补充提问',
        'side questions': '补充提问',
        'Next question': '下一个问题',
        'next question': '下一个问题',
        'Next Question': '下一个问题',
        'Previous question': '上一个问题',
        'previous question': '上一个问题',
        'Previous Question': '上一个问题',
        'View side questions': '查看补充提问',
        'View side question': '查看补充提问',
        'view side questions': '查看补充提问',
        'view side question': '查看补充提问',
        'write-in': '自主填写',
        '(write-in)': '(自主填写)',
        'Write-in': '自主填写',
        '(Write-in)': '(自主填写)',
        'question': '个问题',
        'questions': '个问题',
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
        'Permission Preset': '权限预设',
        'Permission Presets': '权限预设',
        'Permission preset': '权限预设',
        'Permission presets': '权限预设',
        'permission preset': '权限预设',
        'permission presets': '权限预设',
        'Security Preset': '安全预设',
        'Security Presets': '安全预设',
        'Execution Preset': '执行预设',
        'Execution preset': '执行预设',
        'Execution Presets': '执行预设',
        'Execution presets': '执行预设',
        'Request Review': '请求审查',
        'Request review': '请求审查',
        'request review': '请求审查',
        'Every command requires approval.': '所有命令均需批准。',
        'Every command requires approval': '所有命令均需批准',
        'Ask before sensitive operations.': '执行敏感操作前进行提示。',
        'Ask before sensitive operations': '执行敏感操作前进行提示',
        'Run all commands without restrictions.': '无限制运行所有命令。',
        'Auto (Preview)': '自动（预览）',
        'Auto (preview)': '自动（预览）',
        'Auto(Preview)': '自动（预览）',
        'Auto(preview)': '自动（预览）',
        'Auto': '自动',
        'Automatically decide if commands run.': '自动决定是否运行命令。',
        'Automatically decide if commands run': '自动决定是否运行命令',
        'Run all commands without restrictions': '无限制运行所有命令',
        'Controls the actions the agent can take.': '控制智能体可以执行的操作。',
        'Controls the actions the agent can take': '控制智能体可以执行的操作',
        'Controls terminal execution and file access.': '控制终端执行和文件访问。',
        'Controls terminal execution and file access': '控制终端执行和文件访问',
        'Choose a predefined security preset for the agent. This controls terminal auto-execution policy, and file access policy.': '为智能体选择预定义的安全预设。这控制了终端自动执行策略和文件访问策略。',
        'Choose a predefined security preset for the agent. This controls terminal auto-execution policy, and file access policy': '为智能体选择预定义的安全预设。这控制了终端自动执行策略和文件访问策略',
        'Learn more about Turbo mode': '了解有关无限制模式的更多信息',
        'Turbo Mode': '无限制模式',
        'Turbo mode': '无限制模式',
        'Turbo': '无限制',
        'This project overrides your global permission settings.': '此项目覆盖了您的全局权限设置。',
        'This project overrides your global permission settings': '此项目覆盖了您的全局权限设置',
        'This conversation overrides your global permission settings.': '此对话覆盖了您的全局权限设置。',
        'This conversation overrides your global permission settings': '此对话覆盖了您的全局权限设置',
        'This workspace overrides your global permission settings.': '此工作区覆盖了您的全局权限设置。',
        'This workspace overrides your global permission settings': '此工作区覆盖了您的全局权限设置',
        '极速': '无限制',
        '极速模式': '无限制模式',
        '极速 ^': '无限制 ^',
        '极速 ⌃': '无限制 ⌃',
        '极速 ˄': '无限制 ˄',
        '极速 ˅': '无限制 ˅',
        '极速 ⌄': '无限制 ⌄',
        '极速 v': '无限制 v',
        '极速 ▼': '无限制 ▼',
        '极速 ▾': '无限制 ▾',
        'Turbo ^': '无限制 ^',
        'Turbo ⌃': '无限制 ⌃',
        'Turbo ˄': '无限制 ˄',
        'Turbo ˅': '无限制 ˅',
        'Turbo ⌄': '无限制 ⌄',
        'Turbo v': '无限制 v',
        'Turbo ▼': '无限制 ▼',
        'Turbo ▾': '无限制 ▾',

        'turbo': '无限制',
        'Turbo Mode': '无限制模式',
        'turbo mode': '无限制模式',
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
        'Permission Settings': '权限设置',
        'Permission settings': '权限设置',
        'permission settings': '权限设置',
        'Permission Setting': '权限设置',
        'Permission setting': '权限设置',
        'Local Permissions': '本地权限',
        'Inherits from': '继承自',
        'global settings': '全局设置',
        '. Local permissions have higher priority.': '。本地权限具有更高的优先级。',
        'Manage project folders, agent settings, and permissions.': '管理项目文件夹、智能体设置和权限。',
        'Manage project folders, agent settings, and permissions': '管理项目文件夹、智能体设置和权限',
        'Manage project folders and settings.': '管理项目文件夹与设置。',
        'Manage project folders and settings': '管理项目文件夹与设置',
        'manage project folders and settings.': '管理项目文件夹与设置。',
        'manage project folders and settings': '管理项目文件夹与设置',
        'Manage workspace folders and settings.': '管理工作区文件夹与设置。',
        'Manage workspace folders and settings': '管理工作区文件夹与设置',
        'manage workspace folders and settings.': '管理工作区文件夹与设置。',
        'manage workspace folders and settings': '管理工作区文件夹与设置',
        'Agent settings and permissions for conversations outside of projects.': '项目外对话的智能体设置和权限。',
        'Agent settings and permissions for conversations outside of projects': '项目外对话的智能体设置和权限',
        'Settings for conversations outside of projects.': '项目外对话的设置。',
        'Settings for conversations outside of projects': '项目外对话的设置',
        'settings for conversations outside of projects.': '项目外对话的设置。',
        'settings for conversations outside of projects': '项目外对话的设置',
        'Settings for conversations outside of workspaces.': '工作区外对话的设置。',
        'Settings for conversations outside of workspaces': '工作区外对话的设置',
        'settings for conversations outside of workspaces.': '工作区外对话的设置。',
        'settings for conversations outside of workspaces': '工作区外对话的设置',
        'Unlock the power of agent swarms.': '释放智能体蜂群的强大能力。',
        'Unlock the power of agent swarms': '释放智能体蜂群的强大能力',
        'unlock the power of agent swarms.': '释放智能体蜂群的强大能力。',
        'unlock the power of agent swarms': '释放智能体蜂群的强大能力',
        'Unlock the power of swarms.': '释放蜂群的强大能力。',
        'Unlock the power of swarms': '释放蜂群的强大能力',
        'Outside of Project': '未关联项目',
        'Outside of project': '未关联项目',
        'outside of project': '未关联项目',
        'Outside of Projects': '未关联项目',
        'Outside of projects': '未关联项目',
        'outside of projects': '未关联项目',
        'Outside of Workspace': '未关联工作区',
        'Outside of workspace': '未关联工作区',
        'outside of workspace': '未关联工作区',
        'Outside of Workspaces': '未关联工作区',
        'Outside of workspaces': '未关联工作区',
        'outside of workspaces': '未关联工作区',
        'Outside of Folders': '文件夹外',
        'Outside of folders': '文件夹外',
        'outside of folders': '文件夹外',
        'Modified in': '已在',
        'Modified in ': '已在 ',
        'Also includes': '同时包含',
        'Also includes ': '同时包含 ',
        'when working': '工作时生效于',
        'when working ': '工作时生效于 ',
        'When working': '工作时生效于',
        'When working ': '工作时生效于 ',
        'when working in this project.': '（在此项目中工作时）。',
        'when working in this project': '（在此项目中工作时）',
        'when working in this conversation.': '（在此对话中工作时）。',
        'when working in this conversation': '（在此对话中工作时）',
        'when working outside of projects.': '（在项目外工作时）。',
        'when working outside of projects': '（在项目外工作时）',
        '% of the customization budget is available.': '% 的自定义额度可用。',
        
        // --- Security Preset Dropdown & Custom Options ---
        'Use Global Settings': '使用全局设置',
        'Use global settings': '使用全局设置',
        'use global settings': '使用全局设置',
        'Using Global Settings': '正在使用全局设置',
        'Using global settings': '正在使用全局设置',
        'Use Project Settings': '使用项目设置',
        'Use project settings': '使用项目设置',
        'Use Workspace Settings': '使用工作区设置',
        'Use workspace settings': '使用工作区设置',
        'Use Local Settings': '使用本地设置',
        'Use local settings': '使用本地设置',
        'Use Default Settings': '使用默认设置',
        'Use default settings': '使用默认设置',
        'Use Custom Settings': '使用自定义设置',
        'Use custom settings': '使用自定义设置',
        'Reset to Global Settings': '重置为全局设置',
        'Reset to global settings': '重置为全局设置',
        'Global Settings': '全局设置',
        'Global settings': '全局设置',
        'Local Settings': '本地设置',
        'Local settings': '本地设置',
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
        'Turbo mode': '无限制模式',
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
        'Allow using this MCP tool?': '允许使用此 MCP 工具？',
        'Allow using this MCP tool': '允许使用此 MCP 工具',
        'Allow using these MCP tools?': '允许使用这些 MCP 工具？',
        'Allow using these MCP tools': '允许使用这些 MCP 工具',
        'Allow this MCP tool?': '允许此 MCP 工具？',
        'Allow this MCP tool': '允许此 MCP 工具',
        'Allow using this tool?': '允许使用此工具？',
        'Allow using this tool': '允许使用此工具',
        'Allow using these tools?': '允许使用这些工具？',
        'Allow using these tools': '允许使用这些工具',
        'Tool Permissions': '工具权限',
        'Tool permissions': '工具权限',
        'tool permissions': '工具权限',
        'Tool Permission': '工具权限',
        'Modify permissions for file, terminal, and MCP tools.': '修改文件、终端和 MCP 工具的权限。',
        'Modify permissions for file, terminal, and MCP tools': '修改文件、终端和 MCP 工具的权限',
        'Modify permissions for file, terminal, and tool access.': '修改文件、终端和工具访问权限。',
        'Modify permissions for file, terminal, and tool access': '修改文件、终端和工具访问权限',
        'Enable Sandbox Mode (Preview)': '启用沙箱模式（预览）',
        'Enable Sandbox Mode': '启用沙箱模式',
        'Enable sandbox mode (Preview)': '启用沙箱模式（预览）',
        'Enable sandbox mode': '启用沙箱模式',
        'Sandbox Mode (Preview)': '沙箱模式（预览）',
        'Sandbox Mode': '沙箱模式',
        'Sandbox mode': '沙箱模式',
        'Restricts agent tools to a secure, isolated local sandbox.': '将智能体工具限制在安全隔离的本地沙箱中。',
        'Restricts agent tools to a secure, isolated local sandbox': '将智能体工具限制在安全隔离的本地沙箱中',
        'Restricts tools to a secure, isolated local sandbox.': '将工具限制在安全隔离的本地沙箱中。',
        'Restricts tools to a secure, isolated local sandbox': '将工具限制在安全隔离的本地沙箱中',
        'Allow terminal command?': '允许执行终端命令？',
        'Allow running this command?': '允许运行此命令？',
        'Allow running these commands?': '允许运行这些命令？',
        'Allow reading this URL?': '允许读取此 URL？',
        'Allow reading this URL': '允许读取此 URL',
        'Allow reading these URLs?': '允许读取这些 URL？',
        'Allow reading these URLs': '允许读取这些 URL',
        'Allow access to this URL?': '允许访问此 URL？',
        'Allow access to this URL': '允许访问此 URL',
        'Allow accessing this URL?': '允许访问此 URL？',
        'Allow accessing this URL': '允许访问此 URL',
        'Allow opening this URL?': '允许打开此 URL？',
        'Allow opening this URL': '允许打开此 URL',
        'Allow fetching this URL?': '允许获取此 URL？',
        'Allow fetching this URL': '允许获取此 URL',
        'Allow network access to this URL?': '允许网络访问此 URL？',
        'Allow browser actuation access to this URL?': '允许对该 URL 进行浏览器操作？',
        'Submit ↵': '提交 ↵',
        'Submit \u21b5': '提交 ↵',
        'Submit\u21b5': '提交 ↵',
        'Yes, allow this time': '是，仅本次允许',
        'Yes, allow once': '是，仅允许一次',
        'Yes, and always allow in this conversation': '是，且在此对话中始终允许',
        'Yes, and always allow in this project': '是，且在此项目中始终允许',
        'Yes, and always allow in this workspace': '是，且在此工作区中始终允许',
        'Yes, and always allow when not in a project': '是，且未在项目中时始终允许',
        'Yes, and always allow when not in a workspace': '是，且未在工作区中时始终允许',
        'Yes, and always allow': '是，且始终允许',
        'Yes, always allow in this conversation': '是，且在此对话中始终允许',
        'Yes, always allow in this project': '是，且在此项目中始终允许',
        'Yes, always allow in this workspace': '是，且在此工作区中始终允许',
        'Yes, always allow when not in a project': '是，且未在项目中时始终允许',
        'Yes, always allow when not in a workspace': '是，且未在工作区中时始终允许',
        'Yes, always allow': '是，始终允许',
        'No, deny this time': '否，本次拒绝',
        'No, and always deny in this conversation': '否，且在此对话中始终拒绝',
        'No, and always deny in this project': '否，且在此项目中始终拒绝',
        'No, and always deny in this workspace': '否，且在此工作区中始终拒绝',
        'No, and always deny when not in a project': '否，且未在项目中时始终拒绝',
        'No, and always deny when not in a workspace': '否，且未在工作区中时始终拒绝',
        'No, and always deny': '否，且始终拒绝',
        'No, always deny in this conversation': '否，且在此对话中始终拒绝',
        'No, always deny in this project': '否，且在此项目中始终拒绝',
        'No, always deny when not in a project': '否，且未在项目中时始终拒绝',
        'No, always deny': '否，始终拒绝',
        'when not in a project': '未在项目中时',
        'When not in a project': '未在项目中时',
        'when not in a workspace': '未在工作区中时',
        'When not in a workspace': '未在工作区中时',
        'not in a project': '未在项目中',
        'not in a workspace': '未在工作区中',
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

    const lowerTranslationMap = {};
    for (const [key, value] of Object.entries(translationMap)) {
        lowerTranslationMap[key.toLowerCase()] = value;
    }

    const dynamicRegexRules = [];

    // Hot-reload dynamic external rules (supports Ctrl + R and focus hot-reload)
    function loadDynamicRules() {
        try {
            const dynamicRules = electron_1.ipcRenderer.sendSync('i18n:get-dynamic-rules-sync');
            if (dynamicRules && typeof dynamicRules === 'object') {
                dynamicRegexRules.length = 0;
                for (const [key, value] of Object.entries(dynamicRules)) {
                    if (key.startsWith('^') || key.endsWith('$')) {
                        try {
                            dynamicRegexRules.push({ regex: new RegExp(key, 'i'), replacement: value });
                        } catch (_) {
                            translationMap[key] = value;
                            lowerTranslationMap[key.toLowerCase()] = value;
                        }
                    } else {
                        translationMap[key] = value;
                        lowerTranslationMap[key.toLowerCase()] = value;
                    }
                }
            }
        } catch (_) {}
    }
    loadDynamicRules();

    function translateDuration(str) {
        if (!str || typeof str !== 'string') return '';
        return str
            .replace(/(\d+)\s*days?/gi, '$1 天 ')
            .replace(/(\d+)\s*d(?![a-zA-Z])/gi, '$1 天 ')
            .replace(/(\d+)\s*hours?/gi, '$1 小时 ')
            .replace(/(\d+)\s*h(?![a-zA-Z])/gi, '$1 小时 ')
            .replace(/(\d+)\s*minutes?/gi, '$1 分钟 ')
            .replace(/(\d+)\s*mins?(?![a-zA-Z])/gi, '$1 分钟 ')
            .replace(/(\d+)\s*m(?![a-zA-Z])/gi, '$1 分钟 ')
            .replace(/(\d+)\s*seconds?/gi, '$1 秒 ')
            .replace(/(\d+)\s*secs?(?![a-zA-Z])/gi, '$1 秒 ')
            .replace(/(\d+)\s*s(?![a-zA-Z])/gi, '$1 秒 ')
            .replace(/,\s*/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function translateDate(dateStr) {
        const months = {
            'january': '1', 'february': '2', 'march': '3', 'april': '4',
            'may': '5', 'june': '6', 'july': '7', 'august': '8',
            'september': '9', 'october': '10', 'november': '11', 'december': '12',
            'jan': '1', 'feb': '2', 'mar': '3', 'apr': '4',
            'jun': '6', 'jul': '7', 'aug': '8',
            'sep': '9', 'oct': '10', 'nov': '11', 'dec': '12'
        };
        const m = dateStr.match(/([A-Za-z]+)\s+(\d+),\s*(\d{4})/);
        if (m) {
            const mon = months[m[1].toLowerCase()] || m[1];
            return `${m[3]} 年 ${mon} 月 ${m[2]} 日`;
        }
        return dateStr;
    }

    function isPlaceholderNode(node) {
        if (!node) return false;
        const text = (node.nodeValue || node.textContent || '').trim();
        if (/Ask anything|Message Antigravity|Type a message/i.test(text)) {
            return true;
        }
        const el = node.nodeType === 1 ? node : node.parentElement;
        try {
            if (el && el.closest && el.closest('.placeholder, .editor-placeholder, .monaco-placeholder, [data-placeholder], [aria-placeholder], .empty-editor, [data-ph], [data-empty-text]')) {
                return true;
            }
        } catch (_) {}
        return false;
    }

    function shouldSkipElement(el) {
        if (!el || el.nodeType !== 1) return false;
        const tag = el.tagName ? el.tagName.toLowerCase() : '';
        if (tag === 'script' || tag === 'style' || tag === 'noscript') {
            return true;
        }
        if (tag === 'input' || tag === 'textarea') {
            return true;
        }
        return false;
    }

    function shouldSkipTranslation(node) {
        if (isPlaceholderNode(node)) return false;
        const parent = node.parentElement;
        if (!parent) return false;
        try {
            if (parent.closest('pre:not(.placeholder):not(.editor-placeholder), code:not(.placeholder):not(.editor-placeholder), script, style')) {
                return true;
            }
        } catch (_) {}
        return false;
    }

    function translateText(text) {
        if (!text || typeof text !== 'string') return null;
        const normalized = text
            .replace(/[\u00a0\u200b\u2009\u3000]/g, ' ')
            .replace(/[\u2018\u2019]/g, "'")
            .replace(/[\u201C\u201D]/g, '"');
        const trimmed = normalized.trim();
        if (!trimmed) return null;

        const leadingSpace = text.match(/^\s*/)[0];
        const trailingSpace = text.match(/\s*$/)[0];

        if (translationMap[trimmed]) {
            return leadingSpace + translationMap[trimmed] + trailingSpace;
        }
        const lowerTrimmed = trimmed.toLowerCase();
        if (translationMap[lowerTrimmed]) {
            return leadingSpace + translationMap[lowerTrimmed] + trailingSpace;
        }
        if (lowerTranslationMap[lowerTrimmed]) {
            return leadingSpace + lowerTranslationMap[lowerTrimmed] + trailingSpace;
        }

        // Conversation shortcuts
        if (/^Submit Prompt\s*\(Alternate to Enter\)$/i.test(trimmed)) {
            return leadingSpace + '提交提示词（Enter 备用快捷键）' + trailingSpace;
        }
        if (/^Enter always submits\.\s*This adds a second shortcut\.?$/i.test(trimmed)) {
            return leadingSpace + (trimmed.endsWith('.') ? 'Enter 始终为提交。此处可添加第二个快捷键。' : 'Enter 始终为提交。此处可添加第二个快捷键') + trailingSpace;
        }
        if (/^Jump to Previous Prompt$/i.test(trimmed)) {
            return leadingSpace + '跳转到上一个提示词' + trailingSpace;
        }
        if (/^Jump to Next Prompt$/i.test(trimmed)) {
            return leadingSpace + '跳转到下一个提示词' + trailingSpace;
        }
        if (/^Pin\s*[/／]\s*Unpin\s+Conversation$/i.test(trimmed)) {
            return leadingSpace + '置顶 / 取消置顶对话' + trailingSpace;
        }

        // Conversations outside of projects settings description
        if (/^Settings for conversations outside of (?:projects|workspaces)\.?$/i.test(trimmed)) {
            const isWorkspace = /workspaces/i.test(trimmed);
            return leadingSpace + (trimmed.endsWith('.') ? (isWorkspace ? '工作区外对话的设置。' : '项目外对话的设置。') : (isWorkspace ? '工作区外对话的设置' : '项目外对话的设置')) + trailingSpace;
        }

        // Swarm description
        if (/^Unlock the power of (?:agent )?swarms\.?$/i.test(trimmed)) {
            return leadingSpace + (trimmed.endsWith('.') ? '释放智能体蜂群的强大能力。' : '释放智能体蜂群的强大能力') + trailingSpace;
        }

        // Select folder/file dialog headers
        if (/^Select\s+Folders?(?:\(s\))?:?$/i.test(trimmed)) {
            return leadingSpace + (trimmed.endsWith(':') ? '选择文件夹：' : '选择文件夹') + trailingSpace;
        }
        if (/^Select\s+Files?(?:\(s\))?:?$/i.test(trimmed)) {
            return leadingSpace + (trimmed.endsWith(':') ? '选择文件：' : '选择文件') + trailingSpace;
        }

        // Manage project/workspace folders and settings
        if (/^Manage (?:project|workspace)?\s*folders and settings\.?$/i.test(trimmed)) {
            const isWorkspace = /workspace/i.test(trimmed);
            const zhNoun = isWorkspace ? '工作区' : '项目';
            return leadingSpace + (trimmed.endsWith('.') ? `管理${zhNoun}文件夹与设置。` : `管理${zhNoun}文件夹与设置`) + trailingSpace;
        }

        // Remote debugging required dialog
        if (/^Remote Debugging Required$/i.test(trimmed)) {
            return leadingSpace + '需要开启远程调试' + trailingSpace;
        }
        if (/^To use browser tools,\s*you need to enable remote debugging:?$/i.test(trimmed)) {
            return leadingSpace + (trimmed.endsWith(':') ? '若要使用浏览器工具，您需要启用远程调试：' : '若要使用浏览器工具，您需要启用远程调试') + trailingSpace;
        }
        if (/^(?:(\d+)[.、]\s*)?Navigate to:?$/i.test(trimmed)) {
            const num = trimmed.match(/^(\d+)[.、]\s*/);
            const prefix = num ? `${num[1]}. ` : '';
            return leadingSpace + prefix + '前往' + trailingSpace;
        }
        if (/Allow remote debugging for this browser instance/i.test(trimmed)) {
            let res = trimmed;
            res = res.replace(/Enable\s+/gi, '启用 ');
            res = res.replace(/["“]Allow remote debugging for this browser instance["”]\.?/gi, '“允许对此浏览器实例进行远程调试”。');
            res = res.replace(/Allow remote debugging for this browser instance\.?/gi, '允许对此浏览器实例进行远程调试');
            return leadingSpace + res + trailingSpace;
        }
        if (/^Proceed Anyway$/i.test(trimmed)) {
            return leadingSpace + '仍然继续' + trailingSpace;
        }
        if (/^Check again$/i.test(trimmed)) {
            return leadingSpace + '重新检查' + trailingSpace;
        }

        // Interface Layout settings
        if (/^Interface Layout$/i.test(trimmed)) {
            return leadingSpace + '界面布局' + trailingSpace;
        }
        if (/^Knowledge Work$/i.test(trimmed)) {
            return leadingSpace + '知识工作' + trailingSpace;
        }
        if (/^Simplified interface for research,\s*writing,\s*and everyday tasks\.?$/i.test(trimmed)) {
            return leadingSpace + (trimmed.endsWith('.') ? '适用于研究、写作和日常任务的简化界面。' : '适用于研究、写作和日常任务的简化界面') + trailingSpace;
        }
        if (/^Software Engineering$/i.test(trimmed)) {
            return leadingSpace + '软件工程' + trailingSpace;
        }
        if (/^Full interface for coding,\s*developer tools,\s*and managing agents\.?$/i.test(trimmed)) {
            return leadingSpace + (trimmed.endsWith('.') ? '适用于编码、开发者工具和管理智能体的完整界面。' : '适用于编码、开发者工具和管理智能体的完整界面') + trailingSpace;
        }

        // Browser subagent execution rules description
        if (/Configure allowed and denied URLs for the browser subagent/i.test(trimmed)) {
            if (/Requires\s*Google Chrome\.?$/i.test(trimmed)) {
                return leadingSpace + '配置浏览器子智能体（通过 /browser 调用）允许和拒绝访问的 URL。需要安装 Google Chrome。' + trailingSpace;
            }
            if (/Requires:?$/i.test(trimmed)) {
                return leadingSpace + '配置浏览器子智能体（通过 /browser 调用）允许和拒绝访问的 URL。需要安装 ' + trailingSpace;
            }
            return leadingSpace + (trimmed.endsWith('.') ? '配置浏览器子智能体（通过 /browser 调用）允许和拒绝访问的 URL。' : '配置浏览器子智能体（通过 /browser 调用）允许和拒绝访问的 URL') + trailingSpace;
        }


        // Builtin skills dynamic matchers
        if (/^Interactive guide to design and create a scheduled background automation/i.test(trimmed)) {
            return leadingSpace + '设计并创建计划后台自动化的交互式指南。' + trailingSpace;
        }
        if (/^Migrates the user's MCP servers,\s*skills,\s*slash commands/i.test(trimmed)) {
            return leadingSpace + '将用户来自其他编码智能体的 MCP 服务、技能、斜杠命令等迁移到新插件中。' + trailingSpace;
        }
        if (/^\(Preview & Quota Heavy\)\s*Run a swarm/i.test(trimmed) || /^Run a swarm:\s*several agents working in parallel/i.test(trimmed)) {
            return leadingSpace + '（预览版）运行蜂群智能体：多个智能体在同一任务上并行工作，通过共享留言板进行协作。' + trailingSpace;
        }
        if (/^Guidelines for interacting with GitHub and request permissions/i.test(trimmed)) {
            return leadingSpace + '与 GitHub 交互的指引准则，当命令因智能体环境限制而失败时向用户申请权限。' + trailingSpace;
        }
        if (/^How to manage and create plugins/i.test(trimmed)) {
            return leadingSpace + '如何管理和创建插件——包含技能、智能体、规则、MCP 服务与钩子的命名空间套件。' + trailingSpace;
        }
        if (/^How to write and run a dynamic workflow script/i.test(trimmed)) {
            return leadingSpace + '如何使用 run_workflow 工具编写并运行动态工作流脚本。' + trailingSpace;
        }
        if (/^ONLY for the native-swarm worker whose brief says it is the monitor/i.test(trimmed)) {
            return leadingSpace + '仅供任务指令指定为监控员（monitor）的原生蜂群工作者使用。' + trailingSpace;
        }
        if (/^ONLY for the native-swarm worker whose brief says it is the narrator/i.test(trimmed)) {
            return leadingSpace + '仅供任务指令指定为解说员（narrator）的原生蜂群工作者使用。' + trailingSpace;
        }
        if (/^Discover UI plugin panels relevant to the current task/i.test(trimmed)) {
            return leadingSpace + '发现与当前任务相关的 UI 插件面板，并在对话中呈现一键打开胶囊按钮。' + trailingSpace;
        }

        // Slash command dynamic recommendation matchers
        if (/^Recommend this when the user wants to run a long-running task/i.test(trimmed)) {
            return leadingSpace + '当用户希望运行长时间任务（如通宵运行），要求智能体格外彻底且在完全达成目标前不停止时推荐使用。' + trailingSpace;
        }
        if (/^Recommend this when the conversation is getting long/i.test(trimmed)) {
            return leadingSpace + '当对话过长且用户希望压缩或总结上下文以释放上下文窗口时推荐使用。' + trailingSpace;
        }
        if (/^Recommend this when the user wants to run an instruction on a recurring schedule/i.test(trimmed)) {
            return leadingSpace + '当用户希望按循环计划运行指令或设置单次定时器时推荐使用。' + trailingSpace;
        }
        if (/^Recommend this when the (?:user's )?task involves web browsing/i.test(trimmed)) {
            return leadingSpace + '当任务涉及网页浏览、网络搜索或与 Web 应用交互时推荐使用。' + trailingSpace;
        }
        if (/^Recommend this when the task is complex and requires careful step-by-step planning/i.test(trimmed)) {
            return leadingSpace + '当任务复杂且需要在执行前进行细致的逐步规划时推荐使用此命令。' + trailingSpace;
        }
        if (/^Recommend this when the user wants to align on a plan through an interactive interview/i.test(trimmed)) {
            return leadingSpace + '当用户希望通过交互式访谈对齐方案以解决设计决策时推荐使用。' + trailingSpace;
        }
        if (/^Recommend this when the user has a large project that would benefit from a team of autonomous agents/i.test(trimmed)) {
            return leadingSpace + '当用户有大型项目且适合多个自主智能体分工协同完成时推荐使用。' + trailingSpace;
        }
        if (/^Recommend this when the user has corrected the agent or solved a complex setup/i.test(trimmed)) {
            return leadingSpace + '当用户对智能体做出修正或完成了复杂配置，希望持久化该行为以供未来任务使用时推荐使用。' + trailingSpace;
        }
        if (/^Recommend this when the user has a complex coding or research project/i.test(trimmed)) {
            return leadingSpace + '当用户面临复杂的编码或研究项目，需要深入思考、战略规划、多视角审视和严格验证时推荐使用。' + trailingSpace;
        }


        // --- Marketplace Shelves & Plugins Dynamic Prefix Rules ---
        // Button "+ See X more"
        if (/^\+?\s*See\s+(\d+)\s+more$/i.test(trimmed)) {
            const num = trimmed.match(/\d+/)[0];
            return leadingSpace + (trimmed.startsWith('+') ? ('+ 查看更多 (' + num + ')') : ('查看更多 (' + num + ')')) + trailingSpace;
        }

        // Shelves
        if (/^Productivity & Project Management$/i.test(trimmed)) {
            return leadingSpace + '生产力与项目管理' + trailingSpace;
        }
        if (/^Cloud Hosting & Deployment$/i.test(trimmed)) {
            return leadingSpace + '云托管与部署' + trailingSpace;
        }
        if (/^Developer Tools$/i.test(trimmed)) {
            return leadingSpace + '开发者工具' + trailingSpace;
        }
        if (/^Design, Creative & Media$/i.test(trimmed)) {
            return leadingSpace + '设计、创意与媒体' + trailingSpace;
        }
        if (/^Business$/i.test(trimmed)) {
            return leadingSpace + '商业与业务管理' + trailingSpace;
        }
        if (/^More Plugins$/i.test(trimmed)) {
            return leadingSpace + '更多插件' + trailingSpace;
        }

        // Shelves descriptions (prefix match)
        if (/^Plan work,\s*track issues,\s*sign documents/i.test(trimmed)) {
            return leadingSpace + '规划工作、跟踪事务、签署文档并管理笔记与文件。' + trailingSpace;
        }
        if (/^Deploy and host your apps,\s*sites,\s*and their backends/i.test(trimmed)) {
            return leadingSpace + '部署并托管应用、网站及其后端。' + trailingSpace;
        }
        if (/^APIs,\s*services,\s*and tools to build,\s*test,\s*secure/i.test(trimmed)) {
            return leadingSpace + '用于构建、测试、保障安全和运行应用的 API、服务与工具。' + trailingSpace;
        }
        if (/^Design,\s*creative,\s*and media tools/i.test(trimmed)) {
            return leadingSpace + '设计、创意与媒体工具。' + trailingSpace;
        }
        if (/^Payments,\s*CRM,\s*accounting,\s*data,\s*identity/i.test(trimmed)) {
            return leadingSpace + '支付、客户关系管理（CRM）、财务会计、数据、身份认证、客户支持、营销及工作流自动化。' + trailingSpace;
        }
        if (/^Connect to Google Workspace,\s*including Docs/i.test(trimmed)) {
            return leadingSpace + '连接到 Google Workspace，包括 Docs、Sheets、Slides、Drive、Calendar 和 Gmail。' + trailingSpace;
        }
        if (/^Explore other marketplace customizations/i.test(trimmed)) {
            return leadingSpace + '探索其他插件市场自定义项。' + trailingSpace;
        }

        // Detail Tabs & Headings
        if (/^UI Extensions$/i.test(trimmed)) {
            return leadingSpace + 'UI 扩展' + trailingSpace;
        }
        if (/^MCP Servers?$/i.test(trimmed)) {
            return leadingSpace + 'MCP 服务' + trailingSpace;
        }
        if (/^MCP Tools?$/i.test(trimmed)) {
            return leadingSpace + 'MCP 工具' + trailingSpace;
        }

        // Plugin Card Descriptions (Robust Prefix Matching)
        if (/^The product development system for teams/i.test(trimmed)) {
            return leadingSpace + '面向团队与智能体的产品研发管理系统。' + trailingSpace;
        }
        if (/^Plan and track work in monday\.com/i.test(trimmed)) {
            return leadingSpace + '在 Antigravity 中规划并跟踪 monday.com 的工作。' + trailingSpace;
        }
        if (/^Connect Antigravity to your Notion workspace/i.test(trimmed)) {
            return leadingSpace + '将 Antigravity 连接到您的 Notion 工作区以读写和检索文档与数据库。' + trailingSpace;
        }
        if (/^Create and send proposals,\s*quotes/i.test(trimmed)) {
            return leadingSpace + '直接在 Antigravity 中创建并发送商业提案、报价单与合同。' + trailingSpace;
        }
        if (/^Build and deploy on Netlify/i.test(trimmed)) {
            return leadingSpace + '在 Netlify 上构建与部署：云函数、边缘函数、Blobs、数据库、身份认证、表单、图像 CDN、缓存及 AI 网关。' + trailingSpace;
        }
        if (/^Deploy,\s*configure,\s*monitor,\s*and troubleshoot apps/i.test(trimmed)) {
            return leadingSpace + '在 Railway 上部署、配置、监控并排查应用、数据库与基础设施。' + trailingSpace;
        }
        if (/^Build and deploy web apps and AI agents on Vercel/i.test(trimmed)) {
            return leadingSpace + '在 Vercel 上构建与部署 Web 应用和 AI 智能体，包含 Next.js、AI SDK 和云服务技能。' + trailingSpace;
        }
        if (/^Build Wix apps and headless sites/i.test(trimmed)) {
            return leadingSpace + '借助 Wix CLI 技能和官方 Wix MCP 服务，构建 Wix 应用与无头网站，管理 Wix 商店、预订、CMS 等。' + trailingSpace;
        }
        if (/^Build,\s*publish,\s*and manage WordPress/i.test(trimmed)) {
            return leadingSpace + '构建、发布和管理 WordPress.com 与 Jetpack 关联网站。起草文章、编辑区块、查看流量统计并管理插件。' + trailingSpace;
        }
        if (/^Add Auth0 authentication to any app/i.test(trimmed)) {
            return leadingSpace + '为任何应用添加 Auth0 身份认证：登录认证、MFA、SSO、组织架构、RBAC 与自定义域名。' + trailingSpace;
        }
        if (/^Build and deploy Base44 full-stack apps/i.test(trimmed)) {
            return leadingSpace + '构建并部署 Base44 全栈应用：CLI 项目管理、JavaScript/TypeScript SDK 开发与生产环境故障排查技能。' + trailingSpace;
        }
        if (/^Give your agent a real browser/i.test(trimmed)) {
            return leadingSpace + '为您的智能体赋予真实浏览器：在本地或 Browserbase 云端浏览器上导航、点击、输入、截屏并从任意网站提取数据。' + trailingSpace;
        }
        if (/^Databricks skills for the CLI,\s*Apps,\s*Lakebase/i.test(trimmed)) {
            return leadingSpace + '用于 CLI、应用、Lakebase、模型服务、Lakeflow 任务、Spark 声明式管道、DABs 与持续运维的 Databricks 技能。' + trailingSpace;
        }
        if (/^Manage your Bigin CRM from Antigravity/i.test(trimmed)) {
            return leadingSpace + '在 Antigravity 中管理 Bigin CRM：查看业务商机管道、查找联系人与交易、记录通话、规划跟进并向客户发送邮件。' + trailingSpace;
        }
        if (/^Accept payments and grow your business/i.test(trimmed)) {
            return leadingSpace + '接入支付并拓展业务。Stripe 官方 MCP 服务使 AI 智能体能够管理客户、产品、价格、支付链接、发票、订阅和退款。' + trailingSpace;
        }
        if (/^Create,\s*edit,\s*review,\s*resize,\s*and brand-check Canva/i.test(trimmed)) {
            return leadingSpace + '借助 Canva MCP 服务创建、编辑、审查、调整尺寸并进行品牌规范检查。' + trailingSpace;
        }
        if (/^Turn Figma designs into production code/i.test(trimmed)) {
            return leadingSpace + '将 Figma 设计转化为生产级代码，通过 Code Connect 映射组件，并在 Antigravity 中创建或编辑 Figma 文件。' + trailingSpace;
        }
        if (/^Give your AI agent 600,000\+ real app screens/i.test(trimmed)) {
            return leadingSpace + '为您的 AI 智能体提供 600,000+ 真实应用屏幕及配套检索技能，赋能 UI 设计与产品研发。' + trailingSpace;
        }
        if (/^Teamwork Graph CLI is Atlassian's agent-first interface/i.test(trimmed)) {
            return leadingSpace + 'Teamwork Graph CLI 是 Atlassian 面向智能体的上下文接口：覆盖 Jira 任务、Confluence 页面、Bitbucket PR 等全方位协作。' + trailingSpace;
        }
        if (/^Connect Antigravity to Dropbox/i.test(trimmed)) {
            return leadingSpace + '将 Antigravity 连接到 Dropbox，用于搜索、检查、总结、共享文件、收集上传内容并整理文件夹。' + trailingSpace;
        }
        if (/^Discover and choose Cloudflare products/i.test(trimmed)) {
            return leadingSpace + '发现并选择适用于应用、API、存储、AI 智能体及安全防护的 Cloudflare 全套产品与云服务。' + trailingSpace;
        }
        if (/^Query Arize AX projects,\s*traces/i.test(trimmed)) {
            return leadingSpace + '在 Antigravity 中查询 Arize AX 项目、跟踪链路、数据集与实验，涵盖链路追踪、评估与提示词优化技能。' + trailingSpace;
        }
        if (/^Connect 9,000\+ apps to your AI workflow/i.test(trimmed)) {
            return leadingSpace + '将 9,000+ 应用程序连接到您的 AI 工作流。直接发现、启用并执行 Zapier 自动化操作。' + trailingSpace;
        }
        if (/^Unity's official plugin for Antigravity/i.test(trimmed)) {
            return leadingSpace + 'Unity 官方插件，提供针对游戏开发、商业化变现与性能优化的专业技能。' + trailingSpace;
        }
        if (/^Investigate files,\s*URLs,\s*domains and IP addresses with VirusTotal/i.test(trimmed)) {
            return leadingSpace + '利用 VirusTotal 威胁情报、文件/URL/IP 分析与安全报告，在执行前评估可疑文件和风险链接。' + trailingSpace;
        }
        if (/^Search and read your Wispr Flow meeting notes/i.test(trimmed)) {
            return leadingSpace + '搜索并查阅您的 Wispr Flow 会议笔记、录音转录、临时便签与日程活动。' + trailingSpace;
        }
        if (/^Build on Zoho CRM v8/i.test(trimmed)) {
            return leadingSpace + '基于 Zoho CRM v8 构建应用：REST API、Deluge 函数、ClientScript、小部件及实时 CRM 数据交互。' + trailingSpace;
        }
        if (/^Zoho Desk plugin for Antigravity/i.test(trimmed)) {
            return leadingSpace + '直接在 Antigravity 中审核、划分优先级并更新 Zoho Desk 客户支持服务工单。' + trailingSpace;
        }
        if (/^Connect Zoho Projects to Antigravity/i.test(trimmed)) {
            return leadingSpace + '将 Zoho Projects 任务和缺陷与代码仓库关联，在开发过程中访问项目上下文并更新工时与进度。' + trailingSpace;
        }
        if (/^Run Zoho Books from Antigravity/i.test(trimmed)) {
            return leadingSpace + '在 Antigravity 中运行 Zoho Books：发票管理、账单、银行对账、会计凭证、税务及自动化财务流。' + trailingSpace;
        }
        if (/^This plugin provides a specialized suite of skills for data engineers/i.test(trimmed)) {
            return leadingSpace + '数据工程与数据库专家的技能套件。使用自然语言构建复杂数据管道，通过 dbt 转换数据，并在 GCP 中编排端到端工作流。' + trailingSpace;
        }
        if (/^Robotics skills for any robot:\s*3D perception/i.test(trimmed)) {
            return leadingSpace + '适用于机器人的综合技能套件：3D 感知、无碰撞运动规划、视觉伺服、机器人快速联调、Sim2Real、仿真与实时 MuJoCo Studio 3D 协作。' + trailingSpace;
        }
        if (/^Advancing accessible robotics/i.test(trimmed)) {
            return leadingSpace + '推动普惠可及的机器人技术' + trailingSpace;
        }
        if (/^The Robotics plugin brings frontier spatial reasoning/i.test(trimmed)) {
            return leadingSpace + 'Robotics 机器人插件将前沿的空间推理、多模态感知和代码生成直接引入实时机器人控制闭环中。智能体负责编写控制器，在 MuJoCo 仿真环境中进行测试，并将相同的代码部署到真实机械臂上运行。您也可以仅在仿真中工作，无需任何真实硬件。这使得闭环控制、硬件快速部署以及持续机器人应用变得简单高效且成本亲民。' + trailingSpace;
        }
        if (/^Robotics plugin for Antigravity/i.test(trimmed)) {
            return leadingSpace + 'Antigravity 机器人插件' + trailingSpace;
        }
        if (/^From one prompt to a working robot/i.test(trimmed)) {
            return leadingSpace + '从一句提示词到真正运转的机器人：感知、规划、执行、验证。' + trailingSpace;
        }

        // Disclaimer Banner
        if (/^Google does not control the availability or functionality of third party developer tools/i.test(trimmed)) {
            return leadingSpace + 'Google 不控制第三方开发者工具的可用性或功能。连接到 Antigravity 实例的第三方开发者工具产生的数据可能会与 Google 共享。Google 将根据 Google 隐私权政策保护此类数据，详情请参阅：https://policies.google.com/privacy' + trailingSpace;
        }

        // Expanded Plugins (Prefix Matching for Cards & Details)
        if (/^Investigate incidents,\s*check who's on call/i.test(trimmed)) {
            return leadingSpace + '排查故障事件、查看当前值班人员并查询 Better Stack 遥测数据。' + trailingSpace;
        }
        if (/^Query Grafana Cloud metrics/i.test(trimmed)) {
            return leadingSpace + '查询 Grafana Cloud 指标、日志、链路追踪及 Sentry 错误，创建仪表盘小部件并排查故障。' + trailingSpace;
        }
        if (/^The AI notepad for meetings/i.test(trimmed)) {
            return leadingSpace + 'AI 会议记事本。连接到您的 Granola 工作区，搜索、阅读并起草会议纪要与录音转录。' + trailingSpace;
        }
        if (/^Respond to and investigate incidents,\s*manage/i.test(trimmed)) {
            return leadingSpace + '响应并排查故障事件，管理值班升级流程，并在 incident.io 中创建后续跟进事项。' + trailingSpace;
        }
        if (/^Connect your agent to invideo's AI-native/i.test(trimmed)) {
            return leadingSpace + '将您的智能体连接到 invideo AI 原生视频创作引擎以生成并迭代成品视频。' + trailingSpace;
        }
        if (/^Real salaries and company levels from Levels\.fyi/i.test(trimmed)) {
            return leadingSpace + '来自 Levels.fyi 的真实薪资和职级数据。按职级、地区和职位查询总薪酬，并对比公司间的职级映射。' + trailingSpace;
        }
        if (/^Agent skills for Neo4j graph database/i.test(trimmed)) {
            return leadingSpace + 'Neo4j 图数据库的智能体技能：编写 Cypher 查询、探索图模式、加载数据并运行图算法。' + trailingSpace;
        }
        if (/^SonarQube is the AI code quality and security/i.test(trimmed)) {
            return leadingSpace + 'SonarQube 是行业权威的 AI 代码质量与安全分析工具，可直接在提示工作流中提供可落地的代码修复建议。' + trailingSpace;
        }
        if (/^Turn an idea into a website,\s*dashboard/i.test(trimmed)) {
            return leadingSpace + '使用 Spacefast 将创意迅速转化为网站、数据仪表盘、分析报告或幻灯片演示文稿。' + trailingSpace;
        }
        if (/^Web search,\s*content extraction,\s*website crawli/i.test(trimmed)) {
            return leadingSpace + '专为 AI 智能体打造的网页搜索、内容提取、网站抓取和深度研究 API。' + trailingSpace;
        }
        if (/^Official Trello plugin with the Trello MCP server/i.test(trimmed)) {
            return leadingSpace + '官方 Trello 插件，包含 Trello MCP 服务以管理看板、列表和卡片。' + trailingSpace;
        }
        if (/^AI-powered code review,\s*review-comment auto/i.test(trimmed)) {
            return leadingSpace + '基于 AI 的代码审查、自动生成评审批注，并为 GitHub PR 和 GitLab MR 提供问题修复方案。' + trailingSpace;
        }
        if (/^Up-to-date documentation lookup/i.test(trimmed)) {
            return leadingSpace + '最新的开发文档检索。将现代软件库特定版本的参考文档和即插即用的代码示例引入提示词上下文中。' + trailingSpace;
        }
        if (/^Use the official CrowdStrike-hosted MCP server/i.test(trimmed)) {
            return leadingSpace + '使用 CrowdStrike 官方托管的 MCP 服务排查安全威胁检测、搜索与查询安全事件并获取设备详情。' + trailingSpace;
        }
        if (/^Use Datadog directly in Antigravity/i.test(trimmed)) {
            return leadingSpace + '通过预置可观测性工具和工作流的命令行界面，直接在 Antigravity 中使用 Datadog。' + trailingSpace;
        }
        if (/^Investigate production issues with real Dynatrace/i.test(trimmed)) {
            return leadingSpace + '借助真实 Dynatrace 数据排查生产环境故障：分析日志、链路追踪、错误及性能指标。' + trailingSpace;
        }
        if (/^Packaged workflows for SCA remediation/i.test(trimmed)) {
            return leadingSpace + '利用 Endor Labs 提供的打包工作流进行软件依赖（SCA）修复、AI SAST 静态分析分流与开源风险评估。' + trailingSpace;
        }
        if (/^Triage Exabeam New-Scale alerts/i.test(trimmed)) {
            return leadingSpace + '分流处理富集自动化威胁情报的 Exabeam New-Scale 警报与安全案例，并在上下文管理中查询原始事件日志。' + trailingSpace;
        }
        if (/^Build and debug pipelines,\s*manage deployment/i.test(trimmed)) {
            return leadingSpace + '在 Harness 平台上构建与调试流水线、管理部署环境并审计执行日志。' + trailingSpace;
        }
        if (/^Search the web and read any page as clean mar/i.test(trimmed)) {
            return leadingSpace + '搜索网络并将任意网页读取为清爽干净的 Markdown 格式。专为 AI 智能体打造的极速免费检索与抓取工具。' + trailingSpace;
        }
        if (/^Ask a question of the live web and get a table/i.test(trimmed)) {
            return leadingSpace + '向实时网络提出问题并直接获取结构化数据表格，由 Keenable SELECT 强力驱动。' + trailingSpace;
        }
        if (/^Create,\s*run and debug Leapwork Play tests/i.test(trimmed)) {
            return leadingSpace + '直接在 Antigravity 中创建、运行和调试 Leapwork Play 可视化自动化测试工作流。' + trailingSpace;
        }
        if (/^Official Antigravity plugin for MongoDB Atlas/i.test(trimmed)) {
            return leadingSpace + 'MongoDB Atlas 官方 Antigravity 插件（托管 MCP 服务），支持使用自然语言管理集群、数据库、集合并执行数据库查询。' + trailingSpace;
        }
        if (/^Search the live web and fetch page content/i.test(trimmed)) {
            return leadingSpace + '使用专为 AI 智能体打造的 Parallel 搜索与提取 API 检索实时网络并提取网页内容。' + trailingSpace;
        }
        if (/^Agent plugin for PingOne multi-tenant/i.test(trimmed)) {
            return leadingSpace + 'PingOne 多租户智能体插件，包含用于租户引导、环境配置和单点登录（SSO）策略管理的命令行工具。' + trailingSpace;
        }
        if (/^Equip Antigravity with specialized Postman skill/i.test(trimmed)) {
            return leadingSpace + '为 Antigravity 配备专业的 Postman 技能，跨工作区检查、运行、模拟（Mock）和监控各类 API。' + trailingSpace;
        }
        if (/^Set up Qodo,\s*explore code and repository histo/i.test(trimmed)) {
            return leadingSpace + '配置 Qodo、探索代码库历史、运行测试驱动（TDD）开发工作流并审查拉取请求（PR）。' + trailingSpace;
        }
        if (/^Query your SentinelOne Singularity Console/i.test(trimmed)) {
            return leadingSpace + '在 Antigravity 中查询 SentinelOne Singularity 控制台：搜索安全威胁、检查警报并获取分析师级别的汇总报告。' + trailingSpace;
        }
        if (/^Set up Sentry monitoring,\s*investigate productio/i.test(trimmed)) {
            return leadingSpace + '配置 Sentry 监控、排查生产环境错误和性能瓶颈，并在 Sentry 中对未解决问题进行分流排查。' + trailingSpace;
        }
        if (/^Official Supabase plugin for Antigravity with Su/i.test(trimmed)) {
            return leadingSpace + 'Supabase 官方 Antigravity 插件，包含 Supabase CLI 技能、数据库迁移工作流和官方 Supabase MCP 服务。' + trailingSpace;
        }
        if (/^Make your coding agent a better engineer\.?$/i.test(trimmed)) {
            return leadingSpace + '让您的编程智能体成为更卓越的软件工程师。' + trailingSpace;
        }
        if (/^Search Intercom conversations,\s*contacts/i.test(trimmed)) {
            return leadingSpace + '通过官方 Intercom MCP 服务搜索客户对话、联系人和企业信息，发送回复并管理支持工单。' + trailingSpace;
        }
        if (/^SEO workflows on live Semrush data/i.test(trimmed)) {
            return leadingSpace + '基于实时 Semrush 数据的 SEO 工作流：关键词挖掘、域名竞争分析、反向链接审计、网站审计报告和页面优化。' + trailingSpace;
        }



        // Connect to SSH Host
        if (/^Connect to SSH Host(?:\.{3}|\u2026)?$/i.test(trimmed)) {
            return leadingSpace + (trimmed.endsWith('...') || trimmed.endsWith('\u2026') ? '连接到 SSH 主机...' : '连接到 SSH 主机') + trailingSpace;
        }

        // Cancel Generation
        if (/^Cancel Generation$/i.test(trimmed)) {
            return leadingSpace + '取消生成' + trailingSpace;
        }

        // Comment on Selection & Side Question on Selection
        if (/^Comment on Selection$/i.test(trimmed)) {
            return leadingSpace + '对选区进行批注' + trailingSpace;
        }
        if (/^(?:Side\s+Question[:：]|补充提问[:：])\s*Selection$/i.test(trimmed)) {
            return leadingSpace + '对选区进行补充提问' + trailingSpace;
        }

        // Terminal shortcuts
        if (/^Terminal:\s*Add to Chat$/i.test(trimmed)) {
            return leadingSpace + '终端：添加到聊天' + trailingSpace;
        }
        if (/^Terminal:\s*Select All$/i.test(trimmed)) {
            return leadingSpace + '终端：全选' + trailingSpace;
        }

        // Browser Settings description & Change button
        if (/^Configure built-in browser,\s*link opening/i.test(trimmed)) {
            return leadingSpace + (trimmed.endsWith('.') ? '配置内置浏览器、链接打开方式以及浏览器子智能体偏好。' : '配置内置浏览器、链接打开方式以及浏览器子智能体偏好') + trailingSpace;
        }
        if (/^Change(?:\.{3}|\u2026)?$/i.test(trimmed)) {
            return leadingSpace + (trimmed.endsWith('...') || trimmed.endsWith('\u2026') ? '更改...' : '更改') + trailingSpace;
        }

        // Leaked icon restore_page
        if (/^restore_page\s+(.+)$/i.test(trimmed)) {
            const rest = trimmed.replace(/^restore_page\s+/i, '');
            const tr = translateText(rest) || rest;
            return leadingSpace + tr + trailingSpace;
        }

        // Greeting headlines e.g. "what can we get done today?"
        if (/^what can we get done today[?？]?$/i.test(trimmed)) {
            return leadingSpace + '今天我们来完成点什么？' + trailingSpace;
        }

        
        // At Mention Code Block / Mention
        if (/^At[- ]Mention(?:s+Codes+Block)?$/i.test(trimmed)) {
            return leadingSpace + (/codes+block/i.test(trimmed) ? '@提及代码块' : '@提及') + trailingSpace;
        }
        if (/^Mentions+Codes+Block$/i.test(trimmed)) {
            return leadingSpace + '提及代码块' + trailingSpace;
        }

        // Side Question headers, tab buttons & empty state
        if (/^(?:News+)?Sides+Questions?$/i.test(trimmed)) {
            return leadingSpace + (/^New/i.test(trimmed) ? '新建补充提问' : '补充提问') + trailingSpace;
        }
        if (/^Ask a side question without interrupting the main conversation.?$/i.test(trimmed)) {
            return leadingSpace + (trimmed.endsWith('.') ? '在不中断主对话的情况下提出补充问题。' : '在不中断主对话的情况下提出补充问题') + trailingSpace;
        }
        if (/^Ask a side question(?:.{3}|…)?$/i.test(trimmed)) {
            return leadingSpace + (trimmed.endsWith('...') || trimmed.endsWith('…') ? '提出补充问题...' : '提出补充问题') + trailingSpace;
        }
        if (/^(?:Open|Close)s+Sides+Question$/i.test(trimmed)) {
            return leadingSpace + (/^Open/i.test(trimmed) ? '打开补充提问' : '关闭补充提问') + trailingSpace;
        }

        // Browser address bar & URL search input
        if (/^Search or (?:enter|type)(?:s+(?:a|an))?s+(?:URL|address|webs+address)$/i.test(trimmed)) {
            return leadingSpace + (/address/i.test(trimmed) && !/web/i.test(trimmed) ? '搜索或输入地址' : '搜索或输入网址') + trailingSpace;
        }
        if (/^Enter(?:s+(?:a|an))?s+(?:URL|webs+address)$/i.test(trimmed)) {
            return leadingSpace + '输入网址' + trailingSpace;
        }

        // Worktree branch menu options
        if (/^work in a new worktree\.?$/i.test(trimmed)) {
            return leadingSpace + '在新的工作树中工作' + trailingSpace;
        }
        if (/^keeps your checkout untouched\.?$/i.test(trimmed)) {
            return leadingSpace + '保持当前检出不受影响' + trailingSpace;
        }

        // Undo and agent execution status
        if (/^User (?:cancelled|canceled) agent execution\.?$/i.test(trimmed)) {
            return leadingSpace + (trimmed.endsWith('.') ? '用户取消了智能体执行。' : '用户取消了智能体执行') + trailingSpace;
        }
        if (/^Agent execution (?:cancelled|canceled)\.?$/i.test(trimmed)) {
            return leadingSpace + (trimmed.endsWith('.') ? '智能体执行已取消。' : '智能体执行已取消') + trailingSpace;
        }
        if (/^Confirm Undo$/i.test(trimmed)) {
            return leadingSpace + '确认撤销' + trailingSpace;
        }
        if (/^This undo action will not make any code changes\.?$/i.test(trimmed)) {
            return leadingSpace + (trimmed.endsWith('.') ? '此撤销操作不会产生任何代码更改。' : '此撤销操作不会产生任何代码更改') + trailingSpace;
        }
        if (/^This undo action will (?:revert|make) (?:any )?code changes\.?$/i.test(trimmed)) {
            return leadingSpace + (trimmed.endsWith('.') ? '此撤销操作将修改代码文件。' : '此撤销操作将修改代码文件') + trailingSpace;
        }
        if (/^Revert (?:all )?file changes$/i.test(trimmed)) {
            return leadingSpace + (/all/i.test(trimmed) ? '还原所有文件更改' : '还原文件更改') + trailingSpace;
        }
        if (/^Confirm(?:\s*[↵⏎\u21b5\u23ce\u21a9])?$/i.test(trimmed)) {
            const hasEnter = /[↵⏎\u21b5\u23ce\u21a9]/.test(trimmed);
            return leadingSpace + (hasEnter ? '确认 ↵' : '确认') + trailingSpace;
        }

        // Side panel shortcut commands
        if (/^Toggle (?:Maximize )?Side Panel$/i.test(trimmed)) {
            return leadingSpace + (/maximize/i.test(trimmed) ? '切换最大化侧边面板' : '切换侧边面板') + trailingSpace;
        }

        // Queued message shortcut tooltips
        if (/(?:Enter|Return)\s+Sends immediately/i.test(trimmed)) {
            return leadingSpace + trimmed.replace(/(?:Enter|Return)\s+Sends immediately/gi, 'Enter 立即发送') + trailingSpace;
        }
        if (/((?:Alt|Cmd|Option|Ctrl)\+Enter)\s+Queues after the turn/i.test(trimmed)) {
            return leadingSpace + trimmed.replace(/((?:Alt|Cmd|Option|Ctrl)\+Enter)\s+Queues after the turn/gi, '$1 在本轮后排队') + trailingSpace;
        }
        if (/((?:Alt|Cmd|Option|Ctrl)\+Enter)\s+On empty prompt,\s*sends next in queue\.?/i.test(trimmed)) {
            return leadingSpace + trimmed.replace(/((?:Alt|Cmd|Option|Ctrl)\+Enter)\s+On empty prompt,\s*sends next in queue\.?/gi, '$1 输入框为空时，发送队列中的下一条') + trailingSpace;
        }

        // Voice mode tooltips and controls
        if (/^(?:Start|Stop|End|Exit|Pause|Resume)\s+Voice\s+mode$/i.test(trimmed)) {
            const actMap = {
                'start': '开启',
                'stop': '停止',
                'end': '结束',
                'exit': '退出',
                'pause': '暂停',
                'resume': '恢复'
            };
            const act = trimmed.split(/\s+/)[0].toLowerCase();
            const zhAct = actMap[act] || '开启';
            return leadingSpace + `${zhAct}语音模式` + trailingSpace;
        }
        if (/^Voice\s+mode$/i.test(trimmed)) {
            return leadingSpace + '语音模式' + trailingSpace;
        }

        // "Outside of Project" / "Outside of Workspace" / "Outside of Folders"
        if (/^Outside of (?:Projects?|Workspaces?|Folders?)$/i.test(trimmed)) {
            const m = trimmed.toLowerCase();
            if (m.includes('project')) return leadingSpace + '未关联项目' + trailingSpace;
            if (m.includes('workspace')) return leadingSpace + '未关联工作区' + trailingSpace;
            if (m.includes('folder')) return leadingSpace + '文件夹外' + trailingSpace;
        }

        // "X turns" / "1 turn"
        const turnsMatch = trimmed.match(/^(\d+)\s+turns?$/i);
        if (turnsMatch) {
            return leadingSpace + `${turnsMatch[1]} 轮对话` + trailingSpace;
        }

        // "Turn X" / "turn X"
        const turnNumMatch = trimmed.match(/^Turn\s+(\d+)$/i);
        if (turnNumMatch) {
            return leadingSpace + `第 ${turnNumMatch[1]} 轮` + trailingSpace;
        }

        // "(X image attachment(s))" e.g. "12:54  汉化 (1 image attachment)" or "(1 image attachment)"
        if (/\((\d+)\s+image\s+attachments?\)/i.test(trimmed)) {
            return leadingSpace + trimmed.replace(/\((\d+)\s+image\s+attachments?\)/gi, (_, c) => `(${c} 个图片附件)`) + trailingSpace;
        }

        // "(X file attachment(s))"
        if (/\((\d+)\s+file\s+attachments?\)/i.test(trimmed)) {
            return leadingSpace + trimmed.replace(/\((\d+)\s+file\s+attachments?\)/gi, (_, c) => `(${c} 个文件附件)`) + trailingSpace;
        }

        // "(X attachment(s))"
        if (/\((\d+)\s+attachments?\)/i.test(trimmed)) {
            return leadingSpace + trimmed.replace(/\((\d+)\s+attachments?\)/gi, (_, c) => `(${c} 个附件)`) + trailingSpace;
        }

        // "(X image(s))"
        if (/\((\d+)\s+images?\)/i.test(trimmed)) {
            return leadingSpace + trimmed.replace(/\((\d+)\s+images?\)/gi, (_, c) => `(${c} 张图片)`) + trailingSpace;
        }

        // "(X file(s))"
        if (/\((\d+)\s+files?\)/i.test(trimmed)) {
            return leadingSpace + trimmed.replace(/\((\d+)\s+files?\)/gi, (_, c) => `(${c} 个文件)`) + trailingSpace;
        }

        // "X image attachment(s)" / "X image attachments"
        const imgAttachMatch = trimmed.match(/^(\d+)\s+image\s+attachments?$/i);
        if (imgAttachMatch) {
            return leadingSpace + `${imgAttachMatch[1]} 个图片附件` + trailingSpace;
        }

        // "X file attachment(s)" / "X file attachments"
        const fileAttachMatch = trimmed.match(/^(\d+)\s+file\s+attachments?$/i);
        if (fileAttachMatch) {
            return leadingSpace + `${fileAttachMatch[1]} 个文件附件` + trailingSpace;
        }

        // "X attachment(s)" / "1 attachment"
        const attachCountMatch = trimmed.match(/^(\d+)\s+attachments?$/i);
        if (attachCountMatch) {
            return leadingSpace + `${attachCountMatch[1]} 个附件` + trailingSpace;
        }

        // Time with Turn: e.g. "11:09 Turn 62"
        const timeTurnMatch = trimmed.match(/^(\d{1,2}:\d{2}(?::\d{2})?)\s+Turn\s+(\d+)$/i);
        if (timeTurnMatch) {
            return leadingSpace + `${timeTurnMatch[1]} 第 ${timeTurnMatch[2]} 轮` + trailingSpace;
        }

        // Time with image attachment: e.g. "11:22 1 image attachment"
        const timeImgMatch = trimmed.match(/^(\d{1,2}:\d{2}(?::\d{2})?)\s+(\d+)\s+image\s+attachments?$/i);
        if (timeImgMatch) {
            return leadingSpace + `${timeImgMatch[1]} ${timeImgMatch[2]} 个图片附件` + trailingSpace;
        }

        // Time with file attachment: e.g. "11:22 1 file attachment"
        const timeFileMatch = trimmed.match(/^(\d{1,2}:\d{2}(?::\d{2})?)\s+(\d+)\s+file\s+attachments?$/i);
        if (timeFileMatch) {
            return leadingSpace + `${timeFileMatch[1]} ${timeFileMatch[2]} 个文件附件` + trailingSpace;
        }

        // Time with general attachment: e.g. "11:22 1 attachment"
        const timeAttMatch = trimmed.match(/^(\d{1,2}:\d{2}(?::\d{2})?)\s+(\d+)\s+attachments?$/i);
        if (timeAttMatch) {
            return leadingSpace + `${timeAttMatch[1]} ${timeAttMatch[2]} 个附件` + trailingSpace;
        }

        // Time range with turns: e.g. "10月8日周四, 11:09 – 17:30 · 14 turns"
        if (/·\s*(\d+)\s+turns?/i.test(trimmed)) {
            return leadingSpace + trimmed.replace(/·\s*(\d+)\s+turns?/i, '· $1 轮对话') + trailingSpace;
        }
        if (/^[·•]\s*(\d+)\s+turns?$/i.test(trimmed)) {
            const m = trimmed.match(/^[·•]\s*(\d+)\s+turns?$/i);
            return leadingSpace + `· ${m[1]} 轮对话` + trailingSpace;
        }

        // "X of Y" e.g. "113 of 113" -> "113 / 113"
        const xOfYMatch = trimmed.match(/^(\d+)\s+of\s+(\d+)$/i);
        if (xOfYMatch) {
            return leadingSpace + `${xOfYMatch[1]} / ${xOfYMatch[2]}` + trailingSpace;
        }

        // "View X side questions" / "View side questions" / "View side question"
        const viewSqMatch = trimmed.match(/^View\s+(\d+)\s+side\s+questions?$/i);
        if (viewSqMatch) {
            return leadingSpace + `查看 ${viewSqMatch[1]} 个补充提问` + trailingSpace;
        }
        if (/^View\s+side\s+questions?$/i.test(trimmed)) {
            return leadingSpace + '查看补充提问' + trailingSpace;
        }

        // "X side questions" / "1 side question"
        const sqCountMatch = trimmed.match(/^(\d+)\s+side\s+questions?$/i);
        if (sqCountMatch) {
            return leadingSpace + `${sqCountMatch[1]} 个补充提问` + trailingSpace;
        }

        // "Next question" / "Previous question"
        if (/^Next\s+question$/i.test(trimmed)) {
            return leadingSpace + '下一个问题' + trailingSpace;
        }
        if (/^Previous\s+question$/i.test(trimmed)) {
            return leadingSpace + '上一个问题' + trailingSpace;
        }

        // "Side Question: <rest>" or "Side Questions" or "Side Question"
        if (/^Side\s+Questions?[:：]?/i.test(trimmed)) {
            const m = trimmed.match(/^Side\s+Questions?[:：]?\s*([\s\S]*)$/i);
            const rest = m && m[1] ? m[1].trim() : '';
            const trRest = rest ? (translateText(rest) || rest) : '';
            const label = trimmed.includes(':') || trimmed.includes('：') ? '补充提问：' : '补充提问';
            return leadingSpace + (trRest ? `${label} ${trRest}` : label) + trailingSpace;
        }

        // "(Recommended) ..." or "Recommended: ..." option prefixes
        const recPrefixMatch = trimmed.match(/^(\(?Recommended\)?\s*[:：\-]?\s*)([\s\S]+)$/i);
        if (recPrefixMatch) {
            const rest = recPrefixMatch[2];
            const transRest = translateText(rest) || rest;
            return leadingSpace + `(推荐) ${transRest.trim()}` + trailingSpace;
        }

        // "... (write-in)" option suffixes or standalone "write-in"
        if (/^\(?write-in\)?$/i.test(trimmed)) {
            return leadingSpace + (trimmed.startsWith('(') ? '(自主填写)' : '自主填写') + trailingSpace;
        }
        const writeInSuffixMatch = trimmed.match(/^([\s\S]+?)\s*\(write-in\)$/i);
        if (writeInSuffixMatch) {
            const rest = writeInSuffixMatch[1];
            const transRest = translateText(rest) || rest;
            return leadingSpace + `${transRest.trim()} (自主填写)` + trailingSpace;
        }

        // "question(s)" standalone or child-split node e.g. "1" + " question"
        if (/^questions?$/i.test(trimmed)) {
            return leadingSpace + '个问题' + trailingSpace;
        }
        const qMatch = trimmed.match(/^(\d+)\s*questions?$/i);
        if (qMatch) {
            return leadingSpace + `${qMatch[1]} 个问题` + trailingSpace;
        }

        // Numbered list items / prompt options (e.g. "1 Yes, allow this time", "5 No (tell the agent what to do instead)")
        const nm = trimmed.match(/^(?:(?:\(|\[)?(\d+)(?:\)|\]|([.、]))?)\s+([\s\S]+)$/);
        if (nm) {
            const tr = translateText(nm[3]);
            if (tr && tr !== nm[3]) {
                const sep = nm[2] ? `${nm[2]} ` : ' ';
                const prefix = trimmed.startsWith('(') ? `(${nm[1]}) ` : (trimmed.startsWith('[') ? `[${nm[1]}] ` : `${nm[1]}${sep}`);
                return leadingSpace + prefix + tr.trim() + trailingSpace;
            }
        }

        // Enter / Return symbol handler (e.g. "Submit ↵", "Submit ⏎")
        const em = trimmed.match(/^(.+?)\s*([↵⏎\u21b5\u23ce\u21a9])$/);
        if (em) {
            const tb = translateText(em[1]);
            if (tb && tb !== em[1]) {
                return leadingSpace + tb.trim() + ' ' + em[2] + trailingSpace;
            }
        }

        // URL Permission prompt: "Allow reading/accessing/opening/fetching this/these URL(s)?"
        const urlMatch = trimmed.match(/^Allow\s+(reading|accessing|access\s+to|opening|fetching)\s+(this|these)\s+URLs?\??$/i);
        if (urlMatch) {
            const act = urlMatch[1].toLowerCase().replace(/\s+/g, ' ');
            const plural = urlMatch[2].toLowerCase() === 'these';
            const actMap = {
                'reading': '读取',
                'accessing': '访问',
                'access to': '访问',
                'opening': '打开',
                'fetching': '获取'
            };
            const actionText = actMap[act] || '读取';
            return leadingSpace + `允许${actionText}${plural ? '这些' : '此'} URL？` + trailingSpace;
        }

        // "Type / and select plan to have the agent generate a plan" (or partial node)
        if (/^(?:Type|类型)\s*\/?\s*and select\s+plan\s+to have the agent (?:generate a plan|propose a structured plan before executing)\.?$/i.test(trimmed)) {
            return leadingSpace + '输入 / 并选择 plan 让智能体生成计划。' + trailingSpace;
        }
        if (/^and select\s+plan\s+to have the agent (?:generate a plan|propose a structured plan before executing)\.?$/i.test(trimmed)) {
            return leadingSpace + '并选择 plan 让智能体生成计划。' + trailingSpace;
        }
        if (/^to have the agent (?:generate a plan|propose a structured plan before executing)\.?$/i.test(trimmed)) {
            return leadingSpace + '让智能体生成计划。' + trailingSpace;
        }

        // "Modified in X projects/workspaces/conversations [chevron]"
        if (/Modified in\s+(\d+)\s+projects?/i.test(trimmed)) {
            const m = trimmed.match(/Modified in\s+(\d+)\s+projects?(.*)$/i);
            return leadingSpace + '已在 ' + (m ? m[1] : '') + ' 个项目中修改' + (m ? m[2] : '') + trailingSpace;
        }
        if (/Modified in\s+(\d+)\s+workspaces?/i.test(trimmed)) {
            const m = trimmed.match(/Modified in\s+(\d+)\s+workspaces?(.*)$/i);
            return leadingSpace + '已在 ' + (m ? m[1] : '') + ' 个工作区中修改' + (m ? m[2] : '') + trailingSpace;
        }
        if (/Modified in\s+(\d+)\s+conversations?/i.test(trimmed)) {
            const m = trimmed.match(/Modified in\s+(\d+)\s+conversations?(.*)$/i);
            return leadingSpace + '已在 ' + (m ? m[1] : '') + ' 个对话中修改' + (m ? m[2] : '') + trailingSpace;
        }
        
        // --- Dynamic String Translation ---
        
        // "Resets in X" or "将在 X 后重置"
        const resetsInMatch = trimmed.match(/^Resets\s+in\s+([\s\S]+?)$/i);
        if (resetsInMatch) {
            return leadingSpace + `将在 ${translateDuration(resetsInMatch[1])}后重置` + trailingSpace;
        }
        const resetsZhMatch = trimmed.match(/^将在\s+([\s\S]+?)\s*后重置$/i);
        if (resetsZhMatch) {
            return leadingSpace + `将在 ${translateDuration(resetsZhMatch[1])}后重置` + trailingSpace;
        }

        // "Worked for X [>]"
        const workedForEarlyMatch = trimmed.match(/^Worked\s+for\s+([\s\S]+?)(?:\s*([>›»]))?$/i);
        if (workedForEarlyMatch) {
            const dur = translateDuration(workedForEarlyMatch[1]);
            const arrow = workedForEarlyMatch[2] ? ' ' + workedForEarlyMatch[2] : '';
            return leadingSpace + `耗时 ${dur}${arrow}` + trailingSpace;
        }

        // "% left" / "X% left" / "left"
        if (/^%?\s*left$/i.test(trimmed)) {
            return leadingSpace + (trimmed.startsWith('%') ? '% 剩余' : '剩余') + trailingSpace;
        }
        const pctLeftMatch = trimmed.match(/^([\d.]+%?)\s+left$/i);
        if (pctLeftMatch) {
            return leadingSpace + `${pctLeftMatch[1]} 剩余` + trailingSpace;
        }

        // "Xh/Xd/Xw limit"
        const limitMatch = trimmed.match(/^(\d+)\s*(h|d|w|m)\s+limit$/i);
        if (limitMatch) {
            const unitMap = { 'h': '小时', 'd': '天', 'w': '周', 'm': '分钟' };
            const u = unitMap[limitMatch[2].toLowerCase()] || limitMatch[2];
            return leadingSpace + `${limitMatch[1]}${u}限制` + trailingSpace;
        }

        // Check dynamic regex rules from dynamic_rules.json
        for (let i = 0; i < dynamicRegexRules.length; i++) {
            const rule = dynamicRegexRules[i];
            if (rule.regex.test(trimmed)) {
                return leadingSpace + trimmed.replace(rule.regex, rule.replacement) + trailingSpace;
            }
        }

        // "Updated <time/date>"
        const updatedMatch = trimmed.match(/^Updated\s+(.+)$/i);
        if (updatedMatch) {
            return text.replace(trimmed, `更新于 ${updatedMatch[1]}`);
        }

        // "Created <time/date>"
        const createdMatch = trimmed.match(/^Created\s+(.+)$/i);
        if (createdMatch) {
            return text.replace(trimmed, `创建于 ${createdMatch[1]}`);
        }

        // "Started <time/date>"
        const startedMatch = trimmed.match(/^Started\s+(.+)$/i);
        if (startedMatch) {
            return text.replace(trimmed, `开始于 ${startedMatch[1]}`);
        }

        // Handle tooltips and labels with keyboard shortcuts: "Action Name [Ctrl+Key]", "Action Name Ctrl+Key", "Action Name Enter", "Action Name (Ctrl+D)"
        const shortcutMatch = trimmed.match(/^(.+?)\s+(\(?\b(?:(?:Ctrl|Alt|Shift|Cmd|Meta)(?:\+[A-Za-z0-9]+)+|Enter|Return|Esc|Escape|Tab|Space|Backspace|Delete)\b\)?)$/i);
        if (shortcutMatch) {
            const action = shortcutMatch[1];
            const shortcut = shortcutMatch[2];
            const translatedAction = translationMap[action];
            if (translatedAction) {
                return text.replace(trimmed, `${translatedAction} ${shortcut}`);
            }
        }
        
        // "Thought for Xs" / "Thought for Xms"
        const thoughtMatch = trimmed.match(/^Thought for (\d+(?:\.\d+)?)\s*(s|ms)$/i);
        if (thoughtMatch) {
            const unit = thoughtMatch[2].toLowerCase() === 's' ? '秒' : '毫秒';
            return `思考耗时 ${thoughtMatch[1]} ${unit}`;
        }

        // --- Inspector Panel & Sidebar Items ---
        // "Custom Agents [X] [chevrons]"
        const customAgentsMatch = trimmed.match(/^Custom\s+Agents?\s*(\d*)\s*([▼▾⌄⌵ˇv∨˅\^∧>›\u02c4\u02c5\u02c6\u2303\u2304\u25b2\u25b4\u25b5\u25bc\u25be\ufe40\u2228\u23f7\u25bd]?)$/i);
        if (customAgentsMatch) {
            return `自定义智能体${customAgentsMatch[1] ? ' ' + customAgentsMatch[1] : ''}${customAgentsMatch[2] ? ' ' + customAgentsMatch[2] : ''}`;
        }

        // "Built-in Agents [X] [chevrons]"
        const builtInAgentsMatch = trimmed.match(/^Built-?in\s+Agents?\s*(\d*)\s*([▼▾⌄⌵ˇv∨˅\^∧>›\u02c4\u02c5\u02c6\u2303\u2304\u25b2\u25b4\u25b5\u25bc\u25be\ufe40\u2228\u23f7\u25bd]?)$/i);
        if (builtInAgentsMatch) {
            return `内置智能体${builtInAgentsMatch[1] ? ' ' + builtInAgentsMatch[1] : ''}${builtInAgentsMatch[2] ? ' ' + builtInAgentsMatch[2] : ''}`;
        }

        // "Subagents [X] [chevrons]"
        const subagentsMatch = trimmed.match(/^Subagents?\s*(\d*)\s*([▼▾⌄⌵ˇv∨˅\^∧>›\u02c4\u02c5\u02c6\u2303\u2304\u25b2\u25b4\u25b5\u25bc\u25be\ufe40\u2228\u23f7\u25bd]?)$/i);
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

        // Schedule time: "9:00 AM GMT+8" or "10:30 PM GMT+8" or "9:00 AM"
        const schedTimeMatch = trimmed.match(/^(\d{1,2}:\d{2})\s*(AM|PM)(?:\s*(GMT[+-]\d+))?$/i);
        if (schedTimeMatch) {
            const time = schedTimeMatch[1];
            const ampm = schedTimeMatch[2].toUpperCase() === 'AM' ? '上午' : '下午';
            const tz = schedTimeMatch[3] ? ' ' + schedTimeMatch[3] : '';
            return leadingSpace + ampm + ' ' + time + tz + trailingSpace;
        }

        // "Send feedback as <email>"
        const sendFeedbackMatch = trimmed.match(/^Send\s+feedback\s+as\s+(.+)$/i);
        if (sendFeedbackMatch) {
            return leadingSpace + '以 ' + sendFeedbackMatch[1] + ' 身份发送反馈' + trailingSpace;
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

        // "Modified in X projects / Modified in X workspaces"
        if (/Modified in\s+\d+\s+projects?/i.test(trimmed)) {
            return trimmed.replace(/Modified in\s+(\d+)\s+projects?/gi, '已在 $1 个项目中修改');
        }
        if (/Modified in\s+\d+\s+workspaces?/i.test(trimmed)) {
            return trimmed.replace(/Modified in\s+(\d+)\s+workspaces?/gi, '已在 $1 个工作区中修改');
        }
        if (/^Modified in this project$/i.test(trimmed)) {
            return '已在此项目中修改';
        }
        if (/^Modified in this workspace$/i.test(trimmed)) {
            return '已在此工作区中修改';
        }

        // "X conversations"
        const convMatch = trimmed.match(/^(\d+)\s+conversations?$/i);
        if (convMatch) {
            return `${convMatch[1]} 个对话`;
        }

        // "X comments"
        const commentsMatch = trimmed.match(/^(\d+)\s+comments?$/i);
        if (commentsMatch) {
            return `${commentsMatch[1]} 条评论`;
        }

        // "X tools enabled / disabled / available"
        const toolsEnabledMatch = trimmed.match(/^(\d+)\s+tools?\s+(enabled|disabled|available)$/i);
        if (toolsEnabledMatch) {
            const statusMap = { 'enabled': '已启用', 'disabled': '已禁用', 'available': '可用' };
            const status = statusMap[toolsEnabledMatch[2].toLowerCase()] || toolsEnabledMatch[2];
            return `${status} ${toolsEnabledMatch[1]} 个工具`;
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
        
        // "(Thinking)" / "(Medium)" / "(High)" / "(Low)" / "(Max)" inside model names
        if (/\((?:Thinking|Medium|High|Low|Fast|Max)\)/i.test(trimmed)) {
            return trimmed
                .replace(/\(Thinking\)/gi, '(思考)')
                .replace(/\(Medium\)/gi, '(中)')
                .replace(/\(High\)/gi, '(高)')
                .replace(/\(Low\)/gi, '(低)')
                .replace(/\(Fast\)/gi, '(快速)')
                .replace(/\(Max\)/gi, '(最大)');
        }

        // "(Preview)" tag handling
        if (/\((?:Preview|preview)\)/i.test(trimmed)) {
            const base = trimmed.replace(/\s*\((?:Preview|preview)\)/i, '').trim();
            const transBase = translationMap[base] || base;
            return `${transBase}（预览）`;
        }

        // Update button variants (with or without arrow/dots)
        if (/^Update Available(?:\s*[-—→>]+)?$/i.test(trimmed)) {
            const hasArrow = /[-—→>]/.test(trimmed);
            return `有可用更新${hasArrow ? ' →' : ''}`;
        }
        if (/^Restart to Update(?:\s*[-—→>]+)?$/i.test(trimmed)) {
            const hasArrow = /[-—→>]/.test(trimmed);
            return `重启以应用更新${hasArrow ? ' →' : ''}`;
        }
        if (/^Downloading Update(?:\.{3}|…)?$/i.test(trimmed)) {
            return '正在下载更新...';
        }
        if (/^Checking for Updates(?:\.{3}|…)?$/i.test(trimmed)) {
            return '正在检查更新...';
        }

        // Permission prompt & MCP translations
        if (/\b(?:when not in a project|when not in a workspace|not in a project|not in a workspace)\b/i.test(trimmed)) {
            return trimmed
                .replace(/when not in a project/gi, '未在项目中时')
                .replace(/when not in a workspace/gi, '未在工作区中时')
                .replace(/not in a project/gi, '未在项目中')
                .replace(/not in a workspace/gi, '未在工作区中');
        }
        if (/^Allow using this MCP tool\??$/i.test(trimmed)) {
            return '允许使用此 MCP 工具？';
        }
        if (/^Allow using these MCP tools\??$/i.test(trimmed)) {
            return '允许使用这些 MCP 工具？';
        }
        if (/^Allow using this tool\??$/i.test(trimmed)) {
            return '允许使用此工具？';
        }
        if (/^Allow using these tools\??$/i.test(trimmed)) {
            return '允许使用这些工具？';
        }

        // Model suffix "High" / "Low" / "Medium" / "Fast" / "Max" (e.g. "Gemini 3.7 Flash High" or "Claude 5.5 Sonnet Max")
        const modelSuffixMatch = trimmed.match(/^(.+?)\s+(High|Low|Medium|Fast|Max)(?:\s*([▼▾⌄⌵ˇv∨˅\^∧>›\u02c5\u2304\u25bc\u25be\ufe40\u2228\u23f7\u25bd]))?$/i);
        if (modelSuffixMatch && !trimmed.startsWith('Learn more')) {
            const levelMap = { 'high': '高', 'low': '低', 'medium': '中', 'fast': '快速', 'max': '最大' };
            const lvl = levelMap[modelSuffixMatch[2].toLowerCase()] || modelSuffixMatch[2];
            const chevron = modelSuffixMatch[3] ? ' ' + modelSuffixMatch[3] : '';
            return `${modelSuffixMatch[1]} ${lvl}${chevron}`;
        }

        // Slash commands & Planning mode banner
        if (/^Planning mode has moved to\s*(\S+)\.?$/i.test(trimmed)) {
            const m = trimmed.match(/^Planning mode has moved to\s*(\S+)\.?$/i);
            return `规划模式已迁移至 ${m[1]}`;
        }
        if (/^Use\s+(\S+)\s+to explicitly ask your agent to generate a structured plan before implementation\.?$/i.test(trimmed)) {
            const m = trimmed.match(/^Use\s+(\S+)\s+to explicitly ask your agent to generate a structured plan before implementation\.?$/i);
            return `使用 ${m[1]} 明确要求智能体在实现前生成结构化规划。`;
        }
        if (/^Plan carefully before executing a task\.?$/i.test(trimmed)) {
            return '在执行任务前仔细规划。';
        }

        // Slash commands popup dynamic match (e.g. "btw Ask a quick question..." or "goal Run until...")
        if (/^(?:\/)?(?:btw|goal|schedule|browser|grill-me|teamwork-preview|learn|boost|plan|compact)\b/i.test(trimmed)) {
            let res = trimmed
                .replace(/^(\/?btw\s+)Ask a quick question without interrupting the main conversation\.?/i, '$1在不中断主对话的情况下快速提问。')
                .replace(/^(\/?goal\s+)Run until the specified goal is completely finished\.?/i, '$1持续运行直至指定目标完全达成。')
                .replace(/^(\/?schedule\s+)Run an instruction on a recurring schedule or as a one-time timer\.?/i, '$1按循环计划运行指令或作为单次定时器。')
                .replace(/^(\/?browser\s+)Invoke a browser agent for web tasks\.?/i, '$1调用浏览器智能体执行网页任务。')
                .replace(/^(\/?grill-me\s+)Interview me to align on a plan\.?/i, '$1通过交互式问答对齐计划。')
                .replace(/^(\/?teamwork-preview\s+)Invoke a team of agents to autonomously tackle large projects\.?/i, '$1调用智能体团队自主处理大型项目。')
                .replace(/^(\/?learn\s+)Reflect on recent successes or corrections to capture reusable skills or rules\.?/i, '$1总结近期经验或修正，沉淀为可复用的技能或规则。')
                .replace(/^(\/?boost\s+)Invoke the Boost multi-agent orchestrator for complex tasks\.?/i, '$1调用 Boost 多智能体编排器处理复杂任务。')
                .replace(/^(\/?plan\s+)Plan carefully before executing a task\.?/i, '$1在执行任务前仔细规划。')
                .replace(/^(\/?compact\s+)Compact the conversation now \(summarize history to free up the context window\)\.?/i, '$1立即压缩当前对话（总结历史记录以释放上下文窗口空间）。')
                .replace(/^(\/?compact\s+)Compact the conversation now\.?/i, '$1立即压缩当前对话。');
            if (res !== trimmed) return res;
        }

                        // Skills & Agents descriptions dynamic matching (full text, truncated with ... / …, or with /command)
        const SKILL_RULES = [
        {
                "prefix": "Uses Chrome DevTools MCP for inspecting",
                "zh": "使用 Chrome DevTools MCP 检查、调试和测试 Cookie、会话状态、身份验证问题以及 Cookie 权限合规性。在诊断 401/403 错误或 SameSite 警告时使用。"
        },
        {
                "prefix": "Instructions for the Android Compose Preview sidecar",
                "zh": "Android Compose Preview 辅助工具说明：用于独立渲染 Jetpack Compose 预览并处理交互事件。"
        },
        {
                "prefix": "Instructions for working with the Android Device Hub sidecar",
                "zh": "Android Device Hub 辅助工具说明：用于列出、启动、停止和管理连接的 Android 设备与模拟器。"
        },
        {
                "prefix": "How to write and run a dynamic workflow script with the",
                "zh": "如何使用 run_workflow 工具编写并运行动态工作流脚本：通过 Python 脚本使用 agent、parallel、pipeline 和 phase 编排多个智能体。当任务需要拆分为许多独立或分阶段的子任务时使用。"
        },
        {
                "prefix": "Uses Chrome DevTools MCP for inspecting, debugging, and testing cookies",
                "zh": "使用 Chrome DevTools MCP 检查、调试和测试 Cookie、会话状态、身份验证问题以及 Cookie 权限合规性。在诊断 401/403 错误或 SameSite 警告时使用。"
        },
        {
                "prefix": "Uses Chrome DevTools MCP for accessibility",
                "zh": "基于 web.dev 指南，使用 Chrome DevTools MCP 进行无障碍功能（a11y）调试与审核。在测试语义化 HTML、ARIA 标签、焦点状态、键盘导航、点击目标和色彩对比度时使用。"
        },
        {
                "prefix": "Interactive guide to design and create a scheduled background automation",
                "zh": "设计和创建定时后台自动化的交互式指南。当用户需要创建自动化或定期计划任务（例如“每天早上汇总我的邮件”、“每周一发送待办清单”）时使用。也可通过 /automation 斜杠指令触发。"
        },
        {
                "prefix": "Uses Chrome DevTools via MCP for efficient debugging",
                "zh": "通过 MCP 使用 Chrome DevTools 实现高效调试、故障排查及浏览器自动化。在调试网页、自动化浏览器交互、分析性能或检查网络请求时使用。此技能不适用于 --slim 模式。"
        },
        {
                "prefix": "Build and publish Chrome Extensions using Manifest V3 best practices",
                "zh": "使用 Manifest V3 最佳实践构建和发布 Chrome 扩展程序。每当需要创建、修改、调试或理解 Chrome 浏览器扩展、插件或涉及 Chrome Extensions API 的任何内容时使用。"
        },
        {
                "prefix": "Guides debugging and optimizing Largest Contentful Paint",
                "zh": "指导使用 Chrome DevTools MCP 工具调试与优化最大内容绘制（LCP）。当涉及 LCP 性能、页面加载缓慢、Core Web Vitals 优化，或需要排查主页面内容渲染过慢时使用。"
        },
        {
                "prefix": "Skill for converting an installed Firebase Extension",
                "zh": "用于将已安装的 Firebase Extension（或扩展源码）转换为独立的 Cloud Functions for Firebase 代码库或可发布的 npm 包，包含 V1 到 V2 触发器升级、生命周期钩子及声明式安全策略。"
        },
        {
                "prefix": "Official skill for integrating Firebase AI Logic",
                "zh": "将 Firebase AI Logic (Gemini API) 集成到 Web 应用程序的官方技能。涵盖环境搭建、多模态推理、结构化输出与安全性。"
        },
        {
                "prefix": "Deploys and manages full-stack web applications",
                "zh": "使用 Firebase App Hosting 部署和管理具有服务端渲染（SSR）的全栈 Web 应用（Next.js、Angular）。用于部署应用、配置 apphosting.yaml、管理密钥及 CI/CD。"
        },
        {
                "prefix": "Guide for setting up and using Firebase Authentication",
                "zh": "设置和使用 Firebase Authentication 的指南。当应用需要用户登录、用户管理或基于身份验证规则的安全数据访问时使用。"
        },
        {
                "prefix": "Provides foundational Firebase CLI setup",
                "zh": "提供 Firebase CLI 基础设置、CLI 安装与版本检查、CLI 登录、项目创建与切换，以及应用配置文件（google-services.json、GoogleService-Info.plist）下载。"
        },
        {
                "prefix": "Comprehensive guide for Firebase Crashlytics",
                "zh": "Firebase Crashlytics 全面指南，涵盖环境配置及 SDK 使用。当需要在应用中配置 Crashlytics、添加崩溃报告或使用 Crashlytics SDK 时使用。"
        },
        {
                "prefix": "Builds and deploys Firebase SQL Connect",
                "zh": "安全构建和部署基于 PostgreSQL 的 Firebase SQL Connect（又名 Firebase Data Connect）后端。用于设计表结构与关系、编写授权查询与变更、配置实时数据更新及生成类型安全 SDK。"
        },
        {
                "prefix": "Sets up, manages, queries, and configures Cloud Firestore databases",
                "zh": "设置、管理、查询和配置 Cloud Firestore 数据库（标准版/企业版），包括数据建模、安全规则、索引以及 SDK 集成（Web、Python、iOS、Android、Flutter）。"
        },
        {
                "prefix": "Deploys and configures classic Firebase Hosting for static websites",
                "zh": "为静态网站、单页应用（SPA）和微服务部署并配置传统 Firebase Hosting。用于静态站点部署、自定义域名配置、重定向与重写规则设置及预览通道管理。"
        },
        {
                "prefix": "Manages Firebase Remote Config templates",
                "zh": "管理 Firebase Remote Config 模板、功能开关（Feature Flags）、加载策略及 SDK（Android、iOS）。用于配置模板、版本管理、应用内默认值及实时监听。"
        },
        {
                "prefix": "Audits Firebase (Firestore, Cloud Storage) security rules",
                "zh": "审核 Firebase（Firestore、Cloud Storage）安全规则的潜在漏洞、特权提升、角色绕过、创建与更新不一致、资源耗尽、类型安全及所有权检查。"
        },
        {
                "prefix": "Designs, authors, refactors, and hardens production-grade Cloud Firestore Security Rules",
                "zh": "设计、编写、重构并加固生产级 Cloud Firestore 安全规则（firestore.rules）。"
        },
        {
                "prefix": "Read, create, and manage Google Calendar events",
                "zh": "读取、创建和管理 Google 日历日程。当用户分享日历链接、查询日程安排、查找/创建/修改/删除/移动日程、RSVP 回复、排查日程冲突或设置勿扰/外出时间时使用。"
        },
        {
                "prefix": "Read, create, edit, and manage Google Docs",
                "zh": "读取、创建、编辑和管理 Google Docs 文档。当用户分享文档链接、提取/总结文档内容、起草或排版文档、添加评论、插入表格与图像、导入 Markdown 或导出文档时使用。"
        },
        {
                "prefix": "Browse, search, and manage Google Drive files and folders",
                "zh": "浏览、搜索和管理 Google 云端硬盘（Google Drive）文件与文件夹。用于查找、下载、上传、重命名、移动、管理共享权限及导出文件（PDF、Markdown、CSV 等）。"
        },
        {
                "prefix": "Use this skill when writing code that calls the Gemini API",
                "zh": "在编写调用 Gemini API 的代码时使用，涵盖文本生成、多轮对话、多模态理解、图像/视频/语音生成、流式响应、函数调用、结构化输出及 SDK 最佳实践（Python/TypeScript）。"
        },
        {
                "prefix": "Use this skill when building real-time, bidirectional streaming applications with the Gemini Live API",
                "zh": "在使用 Gemini Live API 构建实时双向流式传输应用或迁移 Live 模型时使用。涵盖基于 WebSocket 的音视频/文本流式传输、语音活动检测（VAD）、扩展思考推理、实时转录与翻译。"
        },
        {
                "prefix": "Use this skill for generative video editing, text-to-video",
                "zh": "使用 Gemini Omni 1.1 Flash 进行生成式视频编辑、文本生成视频、参考图生成视频、首尾帧过渡及视频拓展。包含 ffmpeg 预处理优化及逐轮视频编辑工作流。"
        },
        {
                "prefix": "Design, implement, and debug autonomous AI agents and multi-agent systems using the Google Antigravity",
                "zh": "使用 Google Antigravity (AGY) SDK 设计、实现和调试自主 AI 智能体与多智能体系统。当需要创建、配置或编排 Antigravity 智能体时使用。"
        },
        {
                "prefix": "Read, write, format, and manage Google Sheets",
                "zh": "读取、写入、格式化和管理 Google 表格（Google Sheets）。用于读取分析表格数据、单元格读写排版、数据排序过滤、数据透视表与图表制作、CSV 导入及表格导出。"
        },
        {
                "prefix": "Read, create, and edit Google Slides presentations",
                "zh": "读取、创建和编辑 Google 幻灯片演示文稿（Google Slides）。用于新建演示文稿、提取汇总幻灯片内容、起草或修改幻灯片页面及导出演示文稿。"
        },
        {
                "prefix": "Diagnoses and resolves memory leaks in JavaScript",
                "zh": "诊断并解决 JavaScript/Node.js 应用程序中的内存泄漏问题。当遇到高内存占用、OOM 内存溢出错误，或需要分析堆快照（Heap Snapshot）及使用 memlab 检测时使用。"
        },
        {
                "prefix": "Search tool for modern web development best practices",
                "zh": "现代 Web 开发最佳实践检索工具。涵盖最新的 HTML/CSS 及客户端 JavaScript 规范、Web API、布局、动画与性能优化建议。"
        },
        {
                "prefix": "Guidelines for interacting with GitHub and request permissions",
                "zh": "与 GitHub 交互的指导规范。当命令因智能体环境限制失败时，向用户申请执行权限。"
        },
        {
                "prefix": "How to manage and create plugins",
                "zh": "如何管理和创建插件 —— 将技能、智能体、规则、MCP 服务和钩子打包为可作为整体安装、启用和禁用的命名空间单元。也可通过 /plugin 指令触发。"
        },
        {
                "prefix": "Uses Chrome DevTools MCP and documentation to troubleshoot connection",
                "zh": "使用 Chrome DevTools MCP 和文档排查连接与目标问题。当 list_pages、new_page、navigate_page 失败或服务器初始化异常时触发。"
        },
        {
                "prefix": "Discover UI plugin panels relevant to the current task",
                "zh": "发现与当前任务相关的 UI 插件面板，并在对话中呈现一键点击按钮以在侧边栏打开（切换）该面板。"
        },
        {
                "prefix": "Safely modifies Xcode projects",
                "zh": "安全修改 Xcode 项目（.pbxproj）以添加 Swift 软件包及关联文件。当 iOS 项目需要安装依赖项（如 Firebase、Alamofire）时使用。"
        },
        {
                "prefix": "Comprehensive guide and reference for the Antigravity Customization System",
                "zh": "Antigravity 自定义系统的全面指南与参考。用于解释自定义工作机制、加载优先级、发现机制，并指导技能、规则、插件、钩子及 MCP 服务的创建。"
        },
        {
                "prefix": "Provides instructions for installing and using the",
                "zh": "提供安装和使用 android CLI 的说明。该命令行工具是 Android 开发的关键工具，可帮助创建新项目、在设备上运行应用、管理与交互虚拟设备、管理 SDK 组件等。"
        },
        {
                "prefix": "Provides a comprehensive guide, quick reference, and sitemap for Google Antigravity",
                "zh": "提供 Google Antigravity (AGY) 的全面指南、快速参考与站点地图，包括 CLI (agy)、2.0、IDE、Python SDK、斜杠指令、快捷键及自定义配置。"
        },
        {
                "prefix": "How to render rich interactive HTML widgets inline in the chat",
                "zh": "如何在对话内嵌或独立工件中渲染丰富的交互式 HTML 小部件。用于向用户展示图表、数据可视化、交互控件等富视觉内容。"
        },
        {
                "prefix": "Automatically migrate legacy workflows to modern skills",
                "zh": "自动将全局和工作区配置中的旧版工作流迁移为现代技能。扫描现有工作流，创建目标 SKILL.md 并安全归档旧文件。"
        },
        {
                "prefix": "Guide agents to use",
                "zh": "指导智能体使用 package:ffigen 自动生成 FFI 绑定，而不是手动编写。在涉及编写新 FFI 绑定、扩展 C/Objective-C/Swift 集成时使用。"
        },
        {
                "prefix": "Use switch expressions and pattern matching where appropriate",
                "zh": "在合适的地方使用 switch 表达式和模式匹配（Pattern Matching）。"
        },
        {
                "prefix": "Rules and formatting guidelines for writing Dart",
                "zh": "编写 Dart /// API 文档和文档注释的规则与格式指南。"
        },
        {
                "prefix": "Configures Flutter Driver for app interaction",
                "zh": "配置用于应用交互的 Flutter Driver，并将 MCP 操作转换为持久化集成测试。"
        },
        {
                "prefix": "Adds interactive widget previews to the project",
                "zh": "使用 previews.dart 系统向项目中添加交互式 Widget 组件预览。"
        },
        {
                "prefix": "Implement a component-level test using",
                "zh": "使用 WidgetTester 实现组件级测试，以验证 UI 渲染和用户交互（点击、滚动、文本输入）。"
        },
        {
                "prefix": "Architects a Flutter application using the recommended layered approach",
                "zh": "使用官方推荐的分层架构方法（UI、业务逻辑、数据层）构建 Flutter 应用程序。"
        },
        {
                "prefix": "create a layout that adapts to different screen sizes",
                "zh": "使用 LayoutBuilder、MediaQuery 或 Expanded/Flexible 创建适应不同屏幕尺寸的响应式布局。"
        },
        {
                "prefix": "Fixes Flutter layout errors",
                "zh": "使用 Dart 和 Flutter MCP 工具修复 Flutter 布局错误（溢出、无界约束）。"
        },
        {
                "prefix": "Create model classes with",
                "zh": "使用 dart:convert 创建带有 fromJson 和 toJson 方法的模型类，进行简单数据结构的 JSON 映射。"
        },
        {
                "prefix": "advanced URL-based navigation",
                "zh": "使用类似 go_router 的软件包配置 MaterialApp.router，实现高级基于 URL 的导航与深度链接。"
        },
        {
                "prefix": "flutter_localizations",
                "zh": "添加 flutter_localizations 和 intl 依赖项，启用多语言本地化配置。"
        },
        {
                "prefix": "package to execute GET, POST, PUT, or DELETE requests",
                "zh": "使用 http 软件包执行 GET、POST、PUT 或 DELETE 网络请求以连接 REST API。"
        },
        {
                "prefix": "MANDATORY specialist subagent for Cloud Firestore Security Rules",
                "zh": "Cloud Firestore 安全规则（firestore.rules）的强制专家级子智能体。每当您的任务需要创建、编写或修改 Firestore 安全规则（firestore.rules）时，您必须将规则编写委托给该子智能体，而不是在主智能体中直接编写 firestore.rules。"
        },
        {
                "prefix": "Expert at reviewing Flutter code for accessibility",
                "zh": "审查 Flutter 代码无障碍功能（a11y）问题的专家。调用此智能体对代码库、待定更改或 PR 执行无障碍审查。"
        }
];
        for (let i = 0; i < SKILL_RULES.length; i++) {
            const rule = SKILL_RULES[i];
            if (trimmed.includes(rule.prefix)) {
                if (trimmed.startsWith('/')) {
                    const m = trimmed.match(/^(\s*\/[a-zA-Z0-9_.-]+\s+)/);
                    return leadingSpace + (m ? m[1] : '') + rule.zh + trailingSpace;
                }
                return leadingSpace + rule.zh + trailingSpace;
            }
        }

        // Custom Agents descriptions dynamic matching (full or truncated with ... / …)
        if (/MANDATORY specialist subagent for Cloud Firestore Security Rules/i.test(trimmed)) {
            return 'Cloud Firestore 安全规则（firestore.rules）的强制专家级子智能体。每当您的任务需要创建、编写或修改 Firestore 安全规则（firestore.rules）时，您必须将规则编写委托给该子智能体，而不是在主智能体中直接编写 firestore.rules。';
        }
        if (/Expert at reviewing Flutter code for accessibility/i.test(trimmed)) {
            return '审查 Flutter 代码无障碍功能（a11y）问题的专家。调用此智能体对代码库、待定更改或 PR 执行无障碍审查。';
        }

        // Plugin catalog descriptions dynamic matching (full or truncated with ... / …)
        if (/Build applications with the Gemini Interaction/i.test(trimmed)) {
            return '使用 Gemini 交互 API 构建应用程序。';
        }
        if (/Reliable automation, in-depth debugging/i.test(trimmed)) {
            return '针对网页提供可靠的自动化、深度调试和全面检查。';
        }
        if (/Core tools and knowledge required to develo/i.test(trimmed)) {
            return '开发 Android 所需的核心工具和知识。';
        }
        if (/Prototype, build & run modern apps that user/i.test(trimmed)) {
            return '使用 Firebase 进行原型设计、构建并运行深受用户喜爱的现代应用。';
        }
        if (/Curated collection of agent skills for science/i.test(trimmed)) {
            return '精选的适用于科学任务的智能体技能合集。';
        }
        if (/Using the Google Antigravity Python SDK/i.test(trimmed)) {
            return '使用 Google Antigravity Python SDK 构建自定义扩展。';
        }
        if (/Keep your coding agent up to date with the la/i.test(trimmed)) {
            return '让您的编码智能体紧跟最新的现代 Web 标准。';
        }
        if (/Integration skill and tools for Google Maps/i.test(trimmed)) {
            return 'Google Maps 平台的集成技能与工具。';
        }
        if (/Official plugin for Dart and Flutter that installs/i.test(trimmed)) {
            return 'Dart 和 Flutter 官方插件，用于安装 SDK 及开发工具。';
        }
        if (/This plugin provides a specialized suite of skill/i.test(trimmed)) {
            return '此插件提供用于数据分析与探索的专用技能套件。';
        }
        if (/Connect to Google Workspace, including Docs, Sheets, Slides, Drive/i.test(trimmed)) {
            return '连接到 Google Workspace，包括 Docs、Sheets、Slides、Drive 和 Calendar。';
        }
        if (/Build on Google's developer platforms, including Android, Chrome, Gemini/i.test(trimmed)) {
            return '在 Google 开发者平台上构建应用，包括 Android、Chrome、Gemini 和 Google Cloud。';
        }

        // Third-party model notices & tooltips
        const tpModelMatch = trimmed.match(/^([\s\S]+?)\s+is now available on paid Pro and Ultra plans\.\s*Third-party model access will no longer be available on your current plan starting on\s+([A-Za-z]+\s+\d+,\s+\d{4})\.?$/i);
        if (tpModelMatch) {
            return `${tpModelMatch[1]} 现已面向付费的 Pro 和 Ultra 计划推出。自 ${translateDate(tpModelMatch[2])} 起，您当前的计划将不再提供第三方模型访问权限。`;
        }

        const tpModelMatch2 = trimmed.match(/^([\s\S]+?)\s+(?:is|are) now available (?:on|in) paid Pro and Ultra plans\.?\s*Starting (?:on\s+)?([A-Za-z]+\s+\d+,\s+\d{4}),\s*your current plan will no longer (?:provide|include) (?:access to )?third-party models?\.?$/i);
        if (tpModelMatch2) {
            return `${tpModelMatch2[1]} 现在可在付费的 Pro 和 Ultra 计划中使用。从 ${translateDate(tpModelMatch2[2])} 起，您当前计划将不再提供第三方模型访问权限。`;
        }

        if (/Opus.*Sonnet.*(?:Pro|Ultra)/i.test(trimmed) || /第三方模型访问变更/i.test(trimmed)) {
            return trimmed
                .replace(/\s+([，。！？；：])/g, '$1')
                .replace(/([（《])\s+/g, '$1');
        }

        // Model plan subscriber availability tooltips
        const modelAvailMatch = trimmed.match(/^([\s\S]+?)\s+is (?:currently\s+|only\s+)?available to\s+([\s\S]+?)\s+(?:plan\s+)?subscribers\.?$/i);
        if (modelAvailMatch) {
            let plan = modelAvailMatch[2].trim();
            plan = plan.replace(/Ultra and paid Pro/i, 'Ultra 和付费 Pro')
                       .replace(/paid Pro and Ultra/i, '付费 Pro 和 Ultra')
                       .replace(/paid Pro/i, '付费 Pro')
                       .replace(/Ultra/i, 'Ultra')
                       .replace(/Pro/i, 'Pro');
            const period = trimmed.endsWith('.') ? '。' : '';
            return `${modelAvailMatch[1]} 目前面向 ${plan} 计划订阅用户开放${period}`;
        }

        // Automation enabled/disabled notifications & modals
        const autoEnableMatch = trimmed.match(/^Enabled\s+"([^"]+)"\.?$/i);
        if (autoEnableMatch) {
            return `已启用“${autoEnableMatch[1]}”。`;
        }
        const autoDisableMatch = trimmed.match(/^Disabled\s+"([^"]+)"\.?$/i);
        if (autoDisableMatch) {
            return `已停用“${autoDisableMatch[1]}”。`;
        }
        if (/^Agents created by this automation run in a dedicated project with its own permissions/i.test(trimmed)) {
            return '此自动化任务创建的智能体将在具有独立权限的专用项目中运行。您可以在项目设置页面中修改权限。';
        }

        // "Review permissions for <name>"
        const revPermMatch = trimmed.match(/^Review permissions for\s+([\s\S]+?)$/i);
        if (revPermMatch) {
            return `审查 ${revPermMatch[1]} 的权限`;
        }

        // "Agents created by <name> run in a dedicated project with its own permissions, which you can change anytime in the project settings page. On top of those defaults, <name> requests the access below."
        const autoPermDescMatch = trimmed.match(/^Agents created by\s+([\s\S]+?)\s+run in a dedicated project with its own permissions,\s*which you can change (?:anytime )?in the project settings page\.\s*On top of those defaults,\s*[\s\S]+?\s+requests the access below\.?$/i);
        if (autoPermDescMatch) {
            return `由 ${autoPermDescMatch[1]} 创建的智能体将在具有独立权限的专用项目中运行，您可以随时在项目设置页面中进行修改。在这些默认权限的基础上，该任务还需要申请以下访问权限。`;
        }

        // "This project was created for the <name> automation and its agents have permissions specific to this automation"
        const projAutoPermMatch = trimmed.match(/^This project was created for the\s+([\s\S]+?)\s+automation and its agents have permissions specific to this automation(?:\s*\(在此项目中工作时\))?\.?\s*(?:了解更多。?)?$/i);
        if (projAutoPermMatch) {
            return `此项目是为 ${projAutoPermMatch[1]} 自动化创建的，其智能体拥有专门针对此自动化的权限（在此项目中工作时）。了解更多。`;
        }

        // "Project already exists" modal and body
        const projAlreadyExistsFullMatch = trimmed.match(/^Project\s+([\s\S]+?)\s+already exists for this folder\.\s*Would you like to continue using it or (?:make|create) a new one\??$/i);
        if (projAlreadyExistsFullMatch) {
            return `项目 ${projAlreadyExistsFullMatch[1]} 已存在于此文件夹。您想继续使用它还是新建一个？`;
        }
        if (/^already exists for this folder\.\s*Would you like to continue using it or (?:make|create) a new one\??$/i.test(trimmed)) {
            return '已存在于此文件夹。您想继续使用它还是新建一个？';
        }
        if (/^already exists for this folder\.?$/i.test(trimmed)) {
            return '已存在于此文件夹。';
        }
        if (/^Would you like to continue using it or (?:make|create) a new one\??$/i.test(trimmed)) {
            return '您想继续使用它还是新建一个？';
        }

        // "Ask anything, @ to mention, / for actions"
        if (/^Ask anything,\s*@\s*to mention,\s*\/\s*for actions\.?$/i.test(trimmed)) {
            return '输入任何问题，输入 @ 提及，输入 / 执行操作';
        }
        if (/^Ask anything,?\s*@\s*to mention/i.test(trimmed)) {
            return trimmed
                .replace(/Ask anything,?/gi, '输入任何问题，')
                .replace(/@\s*to mention,?/gi, '输入 @ 提及，')
                .replace(/\/\s*for actions\.?/gi, '输入 / 执行操作');
        }

        // "No X yet" or "No X"
        if (/^No\s+([A-Za-z\s]+?)\s+yet\.?$/i.test(trimmed)) {
            const m = trimmed.match(/^No\s+([A-Za-z\s]+?)\s+yet\.?$/i);
            const nounMap = {
                'conversations': '对话',
                'conversation': '对话',
                'projects': '项目',
                'project': '项目',
                'tasks': '任务',
                'task': '任务',
                'skills': '技能',
                'skill': '技能',
                'rules': '规则',
                'rule': '规则',
                'comments': '评论',
                'comment': '评论',
                'tools': '工具',
                'tool': '工具',
                'automations': '自动化',
                'automation': '自动化',
            };
            const noun = nounMap[m[1].toLowerCase()];
            if (noun) {
                return `暂无${noun}`;
            }
        }

        // "No automations configured"
        if (/^No automations configured(?:\s+yet)?\.?$/i.test(trimmed)) {
            return '未配置任何自动化。';
        }

        // "Automations [shortcut]"
        if (/^Automations(?:\s+(?:Ctrl\+U|\(Ctrl\+U\)))?$/i.test(trimmed)) {
            const hasShortcut = /Ctrl\+U/i.test(trimmed);
            return hasShortcut ? '自动化 Ctrl+U' : '自动化';
        }

        // "CLI Project(s)"
        if (/^CLI\s+Projects?$/i.test(trimmed)) {
            return 'CLI 项目';
        }

        // "No Project(s)"
        if (/^No\s+Projects?$/i.test(trimmed)) {
            return '未选择项目';
        }

        // "Main Agent"
        if (/^Main\s+Agent$/i.test(trimmed)) {
            return '主智能体';
        }

        // "Guide me through creating an automated task / automation"
        if (/^Guide me through creating an (?:automated task|automation)\.?$/i.test(trimmed)) {
            return '引导我创建自动化任务';
        }

        // "You have hit your 5-hour/weekly limit..."
        if (/^You have hit your/i.test(trimmed)) {
            // Case 1: "You have hit your 5-hour limit, so the weekly limit does not currently apply. Your 5-hour limit will refresh in 4 hours, 52 minutes."
            let m = trimmed.match(/^You have hit your ([\w-]+) limit,\s*so the ([\w-]+) limit does not currently apply\.\s*Your ([\w-]+) limit will refresh in (.+?)\.?$/i);
            if (m) {
                const lim1 = m[1].toLowerCase().includes('weekly') ? '每周' : (m[1].toLowerCase().includes('5') ? '5 小时' : m[1]);
                const lim2 = m[2].toLowerCase().includes('weekly') ? '每周' : (m[2].toLowerCase().includes('5') ? '5 小时' : m[2]);
                const dur = translateDuration(m[4]);
                return leadingSpace + `您已达到 ${lim1}限制，因此当前不适用 ${lim2}限制。您的 ${lim1}限制将在 ${dur}后刷新。` + trailingSpace;
            }
            // Case 2: "You have hit your 5-hour limit, it will refresh in 4 hours, 52 minutes. If on a supported paid plan, you can use AI credits in the interim."
            m = trimmed.match(/^You have hit your ([\w-]+) limit,\s*it will refresh in (.+?)\.\s*If on a supported paid plan,\s*you can use AI credits in the interim\.?$/i);
            if (m) {
                const lim1 = m[1].toLowerCase().includes('weekly') ? '每周' : (m[1].toLowerCase().includes('5') ? '5 小时' : m[1]);
                const dur = translateDuration(m[2]);
                return leadingSpace + `您已达到 ${lim1}限制，将在 ${dur}后刷新。如果您使用的是受支持的付费计划，期间可以使用 AI 积分。` + trailingSpace;
            }
            // Case 3: "You have hit your 5-hour limit, it will refresh in 4 hours, 52 minutes."
            m = trimmed.match(/^You have hit your ([\w-]+) limit,\s*it will refresh in (.+?)\.?$/i);
            if (m) {
                const lim1 = m[1].toLowerCase().includes('weekly') ? '每周' : (m[1].toLowerCase().includes('5') ? '5 小时' : m[1]);
                const dur = translateDuration(m[2]);
                return leadingSpace + `您已达到 ${lim1}限制，将在 ${dur}后刷新。` + trailingSpace;
            }
            // Case 4: "You have hit your 5-hour limit."
            m = trimmed.match(/^You have hit your ([\w-]+) limit\.?$/i);
            if (m) {
                const lim1 = m[1].toLowerCase().includes('weekly') ? '每周' : (m[1].toLowerCase().includes('5') ? '5 小时' : m[1]);
                return leadingSpace + `您已达到 ${lim1}限制。` + trailingSpace;
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

// (Resets in X and Worked for X handled earlier before dynamic regex)

        // "X finished [>]"
        const finishedMatch = trimmed.match(/^([\s\S]+?)\s+finished(?:\s*([>›»]))?$/i);
        if (finishedMatch && !trimmed.startsWith('Not finished')) {
            const base = finishedMatch[1].trim();
            const transBase = translationMap[base] || base;
            const arrow = finishedMatch[2] ? ' ' + finishedMatch[2] : '';
            return `${transBase} 已完成${arrow}`;
        }

        // Relative timestamps e.g. "3m ago", "10s ago", "just now"
        if (/^just\s+now$/i.test(trimmed)) {
            return '刚刚';
        }
        const timeAgoMatch = trimmed.match(/^(\d+)\s*([smhdwy]|seconds?|minutes?|mins?|hours?|days?|weeks?|years?)\s+ago$/i);
        if (timeAgoMatch) {
            const dur = translateDuration(`${timeAgoMatch[1]}${timeAgoMatch[2]}`);
            return `${dur}前`;
        }

        // "Category (X tokens) Y%" / "(X tokens)"
        const tokenBreakdownMatch = trimmed.match(/^(.+?)\s*\(([\d,]+)\s+tokens?\)\s*([\d.]+%?)$/i);
        if (tokenBreakdownMatch) {
            const catMap = {
                'Skills': '技能', 'skills': '技能',
                'Rules': '规则', 'rules': '规则',
                'Plugins': '插件', 'plugins': '插件',
                'Subagents': '子智能体', 'subagents': '子智能体',
                'Mcp Tools': 'MCP 工具', 'mcp tools': 'MCP 工具', 'MCP Tools': 'MCP 工具', 'MCP tools': 'MCP 工具',
                'MCP': 'MCP', 'mcp': 'MCP'
            };
            const cat = catMap[tokenBreakdownMatch[1]] || translationMap[tokenBreakdownMatch[1]] || tokenBreakdownMatch[1];
            return `${cat} (${tokenBreakdownMatch[2]} 个 Token) ${tokenBreakdownMatch[3]}`;
        }
        const tokensOnlyMatch = trimmed.match(/^\(([\d,]+)\s+tokens?\)$/i);
        if (tokensOnlyMatch) {
            return `(${tokensOnlyMatch[1]} 个 Token)`;
        }

        // "Local [chevrons]"
        const localMatch = trimmed.match(/^Local(?:\s*([▼▾⌄⌵ˇv∨˅\^∧>›\u02c5\u2304\u25bc\u25be\ufe40\u2228\u23f7\u25bd]))?$/i);
        if (localMatch) {
            return `本地${localMatch[1] ? ' ' + localMatch[1] : ''}`;
        }

        // "Main Agent [chevrons]"
        const mainAgentMatch = trimmed.match(/^Main\s+Agent(?:\s*([▼▾⌄⌵ˇv∨˅\^∧>›\u02c5\u2304\u25bc\u25be\ufe40\u2228\u23f7\u25bd]))?$/i);
        if (mainAgentMatch) {
            return `主智能体${mainAgentMatch[1] ? ' ' + mainAgentMatch[1] : ''}`;
        }

        // "New Worktree [chevrons]"
        const newWorktreeMatch = trimmed.match(/^New\s+Worktree(?:\s*([▼▾⌄⌵ˇv∨˅\^∧>›\u02c5\u2304\u25bc\u25be\ufe40\u2228\u23f7\u25bd]))?$/i);
        if (newWorktreeMatch) {
            return `新建工作树${newWorktreeMatch[1] ? ' ' + newWorktreeMatch[1] : ''}`;
        }

        // "Select branch [chevrons]"
        const selectBranchMatch = trimmed.match(/^Select\s+branch(?:\s*([▼▾⌄⌵ˇv∨˅\^∧>›\u02c5\u2304\u25bc\u25be\ufe40\u2228\u23f7\u25bd]))?$/i);
        if (selectBranchMatch) {
            return `选择分支${selectBranchMatch[1] ? ' ' + selectBranchMatch[1] : ''}`;
        }

        // "Commit/Push/Pull/Sync [chevrons]"
        const gitBtnMatch = trimmed.match(/^(Commit|Push|Pull|Sync)(?:\s*([▼▾⌄⌵ˇv∨˅\^∧>›\u02c5\u2304\u25bc\u25be\ufe40\u2228\u23f7\u25bd]))?$/i);
        if (gitBtnMatch) {
            const actMap = { 'Commit': '提交', 'Push': '推送', 'Pull': '拉取', 'Sync': '同步' };
            const act = actMap[gitBtnMatch[1]] || gitBtnMatch[1];
            return act + (gitBtnMatch[2] ? ' ' + gitBtnMatch[2] : '');
        }

        // General chevron suffix handler
        const chevronMatch = trimmed.match(/^(.+?)\s*([▼▾⌄⌵ˇv∨˅\^∧>›\u02c4\u02c5\u02c6\u2303\u2304\u25b2\u25b4\u25b5\u25bc\u25be\ufe40\u2228\u23f7\u25bd])$/);
        if (chevronMatch) {
            const base = chevronMatch[1].trim();
            if (!/[▼▾⌄⌵ˇv∨˅\^∧>›\u02c4\u02c5\u02c6\u2303\u2304\u25b2\u25b4\u25b5\u25bc\u25be\ufe40\u2228\u23f7\u25bd]$/.test(base)) {
                const transBase = translateText(base);
                if (transBase && transBase !== base) {
                    return `${transBase} ${chevronMatch[2]}`;
                }
            }
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

        // "Permanently delete <name> including <count> active/archived conversations"
        const permDelMatch = trimmed.match(/^Permanently delete\s+([\s\S]+?)\s+including\s+([\s\S]+?)\.?$/i);
        if (permDelMatch) {
            return `永久删除 ${permDelMatch[1]}，包括 ${permDelMatch[2]}。`;
        }
        if (/^Permanently delete\s+([\s\S]+?)\.?$/i.test(trimmed)) {
            const m = trimmed.match(/^Permanently delete\s+([\s\S]+?)\.?$/i);
            return `永久删除 ${m[1]}`;
        }
        if (/^including\s+([\s\S]+?)\.?$/i.test(trimmed)) {
            const m = trimmed.match(/^including\s+([\s\S]+?)\.?$/i);
            return `包括 ${m[1]}`;
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
        // "X question(s)"
        const questionMatch = trimmed.match(/^(\d+)\s+questions?$/i);
        if (questionMatch) {
            return `${questionMatch[1]} 个问题`;
        }

        // Arrow suffix handler e.g. "Action Name >" or "Action Name ›"
        const arrowMatch = trimmed.match(/^(.+?)\s*([>›»])$/);
        if (arrowMatch) {
            const innerText = arrowMatch[1].trim();
            if (!/[>›»]$/.test(innerText)) {
                const innerTrans = translateText(innerText);
                if (innerTrans && innerTrans !== innerText) {
                    return `${innerTrans} ${arrowMatch[2]}`;
                }
            }
        }

        // Compound step actions like "Ran commands, edited file", "Running commands, editing file"
        if (trimmed.includes(',')) {
            const parts = trimmed.split(/\s*,\s*/);
            if (parts.length >= 2) {
                const stepActionMap = {
                    'running command': '正在运行命令',
                    'running commands': '正在运行命令',
                    'ran command': '已运行命令',
                    'ran commands': '已运行命令',
                    'executed command': '已执行命令',
                    'executed commands': '已执行命令',
                    'editing file': '正在编辑文件',
                    'editing files': '正在编辑文件',
                    'edited file': '已编辑文件',
                    'edited files': '已编辑文件',
                    'creating file': '正在创建文件',
                    'creating files': '正在创建文件',
                    'created file': '已创建文件',
                    'created files': '已创建文件',
                    'viewing file': '正在查看文件',
                    'viewing files': '正在查看文件',
                    'viewed file': '已查看文件',
                    'viewed files': '已查看文件',
                    'reading file': '正在读取文件',
                    'reading files': '正在读取文件',
                    'read file': '已读取文件',
                    'read files': '已读取文件',
                    'searching code': '正在搜索代码',
                    'searched code': '已搜索代码',
                    'searching web': '正在搜索网页',
                    'searched web': '已搜索网页',
                    'listing directory': '正在列出目录',
                    'listed directory': '已列出目录'
                };
                let allMatched = true;
                const transParts = [];
                for (const p of parts) {
                    const low = p.toLowerCase();
                    if (stepActionMap[low]) {
                        transParts.push(stepActionMap[low]);
                    } else {
                        const direct = translationMap[p] || translationMap[low];
                        if (direct) {
                            transParts.push(direct);
                        } else {
                            allMatched = false;
                            break;
                        }
                    }
                }
                if (allMatched) {
                    return transParts.join('，');
                }
            }
        }

        if (/^The browser subagent can be invoked by typing\s*\/browser\s*in the conversation input box\.?$/i.test(trimmed)) {
            return '可以通过在对话输入框中输入 /browser 来调用浏览器子智能体。';
        }

        return null;
    }

    function translateAttributes(el) {
        if (!el || el.nodeType !== Node.ELEMENT_NODE) return;
        const attrs = ['title', 'aria-label', 'data-tooltip', 'placeholder', 'data-placeholder', 'aria-placeholder', 'data-ph', 'data-empty-text', 'data-text'];
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

    function observeShadow(root) {
        if (!root || root.__i18n_observed) return;
        root.__i18n_observed = true;
        try {
            translateNode(root);
            const shadowObs = new MutationObserver((mutations) => {
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
            shadowObs.observe(root, {
                childList: true,
                subtree: true,
                characterData: true,
                attributes: true,
                attributeFilter: ['title', 'aria-label', 'data-tooltip', 'placeholder', 'data-placeholder', 'aria-placeholder', 'data-ph', 'data-empty-text', 'data-text']
            });
        } catch (_) {}
    }

    try {
        if (typeof Element !== 'undefined' && Element.prototype && Element.prototype.attachShadow) {
            const origAttachShadow = Element.prototype.attachShadow;
            Element.prototype.attachShadow = function(init) {
                const shadow = origAttachShadow.call(this, init);
                observeShadow(shadow);
                return shadow;
            };
        }
    } catch (_) {}

    try {
        if (typeof HTMLInputElement !== 'undefined' && HTMLInputElement.prototype) {
            const origInpPh = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'placeholder');
            if (origInpPh && origInpPh.set) {
                Object.defineProperty(HTMLInputElement.prototype, 'placeholder', {
                    get: origInpPh.get,
                    set: function(val) {
                        const tr = (typeof val === 'string' && typeof translateText === 'function') ? (translateText(val) || val) : val;
                        return origInpPh.set.call(this, tr);
                    },
                    configurable: true,
                    enumerable: true
                });
            }
        }
        if (typeof HTMLTextAreaElement !== 'undefined' && HTMLTextAreaElement.prototype) {
            const origTaPh = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'placeholder');
            if (origTaPh && origTaPh.set) {
                Object.defineProperty(HTMLTextAreaElement.prototype, 'placeholder', {
                    get: origTaPh.get,
                    set: function(val) {
                        const tr = (typeof val === 'string' && typeof translateText === 'function') ? (translateText(val) || val) : val;
                        return origTaPh.set.call(this, tr);
                    },
                    configurable: true,
                    enumerable: true
                });
            }
        }
    } catch (_) {}

    function checkAndTranslateAutomationBanner(el) {
        if (!el || !el.textContent || !/This project was created for the/i.test(el.textContent)) {
            return false;
        }
        const textNodes = [];
        for (let i = 0; i < el.childNodes.length; i++) {
            const c = el.childNodes[i];
            if (c.nodeType === Node.TEXT_NODE && c.nodeValue && c.nodeValue.trim()) {
                textNodes.push(c);
            }
        }
        if (textNodes.length > 0) {
            for (let i = 0; i < textNodes.length; i++) {
                const tn = textNodes[i];
                if (/This project was created for the/i.test(tn.nodeValue)) {
                    tn.nodeValue = tn.nodeValue.replace(/This project was created for the/gi, '此项目是为');
                }
                if (/automation and its agents have permissions specific to this automation/i.test(tn.nodeValue)) {
                    tn.nodeValue = tn.nodeValue.replace(/automation and its agents have permissions specific to this automation/gi, '自动化创建的，其智能体拥有专门针对此自动化的权限');
                }
                if (/^\s*automation\s*$/i.test(tn.nodeValue)) {
                    tn.nodeValue = tn.nodeValue.replace(/automation/gi, '自动化');
                }
            }
            return true;
        }
        return false;
    }

    function checkAndTranslateModifiedInElement(el) {
        if (!el || !el.textContent || !/Modified in\s+\d+\s+(?:projects?|workspaces?|conversations?)/i.test(el.textContent)) {
            return false;
        }
        const textNodes = [];
        for (let i = 0; i < el.childNodes.length; i++) {
            const c = el.childNodes[i];
            if (c.nodeType === Node.TEXT_NODE && c.nodeValue && c.nodeValue.trim()) {
                textNodes.push(c);
            }
        }
        if (textNodes.length >= 2) {
            for (let i = 0; i < textNodes.length; i++) {
                const tn = textNodes[i];
                if (/Modified in/i.test(tn.nodeValue)) {
                    tn.nodeValue = tn.nodeValue.replace(/Modified in/gi, '已在');
                }
                if (/projects?/i.test(tn.nodeValue)) {
                    tn.nodeValue = tn.nodeValue.replace(/projects?/gi, '个项目中修改');
                }
                if (/workspaces?/i.test(tn.nodeValue)) {
                    tn.nodeValue = tn.nodeValue.replace(/workspaces?/gi, '个工作区中修改');
                }
                if (/conversations?/i.test(tn.nodeValue)) {
                    tn.nodeValue = tn.nodeValue.replace(/conversations?/gi, '个对话中修改');
                }
            }
            return true;
        }
        return false;
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
            checkAndTranslateAutomationBanner(node);
            checkAndTranslateModifiedInElement(node);
            const tag = node.tagName ? node.tagName.toLowerCase() : '';
            if (tag === 'iframe' || tag === 'webview') {
                try {
                    const doc = node.contentDocument || (node.contentWindow && node.contentWindow.document);
                    if (doc && doc.body) {
                        translateNode(doc.body);
                    }
                    node.addEventListener('load', () => {
                        try {
                            const d = node.contentDocument || (node.contentWindow && node.contentWindow.document);
                            if (d && d.body) {
                                translateNode(d.body);
                            }
                        } catch (_) {}
                    }, { once: true });
                } catch (_) {}
            }
            if (node.shadowRoot) {
                try {
                    observeShadow(node.shadowRoot);
                } catch (_) {}
            }
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
            attributeFilter: ['title', 'aria-label', 'data-tooltip', 'placeholder', 'data-placeholder', 'aria-placeholder', 'data-ph', 'data-empty-text', 'data-text']
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
