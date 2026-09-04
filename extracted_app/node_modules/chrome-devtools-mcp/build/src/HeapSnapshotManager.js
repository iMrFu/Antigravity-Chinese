/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import fsSync from 'node:fs';
import path from 'node:path';
import { isNodeLike } from './formatters/HeapSnapshotFormatter.js';
import { DevTools } from './third_party/index.js';
import { createIdGenerator, stableIdSymbol, } from './utils/id.js';
export class HeapSnapshotManager {
    #snapshots = new Map();
    async getSnapshot(filePath) {
        const absolutePath = path.resolve(filePath);
        const cached = this.#snapshots.get(absolutePath);
        if (cached) {
            return cached.snapshot;
        }
        const { snapshot, worker } = await this.#loadSnapshot(absolutePath);
        this.#snapshots.set(absolutePath, {
            snapshot,
            worker,
            idToClassKey: new Map(),
            classKeyToId: new Map(),
            idGenerator: createIdGenerator(),
        });
        return snapshot;
    }
    async getAggregates(filePath) {
        const snapshot = await this.getSnapshot(filePath);
        const filter = new DevTools.HeapSnapshotModel.HeapSnapshotModel.NodeFilter();
        const aggregates = await snapshot.aggregatesWithFilter(filter);
        for (const key of Object.keys(aggregates)) {
            const id = await this.getOrCreateIdForClassKey(filePath, key);
            const aggregate = aggregates[key];
            if (aggregate) {
                aggregate[stableIdSymbol] = id;
            }
        }
        return aggregates;
    }
    async getStats(filePath) {
        const snapshot = await this.getSnapshot(filePath);
        return await snapshot.getStatistics();
    }
    async getStaticData(filePath) {
        const snapshot = await this.getSnapshot(filePath);
        return snapshot.staticData;
    }
    async getOrCreateIdForClassKey(filePath, classKey) {
        const cached = this.#getCachedSnapshot(filePath);
        let id = cached.classKeyToId.get(classKey);
        if (!id) {
            id = cached.idGenerator();
            cached.classKeyToId.set(classKey, id);
            cached.idToClassKey.set(id, classKey);
        }
        return id;
    }
    async getNodesById(filePath, id) {
        const snapshot = await this.getSnapshot(filePath);
        const filter = new DevTools.HeapSnapshotModel.HeapSnapshotModel.NodeFilter();
        const className = await this.resolveClassKeyFromId(filePath, id);
        if (!className) {
            throw new Error(`Class with ID ${id} not found in heap snapshot`);
        }
        const provider = snapshot.createNodesProviderForClass(className, filter);
        return await provider.serializeItemsRange(0, Infinity);
    }
    async findNodeIndexById(filePath, nodeId) {
        const snapshot = await this.getSnapshot(filePath);
        const aggregates = await this.getAggregates(filePath);
        const filter = new DevTools.HeapSnapshotModel.HeapSnapshotModel.NodeFilter();
        for (const classKey of Object.keys(aggregates)) {
            const provider = snapshot.createNodesProviderForClass(classKey, filter);
            const range = await provider.serializeItemsRange(0, Infinity);
            for (const item of range.items) {
                if (isNodeLike(item) && item.id === nodeId) {
                    return item.nodeIndex;
                }
            }
        }
        return undefined;
    }
    async getRetainers(filePath, nodeId) {
        const nodeIndex = await this.findNodeIndexById(filePath, nodeId);
        if (nodeIndex === undefined) {
            throw new Error(`Node with ID ${nodeId} not found`);
        }
        const snapshot = await this.getSnapshot(filePath);
        const provider = snapshot.createRetainingEdgesProvider(nodeIndex);
        return await provider.serializeItemsRange(0, Infinity);
    }
    #getCachedSnapshot(filePath) {
        const absolutePath = path.resolve(filePath);
        const cached = this.#snapshots.get(absolutePath);
        if (!cached) {
            throw new Error(`Snapshot not loaded for ${filePath}`);
        }
        return cached;
    }
    async resolveClassKeyFromId(filePath, id) {
        const cached = this.#getCachedSnapshot(filePath);
        return cached.idToClassKey.get(id);
    }
    async #loadSnapshot(absolutePath) {
        const workerProxy = new DevTools.HeapSnapshotModel.HeapSnapshotProxy.HeapSnapshotWorkerProxy(() => {
            /* noop */
        }, import.meta.resolve('./third_party/devtools-heap-snapshot-worker.js'));
        const { promise: snapshotPromise, resolve: resolveSnapshot } = Promise.withResolvers();
        const loaderProxy = workerProxy.createLoader(1, snapshotProxy => {
            resolveSnapshot(snapshotProxy);
        });
        const fileStream = fsSync.createReadStream(absolutePath, {
            encoding: 'utf-8',
            highWaterMark: 1024 * 1024,
        });
        for await (const chunk of fileStream) {
            await loaderProxy.write(chunk);
        }
        await loaderProxy.close();
        const snapshot = await snapshotPromise;
        return { snapshot, worker: workerProxy };
    }
    dispose(filePath) {
        const absolutePath = path.resolve(filePath);
        const cached = this.#snapshots.get(absolutePath);
        if (cached) {
            cached.worker.dispose();
            this.#snapshots.delete(absolutePath);
        }
    }
}
//# sourceMappingURL=HeapSnapshotManager.js.map