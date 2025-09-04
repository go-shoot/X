import DB from "./DB.js";
import { Markup } from "./bey.js";
const Glossary = () => DB.get('meta', 'glossary').then(glossary => {
    Glossary.glossary = new O(glossary);
    Glossary.terms = [...Glossary.glossary.keys()].join('|');
    Glossary.search();
    Glossary.event();
    Q('#glossary') ?? Q('body').append(E('aside#glossary'));
});
Object.assign(Glossary, {
    search: () => [Q('p,article'), Q('x-part', []).map(part => part.shadowRoot.Q('p'))].flat(9).forEach(p => {
        if (!p) return;
        const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
        let node;
        while (node = walker.nextNode()) {
            const texts = node.nodeValue.split(/(\w[\w ]*\w)/);
            if (texts.length <= 1) continue;
            const fragment = new DocumentFragment();
            fragment.append(...texts.map(text => new RegExp(`(${Glossary.terms})`).test(text) ? 
                E('u', text) : new Text(text)
            ));
            node.replaceWith(fragment);
        }
    }),    
    event: () => [Q('u'), Q('x-part', []).map(part => part.shadowRoot.Q('u'))].flat(9).forEach(u =>
        u && (u.onclick = ev => Glossary.lookup(ev))
    ),
    lookup: ev => {
        ev.stopPropagation();
        clearTimeout(Glossary.timer);
        let aside = Q('#glossary');
        aside.innerHTML = '';
        let [jap, def] = Glossary.glossary[ev.target.innerText];
        E(aside).set({
            '--left': `${ev.clientX}px`, 
            '--top': `${ev.clientY}px`
        }, [E('dfn', [E('ruby', ev.target.innerText, E('rt', jap.split('&')[0])), ' ', jap.split('&')[1] ?? '']), Markup.spacing(def)])
        Glossary.timer = setTimeout(() => aside.innerHTML = '', 3000);
    },
});
export {Glossary}