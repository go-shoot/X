import { expect } from 'chai';
class O extends Map {
    constructor(...objs) {
        super();
        objs.flatMap(obj => [...typeof obj[Symbol.iterator] == 'function' ? obj : Object.entries(obj)])
            .forEach(([k, v]) => [this[k] = v, this.set(k, v)]);
    }
    [Symbol.toPrimitive] (type) {return type == 'string' && Object.keys(this).join('');}
    path (extractor) {
        let keys = [], current = this, key, value;
        while (current && typeof current == 'object' && !Array.isArray(current)) {
            [key, value] = Object.entries(current)[0];
            keys.push(key);
            current = current[key];
        }
        return [...keys, ...extractor ? [extractor(value)] : []];
    }
    at (path) {return (typeof path == 'string' ? path.split('.') : path).reduce((obj, key) => obj?.[key], this);}
    find (...targets) {
        if (targets.length === 1 && targets[0] instanceof Function)
            return [...this].find(targets[0]);
        
        let options = (targets.at(-1).evaluate || targets.at(-1).default) && targets.pop(), found = {};
        found.v = [...this].find(([k]) => (found.k = targets.find(t =>
            k instanceof RegExp && k.test(t) || k instanceof Array && k.find(item => item == t) ||
            k instanceof Function && k(t) || k == t
        )) != null)?.[1];
        found.k ??= targets[0];
        found.v ??= options?.default;
        
        if (found.v instanceof Function)
            return options?.evaluate ? found.v(found.k) : found.v;
        const interpolater = (item, into) => item?.replaceAll?.('${}', into) ?? item;
        if (found.v instanceof Array)
            return found.v.map(item => interpolater(item, found.k));
        return interpolater(found.v, found.k);
    }
    each (f) {this.forEach((v, k) => f([k, v]));}
    groupBy (...arg) {return new O(Object.groupBy(this, ...arg)).map(([k, v]) => [k, new O(v)]);}
    
    add (...objs) {return this.map(([k, v]) => [k, v + objs.reduce((sum, o) => sum += o?.[k] ?? 0, 0)]);}
    minus (...objs) {return this.map(([k, v]) => [k, v - objs.reduce((sum, o) => sum += o?.[k] ?? 0, 0)]);}
    prepend (...objs) {return this.map(([k, v]) => [k, objs.reduce((sum, o) => (o?.[k] ?? '') + sum, '') + v]);}

    url () {return new URLSearchParams(this).toString();}
}
['map','filter'].forEach(f => O.prototype[f] = function(...p) {return new O([...this][f](...p));});
['flatMap','every'].forEach(f => O.prototype[f] = function(...p) {return [...this][f](...p);});

it('1',()=>expect(new O({a:2,b:4},{b:6}).b).to.equal(6));
it('2',()=>expect(new O({a:2,b:4},{c:8}).c).to.equal(8));
it('3',()=>expect(new O([['a',5],['b',7]]).b).to.equal(7));
it('4',()=>expect(new O({a:{b:2}}).path()).to.eql(['a','b']));
it('5',()=>expect(new O({a:{b:2}}).at('a.b')).to.eql(2));
it('5',()=>expect(new O({a:{b:2}}).at(['a','b'])).to.eql(2));
it('5',()=>expect(new O({a:2,b:'2343'}).url()).to.eql('a=2&b=2343'));
it('5',()=>expect(new O({a:2,b:'2343'}).map(([k,v])=>[k,v+1])).to.eql(new O({a:3,b:'23431'})));
it('5',()=>expect(new O({'--e':2,b:6,'--f':'a'}).groupBy(([a]) => a.includes('--'))).to.eql(new O({true: new O({'--e':2,'--f':'a'}),false:new O({b:6})})));
it('5',()=>expect(new O({a:2,b:5}).add({b:2,c:6},{a:5,b:7})).to.eql(new O({a:7,b:14})));
it('5',()=>expect(new O({a:2,b:5}).minus({b:2,c:6}).minus({a:3,b:1})).to.eql(new O({a:-1,b:2})));
it('5',()=>expect(new O({a:'ee',b:'rere'}).prepend({b:'as',c:'sa'},{a:'b',b:'c'})).to.eql(new O({a:'bee',b:'casrere'})));
it('5',()=>expect(new O([[/b/,6],[[2,3,4],0]]).find('b')).to.eql(6));
it('5',()=>expect(new O([[/b/,6],[[2,3,4],0]]).find(2)).to.eql(0));
it('5',()=>expect(new O([[/b/,6],[[2,3,4],0]]).find(9)).to.eql(undefined));
it('5',()=>expect(new O([[/b/,['sef${}',null,'${}w']],[[2,3,4],0]]).find('b')).to.eql(['sefb',null,'bw']));
it('5',()=>expect(new O([[/b/,6],[[2,3,4],0]]).find(9,{default:n=>n+2,evaluate:true})).to.eql(11));
it('5',()=>expect(`${new O({a:3,b:5})}`).to.eql(`ab`));
it('5',()=>expect({...new O({a:3,b:5})}).to.eql({a:3,b:5}));
