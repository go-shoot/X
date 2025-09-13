import DB from './DB.js';
import { Part, Cell } from './part.js';
import Maps from '../products/maps.js';

let META, PARTS;

class Bey {
    static import = (meta, parts) => [META, PARTS] = [meta, parts];
    constructor([code, type, abbr, ...others]) {
        if (code == 'BH') return new Text();
        this.abbr = abbr;
        let [blade, ratchet, bit] = abbr.split(' ');

        this.line = META.blade.delimiter.find(([, char]) => (blade = blade.split(char)).length > 1)?.[0];
        this.blade = blade.length > 1 ? 
            blade.map((b, i) => PARTS.blade[this.line][Part.blade.sub[i]][b]) ?? new Part.blade() : 
            PARTS.blade[blade[0]] ?? new Part.blade();
        this.ratchet = PARTS.ratchet[ratchet] ?? new Part.ratchet();
        this.bit = PARTS.bit[bit] ?? new Part.bit();
        return location.href.includes('prize') ? this.fullnames() : new Row(this, code, type, others);
    }
    fullnames = () => {
        let names = {
            chi: [...new O({...['', '']}).append(...
                [this.blade].flat().map(b => Markup.remove(b?.names.chi ?? b?.abbr)?.replace(/^(?!.* )(.*)$/, '$1 $1').split(' '))
            ).values()].filter(n => n).join('⬧'),
            jap: Array.isArray(this.blade) ? 
                    this.blade.map((b, i, ar) => ar[0] && ar[1] && i == 2 ? b.abbr : b?.names.jap) : this.blade.names.jap,
        };
        names.chi &&= [names.chi, ' ', this.ratchet.abbr, this.bit.abbr].join('');
        names.jap = [names.jap, ' ', this.ratchet.abbr, this.bit.abbr].flat().join('');
        let single = parts => parts.length === 1 && META.jap.at(parts[0].path.slice(0, -1))?._;
        return {...names, only: single([this.blade, this.ratchet, this.bit].flat().filter(p => p?.abbr))};
    }
    static RB = 0;
}
class Row {
    constructor(bey, code, type, others) {
        let [video, extra] = ['string', 'object'].map(t => others.find(o => typeof o == t));
        this.tr = E('tr', [
            this.cell(code, type, video), 
            ...[bey.blade].flat().map(b => b.cell()), bey.ratchet.cell(), bey.bit.cell()
        ].flat(9), {
            classList: [bey.line ?? bey.blade.group ?? 'BX', type],
            dataset: {abbr: bey.abbr}
        });
        this.extra(extra ?? {});
        return this.tr;  
    }
    cell (code, type, video) { //todo: include 01-08 in beys.json
        type.split(' ')[0] == 'RB' ? code == Bey.current ? Bey.RB++ : Bey.RB = 1 : Bey.RB = 0;
        Bey.current = code;
        return E('td', 
            [code + ' ', ...Bey.RB ? [E('sub', `0${Bey.RB}`)] : []], 
            {dataset: {code, ...video ? {video} : {}}}
        );
    }
    extra ({coat, mode}) {
        coat && E(this.tr).set({'--coat': coat});
        mode && (this.tr.Q('td[headers=blade]').dataset.mode = JSON.stringify(mode));
    }
}

