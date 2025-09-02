const Storage = (key, obj) => !obj ? 
    JSON.parse(localStorage[key] ?? 'null') : 
    localStorage[key] = typeof obj == 'object' ? JSON.stringify({...Storage(key), ...obj}) : obj;
    
const unsupported = document.createElement('style');
unsupported.textContent = `
    html::before {
        content:'請重新整理\\A如問題持續，需更新／換瀏覽器';
        opacity:1;
        animation:show .5s 1.5s forwards;
        z-index:1;
        background:black; color:black; font-size:3em;
        white-space:pre-wrap;
        position:fixed; width:100%; height:100%;
        display:flex; justify-content:center; align-items:center;
    }
    @keyframes show {to {color:white;}}`;
document.head.append(unsupported);
navigator.serviceWorker?.register('/X/worker.js', {scope: '/X/'}).then(() => {
    if (!document.querySelector('link[href$="common.css"]')) return Promise.reject();
    document.title += ' ■ 戰鬥陀螺 X⬧爆旋陀螺 X⬧ベイブレード X⬧Beyblade X';
    unsupported.remove();
}).catch(() => Storage('reloaded') < 3 && Storage('reloaded', Storage('reloaded') + 1) && setTimeout(() => location.reload(), 500));

addEventListener('DOMContentLoaded', () => {
    Q('[popover]')?.addEventListener('click', ev => ev.target.closest('[popover]').hidePopover());
    let menu = Q('nav menu');
    if (!menu) return;
    menu.append(E('li', [E('a', {href: '/X/', dataset: {icon: ''}} )] ));
    let hashchange = () => {
        Q('menu .current')?.classList.remove('current');
        Q('menu li a')?.find(a => new URL(a.href, document.baseURI).href == location.href)?.classList.add('current');
    };
    addEventListener('hashchange', hashchange);
    hashchange();
    Q('body').append(E('script', `
        import PointerInteraction from 'https://aeoq.github.io/pointer-interaction/script.js';
        PointerInteraction.events({
            'nav menu': {
                drag: PI => {
                    PI.drag.to.translate({x: {max: Q('nav menu').offsetLeft*-1 - 6}, y: false });
                    PI.drag.to.select({x: 0}, [...PI.target.children].filter(child => !child.matches(':has(.current),:last-child')));
                },
                lift: PI => Q('.PI-selected') && (location.href = PI.target.Q('.PI-selected a').href)
            }
        })`, {type: 'module'}));
    setTimeout(() => Q('nav').classList.add('safari'), 0);
});
