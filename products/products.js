import DB from '../include/DB.js'
import { Part, Tile, Cell } from '../include/part.js';
import { Bey, Preview, Search } from '../include/bey.js';

let META, PARTS;

const Table = () => Table.firstly().then(Table.display).then(Table.finally);
Object.assign(Table, {
    count: () => Q('.prod-result').value = Q('tbody tr:not(.hidden):not([hidden])', []).length,
    async firstly () {
        Filter();
        Table.events();
        [META, PARTS] = await Promise.all([DB.get('meta','part'), DB.get.PARTS()]);
        Part.import(META = META.general, new O(PARTS));
    },
    display: () => DB.get('product', 'beys').then(beys => Q('tbody').append(...beys.map(bey => new Bey(bey)))),
    async finally () {
        Q('.loading').classList.remove('loading');
        Q('#chi').checked = true;
        Cell.fill('chi');
        $(Q('table')).tablesorter();
        location.search && Table.filter(location.search.substring(1).split(/-(?=.+\=)|=/));
    },
    events () {
        Q('search').oninput = ev => {
            clearTimeout(Table.timer);
            Table.timer = setTimeout(() => Table.filter(ev.target.value), 500);
        }
        Q('nav button').onclick = Table.reset;
        Q('caption').onchange = ev => Cell.fill(ev.target.id);
        Q('tbody').onclick = ev => ev.target.matches('td:first-child') && new Preview('images', ev.target);
        new MutationObserver(Table.count).observe(Q('tbody'), {childList: true, subtree: true, attributeFilter: ['hidden', 'class']});
    },
    reset () {
        location.search && history.replaceState('', '', './');
        Q('tr:is(.hidden,[hidden])', tr => tr.classList.toggle('hidden', tr.hidden = false));
        Q('search input').value = '';
        Filter.reset();
        Q('a[href*=obake]').href = '//obakeblader.com/?s=入手法';
        Q('a[href*=kyoganken]').href = '//kyoganken.web.fc2.com/beyx/#parts1';
    },
    async filter (search) {
        Q('tbody tr', tr => tr.hidden = true);
        await new Search(search).then(({beys, href}) => {console.log(search);
            beys.forEach(tr => tr.hidden = false);
            href && setTimeout(() => Table.links(search)) && history.replaceState('', '', `?${href}`);
        });
    },
    links (query) {
        let target = PARTS.at(query);
        if (!target) return;
        let comp = target.path[2] != 'motif' && Bey.jap.at(target.path.slice(0, -1))._;
        let name = Tile.named(target.path) ? target.names.jap : target.abbr;
        Q('a[href*=obake]').href = '//obakeblader.com/' + (comp && Q('data').value > 1 ? `${comp}-${name}/#toc2` : `?s=入手法`);
        comp = ['blade', 'ratchet', 'bit'].indexOf(target.path[0]);
        Q('a[href*=kyoganken]').href = `//kyoganken.web.fc2.com/beyx/color0${comp + 1}.htm`;
    }
});

const Filter = () => {
    Q('#filter label', label => label.append(E('input', {value: `.${label.className.replaceAll(' ', '.')}`, type: 'checkbox'})));
    [Filter.inputs, Filter.systems] = [Q('#filter input'), Q('.system input')];
    Filter.reset();
    Filter.events();
}
Object.assign(Filter, {
    filter () {
        let hide = this.inputs.filter(i => !i.checked).map(i => i.value);
        Q('tbody tr').forEach(tr => tr.classList.toggle('hidden',
            hide.length && tr.matches(hide) || this.systems.some(i => !i.checked) && tr.matches('[data-abbr^="/"]'))
        );
        Table.count();
    },
    events () {
        E(Q('#filter')).set({
            onclick: ev => ev.target.tagName == 'BUTTON' && 
                this.systems.forEach(i => !i.checked && i.dispatchEvent(new InputEvent('change', {bubbles: true}))) || '',
            onchange: ev => {
                /^.X$/.test(ev.target.value) && this.systems.forEach(i => i.checked = !ev.isTrusted || ev.target == i);
                this.filter();
            },
            onmouseover: ({target}) => target.matches('label[title]') && 
                (Q('#filter summary i').innerText = `｛${target.innerText}｝：${target.title}`)
        });
    },
    reset () {
        Filter.inputs.forEach(input => input.checked = true);
    }
});

export default Table