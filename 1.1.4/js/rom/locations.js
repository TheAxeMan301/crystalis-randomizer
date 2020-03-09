import { Location, LOCATIONS } from './location.js';
class LocationsClass extends Array {
    constructor(rom) {
        super(0x100);
        this.rom = rom;
        for (let id = 0; id < 0x100; id++) {
            this[id] = new Location(rom, id);
        }
        for (const key of Object.keys(LOCATIONS)) {
            const [id,] = namesTyped[key];
            this[key] = this[id];
        }
    }
    static get [Symbol.species]() { return Array; }
    partition(func, eq = (a, b) => a === b, joinNexuses = false) {
        const seen = new Set();
        const out = [];
        for (let loc of this) {
            if (seen.has(loc) || !loc.used)
                continue;
            seen.add(loc);
            const value = func(loc);
            const group = [];
            const queue = [loc];
            while (queue.length) {
                const next = queue.pop();
                group.push(next);
                for (const n of next.neighbors(joinNexuses)) {
                    if (!seen.has(n) && eq(func(n), value)) {
                        seen.add(n);
                        queue.push(n);
                    }
                }
            }
            out.push([[...group], value]);
        }
        return out;
    }
}
const namesTyped = LOCATIONS;
export const Locations = LocationsClass;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9jYXRpb25zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2pzL3JvbS9sb2NhdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsT0FBTyxFQUFDLFFBQVEsRUFBRSxTQUFTLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFFbEQsTUFBTSxjQUFlLFNBQVEsS0FBZTtJQUkxQyxZQUFxQixHQUFRO1FBQzNCLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztRQURNLFFBQUcsR0FBSCxHQUFHLENBQUs7UUFFM0IsS0FBSyxJQUFJLEVBQUUsR0FBRyxDQUFDLEVBQUUsRUFBRSxHQUFHLEtBQUssRUFBRSxFQUFFLEVBQUUsRUFBRTtZQUNqQyxJQUFJLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxRQUFRLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1NBQ2xDO1FBQ0QsS0FBSyxNQUFNLEdBQUcsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFO1lBQ3hDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsR0FBRyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDN0IsSUFBOEMsQ0FBQyxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7U0FDakU7SUFDSCxDQUFDO0lBWEQsTUFBTSxLQUFLLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxLQUFLLE9BQU8sS0FBSyxDQUFDLENBQUMsQ0FBQztJQWUvQyxTQUFTLENBQUksSUFBMEIsRUFBRSxLQUFZLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRSxXQUFXLEdBQUcsS0FBSztRQUN6RixNQUFNLElBQUksR0FBRyxJQUFJLEdBQUcsRUFBWSxDQUFDO1FBQ2pDLE1BQU0sR0FBRyxHQUFzQixFQUFFLENBQUM7UUFDbEMsS0FBSyxJQUFJLEdBQUcsSUFBSSxJQUFJLEVBQUU7WUFDcEIsSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUk7Z0JBQUUsU0FBUztZQUN6QyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ2QsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ3hCLE1BQU0sS0FBSyxHQUFHLEVBQUUsQ0FBQztZQUNqQixNQUFNLEtBQUssR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ3BCLE9BQU8sS0FBSyxDQUFDLE1BQU0sRUFBRTtnQkFDbkIsTUFBTSxJQUFJLEdBQUcsS0FBSyxDQUFDLEdBQUcsRUFBRyxDQUFDO2dCQUMxQixLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNqQixLQUFLLE1BQU0sQ0FBQyxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLEVBQUU7b0JBQzNDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLEVBQUU7d0JBQ3RDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7d0JBQ1osS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztxQkFDZjtpQkFDRjthQUNGO1lBQ0QsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO1NBQy9CO1FBQ0QsT0FBTyxHQUFHLENBQUM7SUFDYixDQUFDO0NBQ0Y7QUFJRCxNQUFNLFVBQVUsR0FBRyxTQUEwRCxDQUFDO0FBSTlFLE1BQU0sQ0FBQyxNQUFNLFNBQVMsR0FBK0IsY0FBcUIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7Um9tfSBmcm9tICcuLi9yb20uanMnO1xuaW1wb3J0IHtMb2NhdGlvbiwgTE9DQVRJT05TfSBmcm9tICcuL2xvY2F0aW9uLmpzJztcblxuY2xhc3MgTG9jYXRpb25zQ2xhc3MgZXh0ZW5kcyBBcnJheTxMb2NhdGlvbj4ge1xuICBcbiAgc3RhdGljIGdldCBbU3ltYm9sLnNwZWNpZXNdKCkgeyByZXR1cm4gQXJyYXk7IH1cblxuICBjb25zdHJ1Y3RvcihyZWFkb25seSByb206IFJvbSkge1xuICAgIHN1cGVyKDB4MTAwKTtcbiAgICBmb3IgKGxldCBpZCA9IDA7IGlkIDwgMHgxMDA7IGlkKyspIHtcbiAgICAgIHRoaXNbaWRdID0gbmV3IExvY2F0aW9uKHJvbSwgaWQpO1xuICAgIH1cbiAgICBmb3IgKGNvbnN0IGtleSBvZiBPYmplY3Qua2V5cyhMT0NBVElPTlMpKSB7XG4gICAgICBjb25zdCBbaWQsXSA9IG5hbWVzVHlwZWRba2V5XTtcbiAgICAgICh0aGlzIGFzIHVua25vd24gYXMge1tuYW1lOiBzdHJpbmddOiBMb2NhdGlvbn0pW2tleV0gPSB0aGlzW2lkXTtcbiAgICB9XG4gIH1cblxuICAvLyBGaW5kIGFsbCBncm91cHMgb2YgbmVpZ2hib3JpbmcgbG9jYXRpb25zIHdpdGggbWF0Y2hpbmcgcHJvcGVydGllcy5cbiAgLy8gVE9ETyAtIG9wdGlvbmFsIGFyZzogY2hlY2sgYWRqYWNlbnQgIyBJRHMuLi4/XG4gIHBhcnRpdGlvbjxUPihmdW5jOiAobG9jOiBMb2NhdGlvbikgPT4gVCwgZXE6IEVxPFQ+ID0gKGEsIGIpID0+IGEgPT09IGIsIGpvaW5OZXh1c2VzID0gZmFsc2UpOiBbTG9jYXRpb25bXSwgVF1bXSB7XG4gICAgY29uc3Qgc2VlbiA9IG5ldyBTZXQ8TG9jYXRpb24+KCk7XG4gICAgY29uc3Qgb3V0OiBbTG9jYXRpb25bXSwgVF1bXSA9IFtdO1xuICAgIGZvciAobGV0IGxvYyBvZiB0aGlzKSB7XG4gICAgICBpZiAoc2Vlbi5oYXMobG9jKSB8fCAhbG9jLnVzZWQpIGNvbnRpbnVlO1xuICAgICAgc2Vlbi5hZGQobG9jKTtcbiAgICAgIGNvbnN0IHZhbHVlID0gZnVuYyhsb2MpO1xuICAgICAgY29uc3QgZ3JvdXAgPSBbXTtcbiAgICAgIGNvbnN0IHF1ZXVlID0gW2xvY107XG4gICAgICB3aGlsZSAocXVldWUubGVuZ3RoKSB7XG4gICAgICAgIGNvbnN0IG5leHQgPSBxdWV1ZS5wb3AoKSE7XG4gICAgICAgIGdyb3VwLnB1c2gobmV4dCk7XG4gICAgICAgIGZvciAoY29uc3QgbiBvZiBuZXh0Lm5laWdoYm9ycyhqb2luTmV4dXNlcykpIHtcbiAgICAgICAgICBpZiAoIXNlZW4uaGFzKG4pICYmIGVxKGZ1bmMobiksIHZhbHVlKSkge1xuICAgICAgICAgICAgc2Vlbi5hZGQobik7XG4gICAgICAgICAgICBxdWV1ZS5wdXNoKG4pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgb3V0LnB1c2goW1suLi5ncm91cF0sIHZhbHVlXSk7XG4gICAgfVxuICAgIHJldHVybiBvdXQ7XG4gIH1cbn1cblxudHlwZSBFcTxUPiA9IChhOiBULCBiOiBUKSA9PiBib29sZWFuO1xuXG5jb25zdCBuYW1lc1R5cGVkID0gTE9DQVRJT05TIGFzIHVua25vd24gYXMge1tuYW1lOiBzdHJpbmddOiBbbnVtYmVyLCBzdHJpbmddfTtcblxuZXhwb3J0IHR5cGUgTG9jYXRpb25zID0gTG9jYXRpb25zQ2xhc3MgJiB7W1QgaW4ga2V5b2YgdHlwZW9mIExPQ0FUSU9OU106IExvY2F0aW9ufTtcblxuZXhwb3J0IGNvbnN0IExvY2F0aW9uczoge25ldyhyb206IFJvbSk6IExvY2F0aW9uc30gPSBMb2NhdGlvbnNDbGFzcyBhcyBhbnk7XG4iXX0=