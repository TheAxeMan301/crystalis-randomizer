import { shuffleCave } from '../maze/cave.js';
import { extendGoaScreens, shuffleGoa1 } from '../maze/goa.js';
import { shuffleSwamp } from '../maze/swamp.js';
import { shufflePyramid } from '../maze/pyramid.js';
export function shuffleMazes(rom, random) {
    shufflePyramid(rom, random);
    shuffleSwamp(rom, random);
    shuffleGoa1(rom, random);
    for (const cave of SHUFFLED_CAVES) {
        shuffleCave(rom.locations[cave], random);
    }
}
export function prepareScreens(rom) {
    extendGoaScreens(rom);
}
const SHUFFLED_CAVES = [
    0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0c,
    0x0e,
    0x10,
    0x11, 0x22, 0x23, 0x24, 0x25, 0x26, 0x27,
    0x2a, 0x2b, 0x2c, 0x2d, 0x2e, 0x31, 0x33, 0x34, 0x35, 0x38, 0x39,
    0x44, 0x45, 0x46,
    0x48, 0x49, 0x4a, 0x4b, 0x4c, 0x4d, 0x4e, 0x4f,
    0x54, 0x55, 0x56, 0x57,
    0x69,
    0x70,
    0x7d, 0x7f, 0x80, 0x81, 0x82, 0x83, 0x84, 0x85, 0x86, 0x87,
    0x8f,
    0x92, 0x95,
    0x9d,
    0xab,
    0xb0, 0xb1, 0xb2, 0xb3,
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2h1ZmZsZW1hemVzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2pzL3Bhc3Mvc2h1ZmZsZW1hemVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQztBQUM1QyxPQUFPLEVBQUMsZ0JBQWdCLEVBQUUsV0FBVyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDN0QsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBQzlDLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUlsRCxNQUFNLFVBQVUsWUFBWSxDQUFDLEdBQVEsRUFBRSxNQUFjO0lBQ25ELGNBQWMsQ0FBQyxHQUFHLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDNUIsWUFBWSxDQUFDLEdBQUcsRUFBRSxNQUFNLENBQUMsQ0FBQztJQUMxQixXQUFXLENBQUMsR0FBRyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQ3pCLEtBQUssTUFBTSxJQUFJLElBQUksY0FBYyxFQUFFO1FBQ2pDLFdBQVcsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0tBQzFDO0FBQ0gsQ0FBQztBQUVELE1BQU0sVUFBVSxjQUFjLENBQUMsR0FBUTtJQUNyQyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUN4QixDQUFDO0FBRUQsTUFBTSxjQUFjLEdBQUc7SUFFckIsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUk7SUFFOUMsSUFBSTtJQUVKLElBQUk7SUFFSixJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJO0lBRXhDLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJO0lBRWhFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSTtJQUVoQixJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSTtJQUU5QyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJO0lBRXRCLElBQUk7SUFJSixJQUFJO0lBRUosSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSTtJQUkxRCxJQUFJO0lBSUosSUFBSSxFQUFFLElBQUk7SUFFVixJQUFJO0lBTUosSUFBSTtJQUlKLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUk7Q0FDdkIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7c2h1ZmZsZUNhdmV9IGZyb20gJy4uL21hemUvY2F2ZS5qcyc7XG5pbXBvcnQge2V4dGVuZEdvYVNjcmVlbnMsIHNodWZmbGVHb2ExfSBmcm9tICcuLi9tYXplL2dvYS5qcyc7XG5pbXBvcnQge3NodWZmbGVTd2FtcH0gZnJvbSAnLi4vbWF6ZS9zd2FtcC5qcyc7XG5pbXBvcnQge3NodWZmbGVQeXJhbWlkfSBmcm9tICcuLi9tYXplL3B5cmFtaWQuanMnO1xuaW1wb3J0IHtSYW5kb219IGZyb20gJy4uL3JhbmRvbS5qcyc7XG5pbXBvcnQge1JvbX0gZnJvbSAnLi4vcm9tLmpzJztcblxuZXhwb3J0IGZ1bmN0aW9uIHNodWZmbGVNYXplcyhyb206IFJvbSwgcmFuZG9tOiBSYW5kb20pIHtcbiAgc2h1ZmZsZVB5cmFtaWQocm9tLCByYW5kb20pO1xuICBzaHVmZmxlU3dhbXAocm9tLCByYW5kb20pO1xuICBzaHVmZmxlR29hMShyb20sIHJhbmRvbSk7XG4gIGZvciAoY29uc3QgY2F2ZSBvZiBTSFVGRkxFRF9DQVZFUykge1xuICAgIHNodWZmbGVDYXZlKHJvbS5sb2NhdGlvbnNbY2F2ZV0sIHJhbmRvbSk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHByZXBhcmVTY3JlZW5zKHJvbTogUm9tKSB7XG4gIGV4dGVuZEdvYVNjcmVlbnMocm9tKTtcbn1cblxuY29uc3QgU0hVRkZMRURfQ0FWRVMgPSBbXG4gIC8vIFNlYWxlZCBDYXZlXG4gIDB4MDQsIDB4MDUsIDB4MDYsIDB4MDcsIDB4MDgsIDB4MDksIDB4MGEsIDB4MGMsXG4gIC8vIFdpbmRtaWxsIENhdmVcbiAgMHgwZSxcbiAgLy8gWmVidSBDYXZlXG4gIDB4MTAsXG4gIC8vIE10IFNhYnJlIFdcbiAgMHgxMSwgMHgyMiwgMHgyMywgMHgyNCwgMHgyNSwgMHgyNiwgMHgyNyxcbiAgLy8gTXQgU2FicmUgTlxuICAweDJhLCAweDJiLCAweDJjLCAweDJkLCAweDJlLCAweDMxLCAweDMzLCAweDM0LCAweDM1LCAweDM4LCAweDM5LFxuICAvLyBLaXJpc2FcbiAgMHg0NCwgMHg0NSwgMHg0NixcbiAgLy8gRm9nIExhbXBcbiAgMHg0OCwgMHg0OSwgMHg0YSwgMHg0YiwgMHg0YywgMHg0ZCwgMHg0ZSwgMHg0ZixcbiAgLy8gV2F0ZXJmYWxsXG4gIDB4NTQsIDB4NTUsIDB4NTYsIDB4NTcsIC8vIGNhbid0IGhhbmRsZSB0aGlzIG9uZSB5ZXRcbiAgLy8gRXZpbCBzcGlyaXRcbiAgMHg2OSwgLy8gMHg2YSwgMHg2YlxuICAvLyBTYWJlcmEgcGFsYWNlIChwcm9iYWJseSBqdXN0IHNraXAgc2FiZXJhIG1hcCA2ZSlcbiAgLy8gMHg2YywgMHg2ZFxuICAvLyBKb2VsIHBhc3NhZ2VcbiAgMHg3MCxcbiAgLy8gTXQgSHlkcmFcbiAgMHg3ZCwgMHg3ZiwgMHg4MCwgMHg4MSwgMHg4MiwgMHg4MywgMHg4NCwgMHg4NSwgMHg4NiwgMHg4NyxcbiAgLy8gU3R4eVxuICAvLyAweDg4LCAweDg5LCAweDhhLFxuICAvLyBHb2EgQmFzZW1lbnRcbiAgMHg4ZixcbiAgLy8gT2FzaXMgQ2F2ZVxuICAvLyAweDkxLCAweGI4LCBcbiAgLy8gQ29ubmVjdG9yc1xuICAweDkyLCAweDk1LFxuICAvLyBQeXJhbWlkXG4gIDB4OWQsIC8vMHg5ZSxcbiAgLy8gQ3J5cHRcbiAgLy8gMHhhMCwgMHhhMSwgMHhhMiwgMHhhMywgMHhhNCwgMHhhNSxcbiAgLy8gR29hIC0gS2VsYmVzcXVlIDJcbiAgLy8gMHhhOCwgMHhhOSwgLy8gTk9URTogYTkgaGFuZGxlZCBieSBzaHVmZmxlR29hMVxuICAvLyBHb2EgLSBTYWJlcmEgMlxuICAweGFiLFxuICAvLyBHb2EgLSBNYWRvIDJcbiAgLy8gMHhhZCwgMHhhZSwgMHhhZiwgMHhiOVxuICAvLyBHb2EgLSBLYXJtaW5lXG4gIDB4YjAsIDB4YjEsIDB4YjIsIDB4YjMsIC8vIDB4YjQsIDB4YjUsIDB4YjgsXG5dO1xuIl19