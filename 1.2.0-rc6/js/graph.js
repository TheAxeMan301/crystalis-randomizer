import { Deque } from './util.js';
export const Edge = {
    of: (...nodes) => nodes.map(n => n.uid),
};
export class Node {
    constructor(graph, name) {
        this.graph = graph;
        this.name = name;
        this.uid = graph.nodes.length;
        graph.nodes.push(this);
    }
    get nodeType() {
        return 'Node';
    }
    toString() {
        return `${this.nodeType} ${this.name}`;
    }
    edges(opts) {
        return [];
    }
    write() { }
}
export class Graph {
    constructor(rom) {
        this.rom = rom;
        this.nodes = [];
    }
    traverse({ wanted, dfs = false } = {}) {
        const stack = new Deque();
        const seen = new Map();
        const g = new Map();
        for (const n of this.nodes) {
            for (const edge of n.edges()) {
                const label = edge.join(' ');
                for (let i = 1; i < edge.length; i++) {
                    const from = edge[i];
                    if (!g.has(from))
                        g.set(from, new Map());
                    g.get(from).set(label, edge);
                }
                if (edge.length === 1) {
                    const to = edge[0];
                    if (!seen.has(to)) {
                        stack.push(to);
                        seen.set(to, edge);
                    }
                }
            }
        }
        const want = new Set((wanted || this.nodes).map((n) => n instanceof Node ? n.uid : n));
        const empty = new Map();
        while (want.size && stack.length) {
            const n = dfs ? stack.pop() : stack.shift();
            want.delete(n);
            NEXT_EDGE: for (const edge of (g.get(n) || empty).values()) {
                const next = edge[0];
                if (seen.has(next))
                    continue;
                for (let i = 1; i < edge.length; i++) {
                    if (!seen.has(edge[i]))
                        continue NEXT_EDGE;
                }
                seen.set(next, edge);
                stack.push(next);
            }
        }
        return {
            path: [...seen.values()].map(([n, ...deps]) => {
                const str = (o) => [
                    this.nodes[o],
                ];
                return [n, [
                        ...str(n),
                        ' (',
                        deps.map(d => str(d).join('').replace(/\s+\(.*\)/, '')).join(', '),
                        ')',
                    ].join('')];
            }),
            seen,
            win: !want.size,
        };
    }
}
export class SparseDependencyGraph {
    constructor(size) {
        this.nodes = new Array(size).fill(0).map(() => new Map());
        this.finalized = new Array(size).fill(false);
    }
    addRoute(edge) {
        const target = edge[0];
        if (this.finalized[target]) {
            throw new Error(`Attempted to add a route for finalized node ${target}`);
        }
        let s = new Set();
        for (let i = edge.length - 1; i >= 1; i--)
            s.add(edge[i]);
        while (true) {
            let changed = false;
            for (const d of s) {
                if (d === target)
                    return [];
                if (this.finalized[d]) {
                    const repl = this.nodes[d];
                    if (!repl.size)
                        return [];
                    s.delete(d);
                    if (repl.size === 1) {
                        for (const dd of repl.values().next().value) {
                            s.add(dd);
                        }
                        changed = true;
                        break;
                    }
                    const routes = new Map();
                    for (const r of repl.values()) {
                        for (const r2 of this.addRoute([target, ...s, ...r])) {
                            routes.set(r2.label, r2);
                        }
                    }
                    return [...routes.values()];
                }
            }
            if (!changed)
                break;
        }
        const sorted = [...s].sort();
        s = new Set(sorted);
        const label = sorted.join(' ');
        const current = this.nodes[target];
        if (current.has(label))
            return [];
        for (const [l, d] of current) {
            if (containsAll(s, d))
                return [];
            if (containsAll(d, s))
                current.delete(l);
        }
        current.set(label, s);
        return [{ target, deps: s, label: `${target}:${label}` }];
    }
    finalize(node) {
        if (this.finalized[node])
            return;
        this.finalized[node] = true;
        for (let target = 0; target < this.nodes.length; target++) {
            const routes = this.nodes[target];
            if (!routes.size)
                continue;
            for (const [label, route] of routes) {
                if (route.has(node)) {
                    const removed = this.finalized[target];
                    this.finalized[target] = false;
                    routes.delete(label);
                    this.addRoute([target, ...route.values()]);
                    this.finalized[target] = removed;
                }
            }
        }
    }
}
const containsAll = (left, right) => {
    if (left.size < right.size)
        return false;
    for (const d of right) {
        if (!left.has(d))
            return false;
    }
    return true;
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ3JhcGguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvanMvZ3JhcGgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsT0FBTyxFQUFDLEtBQUssRUFBQyxNQUFNLFdBQVcsQ0FBQztBQU9oQyxNQUFNLENBQUMsTUFBTSxJQUFJLEdBQXFDO0lBQ3BELEVBQUUsRUFBRSxDQUFDLEdBQUcsS0FBSyxFQUFFLEVBQUUsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQztDQUN4QyxDQUFDO0FBR0YsTUFBTSxPQUFPLElBQUk7SUFJZixZQUFxQixLQUFZLEVBQVcsSUFBWTtRQUFuQyxVQUFLLEdBQUwsS0FBSyxDQUFPO1FBQVcsU0FBSSxHQUFKLElBQUksQ0FBUTtRQUN0RCxJQUFJLENBQUMsR0FBRyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsTUFBZ0IsQ0FBQztRQUN4QyxLQUFLLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN6QixDQUFDO0lBRUQsSUFBSSxRQUFRO1FBQ1YsT0FBTyxNQUFNLENBQUM7SUFDaEIsQ0FBQztJQUVELFFBQVE7UUFDTixPQUFPLEdBQUcsSUFBSSxDQUFDLFFBQVEsSUFBSSxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7SUFDekMsQ0FBQztJQUVELEtBQUssQ0FBQyxJQUFTO1FBQ2IsT0FBTyxFQUFFLENBQUM7SUFDWixDQUFDO0lBR0QsS0FBSyxLQUFJLENBQUM7Q0FDWDtBQUVELE1BQU0sT0FBTyxLQUFLO0lBSWhCLFlBQXFCLEdBQVM7UUFBVCxRQUFHLEdBQUgsR0FBRyxDQUFNO1FBRnJCLFVBQUssR0FBVyxFQUFFLENBQUM7SUFFSyxDQUFDO0lBSWxDLFFBQVEsQ0FBQyxFQUFDLE1BQU0sRUFBRSxHQUFHLEdBQUcsS0FBSyxLQUFzQyxFQUFFO1FBVW5FLE1BQU0sS0FBSyxHQUFHLElBQUksS0FBSyxF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Q0FBQyxDQUFDLENBQUM7WUFBRSxPQUFPLEtBQUssQ0FBQztLQUNoQztJQUNELE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtSb219IGZyb20gJy4vcm9tLmpzJztcbmltcG9ydCB7RGVxdWV9IGZyb20gJy4vdXRpbC5qcyc7XG5cbmRlY2xhcmUgY29uc3QgTk9ERV9JRDogdW5pcXVlIHN5bWJvbDtcblxuZXhwb3J0IHR5cGUgTm9kZUlkID0gbnVtYmVyICYge1tOT0RFX0lEXTogbmV2ZXJ9O1xuXG5leHBvcnQgdHlwZSBFZGdlID0gTm9kZUlkW107XG5leHBvcnQgY29uc3QgRWRnZToge29mOiAoLi4ubm9kZXM6IE5vZGVbXSkgPT4gRWRnZX0gPSB7XG4gIG9mOiAoLi4ubm9kZXMpID0+IG5vZGVzLm1hcChuID0+IG4udWlkKSxcbn07XG5cbi8vIFRPRE8gLSBjb25zaWRlciBwYXJhbWV0cml6aW5nIE5vZGUgYW5kIEdyYXBoP1xuZXhwb3J0IGNsYXNzIE5vZGUge1xuXG4gIHJlYWRvbmx5IHVpZDogTm9kZUlkO1xuXG4gIGNvbnN0cnVjdG9yKHJlYWRvbmx5IGdyYXBoOiBHcmFwaCwgcmVhZG9ubHkgbmFtZTogc3RyaW5nKSB7XG4gICAgdGhpcy51aWQgPSBncmFwaC5ub2Rlcy5sZW5ndGggYXMgTm9kZUlkO1xuICAgIGdyYXBoLm5vZGVzLnB1c2godGhpcyk7XG4gIH1cblxuICBnZXQgbm9kZVR5cGUoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gJ05vZGUnO1xuICB9XG5cbiAgdG9TdHJpbmcoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gYCR7dGhpcy5ub2RlVHlwZX0gJHt0aGlzLm5hbWV9YDtcbiAgfVxuXG4gIGVkZ2VzKG9wdHM/OiB7fSk6IEVkZ2VbXSB7XG4gICAgcmV0dXJuIFtdO1xuICB9XG5cbiAgLyoqIEBwYXJhbSByb20gVGhlIFBSRyByb20gaW1hZ2UuICovXG4gIHdyaXRlKCkge31cbn1cblxuZXhwb3J0IGNsYXNzIEdyYXBoIHtcblxuICByZWFkb25seSBub2RlczogTm9kZVtdID0gW107XG5cbiAgY29uc3RydWN0b3IocmVhZG9ubHkgcm9tPzogUm9tKSB7fVxuXG4gIC8vIFRPRE8gLSBvcHRpb25zIGZvciBkZXB0aCB2cyBicmVhZHRoIGZpcnN0P1xuICAvLyAgICAgIC0gcGFzcyB3YW50ZWQgbGlzdCBhcyBhIG5hbWVkIHBhcmFtP1xuICB0cmF2ZXJzZSh7d2FudGVkLCBkZnMgPSBmYWxzZX06IHt3YW50ZWQ/OiBOb2RlW10sIGRmcz86IGJvb2xlYW59ID0ge30pOiB7XG4gICAgcGF0aDogW05vZGVJZCwgc3RyaW5nXVtdLFxuICAgIHNlZW46IE1hcDxOb2RlSWQsIEVkZ2U+LFxuICAgIHdpbjogYm9vbGVhbixcbiAgfSB7XG4gICAgLy8gVHVybiB0aGlzIGludG8gYSBtb3N0bHktc3RhbmRhcmQgZGVwdGgtZmlyc3QgdHJhdmVyc2FsLlxuICAgIC8vIEJhc2ljYWxseSB3aGF0IHdlIGRvIGlzIGJ1aWxkIHVwIGEgbmV3IGdyYXBoIHdoZXJlIGVhY2ggZWRnZSBoYXMgYSBsaXN0XG4gICAgLy8gb2Ygb3RoZXIgbm9kZXMgdGhhdCBhbGwgbmVlZCB0byBiZSBzZWVuIGZpcnN0IHRvIHRha2UgaXQuXG5cbiAgICAvLyBNYXA8Tm9kZSwgTWFwPHN0cmluZywgQXJyYXk8Tm9kZT4+PlxuICAgIGNvbnN0IHN0YWNrID0gbmV3IERlcXVlPE5vZGVJZD4oKTsgLy8gVE9ETyBvcHRpb24gZm9yIEJGUyBvciBERlNcbiAgICBjb25zdCBzZWVuID0gbmV3IE1hcDxOb2RlSWQsIEVkZ2U+KCk7XG4gICAgY29uc3QgZyA9IG5ldyBNYXA8Tm9kZUlkLCBNYXA8c3RyaW5nLCBFZGdlPj4oKTtcblxuICAgIGZvciAoY29uc3QgbiBvZiB0aGlzLm5vZGVzKSB7XG4gICAgICBmb3IgKGNvbnN0IGVkZ2Ugb2Ygbi5lZGdlcygpKSB7XG4gICAgICAgIGNvbnN0IGxhYmVsID0gZWRnZS5qb2luKCcgJyk7XG4gICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDwgZWRnZS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGNvbnN0IGZyb20gPSBlZGdlW2ldO1xuICAgICAgICAgIGlmICghZy5oYXMoZnJvbSkpIGcuc2V0KGZyb20sIG5ldyBNYXAoKSk7XG4gICAgICAgICAgZy5nZXQoZnJvbSkhLnNldChsYWJlbCwgZWRnZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGVkZ2UubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgY29uc3QgdG8gPSBlZGdlWzBdO1xuICAgICAgICAgIGlmICghc2Vlbi5oYXModG8pKSB7XG4gICAgICAgICAgICBzdGFjay5wdXNoKHRvKTtcbiAgICAgICAgICAgIHNlZW4uc2V0KHRvLCBlZGdlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBXZSBub3cgaGF2ZSBhIGNvbXBsZXRlIGdyYXBoIHRoYXQgd2UgY2FuIGRvIGEgc2ltcGxlIERGUyBvbi5cbiAgICBjb25zdCB3YW50ID1cbiAgICAgICAgbmV3IFNldDxOb2RlSWQ+KCh3YW50ZWQgfHwgdGhpcy5ub2RlcykubWFwKChuOiBOb2RlIHwgTm9kZUlkKSA9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbiBpbnN0YW5jZW9mIE5vZGUgPyBuLnVpZCA6IG4pKTtcbiAgICBjb25zdCBlbXB0eSA9IG5ldyBNYXA8c3RyaW5nLCBFZGdlPigpO1xuXG4gICAgLy8gbG9vcCB1bnRpbCB3ZSBkb24ndCBtYWtlIGFueSBwcm9ncmVzc1xuICAgIHdoaWxlICh3YW50LnNpemUgJiYgc3RhY2subGVuZ3RoKSB7XG4gICAgICBjb25zdCBuID0gZGZzID8gc3RhY2sucG9wKCkhIDogc3RhY2suc2hpZnQoKSE7XG4gICAgICB3YW50LmRlbGV0ZShuKTtcbiAgICAgIE5FWFRfRURHRTpcbiAgICAgIGZvciAoY29uc3QgZWRnZSBvZiAoZy5nZXQobikgfHwgZW1wdHkpLnZhbHVlcygpKSB7XG4gICAgICAgIGNvbnN0IG5leHQgPSBlZGdlWzBdO1xuICAgICAgICBpZiAoc2Vlbi5oYXMobmV4dCkpIGNvbnRpbnVlO1xuICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8IGVkZ2UubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBpZiAoIXNlZW4uaGFzKGVkZ2VbaV0pKSBjb250aW51ZSBORVhUX0VER0U7XG4gICAgICAgIH1cbiAgICAgICAgc2Vlbi5zZXQobmV4dCwgZWRnZSk7XG4gICAgICAgIHN0YWNrLnB1c2gobmV4dCk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICBwYXRoOiBbLi4uc2Vlbi52YWx1ZXMoKV0ubWFwKChbbiwgLi4uZGVwc10pID0+IHtcbiAgICAgICAgY29uc3Qgc3RyID0gKG86IE5vZGVJZCkgPT4gW1xuICAgICAgICAgIC8vIG8gaW5zdGFuY2VvZiBMb2NhdGlvbiA/IG8uYXJlYS5uYW1lICsgJzogJyA6ICcnLFxuICAgICAgICAgIHRoaXMubm9kZXNbb10sXG4gICAgICAgICAgLy8gbyBpbnN0YW5jZW9mIFNsb3QgJiYgby5pbmRleCAhPSBvLmlkID9cbiAgICAgICAgICAvLyAgICAgJyAkJyArIG8uaW5kZXgudG9TdHJpbmcoMTYpIDogJycsXG4gICAgICAgIF07XG4gICAgICAgIHJldHVybiBbbiwgW1xuICAgICAgICAgIC4uLnN0cihuKSxcbiAgICAgICAgICAnICgnLFxuICAgICAgICAgIGRlcHMubWFwKGQgPT4gc3RyKGQpLmpvaW4oJycpLnJlcGxhY2UoL1xccytcXCguKlxcKS8sICcnKSkuam9pbignLCAnKSxcbiAgICAgICAgICAnKScsXG4gICAgICAgIF0uam9pbignJyldO1xuICAgICAgfSksXG4gICAgICBzZWVuLFxuICAgICAgd2luOiAhd2FudC5zaXplLFxuICAgIH07XG4gIH1cblxuICAvLyBIZXJlJ3MgdGhlIHRoaW5nLCBzbG90cyByZXF1aXJlIGl0ZW1zLlxuICAvLyBXZSBkb24ndCB3YW50IHRvIHRyYW5zaXRpdmVseSByZXF1aXJlIGRlcGVuZGVudCBzbG90cycgcmVxdWlyZW1lbnRzLFxuICAvLyBidXQgd2UgKmRvKiBuZWVkIHRvIHRyYW5zaXRpdmVseSByZXF1aXJlIGxvY2F0aW9uIHJlcXVpcmVtZW50cy5cblxuICAvLyBJIHRoaW5rIHdlIG5lZWQgdG8gZG8gdGhpcyB3aG9sZSB0aGluZyBhbGwgYXQgb25jZSwgYnV0IGNhbiB3ZSBqdXN0XG4gIC8vIGNvbXB1dGUgbG9jYXRpb24gcmVxdWlyZW1lbnRzIHNvbWVob3c/ICBBbmQgdHJpZ2dlciByZXF1aXJlbWVudHM/XG4gIC8vICAtIG9ubHkgY2FyZSBhYm91dCBkaXJlY3QgcmVxdWlyZW1lbnRzLCBub3RoaW5nIHRyYW5zaXRpdmUuXG4gIC8vIEJ1aWxkIHVwIGEgbWFwIG9mIG5vZGVzIHRvIHJlcXVpcmVtZW50cy4uLlxuXG4gIC8vIFdlIGhhdmUgYSBkaWNob3RvbXk6XG4gIC8vICAtIGl0ZW1zIGNhbiBCRSByZXF1aXJlbWVudHNcbiAgLy8gIC0gZXZlcnl0aGluZyBlbHNlIGNhbiBIQVZFIHJlcXVpcmVtZW50cywgaW5jbHVkaW5nIHNsb3RzXG4gIC8vICAtIG5vIGxpbmsgYmV0d2VlbiBzbG90IGFuZCBpdGVtXG5cbiAgLy8gVGhlIG5vZGUgZ3JhcGggY29udGFpbnMgdGhlIGxvY2F0aW9uIGdyYXBoLCB3aGljaCBoYXMgY3ljbGVzXG4gIC8vIFJlY3Vyc2l2ZSBtZXRob2RcblxufVxuXG5leHBvcnQgY2xhc3MgU3BhcnNlRGVwZW5kZW5jeUdyYXBoIHtcblxuICByZWFkb25seSBub2RlczogTWFwPHN0cmluZywgU2V0PE5vZGVJZD4+W107XG4gIHJlYWRvbmx5IGZpbmFsaXplZDogYm9vbGVhbltdO1xuXG4gIGNvbnN0cnVjdG9yKHNpemU6IG51bWJlcikge1xuICAgIHRoaXMubm9kZXMgPSBuZXcgQXJyYXkoc2l6ZSkuZmlsbCgwKS5tYXAoKCkgPT4gbmV3IE1hcCgpKTtcbiAgICB0aGlzLmZpbmFsaXplZCA9IG5ldyBBcnJheShzaXplKS5maWxsKGZhbHNlKTtcbiAgfVxuXG4gIC8vIEJlZm9yZSBhZGRpbmcgYSByb3V0ZSwgYW55IHRhcmdldCBpcyB1bnJlYWNoYWJsZVxuICAvLyBUbyBtYWtlIGEgdGFyZ2V0IGFsd2F5cyByZWFjaGFibGUsIGFkZCBhbiBlbXB0eSByb3V0ZVxuXG4gIGFkZFJvdXRlKGVkZ2U6IEVkZ2UpOiBTcGFyc2VSb3V0ZVtdIHtcbiAgICAvLyBjb25zb2xlLmVycm9yKGBhZGRSb3V0ZTogJHtlZGdlfWApO1xuICAgIGNvbnN0IHRhcmdldCA9IGVkZ2VbMF07XG4gICAgaWYgKHRoaXMuZmluYWxpemVkW3RhcmdldF0pIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgQXR0ZW1wdGVkIHRvIGFkZCBhIHJvdXRlIGZvciBmaW5hbGl6ZWQgbm9kZSAke3RhcmdldH1gKTtcbiAgICB9XG4gICAgLy8gTk9URTogaWYgYW55IGRlcHMgYXJlIGFscmVhZHkgaW50ZWdyYXRlZCBvdXQsIHJlcGxhY2UgdGhlbSByaWdodCBhd2F5XG4gICAgbGV0IHMgPSBuZXcgU2V0PE5vZGVJZD4oKTtcbiAgICBmb3IgKGxldCBpID0gZWRnZS5sZW5ndGggLSAxOyBpID49IDE7IGktLSkgcy5hZGQoZWRnZVtpXSk7XG4gICAgd2hpbGUgKHRydWUpIHtcbiAgICAgIGxldCBjaGFuZ2VkID0gZmFsc2U7XG4gICAgICBmb3IgKGNvbnN0IGQgb2Ygcykge1xuICAgICAgICBpZiAoZCA9PT0gdGFyZ2V0KSByZXR1cm4gW107XG4gICAgICAgIGlmICh0aGlzLmZpbmFsaXplZFtkXSkge1xuICAgICAgICAgIC8vIG5lZWQgdG8gcmVwbGFjZSBiZWZvcmUgYWRtaXR0aW5nLiAgbWF5IG5lZWQgdG8gYmUgcmVjdXJzaXZlLlxuICAgICAgICAgIGNvbnN0IC8qKiAhTWFwPHN0cmluZywgIVNldDxudW1iZXI+PiAqLyByZXBsID0gdGhpcy5ub2Rlc1tkXTtcbiAgICAgICAgICBpZiAoIXJlcGwuc2l6ZSkgcmV0dXJuIFtdO1xuICAgICAgICAgIHMuZGVsZXRlKGQpO1xuICAgICAgICAgIC8vIGlmIHRoZXJlJ3MgYSBzaW5nbGUgb3B0aW9uIHRoZW4ganVzdCBpbmxpbmUgaXQgZGlyZWN0bHlcbiAgICAgICAgICBpZiAocmVwbC5zaXplID09PSAxKSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGRkIG9mIHJlcGwudmFsdWVzKCkubmV4dCgpLnZhbHVlKSB7XG4gICAgICAgICAgICAgIHMuYWRkKGRkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNoYW5nZWQgPSB0cnVlO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIG90aGVyd2lzZSB3ZSBuZWVkIHRvIGJlIHJlY3Vyc2l2ZVxuICAgICAgICAgIGNvbnN0IHJvdXRlcyA9IG5ldyBNYXAoKTtcbiAgICAgICAgICBmb3IgKGNvbnN0IHIgb2YgcmVwbC52YWx1ZXMoKSkge1xuICAgICAgICAgICAgZm9yIChjb25zdCByMiBvZiB0aGlzLmFkZFJvdXRlKFt0YXJnZXQsIC4uLnMsIC4uLnJdKSkge1xuICAgICAgICAgICAgICByb3V0ZXMuc2V0KHIyLmxhYmVsLCByMik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBbLi4ucm91dGVzLnZhbHVlcygpXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKCFjaGFuZ2VkKSBicmVhaztcbiAgICB9XG4gICAgY29uc3Qgc29ydGVkID0gWy4uLnNdLnNvcnQoKTtcbiAgICBzID0gbmV3IFNldChzb3J0ZWQpO1xuICAgIGNvbnN0IGxhYmVsID0gc29ydGVkLmpvaW4oJyAnKTtcbiAgICBjb25zdCBjdXJyZW50ID0gdGhpcy5ub2Rlc1t0YXJnZXRdO1xuICAgIC8vIGNvbnNvbGUuZXJyb3IoYCR7dGFyZ2V0fTogJHtzb3J0ZWR9YCk7XG4gICAgaWYgKGN1cnJlbnQuaGFzKGxhYmVsKSkgcmV0dXJuIFtdO1xuICAgIGZvciAoY29uc3QgW2wsIGRdIG9mIGN1cnJlbnQpIHtcbiAgICAgIGlmIChjb250YWluc0FsbChzLCBkKSkgcmV0dXJuIFtdO1xuICAgICAgaWYgKGNvbnRhaW5zQWxsKGQsIHMpKSBjdXJyZW50LmRlbGV0ZShsKTtcbiAgICB9XG4gICAgLy8gY29uc29sZS5lcnJvcihgICA9PiBzZXRgKTtcbiAgICBjdXJyZW50LnNldChsYWJlbCwgcyk7XG4gICAgLy8gY29uc29sZS5lcnJvcihgICA9PiAke3RhcmdldH06ICR7Wy4uLmN1cnJlbnQua2V5cygpXS5tYXAoeD0+YCgke3h9KWApfWApO1xuICAgIHJldHVybiBbe3RhcmdldCwgZGVwczogcywgbGFiZWw6IGAke3RhcmdldH06JHtsYWJlbH1gfV07XG4gIH1cblxuICBmaW5hbGl6ZShub2RlOiBOb2RlSWQpIHtcbiAgICAvLyBjb25zdCBQUiA9IG5vZGUgPT09IDMwMTtcbiAgICBpZiAodGhpcy5maW5hbGl6ZWRbbm9kZV0pIHJldHVybjtcbiAgICAvLyBwdWxsIHRoZSBrZXksIHJlbW92ZSBpdCBmcm9tICphbGwqIG90aGVyIG5vZGVzXG4gICAgdGhpcy5maW5hbGl6ZWRbbm9kZV0gPSB0cnVlO1xuICAgIGZvciAobGV0IHRhcmdldCA9IDAgYXMgTm9kZUlkOyB0YXJnZXQgPCB0aGlzLm5vZGVzLmxlbmd0aDsgdGFyZ2V0KyspIHtcbiAgICAgIGNvbnN0IHJvdXRlczogTWFwPHN0cmluZywgU2V0PE5vZGVJZD4+ID0gdGhpcy5ub2Rlc1t0YXJnZXRdO1xuICAgICAgLy8gaWYoUFIpY29uc29sZS5sb2coYGZpbmFsaXppbmcgJHtub2RlfTogdGFyZ2V0PSR7dGFyZ2V0fSAke1xuICAgICAgLy8gICAgICAgICAgICAgICAgICAgIFsuLi5yb3V0ZXMua2V5cygpXS5tYXAoeD0+YCgke3h9KWApfWApO1xuICAgICAgaWYgKCFyb3V0ZXMuc2l6ZSkgY29udGludWU7XG4gICAgICBmb3IgKGNvbnN0IFtsYWJlbCwgcm91dGVdIG9mIHJvdXRlcykge1xuICAgICAgICAvLyBzdWJzdGl0dXRlLi4uIChyZXVzaW5nIHRoZSBjb2RlIGluIGFkZFJvdXRlKVxuICAgICAgICBpZiAocm91dGUuaGFzKG5vZGUpKSB7XG4gICAgICAgICAgY29uc3QgcmVtb3ZlZCA9IHRoaXMuZmluYWxpemVkW3RhcmdldF07XG4gICAgICAgICAgdGhpcy5maW5hbGl6ZWRbdGFyZ2V0XSA9IGZhbHNlO1xuICAgICAgICAgIHJvdXRlcy5kZWxldGUobGFiZWwpO1xuICAgICAgICAgIHRoaXMuYWRkUm91dGUoW3RhcmdldCwgLi4ucm91dGUudmFsdWVzKCldKTtcbiAgICAgICAgICB0aGlzLmZpbmFsaXplZFt0YXJnZXRdID0gcmVtb3ZlZDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICAvLyBjb25zb2xlLmVycm9yKGBmaW5hbGl6ZWQgJHtub2RlfTogJHtbLi4udGhpcy5ub2Rlc1tub2RlXS52YWx1ZXMoKV1cbiAgICAvLyAgICAgICAgICAgICAgICAgICAgLm1hcChhID0+IFsuLi5hXS5qb2luKCcmJykpLmpvaW4oJyB8ICcpfWApO1xuICB9XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgU3BhcnNlUm91dGUge1xuICByZWFkb25seSB0YXJnZXQ6IE5vZGVJZDtcbiAgcmVhZG9ubHkgZGVwczogU2V0PE5vZGVJZD47XG4gIHJlYWRvbmx5IGxhYmVsOiBzdHJpbmc7XG59XG5cbmNvbnN0IGNvbnRhaW5zQWxsID0gPFQ+KGxlZnQ6IFNldDxUPiwgcmlnaHQ6IFNldDxUPik6IGJvb2xlYW4gPT4ge1xuICBpZiAobGVmdC5zaXplIDwgcmlnaHQuc2l6ZSkgcmV0dXJuIGZhbHNlO1xuICBmb3IgKGNvbnN0IGQgb2YgcmlnaHQpIHtcbiAgICBpZiAoIWxlZnQuaGFzKGQpKSByZXR1cm4gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59O1xuIl19