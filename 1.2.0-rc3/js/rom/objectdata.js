import { Entity } from './entity.js';
import { hex, readLittleEndian, writeLittleEndian } from './util.js';
export class ObjectData extends Entity {
    constructor(rom, id) {
        super(rom, id);
        this.used = true;
        this.name = '';
        this.pointer = 0x1ac00 + (id << 1);
        this.base = readLittleEndian(rom.prg, this.pointer) + 0x10000;
        this.sfx = rom.prg[this.base];
        this.data = [];
        let a = this.base + 1;
        let m = 0;
        for (let i = 0; i < 32; i++) {
            if (!(i & 7)) {
                m = rom.prg[a++];
            }
            this.data.push(m & 0x80 ? rom.prg[a++] : 0);
            m <<= 1;
        }
    }
    serialize() {
        const out = [this.sfx];
        for (let i = 0; i < 4; i++) {
            const k = out.length;
            out.push(0);
            for (let j = 0; j < 8; j++) {
                if (this.data[8 * i + j]) {
                    out[k] |= (0x80 >>> j);
                    out.push(this.data[8 * i + j]);
                }
            }
        }
        return out;
    }
    async write(writer) {
        const address = await writer.write(this.serialize(), 0x1a000, 0x1bfff, `Object ${hex(this.id)}`);
        writeLittleEndian(writer.rom, this.pointer, address - 0x10000);
    }
    get(addr) {
        return this.data[(addr - 0x300) >>> 5];
    }
    parents() {
        return [];
    }
    locations() {
        return this.rom.locations.filter((l) => l.used && l.spawns.some(spawn => spawn.isMonster() && spawn.monsterId === this.id));
    }
    palettes(includeChildren = false) {
        if (this.action === 0x22)
            return [3];
        let metaspriteId = this.data[0];
        if (this.action === 0x2a)
            metaspriteId = this.data[31] | 1;
        if (this.action === 0x29)
            metaspriteId = 0x6b;
        if (this.action === 0x26)
            metaspriteId = 0x9c;
        const ms = this.rom.metasprites[metaspriteId];
        const childMs = includeChildren && this.child ?
            this.rom.metasprites[this.rom.objects[this.rom.adHocSpawns[this.child].objectId].data[0]] :
            null;
        const s = new Set([...ms.palettes(), ...(childMs ? childMs.palettes() : [])]);
        return [...s];
    }
    isVulnerable(element) {
        return !(this.elements & (1 << element));
    }
    isShadow() {
        return this.id === 0x7b || this.id === 0x8c;
    }
    get metasprite() { return METASPRITE.get(this.data); }
    set metasprite(x) { METASPRITE.set(this.data, x); }
    get speed() { return SPEED.get(this.data); }
    set speed(x) { SPEED.set(this.data, x); }
    get collisionPlane() { return COLLISION_PLANE.get(this.data); }
    set collisionPlane(x) { COLLISION_PLANE.set(this.data, x); }
    get hitbox() { return HITBOX.get(this.data); }
    set hitbox(x) { HITBOX.set(this.data, x); }
    get hp() { return HP.get(this.data); }
    set hp(x) { HP.set(this.data, x); }
    get atk() { return ATK.get(this.data); }
    set atk(x) { ATK.set(this.data, x); }
    get def() { return DEF.get(this.data); }
    set def(x) { DEF.set(this.data, x); }
    get level() { return LEVEL.get(this.data); }
    set level(x) { LEVEL.set(this.data, x); }
    get poison() { return !!POISON.get(this.data); }
    set poison(x) { POISON.set(this.data, x ? 1 : 0); }
    get child() { return CHILD.get(this.data); }
    set child(x) { CHILD.set(this.data, x); }
    get terrainSusceptibility() { return TERRAIN_SUSCEPTIBILITY.get(this.data); }
    set terrainSusceptibility(x) { TERRAIN_SUSCEPTIBILITY.set(this.data, x); }
    get immobile() { return !!IMMOBILE.get(this.data); }
    set immobile(x) { IMMOBILE.set(this.data, x ? 1 : 0); }
    get action() { return ACTION.get(this.data); }
    set action(x) { ACTION.set(this.data, x); }
    get replacement() { return REPLACEMENT.get(this.data); }
    set replacement(x) { REPLACEMENT.set(this.data, x); }
    get goldDrop() { return GOLD_DROP.get(this.data); }
    set goldDrop(x) { GOLD_DROP.set(this.data, x); }
    get elements() { return ELEMENTS.get(this.data); }
    set elements(x) { ELEMENTS.set(this.data, x); }
    get expReward() { return EXP_REWARD.get(this.data); }
    set expReward(x) { EXP_REWARD.set(this.data, x); }
    get attackType() { return ATTACK_TYPE.get(this.data); }
    set attackType(x) { ATTACK_TYPE.set(this.data, x); }
    get statusEffect() { return STATUS_EFFECT.get(this.data); }
    set statusEffect(x) { STATUS_EFFECT.set(this.data, x); }
}
function prop(...spec) {
    return new Stat(...spec);
}
class Stat {
    constructor(...spec) {
        this.spec = spec;
    }
    get(data) {
        let value = 0;
        for (const [addr, mask = 0xff, shift = 0] of this.spec) {
            const index = (addr - 0x300) >>> 5;
            const lsh = shift < 0 ? -shift : 0;
            const rsh = shift < 0 ? 0 : shift;
            value |= ((data[index] & mask) >>> rsh) << lsh;
        }
        return value;
    }
    set(data, value) {
        for (const [addr, mask = 0xff, shift = 0] of this.spec) {
            const index = (addr - 0x300) >>> 5;
            const lsh = shift < 0 ? -shift : 0;
            const rsh = shift < 0 ? 0 : shift;
            const v = (value >>> lsh) << rsh & mask;
            data[index] = data[index] & ~mask | v;
        }
    }
}
const METASPRITE = prop([0x300]);
const SPEED = prop([0x340, 0xf]);
const COLLISION_PLANE = prop([0x3a0, 0xf0, 4]);
const HITBOX = prop([0x420, 0x40, 2], [0x3a0, 0x0f]);
const HP = prop([0x3c0]);
const ATK = prop([0x3e0]);
const DEF = prop([0x400]);
const LEVEL = prop([0x420, 0x1f]);
const POISON = prop([0x420, 0x80, 7]);
const CHILD = prop([0x440]);
const TERRAIN_SUSCEPTIBILITY = prop([0x460]);
const IMMOBILE = prop([0x4a0, 0x80, 7]);
const ACTION = prop([0x4a0, 0x7f]);
const REPLACEMENT = prop([0x4c0]);
const GOLD_DROP = prop([0x500, 0xf0, 4]);
const ELEMENTS = prop([0x500, 0xf]);
const EXP_REWARD = prop([0x520]);
const ATTACK_TYPE = prop([0x540]);
const STATUS_EFFECT = prop([0x560, 0xf]);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib2JqZWN0ZGF0YS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9qcy9yb20vb2JqZWN0ZGF0YS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUMsTUFBTSxFQUFDLE1BQU0sYUFBYSxDQUFDO0FBRW5DLE9BQU8sRUFBQyxHQUFHLEVBQUUsZ0JBQWdCLEVBQUUsaUJBQWlCLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFLbkUsTUFBTSxPQUFPLFVBQVcsU0FBUSxNQUFNO0lBV3BDLFlBQVksR0FBUSxFQUFFLEVBQVU7UUFDOUIsS0FBSyxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUNmLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO1FBQ2pCLElBQUksQ0FBQyxJQUFJLEdBQUcsRUFBRSxDQUFDO1FBQ2YsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLEdBQUcsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDbkMsSUFBSSxDQUFDLElBQUksR0FBRyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxPQUFPLENBQUM7UUFDOUQsSUFBSSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM5QixJQUFJLENBQUMsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUNmLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDO1FBQ3RCLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNWLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDM0IsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFO2dCQUNaLENBQUMsR0FBRyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMs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SUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNwRCxJQUFJLEtBQUssQ0FBQyxDQUFTLElBQUksS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUVqRCxJQUFJLGNBQWMsS0FBYSxPQUFPLGVBQWUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN2RSxJQUFJLGNBQWMsQ0FBQyxDQUFTLElBQUksZUFBZSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUVwRSxJQUFJLE1BQU0sS0FBYSxPQUFPLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN0RCxJQUFJLE1BQU0sQ0FBQyxDQUFTLElBQUksTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUVuRCxJQUFJLEVBQUUsS0FBYSxPQUFPLEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUM5QyxJQUFJLEVBQUUsQ0FBQyxDQUFTLElBQUksRUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUUzQyxJQUFJLEdBQUcsS0FBYSxPQUFPLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNoRCxJQUFJLEdBQUcsQ0FBQyxDQUFTLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUU3QyxJQUFJLEdBQUcsS0FBYSxPQUFPLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNoRCxJQUFJLEdBQUcsQ0FBQyxDQUFTLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUU3QyxJQUFJLEtBQUssS0FBYSxPQUFPLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNwRCxJQUFJLEtBQUssQ0FBQyxDQUFTLElBQUksS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUVqRCxJQUFJLE1BQU0sS0FBYyxPQUFPLENBQUMsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDekQsSUFBSSxNQUFNLENBQUMsQ0FBVSxJQUFJLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBRTVELElBQUksS0FBSyxLQUFhLE9BQU8sS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3BELElBQUksS0FBSyxDQUFDLENBQVMsSUFBSSxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBRWpELElBQUkscUJBQXFCLEtBQWEsT0FBTyxzQkFBc0IsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNyRixJQUFJLHFCQUFxQixDQUFDLENBQVMsSUFBSSxzQkFBc0IsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFFbEYsSUFBSSxRQUFRLEtBQWMsT0FBTyxDQUFDLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzdELElBQUksUUFBUSxDQUFDLENBQVUsSUFBSSxRQUFRLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUVoRSxJQUFJLE1BQU0sS0FBYSxPQUFPLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN0RCxJQUFJLE1BQU0sQ0FBQyxDQUFTLElBQUksTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUVuRCxJQUFJLFdBQVcsS0FBYSxPQUFPLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNoRSxJQUFJLFdBQVcsQ0FBQyxDQUFTLElBQUksV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUU3RCxJQUFJLFFBQVEsS0FBYSxPQUFPLFNBQVMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUMzRCxJQUFJLFFBQVEsQ0FBQyxDQUFTLElBQUksU0FBUyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUV4RCxJQUFJLFFBQVEsS0FBYSxPQUFPLFFBQVEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUMxRCxJQUFJLFFBQVEsQ0FBQyxDQUFTLElBQUksUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FB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QUMsQ0FBQztBQUNqQyxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztBQUNqQyxNQUFNLGVBQWUsR0FBRyxJQUFJLENBQUMsQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDL0MsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO0FBQ3JELE1BQU0sRUFBRSxHQUFHLElBQUksQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7QUFDekIsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztBQUMxQixNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO0FBQzFCLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO0FBQ2xDLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN0QyxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO0FBQzVCLE1BQU0sc0JBQXNCLEdBQUcsSUFBSSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztBQUM3QyxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDeEMsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7QUFDbkMsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztBQUNsQyxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDekMsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDcEMsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztBQUNqQyxNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO0FBQ2xDLE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtFbnRpdHl9IGZyb20gJy4vZW50aXR5LmpzJztcbmltcG9ydCB7TG9jYXRpb259IGZyb20gJy4vbG9jYXRpb24uanMnO1xuaW1wb3J0IHtoZXgsIHJlYWRMaXR0bGVFbmRpYW4sIHdyaXRlTGl0dGxlRW5kaWFufSBmcm9tICcuL3V0aWwuanMnO1xuaW1wb3J0IHtXcml0ZXJ9IGZyb20gJy4vd3JpdGVyLmpzJztcbmltcG9ydCB7Um9tfSBmcm9tICcuLi9yb20uanMnO1xuXG4vLyBOT1RFOiBXb3VsZCBiZSBuaWNlIHRvIGNhbGwgdGhpcyBPYmplY3QsIGJ1dCB0aGF0IHNlZW1zIGNvbmZ1c2luZy4uLlxuZXhwb3J0IGNsYXNzIE9iamVjdERhdGEgZXh0ZW5kcyBFbnRpdHkge1xuXG4gIHVzZWQ6IGJvb2xlYW47XG4gIG5hbWU6IHN0cmluZztcblxuICBwb2ludGVyOiBudW1iZXI7XG4gIGJhc2U6IG51bWJlcjtcblxuICBzZng6IG51bWJlcjtcbiAgZGF0YTogbnVtYmVyW107XG5cbiAgY29uc3RydWN0b3Iocm9tOiBSb20sIGlkOiBudW1iZXIpIHtcbiAgICBzdXBlcihyb20sIGlkKTtcbiAgICB0aGlzLnVzZWQgPSB0cnVlO1xuICAgIHRoaXMubmFtZSA9ICcnO1xuICAgIHRoaXMucG9pbnRlciA9IDB4MWFjMDAgKyAoaWQgPDwgMSk7XG4gICAgdGhpcy5iYXNlID0gcmVhZExpdHRsZUVuZGlhbihyb20ucHJnLCB0aGlzLnBvaW50ZXIpICsgMHgxMDAwMDtcbiAgICB0aGlzLnNmeCA9IHJvbS5wcmdbdGhpcy5iYXNlXTtcbiAgICB0aGlzLmRhdGEgPSBbXTtcbiAgICBsZXQgYSA9IHRoaXMuYmFzZSArIDE7XG4gICAgbGV0IG0gPSAwO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMzI7IGkrKykge1xuICAgICAgaWYgKCEoaSAmIDcpKSB7XG4gICAgICAgIG0gPSByb20ucHJnW2ErK107XG4gICAgICB9XG4gICAgICB0aGlzLmRhdGEucHVzaChtICYgMHg4MCA/IHJvbS5wcmdbYSsrXSA6IDApO1xuICAgICAgbSA8PD0gMTtcbiAgICB9XG4gIH1cblxuICAvLyBSZXR1cm5zIGEgYnl0ZSBhcnJheSBmb3IgdGhpcyBlbnRyeVxuICBzZXJpYWxpemUoKTogbnVtYmVyW10ge1xuICAgIGNvbnN0IG91dCA9IFt0aGlzLnNmeF07XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCA0OyBpKyspIHtcbiAgICAgIGNvbnN0IGsgPSBvdXQubGVuZ3RoO1xuICAgICAgb3V0LnB1c2goMCk7XG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IDg7IGorKykge1xuICAgICAgICBpZiAodGhpcy5kYXRhWzggKiBpICsgal0pIHtcbiAgICAgICAgICBvdXRba10gfD0gKDB4ODAgPj4+IGopO1xuICAgICAgICAgIG91dC5wdXNoKHRoaXMuZGF0YVs4ICogaSArIGpdKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gb3V0O1xuICB9XG5cbiAgYXN5bmMgd3JpdGUod3JpdGVyOiBXcml0ZXIpIHtcbiAgICBjb25zdCBhZGRyZXNzID0gYXdhaXQgd3JpdGVyLndyaXRlKHRoaXMuc2VyaWFsaXplKCksIDB4MWEwMDAsIDB4MWJmZmYsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBgT2JqZWN0ICR7aGV4KHRoaXMuaWQpfWApO1xuICAgIHdyaXRlTGl0dGxlRW5kaWFuKHdyaXRlci5yb20sIHRoaXMucG9pbnRlciwgYWRkcmVzcyAtIDB4MTAwMDApO1xuICB9XG5cbiAgZ2V0KGFkZHI6IG51bWJlcik6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuZGF0YVsoYWRkciAtIDB4MzAwKSA+Pj4gNV07XG4gIH1cblxuICBwYXJlbnRzKCk6IE9iamVjdERhdGFbXSB7XG4gICAgLy8gSWYgdGhpcyBpcyBhIHByb2plY3RpbGUgdGhhdCBpcyB0aGUgcGFyZW50IG9mIHNvbWUgbW9uc3RlcixcbiAgICAvLyByZXR1cm4gYW4gYXJyYXkgb2YgcGFyZW50cyB0aGF0IHNwYXduZWQgaXQuXG4gICAgcmV0dXJuIFtdO1xuICAgIC8vIHJldHVybiB0aGlzLnJvbS5tb25zdGVycy5maWx0ZXIoXG4gICAgLy8gICAgIChtOiBPYmplY3REYXRhKSA9PiBtLmNoaWxkICYmXG4gICAgLy8gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJvbS5hZEhvY1NwYXduc1ttLmNoaWxkXS5vYmplY3RJZCA9PT0gdGhpcy5pZCk7XG4gIH1cblxuICBsb2NhdGlvbnMoKTogTG9jYXRpb25bXSB7XG4gICAgLy8gVE9ETyAtIGhhbmRsZSBub24tbW9uc3RlciBOUENzLlxuICAgIHJldHVybiB0aGlzLnJvbS5sb2NhdGlvbnMuZmlsdGVyKChsOiBMb2NhdGlvbikgPT5cbiAgICAgICAgbC51c2VkICYmIGwuc3Bhd25zLnNvbWUoc3Bhd24gPT5cbiAgICAgICAgICAgIHNwYXduLmlzTW9uc3RlcigpICYmIHNwYXduLm1vbnN0ZXJJZCA9PT0gdGhpcy5pZCkpO1xuICB9XG5cbiAgcGFsZXR0ZXMoaW5jbHVkZUNoaWxkcmVuID0gZmFsc2UpOiBudW1iZXJbXSB7XG4gICAgLy8gTk9URTogdGhpcyBnZXRzIHRoZSB3cm9uZyByZXN1bHQgZm9yIGljZS9zYW5kIHpvbWJpZXMgYW5kIGJsb2JzLlxuICAgIC8vICAtIG1heSBqdXN0IG5lZWQgdG8gZ3Vlc3MvYXNzdW1lIGFuZCBleHBlcmltZW50P1xuICAgIC8vICAtIHpvbWJpZXMgKGFjdGlvbiAweDIyKSBsb29rIGxpa2Ugc2hvdWxkIGp1c3QgYmUgM1xuICAgIC8vICAtIGxhdmFtZW4vYmxvYnMgKGFjdGlvbiAweDI5KSBhcmUgMlxuICAgIC8vICAtIHdyYWl0aCBzaGFkb3dzIChhY3Rpb24gMHgyNikgYXJlIDNcbiAgICBpZiAodGhpcy5hY3Rpb24gPT09IDB4MjIpIHJldHVybiBbM107IC8vIHpvbWJpZVxuICAgIGxldCBtZXRhc3ByaXRlSWQgPSB0aGlzLmRhdGFbMF07XG4gICAgaWYgKHRoaXMuYWN0aW9uID09PSAweDJhKSBtZXRhc3ByaXRlSWQgPSB0aGlzLmRhdGFbMzFdIHwgMTtcbiAgICBpZiAodGhpcy5hY3Rpb24gPT09IDB4MjkpIG1ldGFzcHJpdGVJZCA9IDB4NmI7IC8vIGJsb2JcbiAgICBpZiAodGhpcy5hY3Rpb24gPT09IDB4MjYpIG1ldGFzcHJpdGVJZCA9IDB4OWM7XG5cbiAgICBjb25zdCBtcyA9IHRoaXMucm9tLm1ldGFzcHJpdGVzW21ldGFzcHJpdGVJZF07XG4gICAgY29uc3QgY2hpbGRNcyA9XG4gICAgICAgIGluY2x1ZGVDaGlsZHJlbiAmJiB0aGlzLmNoaWxkID9cbiAgICAgICAgICAgIHRoaXMucm9tLm1ldGFzcHJpdGVzW1xuICAgICAgICAgICAgICAgIHRoaXMucm9tLm9iamVjdHNbXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucm9tLmFkSG9jU3Bhd25zW3RoaXMuY2hpbGRdLm9iamVjdElkXS5kYXRhWzBdXSA6XG4gICAgICAgICAgICBudWxsO1xuICAgIGNvbnN0IHMgPSBuZXcgU2V0KFsuLi5tcy5wYWxldHRlcygpLCAuLi4oY2hpbGRNcyA/IGNoaWxkTXMucGFsZXR0ZXMoKSA6IFtdKV0pO1xuICAgIHJldHVybiBbLi4uc107XG4gIH1cblxuICAvLyAwIGZvciB3aW5kLCAxIGZvciBmaXJlLCAyIGZvciB3YXRlciwgMyBmb3IgdGh1bmRlclxuICBpc1Z1bG5lcmFibGUoZWxlbWVudDogbnVtYmVyKSB7XG4gICAgcmV0dXJuICEodGhpcy5lbGVtZW50cyAmICgxIDw8IGVsZW1lbnQpKTtcbiAgfVxuXG4gIGlzU2hhZG93KCkge1xuICAgIC8vIE5PVEU6IGludGVybmFsbHkgdGhlIGdhbWUgY2hlY2tzIHRoYXQgdGhlIG1ldGFzcHJpdGVcbiAgICAvLyBpcyAkYTcgKHNlZSAkMzUwZjMpLCBidXQgd2UnbGwganVzdCBoYXJkY29kZS5cbiAgICByZXR1cm4gdGhpcy5pZCA9PT0gMHg3YiB8fCB0aGlzLmlkID09PSAweDhjO1xuICB9XG5cbiAgZ2V0IG1ldGFzcHJpdGUoKTogbnVtYmVyIHsgcmV0dXJuIE1FVEFTUFJJVEUuZ2V0KHRoaXMuZGF0YSk7IH1cbiAgc2V0IG1ldGFzcHJpdGUoeDogbnVtYmVyKSB7IE1FVEFTUFJJVEUuc2V0KHRoaXMuZGF0YSwgeCk7IH1cblxuICBnZXQgc3BlZWQoKTogbnVtYmVyIHsgcmV0dXJuIFNQRUVELmdldCh0aGlzLmRhdGEpOyB9XG4gIHNldCBzcGVlZCh4OiBudW1iZXIpIHsgU1BFRUQuc2V0KHRoaXMuZGF0YSwgeCk7IH1cblxuICBnZXQgY29sbGlzaW9uUGxhbmUoKTogbnVtYmVyIHsgcmV0dXJuIENPTExJU0lPTl9QTEFORS5nZXQodGhpcy5kYXRhKTsgfVxuICBzZXQgY29sbGlzaW9uUGxhbmUoeDogbnVtYmVyKSB7IENPTExJU0lPTl9QTEFORS5zZXQodGhpcy5kYXRhLCB4KTsgfVxuXG4gIGdldCBoaXRib3goKTogbnVtYmVyIHsgcmV0dXJuIEhJVEJPWC5nZXQodGhpcy5kYXRhKTsgfVxuICBzZXQgaGl0Ym94KHg6IG51bWJlcikgeyBISVRCT1guc2V0KHRoaXMuZGF0YSwgeCk7IH1cblxuICBnZXQgaHAoKTogbnVtYmVyIHsgcmV0dXJuIEhQLmdldCh0aGlzLmRhdGEpOyB9XG4gIHNldCBocCh4OiBudW1iZXIpIHsgSFAuc2V0KHRoaXMuZGF0YSwgeCk7IH1cblxuICBnZXQgYXRrKCk6IG51bWJlciB7IHJldHVybiBBVEsuZ2V0KHRoaXMuZGF0YSk7IH1cbiAgc2V0IGF0ayh4OiBudW1iZXIpIHsgQVRLLnNldCh0aGlzLmRhdGEsIHgpOyB9XG5cbiAgZ2V0IGRlZigpOiBudW1iZXIgeyByZXR1cm4gREVGLmdldCh0aGlzLmRhdGEpOyB9XG4gIHNldCBkZWYoeDogbnVtYmVyKSB7IERFRi5zZXQodGhpcy5kYXRhLCB4KTsgfVxuXG4gIGdldCBsZXZlbCgpOiBudW1iZXIgeyByZXR1cm4gTEVWRUwuZ2V0KHRoaXMuZGF0YSk7IH1cbiAgc2V0IGxldmVsKHg6IG51bWJlcikgeyBMRVZFTC5zZXQodGhpcy5kYXRhLCB4KTsgfVxuXG4gIGdldCBwb2lzb24oKTogYm9vbGVhbiB7IHJldHVybiAhIVBPSVNPTi5nZXQodGhpcy5kYXRhKTsgfVxuICBzZXQgcG9pc29uKHg6IGJvb2xlYW4pIHsgUE9JU09OLnNldCh0aGlzLmRhdGEsIHggPyAxIDogMCk7IH1cblxuICBnZXQgY2hpbGQoKTogbnVtYmVyIHsgcmV0dXJuIENISUxELmdldCh0aGlzLmRhdGEpOyB9XG4gIHNldCBjaGlsZCh4OiBudW1iZXIpIHsgQ0hJTEQuc2V0KHRoaXMuZGF0YSwgeCk7IH1cblxuICBnZXQgdGVycmFpblN1c2NlcHRpYmlsaXR5KCk6IG51bWJlciB7IHJldHVybiBURVJSQUlOX1NVU0NFUFRJQklMSVRZLmdldCh0aGlzLmRhdGEpOyB9XG4gIHNldCB0ZXJyYWluU3VzY2VwdGliaWxpdHkoeDogbnVtYmVyKSB7IFRFUlJBSU5fU1VTQ0VQVElCSUxJVFkuc2V0KHRoaXMuZGF0YSwgeCk7IH1cblxuICBnZXQgaW1tb2JpbGUoKTogYm9vbGVhbiB7IHJldHVybiAhIUlNTU9CSUxFLmdldCh0aGlzLmRhdGEpOyB9XG4gIHNldCBpbW1vYmlsZSh4OiBib29sZWFuKSB7IElNTU9CSUxFLnNldCh0aGlzLmRhdGEsIHggPyAxIDogMCk7IH1cblxuICBnZXQgYWN0aW9uKCk6IG51bWJlciB7IHJldHVybiBBQ1RJT04uZ2V0KHRoaXMuZGF0YSk7IH1cbiAgc2V0IGFjdGlvbih4OiBudW1iZXIpIHsgQUNUSU9OLnNldCh0aGlzLmRhdGEsIHgpOyB9XG5cbiAgZ2V0IHJlcGxhY2VtZW50KCk6IG51bWJlciB7IHJldHVybiBSRVBMQUNFTUVOVC5nZXQodGhpcy5kYXRhKTsgfVxuICBzZXQgcmVwbGFjZW1lbnQoeDogbnVtYmVyKSB7IFJFUExBQ0VNRU5ULnNldCh0aGlzLmRhdGEsIHgpOyB9XG5cbiAgZ2V0IGdvbGREcm9wKCk6IG51bWJlciB7IHJldHVybiBHT0xEX0RST1AuZ2V0KHRoaXMuZGF0YSk7IH1cbiAgc2V0IGdvbGREcm9wKHg6IG51bWJlcikgeyBHT0xEX0RST1Auc2V0KHRoaXMuZGF0YSwgeCk7IH1cblxuICBnZXQgZWxlbWVudHMoKTogbnVtYmVyIHsgcmV0dXJuIEVMRU1FTlRTLmdldCh0aGlzLmRhdGEpOyB9XG4gIHNldCBlbGVtZW50cyh4OiBudW1iZXIpIHsgRUxFTUVOVFMuc2V0KHRoaXMuZGF0YSwgeCk7IH1cblxuICAvKiogVW5wcm9jZXNzZWQgZXhwZXJpZW5jZSByZXdhcmQgKCQ1MjAseCkuICovXG4gIGdldCBleHBSZXdhcmQoKTogbnVtYmVyIHsgcmV0dXJuIEVYUF9SRVdBUkQuZ2V0KHRoaXMuZGF0YSk7IH1cbiAgc2V0IGV4cFJld2FyZCh4OiBudW1iZXIpIHsgRVhQX1JFV0FSRC5zZXQodGhpcy5kYXRhLCB4KTsgfVxuXG4gIGdldCBhdHRhY2tUeXBlKCk6IG51bWJlciB7IHJldHVybiBBVFRBQ0tfVFlQRS5nZXQodGhpcy5kYXRhKTsgfVxuICBzZXQgYXR0YWNrVHlwZSh4OiBudW1iZXIpIHsgQVRUQUNLX1RZUEUuc2V0KHRoaXMuZGF0YSwgeCk7IH1cblxuICBnZXQgc3RhdHVzRWZmZWN0KCk6IG51bWJlciB7IHJldHVybiBTVEFUVVNfRUZGRUNULmdldCh0aGlzLmRhdGEpOyB9XG4gIHNldCBzdGF0dXNFZmZlY3QoeDogbnVtYmVyKSB7IFNUQVRVU19FRkZFQ1Quc2V0KHRoaXMuZGF0YSwgeCk7IH1cbn1cblxuZnVuY3Rpb24gcHJvcCguLi5zcGVjOiBbbnVtYmVyLCBudW1iZXI/LCBudW1iZXI/XVtdKSB7XG4gIHJldHVybiBuZXcgU3RhdCguLi5zcGVjKTtcbn1cblxuY2xhc3MgU3RhdCB7XG4gIHJlYWRvbmx5IHNwZWM6IFtudW1iZXIsIG51bWJlcj8sIG51bWJlcj9dW107XG5cbiAgY29uc3RydWN0b3IoLi4uc3BlYzogW251bWJlciwgbnVtYmVyPywgbnVtYmVyP11bXSkge1xuICAgIHRoaXMuc3BlYyA9IHNwZWM7XG4gIH1cblxuICBnZXQoZGF0YTogbnVtYmVyW10pIHtcbiAgICBsZXQgdmFsdWUgPSAwO1xuICAgIGZvciAoY29uc3QgW2FkZHIsIG1hc2sgPSAweGZmLCBzaGlmdCA9IDBdIG9mIHRoaXMuc3BlYykge1xuICAgICAgY29uc3QgaW5kZXggPSAoYWRkciAtIDB4MzAwKSA+Pj4gNTtcbiAgICAgIGNvbnN0IGxzaCA9IHNoaWZ0IDwgMCA/IC1zaGlmdCA6IDA7XG4gICAgICBjb25zdCByc2ggPSBzaGlmdCA8IDAgPyAwIDogc2hpZnQ7XG4gICAgICB2YWx1ZSB8PSAoKGRhdGFbaW5kZXhdICYgbWFzaykgPj4+IHJzaCkgPDwgbHNoO1xuICAgIH1cbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cblxuICBzZXQoZGF0YTogbnVtYmVyW10sIHZhbHVlOiBudW1iZXIpIHtcbiAgICBmb3IgKGNvbnN0IFthZGRyLCBtYXNrID0gMHhmZiwgc2hpZnQgPSAwXSBvZiB0aGlzLnNwZWMpIHtcbiAgICAgIGNvbnN0IGluZGV4ID0gKGFkZHIgLSAweDMwMCkgPj4+IDU7XG4gICAgICBjb25zdCBsc2ggPSBzaGlmdCA8IDAgPyAtc2hpZnQgOiAwO1xuICAgICAgY29uc3QgcnNoID0gc2hpZnQgPCAwID8gMCA6IHNoaWZ0O1xuICAgICAgY29uc3QgdiA9ICh2YWx1ZSA+Pj4gbHNoKSA8PCByc2ggJiBtYXNrO1xuICAgICAgZGF0YVtpbmRleF0gPSBkYXRhW2luZGV4XSAmIH5tYXNrIHwgdjtcbiAgICB9XG4gIH1cbn1cblxuY29uc3QgTUVUQVNQUklURSA9IHByb3AoWzB4MzAwXSk7XG5jb25zdCBTUEVFRCA9IHByb3AoWzB4MzQwLCAweGZdKTtcbmNvbnN0IENPTExJU0lPTl9QTEFORSA9IHByb3AoWzB4M2EwLCAweGYwLCA0XSk7XG5jb25zdCBISVRCT1ggPSBwcm9wKFsweDQyMCwgMHg0MCwgMl0sIFsweDNhMCwgMHgwZl0pO1xuY29uc3QgSFAgPSBwcm9wKFsweDNjMF0pO1xuY29uc3QgQVRLID0gcHJvcChbMHgzZTBdKTtcbmNvbnN0IERFRiA9IHByb3AoWzB4NDAwXSk7XG5jb25zdCBMRVZFTCA9IHByb3AoWzB4NDIwLCAweDFmXSk7XG5jb25zdCBQT0lTT04gPSBwcm9wKFsweDQyMCwgMHg4MCwgN10pO1xuY29uc3QgQ0hJTEQgPSBwcm9wKFsweDQ0MF0pOyAvLyBhZC1ob2Mgc3Bhd24gaW5kZXhcbmNvbnN0IFRFUlJBSU5fU1VTQ0VQVElCSUxJVFkgPSBwcm9wKFsweDQ2MF0pO1xuY29uc3QgSU1NT0JJTEUgPSBwcm9wKFsweDRhMCwgMHg4MCwgN10pOyAvLyB3aWxsIG5vdCBiZSBrbm9ja2VkIGJhY2tcbmNvbnN0IEFDVElPTiA9IHByb3AoWzB4NGEwLCAweDdmXSk7XG5jb25zdCBSRVBMQUNFTUVOVCA9IHByb3AoWzB4NGMwXSk7XG5jb25zdCBHT0xEX0RST1AgPSBwcm9wKFsweDUwMCwgMHhmMCwgNF0pO1xuY29uc3QgRUxFTUVOVFMgPSBwcm9wKFsweDUwMCwgMHhmXSk7XG5jb25zdCBFWFBfUkVXQVJEID0gcHJvcChbMHg1MjBdKTtcbmNvbnN0IEFUVEFDS19UWVBFID0gcHJvcChbMHg1NDBdKTtcbmNvbnN0IFNUQVRVU19FRkZFQ1QgPSBwcm9wKFsweDU2MCwgMHhmXSk7XG4iXX0=