import { Rom } from '../rom.js';
import { Context } from './context.js';
import { ScreenEditor } from './screeneditor.js';
import { extendSwampScreens } from '../maze/swamp.js';
async function main() {
    const el = document.getElementById('load-rom');
    if (!el)
        throw new Error(`element not found`);
    const rom = await Rom.load(undefined, (picker) => {
        el.classList.add('visible');
        el.appendChild(picker);
    });
    extendSwampScreens(rom);
    el.classList.remove('visible');
    const context = new Context(rom);
    new ScreenEditor(context, document.getElementById('screen-editor'));
    window.screen = (id) => {
        console.log(new Array(15).fill(0).map((_, y) => rom.screens[id].tiles.slice(16 * y, 16 * y + 16).map(x => x.toString(16).padStart(2, '0')).join(' ')).join('\n'));
    };
}
main();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvanMvZWRpdC9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUMsR0FBRyxFQUFDLE1BQU0sV0FBVyxDQUFDO0FBQzlCLE9BQU8sRUFBQyxPQUFPLEVBQUMsTUFBTSxjQUFjLENBQUM7QUFDckMsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQy9DLE9BQU8sRUFBQyxrQkFBa0IsRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBRXBELEtBQUssVUFBVSxJQUFJO0lBQ2pCLE1BQU0sRUFBRSxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUMsVUFBVSxDQUFDLENBQUM7SUFDL0MsSUFBSSxDQUFDLEVBQUU7UUFBRSxNQUFNLElBQUksS0FBSyxDQUFDLG1CQUFtQixDQUFDLENBQUM7SUFDOUMsTUFBTSxHQUFHLEdBQUcsTUFBTSxHQUFHLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDLE1BQU0sRUFBRSxFQUFFO1FBQy9DLEVBQUUsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQzVCLEVBQUUsQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDekIsQ0FBQyxDQUFDLENBQUM7SUFDSCxrQkFBa0IsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUN4QixFQUFFLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUUvQixNQUFNLE9BQU8sR0FBRyxJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNqQyxJQUFJLFlBQVksQ0FBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLGNBQWMsQ0FBQyxlQUFlLENBQUUsQ0FBQyxDQUFDO0lBR3BFLE1BQWMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFVLEVBQUUsRUFBRTtRQUN0QyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQ25DLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEVBQUUsR0FBRyxDQUFDLEVBQUMsRUFBRSxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQzNELENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDbkUsQ0FBQyxDQUFDO0FBSUosQ0FBQztBQUVELElBQUksRUFBRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtSb219IGZyb20gJy4uL3JvbS5qcyc7XG5pbXBvcnQge0NvbnRleHR9IGZyb20gJy4vY29udGV4dC5qcyc7XG5pbXBvcnQge1NjcmVlbkVkaXRvcn0gZnJvbSAnLi9zY3JlZW5lZGl0b3IuanMnO1xuaW1wb3J0IHtleHRlbmRTd2FtcFNjcmVlbnN9IGZyb20gJy4uL21hemUvc3dhbXAuanMnO1xuXG5hc3luYyBmdW5jdGlvbiBtYWluKCkge1xuICBjb25zdCBlbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdsb2FkLXJvbScpO1xuICBpZiAoIWVsKSB0aHJvdyBuZXcgRXJyb3IoYGVsZW1lbnQgbm90IGZvdW5kYCk7XG4gIGNvbnN0IHJvbSA9IGF3YWl0IFJvbS5sb2FkKHVuZGVmaW5lZCwgKHBpY2tlcikgPT4ge1xuICAgIGVsLmNsYXNzTGlzdC5hZGQoJ3Zpc2libGUnKTtcbiAgICBlbC5hcHBlbmRDaGlsZChwaWNrZXIpO1xuICB9KTtcbiAgZXh0ZW5kU3dhbXBTY3JlZW5zKHJvbSk7XG4gIGVsLmNsYXNzTGlzdC5yZW1vdmUoJ3Zpc2libGUnKTtcblxuICBjb25zdCBjb250ZXh0ID0gbmV3IENvbnRleHQocm9tKTtcbiAgbmV3IFNjcmVlbkVkaXRvcihjb250ZXh0LCBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc2NyZWVuLWVkaXRvcicpISk7XG5cbiAgLy8gVE9ETyAtIGJldHRlciBVSSBmb3IgdGhpc1xuICAod2luZG93IGFzIGFueSkuc2NyZWVuID0gKGlkOiBudW1iZXIpID0+IHtcbiAgICBjb25zb2xlLmxvZyhuZXcgQXJyYXkoMTUpLmZpbGwoMCkubWFwKFxuICAgICAgKF8sIHkpID0+IHJvbS5zY3JlZW5zW2lkXS50aWxlcy5zbGljZSgxNiAqIHksMTYgKiB5ICsgMTYpLm1hcChcbiAgICAgICAgeCA9PiB4LnRvU3RyaW5nKDE2KS5wYWRTdGFydCgyLCAnMCcpKS5qb2luKCcgJykpLmpvaW4oJ1xcbicpKTtcbiAgfTtcbiAgLy8gcG9wdWxhdGUgc3R1ZmY/XG5cbiAgLy8gVE9ETyAtIHByb2plY3QgZmlsZT9cbn1cblxubWFpbigpO1xuIl19