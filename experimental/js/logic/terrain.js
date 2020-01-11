import { DefaultMap, iters } from '../util.js';
import { Requirement } from './requirement.js';
export class Terrains {
    constructor(rom) {
        this.rom = rom;
        this.tiles = new DefaultMap((effects) => makeTile(this.rom, effects));
        this.bosses = new DefaultMap((flag) => new BossTerrain(flag));
        this.statues = new Map();
        this.flags = new DefaultMap((base) => new DefaultMap((flag) => new DefaultMap((alt) => new FlagTerrain(base, flag, alt))));
        this.meets = new DefaultMap((left) => new DefaultMap((right) => new MeetTerrain(left, right)));
        this._seamless = new DefaultMap((t) => new SeamlessTerrain(t));
    }
    tile(effects) {
        return effects & 0x04 ? undefined : this.tiles.get(effects);
    }
    boss(flag) {
        return this.bosses.get(flag);
    }
    statue(req) {
        const label = Requirement.label(req);
        let terrain = this.statues.get(label);
        if (!terrain)
            this.statues.set(label, terrain = new StatueTerrain(req));
        return terrain;
    }
    flag(base, flag, alt) {
        if (!base)
            base = CLOSED;
        return this.flags.get(base).get(flag).get(alt);
    }
    meet(left, right) {
        return this.meets.get(left).get(right);
    }
    seamless(delegate) {
        return this._seamless.get(delegate);
    }
    label(terrain, rom) {
        if (terrain.label)
            return terrain.label(rom);
        return 'Terrain';
    }
}
export var Terrain;
(function (Terrain) {
    Terrain.FLY = 0x02;
    Terrain.BLOCKED = 0x04;
    Terrain.SLOPE = 0x20;
    Terrain.BITS = 0x26;
    Terrain.SWAMP = 0x100;
    Terrain.BARRIER = 0x200;
    Terrain.SLOPE8 = 0x400;
    Terrain.SLOPE9 = 0x800;
    Terrain.DOLPHIN = 0x1000;
    function label(t, rom) {
        var _a, _b, _c;
        return _c = (_b = (_a = t).label) === null || _b === void 0 ? void 0 : _b.call(_a, rom), (_c !== null && _c !== void 0 ? _c : 'Terrain');
    }
    Terrain.label = label;
})(Terrain || (Terrain = {}));
class SeamlessTerrain {
    constructor(_delegate) {
        this._delegate = _delegate;
        this.enter = _delegate.enter;
        this.exit = _delegate.exit;
    }
    label(rom) {
        return `Seamless(${Terrain.label(this._delegate, rom)})`;
    }
}
class SimpleTerrain {
    constructor(enter, exit = Requirement.OPEN) {
        this.enter = enter;
        this.exit = [[0xf, exit]];
    }
    get kind() { return 'Simple'; }
    label(rom) {
        const terr = [];
        if (!Requirement.isOpen(this.enter)) {
            terr.push(`enter = ${debugLabel(this.enter, rom)}`);
        }
        if (!Requirement.isOpen(this.exit[0][1])) {
            terr.push(`exit = ${debugLabel(this.exit[0][1], rom)}`);
        }
        return `${this.kind}(${terr.join(', ')})`;
    }
}
class SouthTerrain {
    constructor(enter, exit) {
        this.enter = enter;
        this.exit =
            exit ?
                [[0xb, exit], [0x4, Requirement.OPEN]] :
                [[0xf, Requirement.OPEN]];
    }
    get kind() { return 'South'; }
    label(rom) {
        if (this.exit.length === 1) {
            return SimpleTerrain.prototype.label.call(this, rom);
        }
        const terr = [];
        if (!Requirement.isOpen(this.enter)) {
            terr.push(`enter = ${debugLabel(this.enter, rom)}`);
        }
        if (!Requirement.isOpen(this.exit[0][1])) {
            terr.push(`other = ${debugLabel(this.exit[0][1], rom)}`);
        }
        if (!Requirement.isOpen(this.exit[1][1])) {
            terr.push(`south = ${debugLabel(this.exit[1][1], rom)}`);
        }
        return `${this.kind}(${terr.join(', ')})`;
    }
}
function makeTile(rom, effects) {
    let enter = Requirement.OPEN;
    let exit = undefined;
    if ((effects & Terrain.DOLPHIN) && (effects & Terrain.FLY)) {
        if (effects & Terrain.SLOPE) {
            exit = rom.flags.ClimbWaterfall.r;
        }
        enter = [[rom.flags.CurrentlyRidingDolphin.c], [rom.flags.Flight.c]];
    }
    else {
        if (effects & Terrain.SLOPE9) {
            exit = rom.flags.ClimbSlope9.r;
        }
        else if (effects & Terrain.SLOPE8) {
            exit = rom.flags.ClimbSlope8.r;
        }
        else if (effects & Terrain.SLOPE) {
            exit = rom.flags.Flight.r;
        }
        if (effects & Terrain.FLY)
            enter = rom.flags.Flight.r;
    }
    if (effects & Terrain.SWAMP) {
        enter = enter.map((cs) => [rom.flags.TravelSwamp.c, ...cs]);
    }
    if (effects & Terrain.BARRIER) {
        enter = enter.map((cs) => [rom.flags.ShootingStatue.c, ...cs]);
    }
    return new SouthTerrain(enter, exit);
}
class BossTerrain extends SimpleTerrain {
    constructor(_flag) {
        super(Requirement.OPEN, [[_flag]]);
        this._flag = _flag;
    }
    get kind() { return 'Boss'; }
}
class StatueTerrain extends SouthTerrain {
    constructor(_req) {
        super(Requirement.OPEN, _req);
        this._req = _req;
    }
    get kind() { return 'Statue'; }
}
class FlagTerrain extends SimpleTerrain {
    constructor(base, flag, alt) {
        if (base.exit.length !== 1 || alt.exit.length !== 1) {
            throw new Error('bad flag');
        }
        const f = [[flag]];
        const enter = flag >= 0 ? Requirement.meet(alt.enter, f) : alt.enter;
        const exit = flag >= 0 ? Requirement.meet(alt.exit[0][1], f) : alt.exit[0][1];
        super(Requirement.or(base.enter, enter), Requirement.or(base.exit[0][1], exit));
    }
    get kind() { return 'Flag'; }
}
const CLOSED = new SimpleTerrain(Requirement.CLOSED, Requirement.CLOSED);
function directionIndex(t) {
    const ind = [];
    for (let i = 0; i < t.exit.length; i++) {
        for (let b = 0; b < 4; b++) {
            if (t.exit[i][0] & (1 << b))
                ind[b] = i;
        }
    }
    for (let b = 0; b < 4; b++) {
        if (ind[b] == null) {
            throw new Error(`Bad terrain: ${t.exit.map(e => e[0]).join(',')}`);
        }
    }
    return ind;
}
class MeetTerrain {
    constructor(left, right) {
        this.left = left;
        this.right = right;
        const leftInd = directionIndex(left);
        const rightInd = directionIndex(right);
        const sources = new Set();
        const exit = [];
        for (let i = 0; i < 4; i++) {
            sources.add(leftInd[i] << 2 | rightInd[i]);
        }
        for (const source of sources) {
            const [d0, r0] = left.exit[source >> 2];
            const [d1, r1] = right.exit[source & 3];
            exit.push([d0 & d1, Requirement.meet(r0, r1)]);
        }
        this.enter = Requirement.meet(left.enter, right.enter);
        this.exit = exit;
    }
    get kind() { return 'Terrain'; }
    label(rom) {
        if (this.exit.length === 1) {
            return SimpleTerrain.prototype.label.call(this, rom);
        }
        const terr = [];
        if (!Requirement.isOpen(this.enter)) {
            terr.push(`enter = ${debugLabel(this.enter, rom)}`);
        }
        for (const [dirs, req] of this.exit) {
            const dirstring = [dirs & 1 ? 'N' : '', dirs & 2 ? 'W' : '',
                dirs & 4 ? 'S' : '', dirs & 8 ? 'E' : ''].join('');
            terr.push(`exit${dirstring} = ${debugLabel(req, rom)}`);
        }
        return `${this.kind}(${terr.join(', ')})`;
    }
}
export function debugLabel(r, rom) {
    const css = [...r];
    const s = css.map(cs => iters.isEmpty(cs) ? 'open' :
        [...cs].map((c) => { var _a; return (_a = rom.flags[c]) === null || _a === void 0 ? void 0 : _a.debug; }).join(' & '))
        .join(') | (');
    return css.length > 1 ? `(${s})` : css.length ? s : 'never';
}
Terrain.debugLabel = debugLabel;
if (typeof window === 'object')
    window.debugLabel = debugLabel;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVycmFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9qcy9sb2dpYy90ZXJyYWluLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBLE9BQU8sRUFBQyxVQUFVLEVBQUUsS0FBSyxFQUFDLE1BQU0sWUFBWSxDQUFDO0FBQzdDLE9BQU8sRUFBWSxXQUFXLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUV4RCxNQUFNLE9BQU8sUUFBUTtJQXNCbkIsWUFBcUIsR0FBUTtRQUFSLFFBQUcsR0FBSCxHQUFHLENBQUs7UUFsQlosVUFBSyxHQUNsQixJQUFJLFVBQVUsQ0FDVixDQUFDLE9BQWUsRUFBRSxFQUFFLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQztRQUN6QyxXQUFNLEdBQ25CLElBQUksVUFBVSxDQUFrQixDQUFDLElBQVksRUFBRSxFQUFFLENBQUMsSUFBSSxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUM1RCxZQUFPLEdBQUcsSUFBSSxHQUFHLEVBQW1CLENBQUM7UUFDckMsVUFBSyxHQUNsQixJQUFJLFVBQVUsQ0FDVixDQUFDLElBQWEsRUFBRSxFQUFFLENBQUMsSUFBSSxVQUFVLENBQzdCLENBQUMsSUFBWSxFQUFFLEVBQUUsQ0FBQyxJQUFJLFVBQVUsQ0FDNUIsQ0FBQyxHQUFZLEVBQUUsRUFBRSxDQUFDLElBQUksV0FBVyxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDckQsVUFBSyxHQUNsQixJQUFJLFVBQVUsQ0FDVixDQUFDLElBQWEsRUFBRSxFQUFFLENBQUMsSUFBSSxVQUFVLENBQzdCLENBQUMsS0FBYyxFQUFFLEVBQUUsQ0FBQyxJQUFJLFdBQVcsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzlDLGNBQVMsR0FDdEIsSUFBSSxVQUFVLENBQW1CLENB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QUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLDBDQUFFLEtBQUssR0FBQSxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1NBQ3BFLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUNuQixPQUFPLEdBQUcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQztBQUM5RCxDQUFDO0FBRUEsT0FBZSxDQUFDLFVBQVUsR0FBRyxVQUFVLENBQUM7QUFDekMsSUFBSSxPQUFPLE1BQU0sS0FBSyxRQUFRO0lBQUcsTUFBYyxDQUFDLFVBQVUsR0FBRyxVQUFVLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1JvbX0gZnJvbSAnLi4vcm9tLmpzJztcbmltcG9ydCB7RGVmYXVsdE1hcCwgaXRlcnN9IGZyb20gJy4uL3V0aWwuanMnO1xuaW1wb3J0IHtDb25kaXRpb24sIFJlcXVpcmVtZW50fSBmcm9tICcuL3JlcXVpcmVtZW50LmpzJztcblxuZXhwb3J0IGNsYXNzIFRlcnJhaW5zIHtcblxuICAvLyBBZ2dyZXNzaXZlIG1lbW9pemF0aW9uIHByZXZlbnRzIGluc3RhbnRpYXRpbmcgdGhlIHNhbWUgdGVycmFpbiB0d2ljZS5cbiAgLy8gVGhpcyBhbGxvd3MgcmVmZXJlbmNlIGVxdWFsaXR5IHRvIHRlbGwgd2hlbiB0d28gdGVycmFpbnMgYXJlIHRoZSBzYW1lLlxuICBwcml2YXRlIHJlYWRvbmx5IHRpbGVzID1cbiAgICAgIG5ldyBEZWZhdWx0TWFwPG51bWJlciwgVGVycmFpbj4oXG4gICAgICAgICAgKGVmZmVjdHM6IG51bWJlcikgPT4gbWFrZVRpbGUodGhpcy5yb20sIGVmZmVjdHMpKTtcbiAgcHJpdmF0ZSByZWFkb25seSBib3NzZXMgPVxuICAgICAgbmV3IERlZmF1bHRNYXA8bnVtYmVyLCBUZXJyYWluPigoZmxhZzogbnVtYmVyKSA9PiBuZXcgQm9zc1RlcnJhaW4oZmxhZykpO1xuICBwcml2YXRlIHJlYWRvbmx5IHN0YXR1ZXMgPSBuZXcgTWFwPHN0cmluZywgVGVycmFpbj4oKTtcbiAgcHJpdmF0ZSByZWFkb25seSBmbGFncyA9XG4gICAgICBuZXcgRGVmYXVsdE1hcDxUZXJyYWluLCBEZWZhdWx0TWFwPG51bWJlciwgRGVmYXVsdE1hcDxUZXJyYWluLCBUZXJyYWluPj4+KFxuICAgICAgICAgIChiYXNlOiBUZXJyYWluKSA9PiBuZXcgRGVmYXVsdE1hcChcbiAgICAgICAgICAgICAgKGZsYWc6IG51bWJlcikgPT4gbmV3IERlZmF1bHRNYXAoXG4gICAgICAgICAgICAgICAgICAoYWx0OiBUZXJyYWluKSA9PiBuZXcgRmxhZ1RlcnJhaW4oYmFzZSwgZmxhZywgYWx0KSkpKTtcbiAgcHJpdmF0ZSByZWFkb25seSBtZWV0cyA9XG4gICAgICBuZXcgRGVmYXVsdE1hcDxUZXJyYWluLCBEZWZhdWx0TWFwPFRlcnJhaW4sIFRlcnJhaW4+PihcbiAgICAgICAgICAobGVmdDogVGVycmFpbikgPT4gbmV3IERlZmF1bHRNYXAoXG4gICAgICAgICAgICAgIChyaWdodDogVGVycmFpbikgPT4gbmV3IE1lZXRUZXJyYWluKGxlZnQsIHJpZ2h0KSkpO1xuICBwcml2YXRlIHJlYWRvbmx5IF9zZWFtbGVzcyA9XG4gICAgICBuZXcgRGVmYXVsdE1hcDxUZXJyYWluLCBUZXJyYWluPigodDogVGVycmFpbikgPT4gbmV3IFNlYW1sZXNzVGVycmFpbih0KSk7XG5cbiAgY29uc3RydWN0b3IocmVhZG9ubHkgcm9tOiBSb20pIHt9XG5cbiAgdGlsZShlZmZlY3RzOiBudW1iZXIpOiBUZXJyYWlufHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIGVmZmVjdHMgJiAweDA0ID8gdW5kZWZpbmVkIDogdGhpcy50aWxlcy5nZXQoZWZmZWN0cyk7XG4gIH1cblxuICBib3NzKGZsYWc6IG51bWJlcik6IFRlcnJhaW4ge1xuICAgIHJldHVybiB0aGlzLmJvc3Nlcy5nZXQoZmxhZyk7XG4gIH1cblxuICAvLyBOT1RFOiBhbHNvIHVzZWQgZm9yIHRyaWdnZXJzXG4gIHN0YXR1ZShyZXE6IFJlcXVpcmVtZW50LkZyb3plbik6IFRlcnJhaW4ge1xuICAgIGNvbnN0IGxhYmVsID0gUmVxdWlyZW1lbnQubGFiZWwocmVxKTtcbiAgICBsZXQgdGVycmFpbiA9IHRoaXMuc3RhdHVlcy5nZXQobGFiZWwpO1xuICAgIGlmICghdGVycmFpbikgdGhpcy5zdGF0dWVzLnNldChsYWJlbCwgdGVycmFpbiA9IG5ldyBTdGF0dWVUZXJyYWluKHJlcSkpO1xuICAgIHJldHVybiB0ZXJyYWluITtcbiAgfVxuXG4gIGZsYWcoYmFzZTogVGVycmFpbnx1bmRlZmluZWQsIGZsYWc6IG51bWJlciwgYWx0OiBUZXJyYWluKTogVGVycmFpbiB7XG4gICAgaWYgKCFiYXNlKSBiYXNlID0gQ0xPU0VEO1xuICAgIHJldHVybiB0aGlzLmZsYWdzLmdldChiYXNlKS5nZXQoZmxhZykuZ2V0KGFsdCk7XG4gIH1cblxuICBtZWV0KGxlZnQ6IFRlcnJhaW4sIHJpZ2h0OiBUZXJyYWluKTogVGVycmFpbiB7XG4gICAgLy8gVE9ETyAtIG1lbW9pemUgcHJvcGVybHk/ICBvbmx5IGFsbG93IHR3bz9cbiAgICByZXR1cm4gdGhpcy5tZWV0cy5nZXQobGVmdCkuZ2V0KHJpZ2h0KTtcbiAgfVxuXG4gIHNlYW1sZXNzKGRlbGVnYXRlOiBUZXJyYWluKSB7XG4gICAgcmV0dXJuIHRoaXMuX3NlYW1sZXNzLmdldChkZWxlZ2F0ZSk7XG4gIH1cblxuICBsYWJlbCh0ZXJyYWluOiBUZXJyYWluLCByb206IFJvbSkge1xuICAgIGlmICh0ZXJyYWluLmxhYmVsKSByZXR1cm4gdGVycmFpbi5sYWJlbChyb20pO1xuICAgIHJldHVybiAnVGVycmFpbic7XG4gIH1cbn1cblxudHlwZSBEaXJNYXNrID0gbnVtYmVyO1xuLy8gTk9URTogbWlzc2luZyBkaXJlY3Rpb25zIGFyZSBmb3JiaWRkZW4uXG50eXBlIEV4aXRSZXF1aXJlbWVudHMgPSBSZWFkb25seUFycmF5PHJlYWRvbmx5IFtEaXJNYXNrLCBSZXF1aXJlbWVudC5Gcm96ZW5dPjtcbmV4cG9ydCBpbnRlcmZhY2UgVGVycmFpbiB7XG4gIGVudGVyOiBSZXF1aXJlbWVudC5Gcm96ZW47XG4gIGV4aXQ6IEV4aXRSZXF1aXJlbWVudHM7XG4gIGxhYmVsPzogKHJvbTogUm9tKSA9PiBzdHJpbmc7XG59XG5cbmV4cG9ydCBuYW1lc3BhY2UgVGVycmFpbiB7XG4gIC8vIEJ1aWx0LWluIHRlcnJhaW4gYml0c1xuICAvLyAweDAxID0+IHBpdFxuICBleHBvcnQgY29uc3QgRkxZID0gMHgwMjtcbiAgZXhwb3J0IGNvbnN0IEJMT0NLRUQgPSAweDA0O1xuICAvLyAweDA4ID0+IGZsYWcgYWx0ZXJuYXRlXG4gIC8vIDB4MTAgPT4gYmVoaW5kXG4gIGV4cG9ydCBjb25zdCBTTE9QRSA9IDB4MjA7XG4gIC8vIDB4NDAgPT4gc2xvd1xuICAvLyAweDgwID0+IHBhaW5cbiAgZXhwb3J0IGNvbnN0IEJJVFMgPSAweDI2O1xuXG4gIC8vIEN1c3RvbSB0ZXJyYWluIGJpdHNcbiAgZXhwb3J0IGNvbnN0IFNXQU1QID0gMHgxMDA7XG4gIGV4cG9ydCBjb25zdCBCQVJSSUVSID0gMHgyMDA7IC8vIHNob290aW5nIHN0YXR1ZXNcbiAgLy8gc2xvcGUgMC4uNSA9PiBubyByZXF1aXJlbWVudHNcbiAgZXhwb3J0IGNvbnN0IFNMT1BFOCA9IDB4NDAwOyAvLyBzbG9wZSA2Li44XG4gIGV4cG9ydCBjb25zdCBTTE9QRTkgPSAweDgwMDsgLy8gc2xvcHQgOVxuICAvLyBzbG9wZSAxMCsgPT4gZmxpZ2h0IG9ubHlcbiAgZXhwb3J0IGNvbnN0IERPTFBISU4gPSAweDEwMDA7XG5cbiAgZXhwb3J0IGZ1bmN0aW9uIGxhYmVsKHQ6IFRlcnJhaW4sIHJvbTogUm9tKSB7XG4gICAgcmV0dXJuIHQubGFiZWw/Lihyb20pID8/ICdUZXJyYWluJztcbiAgfVxufVxuXG5jbGFzcyBTZWFtbGVzc1RlcnJhaW4gaW1wbGVtZW50cyBUZXJyYWluIHtcbiAgcmVhZG9ubHkgZW50ZXI6IFJlcXVpcmVtZW50LkZyb3plbjtcbiAgcmVhZG9ubHkgZXhpdDogRXhpdFJlcXVpcmVtZW50cztcbiAgY29uc3RydWN0b3IocmVhZG9ubHkgX2RlbGVnYXRlOiBUZXJyYWluKSB7XG4gICAgdGhpcy5lbnRlciA9IF9kZWxlZ2F0ZS5lbnRlcjtcbiAgICB0aGlzLmV4aXQgPSBfZGVsZWdhdGUuZXhpdDtcbiAgfVxuXG4gIGxhYmVsKHJvbTogUm9tKSB7XG4gICAgcmV0dXJuIGBTZWFtbGVzcygke1RlcnJhaW4ubGFiZWwodGhpcy5fZGVsZWdhdGUsIHJvbSl9KWA7XG4gIH1cbn1cblxuLy8gQmFzaWMgdGVycmFpbiB3aXRoIGFuIGVudHJhbmNlIGFuZC9vciB1bmRpcmVjdGVkIGV4aXQgY29uZGl0aW9uXG5jbGFzcyBTaW1wbGVUZXJyYWluIGltcGxlbWVudHMgVGVycmFpbiB7XG4gIHJlYWRvbmx5IGV4aXQ6IEV4aXRSZXF1aXJlbWVudHM7XG4gIGNvbnN0cnVjdG9yKHJlYWRvbmx5IGVudGVyOiBSZXF1aXJlbWVudC5Gcm96ZW4sXG4gICAgICAgICAgICAgIGV4aXQ6IFJlcXVpcmVtZW50LkZyb3plbiA9IFJlcXVpcmVtZW50Lk9QRU4pIHtcbiAgICB0aGlzLmV4aXQgPSBbWzB4ZiwgZXhpdF1dO1xuICB9XG5cbiAgZ2V0IGtpbmQoKSB7IHJldHVybiAnU2ltcGxlJzsgfVxuXG4gIGxhYmVsKHJvbTogUm9tKSB7XG4gICAgY29uc3QgdGVyciA9IFtdO1xuICAgIGlmICghUmVxdWlyZW1lbnQuaXNPcGVuKHRoaXMuZW50ZXIpKSB7XG4gICAgICB0ZXJyLnB1c2goYGVudGVyID0gJHtkZWJ1Z0xhYmVsKHRoaXMuZW50ZXIsIHJvbSl9YCk7XG4gICAgfVxuICAgIGlmICghUmVxdWlyZW1lbnQuaXNPcGVuKHRoaXMuZXhpdFswXVsxXSkpIHtcbiAgICAgIHRlcnIucHVzaChgZXhpdCA9ICR7ZGVidWdMYWJlbCh0aGlzLmV4aXRbMF1bMV0sIHJvbSl9YCk7XG4gICAgfVxuICAgIHJldHVybiBgJHt0aGlzLmtpbmR9KCR7dGVyci5qb2luKCcsICcpfSlgO1xuICB9XG59XG5cbi8vIEJhc2ljIHRlcnJhaW4gd2l0aCBhbiBlbnRyYW5jZSBhbmQvb3Igbm9uLXNvdXRoIGV4aXQgY29uZGl0aW9uXG5jbGFzcyBTb3V0aFRlcnJhaW4gaW1wbGVtZW50cyBUZXJyYWluIHtcbiAgcmVhZG9ubHkgZXhpdDogRXhpdFJlcXVpcmVtZW50cztcbiAgY29uc3RydWN0b3IocmVhZG9ubHkgZW50ZXI6IFJlcXVpcmVtZW50LkZyb3plbiwgZXhpdD86IFJlcXVpcmVtZW50LkZyb3plbikge1xuICAgIHRoaXMuZXhpdCA9XG4gICAgICAgIGV4aXQgP1xuICAgICAgICAgICAgW1sweGIsIGV4aXRdLCBbMHg0LCBSZXF1aXJlbWVudC5PUEVOXV0gOlxuICAgICAgICAgICAgW1sweGYsIFJlcXVpcmVtZW50Lk9QRU5dXTtcbiAgfVxuXG4gIGdldCBraW5kKCkgeyByZXR1cm4gJ1NvdXRoJzsgfVxuXG4gIGxhYmVsKHJvbTogUm9tKSB7XG4gICAgaWYgKHRoaXMuZXhpdC5sZW5ndGggPT09IDEpIHtcbiAgICAgIHJldHVybiBTaW1wbGVUZXJyYWluLnByb3RvdHlwZS5sYWJlbC5jYWxsKHRoaXMgYXMgYW55LCByb20pO1xuICAgIH1cbiAgICBjb25zdCB0ZXJyID0gW107XG4gICAgaWYgKCFSZXF1aXJlbWVudC5pc09wZW4odGhpcy5lbnRlcikpIHtcbiAgICAgIHRlcnIucHVzaChgZW50ZXIgPSAke2RlYnVnTGFiZWwodGhpcy5lbnRlciwgcm9tKX1gKTtcbiAgICB9XG4gICAgaWYgKCFSZXF1aXJlbWVudC5pc09wZW4odGhpcy5leGl0WzBdWzFdKSkge1xuICAgICAgdGVyci5wdXNoKGBvdGhlciA9ICR7ZGVidWdMYWJlbCh0aGlzLmV4aXRbMF1bMV0sIHJvbSl9YCk7XG4gICAgfVxuICAgIGlmICghUmVxdWlyZW1lbnQuaXNPcGVuKHRoaXMuZXhpdFsxXVsxXSkpIHtcbiAgICAgIHRlcnIucHVzaChgc291dGggPSAke2RlYnVnTGFiZWwodGhpcy5leGl0WzFdWzFdLCByb20pfWApO1xuICAgIH1cbiAgICByZXR1cm4gYCR7dGhpcy5raW5kfSgke3RlcnIuam9pbignLCAnKX0pYDtcbiAgfVxufVxuXG4vLyBNYWtlIGEgdGVycmFpbiBmcm9tIGEgdGlsZWVmZmVjdHMgdmFsdWUsIGF1Z21lbnRlZCB3aXRoIGEgZmV3IGRldGFpbHMuXG5mdW5jdGlvbiBtYWtlVGlsZShyb206IFJvbSwgZWZmZWN0czogbnVtYmVyKTogVGVycmFpbiB7XG4gIGxldCBlbnRlciA9IFJlcXVpcmVtZW50Lk9QRU47XG4gIGxldCBleGl0ID0gdW5kZWZpbmVkO1xuXG4gIGlmICgoZWZmZWN0cyAmIFRlcnJhaW4uRE9MUEhJTikgJiYgKGVmZmVjdHMgJiBUZXJyYWluLkZMWSkpIHtcbiAgICBpZiAoZWZmZWN0cyAmIFRlcnJhaW4uU0xPUEUpIHtcbiAgICAgIGV4aXQgPSByb20uZmxhZ3MuQ2xpbWJXYXRlcmZhbGwucjtcbiAgICB9XG4gICAgZW50ZXIgPSBbW3JvbS5mbGFncy5DdXJyZW50bHlSaWRpbmdEb2xwaGluLmNdLCBbcm9tLmZsYWdzLkZsaWdodC5jXV07XG4gIH0gZWxzZSB7XG4gICAgaWYgKGVmZmVjdHMgJiBUZXJyYWluLlNMT1BFOSkge1xuICAgICAgZXhpdCA9IHJvbS5mbGFncy5DbGltYlNsb3BlOS5yO1xuICAgIH0gZWxzZSBpZiAoZWZmZWN0cyAmIFRlcnJhaW4uU0xPUEU4KSB7XG4gICAgICBleGl0ID0gcm9tLmZsYWdzLkNsaW1iU2xvcGU4LnI7XG4gICAgfSBlbHNlIGlmIChlZmZlY3RzICYgVGVycmFpbi5TTE9QRSkge1xuICAgICAgZXhpdCA9IHJvbS5mbGFncy5GbGlnaHQucjtcbiAgICB9XG4gICAgaWYgKGVmZmVjdHMgJiBUZXJyYWluLkZMWSkgZW50ZXIgPSByb20uZmxhZ3MuRmxpZ2h0LnI7XG4gIH1cbiAgaWYgKGVmZmVjdHMgJiBUZXJyYWluLlNXQU1QKSB7IC8vIHN3YW1wXG4gICAgZW50ZXIgPSBlbnRlci5tYXAoXG4gICAgICAgIChjczogcmVhZG9ubHkgQ29uZGl0aW9uW10pID0+IFtyb20uZmxhZ3MuVHJhdmVsU3dhbXAuYywgLi4uY3NdKTtcbiAgfVxuICBpZiAoZWZmZWN0cyAmIFRlcnJhaW4uQkFSUklFUikgeyAvLyBzaG9vdGluZyBzdGF0dWVzXG4gICAgZW50ZXIgPSBlbnRlci5tYXAoXG4gICAgICAgIChjczogcmVhZG9ubHkgQ29uZGl0aW9uW10pID0+IFtyb20uZmxhZ3MuU2hvb3RpbmdTdGF0dWUuYywgLi4uY3NdKTtcbiAgfVxuICByZXR1cm4gbmV3IFNvdXRoVGVycmFpbihlbnRlciwgZXhpdCk7XG59XG5cbmNsYXNzIEJvc3NUZXJyYWluIGV4dGVuZHMgU2ltcGxlVGVycmFpbiB7XG4gIGNvbnN0cnVjdG9yKHJlYWRvbmx5IF9mbGFnOiBudW1iZXIpIHtcbiAgICBzdXBlcihSZXF1aXJlbWVudC5PUEVOLCBbW19mbGFnIGFzIENvbmRpdGlvbl1dKTtcbiAgfVxuXG4gIGdldCBraW5kKCkgeyByZXR1cm4gJ0Jvc3MnOyB9XG59XG5cbmNsYXNzIFN0YXR1ZVRlcnJhaW4gZXh0ZW5kcyBTb3V0aFRlcnJhaW4ge1xuICBjb25zdHJ1Y3RvcihyZWFkb25seSBfcmVxOiBSZXF1aXJlbWVudC5Gcm96ZW4pIHtcbiAgICBzdXBlcihSZXF1aXJlbWVudC5PUEVOLCBfcmVxKTtcbiAgfVxuXG4gIGdldCBraW5kKCkgeyByZXR1cm4gJ1N0YXR1ZSc7IH1cbn1cblxuY2xhc3MgRmxhZ1RlcnJhaW4gZXh0ZW5kcyBTaW1wbGVUZXJyYWluIHtcbiAgY29uc3RydWN0b3IoYmFzZTogVGVycmFpbiwgZmxhZzogbnVtYmVyLCBhbHQ6IFRlcnJhaW4pIHtcbiAgICAvLyBOT1RFOiBiYXNlIGFuZCBhbHQgbXVzdCBib3RoIGJlIHNpbXBsZSB0ZXJyYWlucyFcbiAgICAvLyBJZiBmbGFnIGlzIC0xIHRoZW4gZG9uJ3QgY29uc2lkZXIgaXQgKGl0J3MgdW50cmFja2VkKS5cbiAgICBpZiAoYmFzZS5leGl0Lmxlbmd0aCAhPT0gMSB8fCBhbHQuZXhpdC5sZW5ndGggIT09IDEpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignYmFkIGZsYWcnKTtcbiAgICB9XG4gICAgY29uc3QgZiA9IFtbZmxhZyBhcyBDb25kaXRpb25dXTtcbiAgICBjb25zdCBlbnRlciA9IGZsYWcgPj0gMCA/IFJlcXVpcmVtZW50Lm1lZXQoYWx0LmVudGVyLCBmKSA6IGFsdC5lbnRlcjtcbiAgICBjb25zdCBleGl0ID1cbiAgICAgICAgZmxhZyA+PSAwID8gUmVxdWlyZW1lbnQubWVldChhbHQuZXhpdFswXVsxXSwgZikgOiBhbHQuZXhpdFswXVsxXTtcbiAgICBzdXBlcihSZXF1aXJlbWVudC5vcihiYXNlLmVudGVyLCBlbnRlciksXG4gICAgICAgICAgUmVxdWlyZW1lbnQub3IoYmFzZS5leGl0WzBdWzFdLCBleGl0KSk7XG4gIH1cblxuICBnZXQga2luZCgpIHsgcmV0dXJuICdGbGFnJzsgfVxufVxuY29uc3QgQ0xPU0VEID0gbmV3IFNpbXBsZVRlcnJhaW4oUmVxdWlyZW1lbnQuQ0xPU0VELCBSZXF1aXJlbWVudC5DTE9TRUQpO1xuXG4vKiogUmV0dXJucyBhIG1hcCBmcm9tIERpciB0byBpbmRleCBpbiB0aGUgZXhpdCBtYXAuICovXG5mdW5jdGlvbiBkaXJlY3Rpb25JbmRleCh0OiBUZXJyYWluKTogbnVtYmVyW10ge1xuICBjb25zdCBpbmQ6IG51bWJlcltdID0gW107XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdC5leGl0Lmxlbmd0aDsgaSsrKSB7XG4gICAgZm9yIChsZXQgYiA9IDA7IGIgPCA0OyBiKyspIHtcbiAgICAgIGlmICh0LmV4aXRbaV1bMF0gJiAoMSA8PCBiKSkgaW5kW2JdID0gaTtcbiAgICB9XG4gIH1cbiAgZm9yIChsZXQgYiA9IDA7IGIgPCA0OyBiKyspIHsgLy8gc2FuaXR5IGNoZWNrXG4gICAgaWYgKGluZFtiXSA9PSBudWxsKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEJhZCB0ZXJyYWluOiAke3QuZXhpdC5tYXAoZSA9PiBlWzBdKS5qb2luKCcsJyl9YCk7XG4gICAgfVxuICB9XG4gIHJldHVybiBpbmQ7XG59XG5cbmNsYXNzIE1lZXRUZXJyYWluIGltcGxlbWVudHMgVGVycmFpbiB7XG4gIHJlYWRvbmx5IGVudGVyOiBSZXF1aXJlbWVudC5Gcm96ZW47XG4gIHJlYWRvbmx5IGV4aXQ6IEV4aXRSZXF1aXJlbWVudHM7XG4gIGNvbnN0cnVjdG9yKHJlYWRvbmx5IGxlZnQ6IFRlcnJhaW4sIHJlYWRvbmx5IHJpZ2h0OiBUZXJyYWluKSB7XG4gICAgLy8gVGhpcyBpcyB0cmlja3k6IHdlIG5lZWQgdG8gZmlndXJlIG91dCB3aGljaCBleGl0cyBhcmUgaW4gY29tbW9uIGFuZFxuICAgIC8vIG5vdCByZXBlYXQgd29yay4gIFNvIGJ1aWxkIHVwIGEgcmV2ZXJzZSBtYXAgb2YgZGlyZWN0aW9uLXRvLWluZGV4LFxuICAgIC8vIHRoZW4ga2VlcCB0cmFjayBvZiBhbGwgdGhlIHVuaXF1ZSBjb21iaW5hdGlvbnMuXG4gICAgY29uc3QgbGVmdEluZCA9IGRpcmVjdGlvbkluZGV4KGxlZnQpO1xuICAgIGNvbnN0IHJpZ2h0SW5kID0gZGlyZWN0aW9uSW5kZXgocmlnaHQpO1xuICAgIGNvbnN0IHNvdXJjZXMgPSBuZXcgU2V0PG51bWJlcj4oKTtcbiAgICBjb25zdCBleGl0OiBBcnJheTxyZWFkb25seSBbbnVtYmVyLCBSZXF1aXJlbWVudC5Gcm96ZW5dPiA9IFtdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgNDsgaSsrKSB7XG4gICAgICBzb3VyY2VzLmFkZChsZWZ0SW5kW2ldIDw8IDIgfCByaWdodEluZFtpXSk7XG4gICAgfVxuICAgIGZvciAoY29uc3Qgc291cmNlIG9mIHNvdXJjZXMpIHtcbiAgICAgIGNvbnN0IFtkMCwgcjBdID0gbGVmdC5leGl0W3NvdXJjZSA+PiAyXTtcbiAgICAgIGNvbnN0IFtkMSwgcjFdID0gcmlnaHQuZXhpdFtzb3VyY2UgJiAzXTtcbiAgICAgIGV4aXQucHVzaChbZDAgJiBkMSwgUmVxdWlyZW1lbnQubWVldChyMCwgcjEpXSk7XG4gICAgfVxuICAgIHRoaXMuZW50ZXIgPSBSZXF1aXJlbWVudC5tZWV0KGxlZnQuZW50ZXIsIHJpZ2h0LmVudGVyKTtcbiAgICB0aGlzLmV4aXQgPSBleGl0O1xuICB9XG5cbiAgZ2V0IGtpbmQoKSB7IHJldHVybiAnVGVycmFpbic7IH1cblxuICBsYWJlbChyb206IFJvbSk6IHN0cmluZyB7XG4gICAgaWYgKHRoaXMuZXhpdC5sZW5ndGggPT09IDEpIHtcbiAgICAgIHJldHVybiBTaW1wbGVUZXJyYWluLnByb3RvdHlwZS5sYWJlbC5jYWxsKHRoaXMgYXMgYW55LCByb20pO1xuICAgIH1cbiAgICBjb25zdCB0ZXJyID0gW107XG4gICAgaWYgKCFSZXF1aXJlbWVudC5pc09wZW4odGhpcy5lbnRlcikpIHtcbiAgICAgIHRlcnIucHVzaChgZW50ZXIgPSAke2RlYnVnTGFiZWwodGhpcy5lbnRlciwgcm9tKX1gKTtcbiAgICB9XG4gICAgZm9yIChjb25zdCBbZGlycywgcmVxXSBvZiB0aGlzLmV4aXQpIHtcbiAgICAgIGNvbnN0IGRpcnN0cmluZyA9IFtkaXJzICYgMSA/ICdOJyA6ICcnLCBkaXJzICYgMiA/ICdXJyA6ICcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgIGRpcnMgJiA0ID8gJ1MnIDogJycsIGRpcnMgJiA4ID8gJ0UnIDogJyddLmpvaW4oJycpO1xuICAgICAgdGVyci5wdXNoKGBleGl0JHtkaXJzdHJpbmd9ID0gJHtkZWJ1Z0xhYmVsKHJlcSwgcm9tKX1gKTtcbiAgICB9XG4gICAgcmV0dXJuIGAke3RoaXMua2luZH0oJHt0ZXJyLmpvaW4oJywgJyl9KWA7XG4gIH1cbn1cblxuLy8gTk9URTogdGhpcyBraW5kIG9mIHdhbnRzIHRvIGJlIGluIFJlcXVpcmVtZW50LCBidXQgaXQncyByb20tc3BlY2lmaWMuLi5cbmV4cG9ydCBmdW5jdGlvbiBkZWJ1Z0xhYmVsKHI6IFJlcXVpcmVtZW50LCByb206IFJvbSk6IHN0cmluZyB7XG4gIGNvbnN0IGNzcyA9IFsuLi5yXTtcbiAgY29uc3QgcyA9IGNzcy5tYXAoY3MgPT4gaXRlcnMuaXNFbXB0eShjcykgPyAnb3BlbicgOlxuICAgICAgICAgICAgICAgICAgICBbLi4uY3NdLm1hcChcbiAgICAgICAgICAgICAgICAgICAgICAgIChjOiBDb25kaXRpb24pID0+IHJvbS5mbGFnc1tjXT8uZGVidWcpLmpvaW4oJyAmICcpKVxuICAgICAgLmpvaW4oJykgfCAoJyk7XG4gIHJldHVybiBjc3MubGVuZ3RoID4gMSA/IGAoJHtzfSlgIDogY3NzLmxlbmd0aCA/IHMgOiAnbmV2ZXInO1xufVxuXG4oVGVycmFpbiBhcyBhbnkpLmRlYnVnTGFiZWwgPSBkZWJ1Z0xhYmVsO1xuaWYgKHR5cGVvZiB3aW5kb3cgPT09ICdvYmplY3QnKSAod2luZG93IGFzIGFueSkuZGVidWdMYWJlbCA9IGRlYnVnTGFiZWw7XG4iXX0=