import DB from "./DB.js";
import { Bey, Markup } from "./bey.js";

class Shohin {
    constructor({code, name, imgs, desc, type, color, class: classList}) {
        imgs ??= [];
        if (name && /XG?-\d+/.test(code)) {
            let c = code.match(/.XG?-\d+/)[0].replace('-', '');
            imgs = [`${Shohin.base}${c}@1.png`, ...imgs];
            imgs.push(...[2,3,4,5,6,7,8,9].map(n => `${Shohin.base}${c}${color ? `_${color}` : ''}_0${n}@1.png`));
        }
        return E('div', [
            E('h5', type ? [
                E(`ruby.below.${type}`, [
                    E('img', {src: `img/types.svg#${type}`}), 
                    E('rt', Shohin.type[type])]),
                    code
                ] : code),
            E('h4', name?.replaceAll('-', '‑').replaceAll('<br>', String.fromCharCode(10))), 
            ...imgs.map(src => E('figure', [
                E('a', '🖼️', {href: src}), E('img', {src})
            ])), 
            ...([desc ?? []].flat()).map(d => E('p', {innerHTML: Markup.spacing(d).replaceAll('-', '‑')}))
        ], {classList: [`scroller`, classList || Shohin.classes.find(code, {default: 'Lm'})]});
    }
    static classes = new O([
        [/(stadium|entry) set/i, 'SS'],
        [/組合|Set/i, 'St'],
        [/Starter/i, 'S'],
        [/Random/i, 'RB'],
        [/Booster/i, 'B'],
        [/.XG?-/, 'others'],
    ])
    static base = `https://beyblade.takaratomy.co.jp/beyblade-x/lineup/_image/`;
    static type = {att: 'ATTACK', bal: 'BALANCE', sta: 'STAMINA', def: 'DEFENSE'};
}
class Keihin {
    constructor({type, note, link, date, code, bey, ver, img: [src, style]}) {
        let names = new Bey([, , bey]);   
        return E(`li.keihin-${type}`, [
            E('em', Keihin.type[type]), 
            E('p', link ? [E('a', {href: link}, note)] : note),
            E('div', [
                E('figure>img', {src, style}), 
                E('h4', {lang: 'ja'}, [
                    E('code', code || ''), 
                    E('span', names.jap), 
                    E('small', {innerHTML: [ver?.[0] ?? '', names.only ? `（${names.only}）` : ''].filter(t => t).join('<br>')})
                ]),
            ]),
            E('h4', {lang: 'zh'}, [names.chi, E('small', [ver?.[1] ?? ''].filter(t => t).join(' '))]),
            E('time', date.replace('-','‒'))
        ]);
    }
    static type = {t: '比賽', d: '抽獎', m: '限定商品', g: '贈品'}
}

const Glossary = async () => {
    let p = [Q('p'), Q('x-part', []).map(part => part.shadowRoot.Q('p'))].flat(9).filter(el => el);
    if (!p.length) return;
    Glossary.search(p, await DB.get('meta', 'glossary'));

    let u = [Q('u'), Q('x-part', []).map(part => part.shadowRoot.Q('u'))].flat(9).filter(el => el);
    if (!u.length) return;
    Glossary.event(u);

    Q('#glossary') ?? Q('body').append(E('aside#glossary'));
}
Object.assign(Glossary, {
    search: (texts, glossary) => texts.forEach(p => {
        const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
        let node;
        while (node = walker.nextNode()) {
            const texts = node.nodeValue.split(/(\w[\w ]*\w)/);
            if (texts.length <= 1) continue;
            const fragment = new DocumentFragment();
            fragment.append(...texts.map(text => text in glossary ? E('u', text) : new Text(text)));
            node.replaceWith(fragment);
        }
    }),    
    event: terms => terms.forEach(u => u.onclick = ev => Glossary.lookup(ev)),
    lookup: async ev => {
        ev.stopPropagation();
        clearTimeout(Glossary.timer);
        let term = ev.target.innerText;
        let aside = Q('#glossary');
        aside.innerHTML = '';
        let [jap, def] = (await DB.get('meta', 'glossary'))[term];
        E(aside).set({
            '--left': `${ev.clientX}px`, '--top': `${ev.clientY}px`
        }, [
            E('dfn', [
                E('ruby', term, E('rt', jap.split('&')[0])),
                ' ', jap.split('&')[1] ?? ''
            ]), Markup.spacing(def)
        ]);
        Glossary.timer = setTimeout(() => aside.innerHTML = '', 3000);
    },
});
export {Shohin, Keihin, Glossary}