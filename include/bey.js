import DB from './DB.js';
import { Part, Cell } from './part.js';
import Table from '../products/products.js';

let META, PARTS;
class Bey {
    static import = (meta, parts) => [META, PARTS] = [meta, parts];
    constructor([code, type, abbr, ...others]) {
        if (code == 'BH') return new Text();
        this.abbr = abbr;
        let [blade, ratchet, bit] = abbr.split(' ');

        this.line = new O(META.blade.delimiter).find(([, char]) => (this.blade = blade.split(char)).length > 1)?.[0];
        this.blade = this.blade.length > 1 ? 
            this.blade.map((b, i) => PARTS.blade[this.line][Part.blade.sub[i]][b]) ?? new Part.blade({line: this.line, group: Part.blade.sub[i]}) : 
            PARTS.blade[this.blade[0]] ?? new Part.blade({});
        this.ratchet = PARTS.ratchet[ratchet] ?? new Part.ratchet({});
        this.bit = PARTS.bit[bit] ?? new Part.bit({});
        return new Row(this, code, type, others);
    }
    static RB = 0;
}
class Row {
    constructor(bey, code, type, others) {
        let [video, extra] = ['string', 'object'].map(t => others.find(o => typeof o == t));
        this.tr = E('tr', [
            this.cell(code, type, video), 
            ...[bey.blade].flat().map(b => b.cell()),
            bey.ratchet.cell(),
            bey.bit.cell(),
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
        video ??= Q(`td[data-video]`, []).findLast(td => td.dataset.code == code)?.dataset.video;
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
const Finder = async query => {
    if (typeof query == 'string') {
        query = query.replaceAll(' ', '').replace(/[’'ʼ´ˊ]/g, '′');
        /^\/.+\/$/.test(query) ?
            Finder.regexp.push(new RegExp(query.replaceAll('/', ''))) :
            Finder.lookup(query.replace(/([^\\])?([.*+?^${}()|[\]\\])/g, '$1\\$2'));
    } else {
        query.length == 3 && (query = new O(PARTS[query[0]][query[1]]).find(([, obj]) => obj[query[2]])[1][query[2]].path);
        Finder.query = query.toReversed().slice(1).reduce((obj, key) => ({[key]: obj}), query.at(-1));
    }
    Finder.beys ??= Q('tbody tr') ?? await DB.get('product', 'beys');
    Finder.build();
    return Finder.beys.filter(bey => Finder.regexp.some(r => r.test(bey.dataset?.abbr ?? bey[2])));
};
Object.assign(Finder, {
    lookup (string) {
        console.log(PARTS);
        return 
    },
    search: {
        parts() {
            let regex = [...new O(META.prefixes.bit).map(([_, t]) => [_, new RegExp(Object.values(t).join('|').replace(/ |\|(?!.)/g, ''), 'i')])];
            let prefix = regex.filter(([, t]) => t.test(Finder.target.free)).map(([p]) => p);
            Finder.target.free = Object.values(regex).reduce((str, reg) => str.replace(reg, ''), Finder.target.free);
            Finder.target.parts = Finder.search.names(META.names, Finder.target.free);
            Finder.target.parts.bit.prefix = prefix;
        },
        names: (compTOpart, typed) =>
            new O(compTOpart).map(([_, parts]) => [_,
                [...new O(parts)].map(([abbrORline, namesORcomp]) => !namesORcomp || namesORcomp.jap ?
                    Finder.search.match([abbrORline, namesORcomp ?? {}], typed.split('/')) && abbrORline :
                    { [abbrORline]: Finder.search.names(namesORcomp, typed) }
                ).filter(abbr => abbr)
            ])
        ,
        match: ([abbr, names], typed) => Array.isArray(typed) ?
            typed.some(t => Finder.search.match([abbr, names], t)) :
            new RegExp(`^${typed}$`, 'i').test(abbr) ||
            !/^[^一-龥]{1,2}(′|\\\+)?$/.test(typed) && Object.values(names).some(n => new RegExp(typed, 'i').test(Markup.sterilize(n)))
    },
    build () {
        Finder.regexp = [];
        const q = Finder.query;
        if (q.blade) {
            Array.isArray(q.blade) || typeof q.blade == 'string' ? 
                Finder.regexp.push(new RegExp(`^${Finder.or(q.blade)} .+$`, 'u')) : 
                new O(META.blade.delimiter).each(([line, char]) => 
                    Finder.regexp.push(new RegExp(`^${Part.blade.sub.map(sub => Finder.or(q.blade[line][sub])).join(`\\${char}`)} .+$`, 'u'))
                );
            Finder.query = new O(q).flatten(([comp, line, sub, abbr]) => [`${comp}-${line}`, abbr]);
        }
        if (q.ratchet)
            Finder.regexp.push(new RegExp(`^.+? ${Finder.or(q.ratchet)} .+$`));
        if (q.bit)
            Finder.regexp.push(new RegExp(`^.+? ${Finder.or(q.bit)}$`, 'u'));
        return this;
    },
    filter: async search => {
        Q('tbody tr', tr => tr.hidden = true);
        (await Finder(search)).forEach(tr => tr.hidden = false);
        Table.count();
    },
    or: abbrs => abbrs ? `(?:${[abbrs].flat().filter(a => typeof a == 'string').join('|')})` : '.+?'
});
const Previewer = () => {
    Previewer.popup = Q('[popover]') ?? Q('body').appendChild(E('aside', {
        popover: true,
        onclick: ev => ev.target.closest('[popover]').hidePopover()
    }, [
        E('div#cells', [E('a', 'fly'), E('table>tbody')]),
        E('div#tiles', [E('a', 'fly'), E('section.catalog')]),
        E('div#images')
    ]));
}
Object.assign(Previewer, {
    show (where, content) {
        ['tbody', '.catalog'].forEach(el => Previewer.popup.Q(el).innerHTML = '');
        Previewer.popup.showPopover();
        Previewer.popup.Q(where).replaceChildren(...[content].flat());
    },
    cell (path) {
        Previewer();
        Finder(path).then(beys => {
            Q('#cells a').href = `../products/?${new URLSearchParams({...Finder.query})}`;
            Previewer.show('tbody', beys.map(bey => new Bey(bey)));
        }).then(() => Cell.fill('chi'))
    },
    tile (path) {   
        Previewer();
        (path.length >= 3 ? DB.get(`${path[0]}-${path[1]}`, path[3]) : DB.get(path[0], path[1]))
            .then(json => PARTS.at(path).push(json).revise())
            .then(part => Previewer.show('.catalog', part.tile(true)));
    }
});
const Markup = (where, string) => {
    if (!string) return [];
    string = string.split(Markup.split);
    return where == 'cell' ?
        (string.length == 2 ? [string[0], '⬧', string[1]] : string)
        .map(s => s.replace(...Markup.cell)).flatMap(s => Markup.replace(s, 'mode')) :
    where == 'tile' ?
        string.map(s => Markup.replace(s, 'mode')).map(s => Markup.replace(s, 'tile')) :
    where == 'stat' ?
        Markup.replace(string, 'stat') : string;
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
    replace (string, which) {
        if (string instanceof Array) return string.flatMap(s => Markup.replace(s, which));
        if (string instanceof HTMLElement) return string;
        let [r, f] = Markup[which].find(([r]) => r.test(string)) ?? [];
        return f?.(r.exec(string)) ?? string;
    }
});
export {Bey, Finder, Previewer, Markup};