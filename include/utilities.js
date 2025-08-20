class KeysAsString {
    constructor(obj) {Object.assign(this, obj);}
    [Symbol.toPrimitive] = type => type == 'string' && Object.keys(this).join('')
};
const Markup = (text, location) => text && (location ? Markup.items[location] : Markup.items)
    .reduce((text, [before, after]) => text.replace(before, after), text);
Markup.items = [
    [/_([^ ]{4,})/g, '<sub class=long>$1</sub>'],
    [/_([^ ]+)/g, '<sub>$1</sub>'],
];
Markup.items.products = [...Markup.items,
    [/ (?=[一-龢])/, '⬧'],
    [/(?<!<)[\/\\]/g, ''],
];
Markup.items.parts = [...Markup.items, 
    [/([^<]+)\\([^<]+)/, '$1<span>$2</span>'],
    [/([^<]+)\/([^<]+)/, '<span>$1</span>$2'],
    [/^([一-龢]{2})([一-龢]{2,})/, '<span>$1</span>$2'],
    [/^[^</\\]+?(?=[ A-Z])/, '<span>$&</span>']
];
Markup.items.stats = [
    ['>', '<small>→</small>'],
    [/[+\-=]/, '<sup>$&</sup>'],
    ['-', '−'], ['=', '≈']
];
Markup.sterilize = text => text.replaceAll(/[_\/\\]/g, '');
const spacing = text => text?.replace(/(?<=\w)(?=[一-龢])/g, ' ').replace(/(?<=[一-龢])(?=\w)/g, ' ') ?? '';
export {KeysAsString, Markup, spacing}