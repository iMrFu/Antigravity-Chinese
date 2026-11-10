"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupApplicationMenu = setupApplicationMenu;
exports.wslConnectMenuTemplate = wslConnectMenuTemplate;
exports.wslReopenLocallyTemplate = wslReopenLocallyTemplate;
exports.relaunchWithWslDistro = relaunchWithWslDistro;
const electron_1 = require("electron");
const path = __importStar(require("path"));
const utils_1 = require("./utils");
const updater_1 = require("./updater");
const wsl_1 = require("./wsl");
const debugConsole_1 = require("./debugConsole");
const hubZoom_1 = require("./hubZoom");
function createHubZoomMenuItem(options) {
    return new electron_1.MenuItem({
        id: options.id,
        label: options.label,
        accelerator: options.accelerator,
        enabled: options.enabled ?? true,
        visible: options.visible ?? true,
        ...(options.acceleratorWorksWhenHidden !== undefined
            ? { acceleratorWorksWhenHidden: options.acceleratorWorksWhenHidden }
            : {}),
        click: (_menuItem, focusedWindow) => {
            void (0, hubZoom_1.applyHubWindowZoom)((0, hubZoom_1.resolveTargetHubWindow)(focusedWindow), options.action).catch(() => undefined);
        },
    });
}
function configureViewZoomMenu(appMenu) {
    const viewMenuItem = appMenu.items?.find((item) => item.label === 'View');
    const viewSubmenu = viewMenuItem?.submenu;
    if (!viewSubmenu || !Array.isArray(viewSubmenu.items)) {
        return;
    }
    const hasBuiltInZoomRole = viewSubmenu.items.some((item) => {
        const role = item.role?.toLowerCase();
        return role === 'resetzoom' || role === 'zoomin' || role === 'zoomout';
    });
    if (!hasBuiltInZoomRole) {
        return;
    }
    const nextItems = [];
    for (const item of viewSubmenu.items) {
        const role = item.role?.toLowerCase();
        if (role === 'resetzoom') {
            nextItems.push(createHubZoomMenuItem({
                id: 'hub-reset-zoom',
                label: '实际大小',
                accelerator: item.accelerator || 'CmdOrCtrl+0',
                action: 'reset',
                enabled: item.enabled,
                visible: item.visible,
            }));
        }
        else if (role === 'zoomin') {
            nextItems.push(createHubZoomMenuItem({
                id: 'hub-zoom-in',
                label: '放大',
                accelerator: item.accelerator || 'CmdOrCtrl+Plus',
                action: 'in',
                enabled: item.enabled,
                visible: item.visible,
            }), 
            // Electron's default `CommandOrControl+Plus` only matches shifted `+`
            // on Linux/Windows; register a hidden `CmdOrCtrl+=` alias so unshifted
            // `Ctrl+=` / `Cmd+=` zooms the Hub UI without duplicating the menu row.
            createHubZoomMenuItem({
                id: 'hub-zoom-in-equal',
                label: '放大',
                accelerator: 'CmdOrCtrl+=',
                action: 'in',
                enabled: item.enabled,
                visible: false,
                acceleratorWorksWhenHidden: true,
            }));
        }
        else if (role === 'zoomout') {
            nextItems.push(createHubZoomMenuItem({
                id: 'hub-zoom-out',
                label: '缩小',
                accelerator: item.accelerator || 'CmdOrCtrl+-',
                action: 'out',
                enabled: item.enabled,
                visible: item.visible,
            }));
        }
        else {
            nextItems.push(item);
        }
    }
    const submenuWithInternals = viewSubmenu;
    if (typeof submenuWithInternals.clear === 'function' &&
        typeof viewSubmenu.insert === 'function') {
        // `Menu.prototype.clear` clears the native C++ MenuModel without emptying
        // the JS `items` / `commandsMap` mirrors; reset both before re-inserting.
        submenuWithInternals.clear();
        viewSubmenu.items.length = 0;
        if (submenuWithInternals.commandsMap) {
            submenuWithInternals.commandsMap = {};
        }
        nextItems.forEach((nextItem, index) => {
            viewSubmenu.insert(index, nextItem);
        });
    }
    else {
        viewSubmenu.items.splice(0, viewSubmenu.items.length, ...nextItems);
    }
}
/**
 * Applies modifications to the default application menu.
 */
