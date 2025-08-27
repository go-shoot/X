
import DB from '../include/DB.js'
import { spacing } from './utilities.js';
import { Bey, Finder, Previewer, Markup } from './bey.js';

let META, PARTS;
class Part {
    static import = (meta, parts) => ([META, PARTS] = [meta, parts]) && Bey.import(meta, parts);
    #path; #tile;
    constructor(json) {Object.assign(this, json);}
    push (json) {return Object.assign(this, json);}
    get path () {return this.#path ??= [this.constructor.name.toLowerCase(), this.abbr];}
    tile (execute) {
        this.#tile ??= new Tile(this);
        execute && !this.#tile.shadowRoot.Q('object') && this.#tile.html();
        return this.#tile;
    }
    cell () {return new Cell(this);}

    revise (revisions, base, pref) {
        revisions?.forEach(what => this[what] = this.#revised[what](base, pref));
        return this;
    }
    #revised = {
        group: base => base.group ?? new O(META.ratchet.height).find(([, dmm]) => this.abbr.split('-')[1] >= dmm)[0],
        names: (base, pref) => new O(base?.names ?? base).prepend(...[...pref].reverse().map(p => META.bit.prefix[p])),
        stat: base => this.stat.length === 1 ? [this.stat[0], ...base.stat.slice(1)] : this.stat,
        attr: (base, pref) => [...this.attr ?? [], ...base.attr, ...pref],
        desc: (base, pref) => [...pref].map(p => META.bit.prefix[p].desc).join('、') + `的【${base.abbr}】Bit${this.desc ? `，${this.desc}` : '。'}`,
    }
}
class Blade extends Part {
    #path;
    constructor(json) {super(json);}
    get path () {return this.#path ??= this.line ? ['blade', this.line, this.group, this.abbr] : super.path;}
    static sub = ['motif', 'upper', 'lower'];
}
class Ratchet extends Part {
    constructor(json) {super(json);}
    revise (where = 'tile') {return super.revise(Ratchet.revisions[where], {stat: [, ...this.abbr.split('-')]});}
    static revisions = {tile: ['group', 'stat']}
}
class Bit extends Part {
    constructor(json) {super(json);}
    async revise (where = 'tile') {
        if (Bit.revisions[where].every(p => this[p])) return this;
        let [, pref, base] = new RegExp(`^([${new O(META.bit.prefix)}]+)([^a-z].*)$`).exec(this.abbr);
        Bit.revisions[where].some(p => !PARTS.bit[base][p]) && PARTS.bit[base].push(await DB.get('bit', base));
        return super.revise(Bit.revisions[where], PARTS.bit[base], pref);
    }
    static revisions = {cell: ['names'], tile: ['group', 'names', 'attr', 'stat', 'desc']}
}
class Tile extends HTMLElement {
    constructor(Part) {
        super();
        let {path, group, attr} = Part;
        (this.Part = Part).named = path[0] == 'blade' && !path[2] || ['motif','upper'].includes(path[2]);
        this.attachShadow({mode: 'open'}).append(
            E('link', {rel: 'stylesheet', href: '../include/common.css'}),
            E('link', {rel: 'stylesheet', href: '../include/part.css'}),
        );
        E(this).set({
            id: path.at(-1),
            classList: [...new Set([...path.slice(0, -1), group, ...attr?.filter(a => !/^.X$/.test(a)) ?? []])],
            style: {visibility: 'hidden'},
            onclick: () => location.href.includes('parts') ? Previewer.cell(this.Part.path) : Finder.filter(this.Part.path)
        });
    }
    html () {
        Q('#triangle') || Tile.triangle();
        let {path, desc, from} = this.html.Part = this.Part;
        this.shadowRoot.append(
            Q('#triangle').cloneNode(true),
            E('object', {data: this.html.background()}),
            E('figure>img', {src: `../img/${path.join('/')}.png`}),
            E.ul(this.html.icons()),
            E('p', spacing(desc)),
            ...this.html.stat(),
            ...this.html.names(),
            E('div', META.types.map(t => E(`svg.${t}`, {viewBox: '-10 -10 20 10'}, E('use', {href: '#triangle'})))),
            from ? E('a', from.split('.')[1] ?? from, {
                href: from.includes('.') ? `?blade=${from.replace('.', '#')}` : `?blade#${from}`, 
                onclick: ev => ev.stopPropagation()
            }) : '',
        );
    }
    static hue = {}
    static icon = new O([
        [/^[A-Z]+X$/, l => E('img', {src: `../img/lines.svg#${l}`})],
        [['BSB','MFB','BBB'], g => E('img', {src: `../img/system-${g}.png`})],
        [['att','bal','def','sta'], t => E('img', {src: `../img/types.svg#${t}`})]
    ], {left: '\ue01d', right: '\ue01e'})
}
Object.assign(Tile.prototype.html, {
    background () {
        let {comp, attr} = this.Part;
        let selector = `.${comp}${attr?.includes('fusion') ? '.fusion' : ''}`;
        Tile.hue[selector] ??= [...document.styleSheets]
            .filter(({href}) => new URL(href).host == location.host)
            .flatMap(css => [...css.cssRules])
            .find(rule => rule.selectorText == selector)
            .styleMap.get('--c')[0];

        let spin = attr?.includes('left') ^ attr?.includes('right');
        let param = {
            hue: Tile.hue[selector],
            ...spin ? {[attr?.find(a => a == 'left' || a == 'right')]: ''} : {}
        };
        return `../parts/bg.svg?${new URLSearchParams(param)}`;
    },
    icons () {
        let {line, group, attr} = this.Part;
        return [...new Set([line, group, ...attr ?? []])].map(a => Tile.icon.find(a, {evaluate: true}));
    },
    names () {
        let {path, named, names} = this.Part;
        return [
            named ? Markup('tile', names.chi)?.map(els => E('h5.chi', els)) ?? '' : E('h4', path.at(-1).replace('-', '‒')), 
            names ? ['jap', 'eng'].map(l => E(`h5.${l}`, Markup('tile', names[l])[0] ?? '')) : ''
        ].flat(9);
    },
    stat () {
        let {comp, stat, date, attr} = this.Part;
        let terms = META[comp][attr?.includes('fusion') ? 'terms.fusion' : 'terms'];
        return [
            date ? E('strong', date) : '',
            E('dl', stat.flatMap((s, i) => [
                E('dt', Markup('stat', terms[i])), 
                E('dd', typeof s == 'string' ? Markup('stat', s) : s)
            ]))
        ];
    },
});
Tile.triangle = () => {
    let [r1, r2] = [.75, 1], corner = {side: {}};
    corner.side.x = r1 / Math.tan(Math.PI / 8);
    corner.side.y = corner.side.x * Math.SQRT1_2;
    corner.top = r2 / Math.SQRT2;
    document.body.append(E('svg>defs>path', {id: 'triangle', d: 
        `M ${corner.side.x-10},-10 A ${r1},${r1},0,0,0,${corner.side.y-10},${corner.side.y-10}
        L -${corner.top},-${corner.top} A ${r2},${r2},0,0,0,${corner.top},-${corner.top}
        L ${10-corner.side.y},${corner.side.y-10} A ${r1},${r1},0,0,0,${10-corner.side.x},-10 Z`
    }));
};
customElements.define('x-part', Tile);

class Cell {
    constructor({path, attr}) {
        this.path = path;
        const named = ['blade','ratchet'].includes(path[0]) && !path[2] || ['motif','upper'].includes(path[2]);
        let tds = [E('td', this.attr[path[0]]?.() ?? {}), !named ? E('td') : ''];
        if (path.at(-1) == null)
            return tds;
        E(tds[0]).set({
            abbr: path.at(-1), 
            headers: path[2] ?? path[0],
            innerText: path.at(-1) || '', 
            ...attr?.includes('fusion') ? {classList: 'fusion'} : {},
            onclick: () => location.href.includes('products') && Previewer.tile(path)
        });
        tds[0].path = path;
        tds[1] && E(tds[1]).set({headers: tds[0].headers, onclick: tds[0].onclick});
        return tds;
    }
    attr = {
        blade: () => !this.path[2] ? {colSpan: 4} : {},
    }
    static fill = (lang, td) => [td ?? Q('td[abbr]:not([headers=ratchet])')].flat().forEach(td => {
        if (!td) return;
        let next = td.nextElementSibling;
        Cell.html(lang, td.path, JSON.parse(td.dataset.mode ?? '""'))
            .then(name => (next?.headers == td.headers ? next : td).replaceChildren(...name));
    })
    static async html (lang, path, mode) {
        let names = PARTS.at(path).names ?? (path[0] == 'bit' && await PARTS.at(path).revise('cell')).names;
        if (!names) return [];
        let content = [...Markup('cell', names[lang] || names.eng), mode ? E('sub', mode[lang] || mode.eng) : ''];
        return names[lang]?.length >= Cell.limit[lang]?.at(path.slice(0, -1)) ? [E('small', content)] : content;
    }
    static limit = {jap: new O({blade: {CX: {lower: 5}}, bit: 7})};
}
Part.blade = Blade, Part.ratchet = Ratchet, Part.bit = Bit;
export {Part, Tile, Cell};