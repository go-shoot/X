
import DB from '../include/DB.js'
import { Markup, spacing } from './utilities.js';
import { Finder } from '../products/table.js';
let META, DICT = {};
class Part {
    static import = meta => META = meta;
    #tile; #cell;
    constructor(json) {Object.assign(this, json);}
    supplement (json) {Object.assign(this, json);}
    tile () {return this.#tile ??= new Tile({...this});}
    cell () {return }

    async revise(revisions, ref, pref) {
        revisions?.forEach(what => this.#revise[what](ref, pref));
        return this;
    }
    #revise = {
        group: () => this.group = new O(META.ratchet.height).find(([_, dmm]) => this.abbr.split('-')[1] >= dmm)[0],
        stat: ref => this.stat.length === 1 && this.stat.push(...ref.stat.slice(1)),
        name: (ref, pref) => this.names = Part.revise.name(ref, pref),
        attr: (ref, pref) => [this.group, this.attr] = [ref.group, [...this.attr ?? [], ...ref.attr, ...pref]],
        desc: (ref, pref) => this.desc = [...pref].map(p => META.bit.prefix[p].desc).join('、') + `的【${ref.abbr}】Bit${this.desc ? `，${this.desc}` : '。'}`,
    }
    static revise = {
        name: (ref, pref) => new O(ref?.names ?? ref).prepend(...[...pref].reverse().map(p => META.bit.prefix[p])),
    }
    strip (what) {return this.comp == 'bit' ? Part.strip(this.abbr, what) : this.abbr;}
    static strip = (abbr, what) => abbr.replace(what == 'dash' ? '′' : new RegExp(`^[${new O(META.bit.prefix)}]+(?=[^′a-z])|′`, what == 'prefORdash' ? '' : 'g'), '');
    
    cell = {
        abbr: html => E('td', {
            innerHTML: html ?? this.abbr.replace(/^[A-Z]$/, ' $&'), 
            abbr: this.abbr, 
            headers: this.line ? this.group : this.comp,
            classList: this.attr.includes('fusion') ? 'fusion' : ''
        }),
        none: () => [E('td'), E('td'), E('td.right')]
    }
}
class Blade extends Part {
    constructor(json) {super(json);}
}
class Ratchet extends Part {
    constructor(json) {super(json);}
    revise () {
        return super.revise(['group', 'stat'], {stat: ['', ...this.abbr.split('-')]});
    }
}
class Bit extends Part {
    constructor(json) {super(json);}
    async revise () {
        if (this.names) return this;
        let [, pref, ref] = new RegExp(`^([${new O(META.bit.prefix)}]+)([^a-z].*)$`).exec(this.abbr);
        return super.revise(['name', 'attr', 'stat', 'desc'], DICT[ref] ??= await DB.get('bit', ref), pref);
    }
}
class Tile extends HTMLElement {
    constructor(json, show = true) {
        super();
        Object.assign(this, json);
        this.attachShadow({mode: 'open'}).append(
            E('link', {rel: 'stylesheet', href: '../include/common.css'}),
            E('link', {rel: 'stylesheet', href: 'part.css'}),
            ...this.html()
        );
        let {abbr, comp, line, group, attr} = this;
        E(this).set({
            id: abbr,
            classList: [comp, line, group, ...(attr ?? []).filter(a => !/.X$/.test(a))],
            hidden: !show,
        });
        let query = this.line ? {line: this.line, [group]: abbr} : {[comp]: abbr};
        this.onclick = () => DB.get('product', 'beys').then(beys => {
            Finder.find(new O(query));
            console.log(beys.filter(bey => Finder.regexp.some(r => r.test?.(bey[2]))));
        });
    }
    html () {
        Q('#triangle') || Tile.triangle();
        let {comp, line, group, abbr} = this;
        this.html.part = this;
        let path = [comp, line ? `${line}-${group}` : '', abbr].filter(p => p).join('/');
        return [
            Q('#triangle').cloneNode(true),
            E('object', {data: this.html.background()}),
            E('figure', E('img', {src: `../img/${path}.png`})),
            this.html.icons(),
            E('p', spacing(this.desc)),
            ...this.stat ? this.html.stat() : [],
            ...this.html.names(),
            E('div', META.types.map(t => E('svg', {class: t, viewBox: '-10 -10 20 10'}, E('use', {href: '#triangle'})))),
            this.from ? E('a', this.from, {href: `/parts/?blade=一體#${this.from}`}) : '',
        ];
    }
    static hue = {}
    static icon = new O([
        [/^D..$/, 'BSB'],
        [/\d$/, 'BBB'],
        [/^[A-Z]+X$/, l => E('img', {src: `../img/lines.svg#${l}`})],
        [/^(?:att|def|sta|bal)$/, t => E('img', {src: `../img/types.svg#${t}`})] ], {
        left: '\ue01d', right: '\ue01e'
    })
}
Object.assign(Tile.prototype.html, {
    background () {
        let {comp, attr} = this.part;
        let selector = `.${comp}${attr?.includes('fusion') ? '.fusion' : ''}`;
        Tile.hue[selector] ??= [...document.styleSheets]
            .filter(({ href }) => new URL(href).host == location.host)
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
        let {abbr, line, group, attr} = this.part;
        return E.ul([
            group == 'remake' ? E('img', {src: `../img/system-${Tile.icon.find(abbr, {default: 'MFB'})}.png`}) : '', 
            line || group.endsWith('X') ? Tile.icon.find(line ?? group, {evaluate: true}) : '', 
            ...attr?.map(a => Tile.icon.find(a, {evaluate: true})) ?? ''
        ]);
    },
    names () {
        let {abbr, comp, group, names, attr} = this.part;
        names ??= {};
        names.chi = names.chi?.split(' ') ?? [];
        return comp != 'blade' || group == 'lower' ? 
            [
                E('h4', abbr.replace('-', '‒')), 
                ...['jap','eng'].map(l => E(`h5.${l}`, {innerHTML: Markup(names[l] || '', 'parts')}))
            ] : 
            [
                ...names.chi.map(n => E('h5.chi', {innerHTML: Markup(n, group == 'collab' || attr.includes('BSB') ? '' : 'parts')})),
                E('h5.jap', {innerHTML: Markup(names.jap, 'parts')}),
                E('h5.eng', {innerHTML: ['hasbro','collab'].includes(group) ? names.eng : Markup(names.eng, 'parts')}),
            ];
    },
    stat () {
        let {comp, stat, date, attr} = this.part;
        let terms = META[comp][attr?.includes('fusion') ? 'terms.fusion' : 'terms'];
        return [
            date ? E('strong', date) : '',
            E.dl(stat.map((s, i) => [
                terms[i]?.replace(/(?<=[A-Z ])(?=[一-龢])/, `
`) ?? '',
                {innerHTML: Markup(`${s}`, 'stats')}
            ]))
        ];
    },
});
Tile.triangle = () => {
    let [r1, r2] = [.75, 1];
    let cornerAdjustX = r1 / Math.tan(Math.PI / 8);
    let cornerAdjustY = cornerAdjustX * Math.SQRT1_2;
    let topAdjust = r2 / Math.SQRT2;
    document.body.append(E('svg', E('defs', E('path', {id: 'triangle'}))));
    E(Q('#triangle')).set({d: 
        `M ${cornerAdjustX-10},-10 A ${r1},${r1},0,0,0,${cornerAdjustY-10},${cornerAdjustY-10}
        L -${topAdjust},-${topAdjust} A ${r2},${r2},0,0,0,${topAdjust},-${topAdjust}
        L ${10-cornerAdjustY},${cornerAdjustY-10} A ${r1},${r1},0,0,0,${10-cornerAdjustX},-10 Z`
    });
};
Finder();
customElements.define('x-part', Tile);
const Classes = {blade: Blade, ratchet: Ratchet, bit: Bit};
export {Part, Tile, Classes};