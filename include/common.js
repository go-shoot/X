Q = Node.prototype.Q = function(el, func) {
    let els = this.querySelectorAll?.(el) ?? document.querySelectorAll(el);
    return func ? els.forEach(func) : els.length > 1 ? [...els] : els[0];
}
Node.prototype.sQ = function(el) {return this.shadowRoot.Q(el);}
location.isIndex = location.pathname == '/X/';

Q('head').insertAdjacentHTML('beforeend', `<style id=unsupported>
    html::before {
        content:'請重新整理\\A如問題持續，需更新／換瀏覽器';
        opacity:1;
        animation:show .5s 1.5s forwards;
        z-index:9;
        background:black; color:black; font-size:3em;
        white-space:pre-wrap;
        position:fixed; width:100%; height:100%;
        display:flex; justify-content:center; align-items:center;
    }
    @keyframes show {to {color:white;}}
    </style>`);
navigator.serviceWorker?.register('/X/worker.js', {scope: '/X/'}).then(() => {
    if (!Q('link[href$="common.css"]')) return Promise.reject();
    document.title += ' ■ 戰鬥陀螺 X⬧爆旋陀螺 X⬧ベイブレード X⬧Beyblade X';
    Q('#unsupported')?.remove();
}).catch(() => location.reload());

addEventListener('DOMContentLoaded', () => {
    let menu = Q('nav menu');
    if (menu) {
        menu.append(E('li', [E('a', {href: '/', dataset: {icon: ''}} )] ));
        let hashchange = () => {
            Q('menu .current')?.classList.remove('current');
            Q('menu li a')?.find(a => new URL(a.href, document.baseURI).href == location.href)?.classList.add('current');
        };
        addEventListener('hashchange', hashchange);
        hashchange();
        new Dragging(menu, {
            what: 'nav menu',
            translate: {x: {max: menu => menu.offsetLeft*-1 - 6}, y: false},
            move: drag => drag.to.select(0),
            lift (drop, dragged) {
                dragged.Q('.selected') && (location.href = dragged.Q('.selected a').href);
                drop.to.return();
            }
        });
        setTimeout(() => Q('nav').classList.add('safari'), 200);
    }
    Q('[popover]')?.addEventListener('click', ev => ev.target.closest('[popover]').hidePopover());
    document.querySelectorAll('a[href]').forEach(a => a.href = a.href.replace(/go-shoot\.github\.io(?!\/X)/, 'go-shoot.github.io/X'));
});
const E = (el, ...stuff) => {
    let [text, attr, children] = ['String', 'Object', 'Array'].map(t => stuff.find(s => Object.prototype.toString.call(s).includes(t)));
    text && (attr = {textContent: text, ...attr ?? {}});
    el == 'img' && (attr &&= {alt: attr.src.match(/([^/.]+)(\.[^/.]+)$/)?.[1], onerror: ev => ev.target.remove(), ...attr ?? {}});
    el = ['svg', 'use', 'path'].includes(el) ? document.createElementNS('http://www.w3.org/2000/svg', el) : document.createElement(el);
    el.append(...children ?? []);
    Object.assign(el.style, attr?.style ?? {});
    Object.assign(el.dataset, attr?.dataset ?? {});
    return Object.assign(el, (({style, dataset, ...attr}) => attr)(attr ?? {}));
}

const Storage = (key, obj) => !obj ? 
    JSON.parse(localStorage[key] ?? 'null') : 
    localStorage[key] = typeof obj == 'object' ? JSON.stringify({...Storage(key), ...obj}) : obj;

class Mapping {
    constructor(...map) {
        this.default = map.length % 2 ? map.pop() : null;
        this.map = new Map(map.flatMap((item, i, ar) => i % 2 ? [] : [[item, ar[i + 1]]]));
    }
    find = (...keys) => {
        let found, evaluate = typeof keys.at(-1) == 'boolean' && keys.pop();
        let key = keys.find(key => (found = 
            [...this.map.entries()].find(([k]) =>
                k instanceof RegExp && k.test(key) || k instanceof Array && k.find(item => item == key) ||
                k instanceof Function && k(key) || k == key
            )?.[1] ?? this.default
        ) != null);
        if (found instanceof Function)
            return evaluate ? found(key) : found;
        if (found instanceof Array)
            return found.map(item => typeof item == 'string' ? item.replaceAll('${}', key) : (item ?? ''));
        return found && typeof found == 'string' ? found.replaceAll('${}', key) : (found ?? '');
    }
    static maps = {};
}
