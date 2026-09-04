/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { DevTools } from '../third_party/index.js';
import { stableIdSymbol } from '../utils/id.js';
export function isNodeLike(item) {
    return (typeof item === 'object' && item !== null && 'id' in item && 'name' in item);
}
export function isEdgeLike(item) {
    return (typeof item === 'object' &&
        item !== null &&
        'name' in item &&
        'node' in item &&
        'type' in item &&
        typeof item.node === 'object' &&
        item.node !== null &&
        'id' in item.node &&
        'name' in item.node);
}
export class HeapSnapshotFormatter {
    #aggregates;
    constructor(aggregates) {
        this.#aggregates = aggregates;
    }
    static formatNodes(items) {
        const lines = [];
        if (items.length > 0) {
            const firstItem = items[0];
            if (isNodeLike(firstItem)) {
                lines.push('nodeId,nodeName,type,distance,selfSize,retainedSize');
            }
            else if (isEdgeLike(firstItem)) {
                lines.push('name,type,nodeId,nodeName');
            }
        }
        for (const item of items) {
            if (isNodeLike(item)) {
                lines.push(`${item.id},${item.name},${item.type},${item.distance},${DevTools.I18n.ByteUtilities.formatBytesToKb(item.selfSize)},${DevTools.I18n.ByteUtilities.formatBytesToKb(item.retainedSize)}`);
            }
            else if (isEdgeLike(item)) {
                lines.push(`${item.name},${item.type},${item.node.id},${item.node.name}`);
            }
        }
        return lines.join('\n');
    }
    #getSortedAggregates() {
        return Object.values(this.#aggregates).sort((a, b) => b.maxRet - a.maxRet);
    }
    toString() {
        const sorted = this.#getSortedAggregates();
        const lines = [];
        lines.push('id,name,count,selfSize,maxRetainedSize');
        for (const info of sorted) {
            const id = info[stableIdSymbol] ?? '';
            lines.push(`${id},${info.name},${info.count},${DevTools.I18n.ByteUtilities.formatBytesToKb(info.self)},${DevTools.I18n.ByteUtilities.formatBytesToKb(info.maxRet)}`);
        }
        return lines.join('\n');
    }
    toJSON() {
        const sorted = this.#getSortedAggregates();
        return sorted.map(info => ({
            id: info[stableIdSymbol],
            className: info.name,
            count: info.count,
            selfSize: DevTools.I18n.ByteUtilities.formatBytesToKb(info.self),
            retainedSize: DevTools.I18n.ByteUtilities.formatBytesToKb(info.maxRet),
        }));
    }
    static sort(aggregates) {
        return Object.entries(aggregates).sort((a, b) => b[1].maxRet - a[1].maxRet);
    }
}
//# sourceMappingURL=HeapSnapshotFormatter.js.map