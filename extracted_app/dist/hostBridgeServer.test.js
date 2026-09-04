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
const vitest_1 = require("vitest");
const http = __importStar(require("node:http"));
const connect_1 = require("@connectrpc/connect");
const connect_node_1 = require("@connectrpc/connect-node");
const connect_2 = require("@connectrpc/connect");
const hostBridgeServer_1 = require("./hostBridgeServer");
const host_bridge_pb_1 = require("./proto/host_bridge_pb");
const STATUS = {
    currentVersion: '1.0.0',
    latestVersion: '1.2.0',
    updateAvailable: true,
};
/** Where the security checks are exercised from, as the language server sees it. */
const GET_UPDATE_STATUS_PATH = '/exa.host_bridge_pb.HostBridgeService/GetUpdateStatus';
const APPLY_UPDATE_PATH = '/exa.host_bridge_pb.HostBridgeService/ApplyUpdate';
/**
 * Issues a raw request with `node:http` rather than going through a Connect
 * client. The security checks run before the request reaches the Connect
 * handler, so they are only observable at this level — and `fetch` refuses to
 * send a caller-supplied Host header, which the rebinding test needs.
 */
function request(server, path, options = {}) {
    const headers = {};
    if (options.auth !== null) {
        headers['Authorization'] = options.auth ?? `Bearer ${server.token}`;
    }
    if (options.host !== undefined) {
        headers['Host'] = options.host;
    }
    return new Promise((resolve, reject) => {
        const req = http.request({
            host: '127.0.0.1',
            port: server.port,
            path,
            method: options.method ?? 'POST',
            headers,
        }, (res) => {
            const chunks = [];
            res.on('data', (chunk) => chunks.push(chunk));
            res.on('end', () => {
                resolve({
                    status: res.statusCode ?? 0,
                    headers: res.headers,
                    body: Buffer.concat(chunks).toString('utf8'),
                });
            });
        });
        req.on('error', reject);
        req.end();
    });
}
/** Presents the server's token the way the language server does. */
function bearer(token) {
    return (next) => async (req) => {
        req.header.set('Authorization', `Bearer ${token}`);
        return next(req);
    };
}
/** A Connect client pointed at the server, standing in for the language server. */
function clientFor(server) {
    return (0, connect_2.createClient)(host_bridge_pb_1.HostBridgeService, (0, connect_node_1.createConnectTransport)({
        baseUrl: server.url,
        httpVersion: '1.1',
        interceptors: [bearer(server.token)],
    }));
}
(0, vitest_1.describe)('hostBridgeServer', () => {
    let server;
    let client;
    let getUpdateStatus;
    let applyUpdate;
    (0, vitest_1.beforeEach)(async () => {
        getUpdateStatus = vitest_1.vi
            .fn()
            .mockReturnValue(STATUS);
        applyUpdate = vitest_1.vi
            .fn()
            .mockReturnValue(true);
        server = await (0, hostBridgeServer_1.startHostBridgeServer)({ getUpdateStatus, applyUpdate });
        client = clientFor(server);
    });
    (0, vitest_1.afterEach)(async () => {
        // Some tests close the server themselves; closing twice must not fail
        // the suite.
        await server.close().catch(() => { });
    });
    (0, vitest_1.it)('should bind to an ephemeral port on the loopback interface', () => {
        const address = server.server.address();
        (0, vitest_1.expect)(address.address).toBe('127.0.0.1');
        (0, vitest_1.expect)(address.port).toBeGreaterThan(0);
        (0, vitest_1.expect)(server.port).toBe(address.port);
        (0, vitest_1.expect)(server.url).toBe(`http://127.0.0.1:${address.port}`);
    });
    (0, vitest_1.it)('should generate a 32-byte hex token', () => {
        (0, vitest_1.expect)(server.token).toMatch(/^[0-9a-f]{64}$/);
    });
    (0, vitest_1.it)('should reject a request with no token', async () => {
        const res = await request(server, GET_UPDATE_STATUS_PATH, { auth: null });
        (0, vitest_1.expect)(res.status).toBe(401);
        (0, vitest_1.expect)(getUpdateStatus).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('should reject a request with a wrong token', async () => {
        const res = await request(server, GET_UPDATE_STATUS_PATH, {
            auth: `Bearer ${'0'.repeat(64)}`,
        });
        (0, vitest_1.expect)(res.status).toBe(401);
        (0, vitest_1.expect)(getUpdateStatus).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('should reject a token of a different length without throwing', async () => {
        const res = await request(server, GET_UPDATE_STATUS_PATH, {
            auth: 'Bearer short',
        });
        (0, vitest_1.expect)(res.status).toBe(401);
    });
    (0, vitest_1.it)('should reject a non-Bearer authorization scheme', async () => {
        const res = await request(server, GET_UPDATE_STATUS_PATH, {
            auth: server.token,
        });
        (0, vitest_1.expect)(res.status).toBe(401);
    });
    (0, vitest_1.it)('should reject a request with a bad Host header', async () => {
        const res = await request(server, GET_UPDATE_STATUS_PATH, {
            host: 'evil.example.com',
        });
        (0, vitest_1.expect)(res.status).toBe(403);
        (0, vitest_1.expect)(getUpdateStatus).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('should reject a Host header pointing at the wrong port', async () => {
        const res = await request(server, GET_UPDATE_STATUS_PATH, {
            host: `127.0.0.1:${server.port + 1}`,
        });
        (0, vitest_1.expect)(res.status).toBe(403);
    });
    (0, vitest_1.it)('should reject a bad Host header before checking the token', async () => {
        const res = await request(server, GET_UPDATE_STATUS_PATH, {
            auth: null,
            host: 'evil.example.com',
        });
        // 403 rather than 401 proves the host check runs before the token check.
        (0, vitest_1.expect)(res.status).toBe(403);
    });
    (0, vitest_1.it)('should not reveal which check failed', async () => {
        const forbidden = await request(server, GET_UPDATE_STATUS_PATH, {
            host: 'evil.example.com',
        });
        const unauthorized = await request(server, GET_UPDATE_STATUS_PATH, {
            auth: null,
        });
        (0, vitest_1.expect)(JSON.parse(forbidden.body)).toEqual({ error: 'forbidden' });
        (0, vitest_1.expect)(JSON.parse(unauthorized.body)).toEqual({ error: 'unauthorized' });
    });
    (0, vitest_1.it)('should log the reason it withholds from the response', async () => {
        // `console` is electron-log in the packaged app, so this is how a
        // rejection reaches the app's log file.
        const warn = vitest_1.vi.spyOn(console, 'warn').mockImplementation(() => { });
        try {
            await request(server, GET_UPDATE_STATUS_PATH, {
                host: 'evil.example.com',
            });
            await request(server, GET_UPDATE_STATUS_PATH, { auth: null });
            (0, vitest_1.expect)(warn).toHaveBeenCalledTimes(2);
            (0, vitest_1.expect)(warn.mock.calls[0][0]).toContain('unexpected Host header');
            (0, vitest_1.expect)(warn.mock.calls[0][0]).toContain('evil.example.com');
            (0, vitest_1.expect)(warn.mock.calls[1][0]).toContain('missing bearer token');
        }
        finally {
            warn.mockRestore();
        }
    });
    (0, vitest_1.it)('should serve the mapped status from GetUpdateStatus', async () => {
        const res = await client.getUpdateStatus({});
        (0, vitest_1.expect)(res.status).toMatchObject({
            currentVersion: '1.0.0',
            latestVersion: '1.2.0',
            updateAvailable: true,
        });
        (0, vitest_1.expect)(getUpdateStatus).toHaveBeenCalledTimes(1);
    });
    (0, vitest_1.it)('should support an async status provider', async () => {
        getUpdateStatus.mockResolvedValue({
            currentVersion: '2.0.0',
            latestVersion: '2.0.0',
            updateAvailable: false,
        });
        const res = await client.getUpdateStatus({});
        (0, vitest_1.expect)(res.status).toMatchObject({
            currentVersion: '2.0.0',
            latestVersion: '2.0.0',
            updateAvailable: false,
        });
    });
    (0, vitest_1.it)('should invoke the apply callback for ApplyUpdate', async () => {
        const res = await client.applyUpdate({});
        (0, vitest_1.expect)(applyUpdate).toHaveBeenCalledTimes(1);
        (0, vitest_1.expect)(res.accepted).toBe(true);
    });
    (0, vitest_1.it)('should report accepted: false when there is nothing to apply', async () => {
        applyUpdate.mockReturnValue(false);
        const res = await client.applyUpdate({});
        (0, vitest_1.expect)(res.accepted).toBe(false);
    });
    (0, vitest_1.it)('should not invoke the apply callback without a valid token', async () => {
        const res = await request(server, APPLY_UPDATE_PATH, { auth: null });
        (0, vitest_1.expect)(res.status).toBe(401);
        (0, vitest_1.expect)(applyUpdate).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('should return 404 for an unknown path', async () => {
        const res = await request(server, '/nope');
        (0, vitest_1.expect)(res.status).toBe(404);
    });
    (0, vitest_1.it)('should not serve a procedure over the wrong method', async () => {
        const res = await request(server, GET_UPDATE_STATUS_PATH, { method: 'GET' });
        (0, vitest_1.expect)(res.status).not.toBe(200);
        (0, vitest_1.expect)(getUpdateStatus).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('should fail the call when the status provider throws', async () => {
        getUpdateStatus.mockImplementation(() => {
            throw new Error('boom');
        });
        const err = await client.getUpdateStatus({}).then(() => undefined, (e) => e);
        (0, vitest_1.expect)(err).toBeInstanceOf(connect_1.ConnectError);
        (0, vitest_1.expect)(connect_1.ConnectError.from(err).code).toBe(connect_1.Code.Internal);
    });
    (0, vitest_1.it)('should stop serving after close()', async () => {
        await server.close();
        await (0, vitest_1.expect)(request(server, GET_UPDATE_STATUS_PATH)).rejects.toThrow();
    });
});
