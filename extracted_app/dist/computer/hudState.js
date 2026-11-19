"use strict";
/**
 * What the computer-use HUD shows for a computer actuator state: pure, so it
 * is unit tested without Electron (hud.ts renders it).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.hudView = hudView;
const MAX_APP_NAME = 60;
function hudView(s) {
    const visible = s.agentActive || s.paused;
    if (s.paused) {
        return { state: 'paused', text: 'Agent paused — you have control', visible };
    }
    if (!s.agentActive) {
        return { state: 'idle', text: 'Agent idle', visible };
    }
    if (s.mode === 'background') {
        const name = (s.appName ?? '').trim().slice(0, MAX_APP_NAME);
        return {
            state: 'background',
            text: name
                ? `AGY working in ${name} (background)`
                : 'AGY working in the background',
            visible,
        };
    }
    return { state: 'running', text: 'AGY is controlling your Mac', visible };
}
