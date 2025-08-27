const spacing = text => text?.replace(/(?<=\w)(?=[一-龢])/g, ' ').replace(/(?<=[一-龢])(?=\w)/g, ' ') ?? '';
const Glossary = () => {
    Glossary.search();
    Glossary.event();
    Q('#glossary') ?? Q('body').append(E('aside#glossary'));
}
Object.assign(Glossary, {
    search: () => [Q('p,article'), Q('x-part', []).map(part => part.shadowRoot.Q('p'))].flat(9).forEach(p => {
        const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
        let node;
        while (node = walker.nextNode()) {
            const texts = node.nodeValue.split(/(\w[\w ]*\w)/);
            if (texts.length <= 1) continue;
            const fragment = new DocumentFragment();
            fragment.append(...texts.map(text => /\w[\w ]*\w/.test(text) ? E('u', text) : new Text(text)));
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
        let [jap, def] = Glossary[ev.target.innerText];
        E(aside).set({
            '--left': `${ev.clientX}px`, 
            '--top': `${ev.clientY}px`
        }, [E('dfn>ruby', [ev.target.innerText, E('rt', jap)]), def])
        Glossary.timer = setTimeout(() => aside.innerHTML = '', 3000);
    },
    Upper: ['アッパー', '旋轉時斜面把對手向上撞向空中，令其失去地面摩擦，更易被擊飛'],
    Smash: ['スマッシュ', '旋轉時斜面把對手向下壓，令其傾側，更易失平衡倒下']
});
O.prototype.flatten = function(transformation) {
    const result = new O({});
    const enter = (current, oldPath = []) => {
        if (current && typeof current === 'object' && !Array.isArray(current)) {
            Object.entries(current).forEach(([key, value]) => enter(value, oldPath.concat(key)));
        } else {
            let newPath = transformation([...oldPath]).filter(k => k);
            newPath.some(k => k.includes('undefined')) && (newPath = oldPath);
            let level = result;
            newPath.forEach((key, i) => level = level[key] ??= i == newPath.length - 1 ? current : {});
        }
    }
    enter(this);
    return result;
}
export {spacing, Glossary}