class Search {
    constructor(query) {
        this.regexp = [];
        if (typeof query == 'string') {
            query = query.replace(/[’'ʼ´ˊ]/g, '′');
            /^\/.+\/\w?$/.test(query) ?
                this.regexp.push(new RegExp(.../^\/(.+)\/(\w?)$/.exec(query).slice(1))) :
                this.lookup(query.replace(/([^\\])?([.*+?^${}()|[\]\\])/g, '$1\\$2'));
        } else {
            query.length == 3 && (query = PARTS.flatten(([comp, line, sub, abbr]) => [comp, line, abbr]).at(query).path);
            this.query = query.toReversed().slice(1).reduce((obj, key) => new O({[key]: obj}), query.at(-1));
            this.href = new URLSearchParams({...this.query.flatten(([comp, line, sub, abbr]) => [`${comp}-${line}`, abbr])});
        }
        this.build();console.log(this.regexp)
        return Search.beys().then(beys => ({
            beys: beys.filter(bey => 
                this.regexp.some(r => r.test(bey.dataset?.abbr ?? bey[2])) ||
                typeof query == 'string' && query.length >= 2 && this.#search.code(query.split(' '), bey.firstChild?.innerText ?? bey[0])
            ),
            href: this.href
        }));
    }
    lookup (string) {
        this.query = this.#search.deep(string.split(' '))
            .map(([comp, parts]) => [comp, new A(
                [...parts.filter(([, part]) => part instanceof Part).keys()], 
                {...parts.filter(([, part]) => !(part instanceof Part)).map(([line, subs]) => 
                    [line, subs.map(([s, parts]) => [s, [...parts.keys()]]).filter(([, parts]) => parts.length)]
                )}
            )]);
    }
    #search = {
        deep: (target, parts = PARTS) => parts.map(([comp, parts]) => [comp, parts.filter(([, part], i, arr) => 
            part instanceof Part ? this.#search.match(target, part) : arr[i][1] = this.#search.deep(target, part)
        )]),
        match: (target, {abbr, names = {}}) => Array.isArray(target) ?
            target.some(t => this.#search.match(t, {abbr, names})) :
            new RegExp(`^${target}$`, 'i').test(abbr) ||
            !/^[^一-龥]{1,2}$/.test(target) && Object.values(names).some(n => new RegExp(target, 'i').test(Markup.remove(n))),
        code: (target, code) => Array.isArray(target) ?
            target.some(t => this.#search.code(t, code)) : new RegExp(target, 'i').test(code)
    }
    build () {
        const q = this.query;
        if (!q) return;
        if (q.blade) {
            let single = q.blade instanceof A ? [...q.blade] : typeof q.blade == 'string' ? q.blade : null;
            let divided = q.blade instanceof A ? {...q.blade} : typeof q.blade == 'object' ? q.blade : null;
            single?.length && this.regexp.push(new RegExp(`^${Search.#or(single)} .+$`, 'u'));
            divided && META.blade.delimiter.each(([line, char]) => divided[line]?.size &&
                this.regexp.push(new RegExp(`^${Part.blade.sub.map(sub => Search.#or(divided[line][sub])).join(`\\${char}`)} .+$`, 'u'))
            );
        }
        if (q.ratchet?.length || q.ratchet?.size)
            this.regexp.push(new RegExp(`^.+? ${Search.#or(q.ratchet instanceof A ? [...q.ratchet] : q.ratchet)} .+$`));
        if (q.bit?.length || q.bit?.size)
            this.regexp.push(new RegExp(`^.+? ${Search.#or(q.bit instanceof A ? [...q.bit] : q.bit)}$`, 'u'));
    }
    static #beys;
    static beys = async () => Search.#beys ??= Q('tbody tr') ?? await DB.get('product', 'beys');
    static #or = abbrs => abbrs?.length ? `(?:${[abbrs].flat().filter(a => typeof a == 'string').join('|')})` : '.+?'
}
class Preview {
    constructor(what, path, where) {
        Preview.place ??= where || Q('[popover]') || Q('body').appendChild(E('aside', {
            popover: true,
            onclick: ev => ev.target.closest('[popover]').hidePopover()
        }, [E('div#cells'), E('div#tiles'), E('div#images')]));
        Preview.reset();
        Preview.place.popover && Preview.place.showPopover();
        [what].flat().forEach(w => this[w](path));
    }
    static reset = () => Preview.place?.Q('div', div => div.innerHTML = '');
    cell = path => new Search(path).then(({beys, href}) => Q('#cells').append(
        E('a', '', {href: `../products/?${href}`}),
        E('table>tbody', beys.map(bey => new Bey(bey)))
    )).then(() => Cell.fill('chi'))

    tile = path => PARTS.at(path).tile().then(tile => Q('#tiles').append(
        E('a', '', {href: tile.href()}),
        tile.fill()
    ))
    image (td) {
        let dataset = typeof td == 'object' ? td.dataset : {code: td};
        let {code, video, lowercase, markup, max} = this.#image.revisions(dataset);
        Preview.place.Q('#images').append(
            E('p', Markup.spacing(Maps.note.find(dataset.code))),
            ...video?.split(',').map(vid => E('a', {href: `//youtu.be/${vid}?start=60`})) ?? [],
            ...this.#image.src('main', code),
            ...this.#image.src('more', code, markup.more, max),
            ...this.#image.src('detail', lowercase ? code.toLowerCase() : code, markup.detail),
        );
    }
    #image = {
        revisions: ({code, video}) => {
            video ??= Q(`[data-code=${code}][data-video]`)?.dataset.video;
            let max = Q(`[data-code=${code}]`)?.length > 2 ? 18 : 9;
            let lowercase = this.#image.lowercase(...code.split('-'));
            let {alias, _, ...markup} = Maps.images.find(code) ?? {};
            code = (alias || code).replace('-', _ ? '_' : '');
            return {code, video, lowercase, markup, max};
        },
        src: (type, code, markup, max) => 
            [...markup ? Markup.replace(markup, 'image', {no: code}) : [code]]
            .flatMap(code => this.#image.format[type](code, max))
            .map(src => E('img', {src: src.replace(/^(?!\/).+$/, `//beyblade.takaratomy.co.jp/beyblade-x/lineup/_image/$&.png`)}))
        ,
        format: {
            main: code => `${code}@1`,
            more: (code, max) => [...Array(max)].map((_, i) => `${code}_${`${i+1}`.padStart(2, 0)}@1`),
            detail: code => `detail_${code}`
        },
        lowercase: (line, number) => Maps.lowercase[line]?.(number)
    }
}

const Markup = (where, string, span = true) => {
    if (!string) return [];
    string = string.split(Markup.split);
    if (where == 'cell')
        return (string.length == 2 ? [string[0], '⬧', string[1]] : string)
            .map(s => s.replace(...Markup.cell)).flatMap(s => Markup.replace(s, 'mode'));
    if (where == 'tile')
        return string.map(s => Markup.replace(s, 'mode')).map(s => span ? Markup.replace(s, 'tile') : s);
    if (where == 'stat')
        return Markup.replace(string, 'stat');
    return string;
}
Object.assign(Markup, {
    split: /(?<=.+?) (?=[一-龢].+)/,
    cell: [/[/\\]/g, ''],
    tile: new O([ //mode first so that _mode won't be sticking to span
        [/(.+)\\(.+)/, ([, $1, $2]) => [$1, E('span', $2)]],
        [/(.+)\/(.+)/, ([, $1, $2]) => [E('span', $1), $2]],
        [/(.+)([ A-Z].+)/, ([, $1, $2]) => [E('span', $1), $2]],
        [/^([一-龢]{2})([一-龢]{2,})/, ([, $1, $2]) => [E('span', $1), $2]],
    ]),
    mode: new O([
        [/(.+)_([一-龢]{4,})/, ([, $1, $2]) => [$1, E('sub.long', $2)]],
        [/(.+)_(.+)/, ([, $1, $2]) => [$1, E('sub', $2)]]
    ]),
    stat: new O([
        [/([A-Z ]+)([一-龢]+)/, ([, $1, $2]) => [$1, String.fromCharCode(10), $2]],
        [/(.+)([+=-])/, ([, $1, $2]) => [$1, E('sup', {'+':'+','=':'≈','-':'−'}[$2])]],
        [/(.+)>(.+)/, ([, $1, $2]) => [$1, E('small', '→'), $2]],
    ]),
    image: [
        [/(.*)\$\{(.+)\}(.*)/, ([, $1, $2, $3], values) => [$1, values[$2], $3].join('')],
        [/(.*)\((.+)\)(.*)/, ([, $1, $2, $3]) => $2.split('|').map(s => [$1, s, $3].join(''))],
    ],
    replace (string, which, values) {
        if (string instanceof Array) 
            return string.flatMap(s => Markup.replace(s, which));
        if (string instanceof HTMLElement) 
            return string;
        if (Markup[which] instanceof Array)
            return Markup[which].reduce((str, [r, f]) => r.test(str) ? f(r.exec(str), values) : str, string);
        let [r, f] = Markup[which].find(([r]) => r.test(string)) ?? [];
        return f?.(r.exec(string), values) ?? string;
    },
    remove: name => name?.replaceAll(/[_\/\\]/g, '') ?? '',
    spacing: text => text?.replace(/(?<=\w)(?=[一-龢])/g, ' ').replace(/(?<=[一-龢])(?=\w)/g, ' ') ?? ''
});
export {Bey, Search, Preview, Markup};