function setupApplicationMenu(url) {
    const menu = electron_1.Menu.getApplicationMenu();
    if (!menu) {
        return;
    }
    // Adds a "New Window" item to the top of the existing File menu.
    addItemToSubmenu(menu, 'File', 0, new electron_1.MenuItem({
        label: '新建窗口',
        accelerator: 'CmdOrCtrl+Shift+N',
        click: () => {
            (0, utils_1.createWindow)(url, undefined, { cascade: true });
        },
    }));
    // Add "Check for Updates" to the application menu on macOS.
    if ((0, utils_1.isMacOS)()) {
        const appSubmenu = menu.items[0]?.submenu;
        if (appSubmenu) {
            appSubmenu.insert(1, new electron_1.MenuItem({
                id: 'check-for-updates',
                label: updater_1.MenuUpdateStep.CheckForUpdates,
                click: (menuItem) => {
                    const action = updater_1.updateActions[menuItem.label];
                    action?.();
                },
            }));
        }
    }
    // Adds Docs to the Help menu.
    addItemToSubmenu(menu, 'Help', 0, new electron_1.MenuItem({
        label: '文档',
        click: async () => {
            await electron_1.shell.openExternal('https://antigravity.google/docs');
        },
    }));
    configureViewZoomMenu(menu);
    (0, debugConsole_1.configureDebugConsoleMenu)(menu);
    // Re-apply the menu so the change takes effect.
    electron_1.Menu.setApplicationMenu(menu);
    // Asynchronously adds "Connect to WSL" (Windows only, when WSL is present).
    void addWslConnectMenu(menu);
}
/**
 * Builds a "Connect to WSL" submenu of installed distros (null when WSL
 * isn't applicable); selecting one relaunches the app connected to it.
 */
async function wslConnectMenuTemplate() {
    if (!(0, wsl_1.isWslAvailable)()) {
        return null;
    }
    let distros;
    try {
        distros = await (0, wsl_1.listWslDistros)();
    }
    catch (err) {
        console.error('Failed to list WSL distros:', err);
        return null;
    }
    if (distros.length === 0) {
        return null;
    }
    const active = (0, wsl_1.getActiveWslDistro)();
    const submenu = distros.map((d) => ({
        label: d.name,
        type: 'checkbox',
        checked: d.name === active,
        click: () => relaunchWithWslDistro(d.name),
    }));
    return { label: '连接到 WSL', submenu };
}
/** "Reopen Locally" item leaving WSL mode, or null when already local. */
function wslReopenLocallyTemplate() {
    if (!(0, wsl_1.getActiveWslDistro)()) {
        return null;
    }
    return { label: '在本地重新打开', click: () => relaunchWithWslDistro('') };
}
/** Adds the WSL items to the File menu. */
async function addWslConnectMenu(menu) {
    const template = await wslConnectMenuTemplate();
    if (!template) {
        return;
    }
    addItemToSubmenu(menu, 'File', 1, new electron_1.MenuItem(template));
    // Local mode is not a WSL distro, so "Reopen Locally" is a sibling item
    // rather than an entry in the distro submenu.
    const reopen = wslReopenLocallyTemplate();
    if (reopen) {
        addItemToSubmenu(menu, 'File', 2, new electron_1.MenuItem(reopen));
    }
    electron_1.Menu.setApplicationMenu(menu);
}
/** Relaunches the app connected to `distro` ('' = local mode). */
function relaunchWithWslDistro(distro) {
    if (distro === (0, wsl_1.getActiveWslDistro)()) {
        return;
    }
    // Persist so the choice survives relaunches that drop command-line switches.
    (0, wsl_1.persistWslDistro)(path.join(electron_1.app.getPath('userData'), wsl_1.WSL_STATE_FILE), distro);
    const args = process.argv
        .slice(1)
        .filter((a) => !a.startsWith('--wsl-distro'));
    if (distro) {
        args.push(`--wsl-distro=${distro}`);
    }
    electron_1.app.relaunch({ args });
    electron_1.app.quit();
}
/**
 * Adds a menu item to a submenu of the main application menu.
 */
function addItemToSubmenu(appMenu, submenuLabel, position, item) {
    const submenuItem = appMenu.items.find((item) => item.label === submenuLabel);
    if (!submenuItem?.submenu) {
        return;
    }
    submenuItem.submenu.insert(position, item);
}
