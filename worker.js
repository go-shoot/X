self.addEventListener('install', ev => {
    self.skipWaiting();
    caches.delete('BBX');
    caches.delete('json');
    ev.waitUntil(Head.cache());
});
self.addEventListener('activate', ev => ev.waitUntil(clients.claim()));
self.addEventListener('fetch', ev => ev.respondWith((() => {
    if (/sw\/$/.test(new URL(ev.request.url).pathname)) {
        let [[field, value]] = new URLSearchParams(new URL(ev.request.url).search);
        return (actions[field]?.[value] ?? actions[field]?._)?.(value)
                .then(() => new Response('', {status: 200}))
                .catch(er => console.error(er) ?? new Response('', {status: 400}))
            ?? new Response('', {status: 404});
    }
    return (is.internal(ev.request.url) ? caches.match(ev.request, {ignoreSearch: true}) : Promise.resolve())
        .then(cached => {
            if (cached && is.image(ev.request.url))
                return cached;
            let fetching = fetch.net(ev.request);
            return cached ? is.html(ev.request.url) ? Head.add(cached) : cached : fetching;
        }).catch(console.error);
})()));

const actions = {
    delete: {
        parts: () => fetch('/db/-update.json').then(() => caches.delete('parts')),
        _: extension => fetch('/db/-update.json')
            .then(() => caches.open('X'))
            .then(cache => cache.keys().then(reqs => reqs.forEach(req => new RegExp(`\\.${extension}$`).test(req.url) && cache.delete(req))))
    }
}

const is = {
    internal: url => new URL(location.href).host == new URL(url).host,
    cacheable: url => is.internal(url) && !/\.json$/.test(new URL(url).pathname),
    volatile: url => /\.(?:css|js|json)$/.test(new URL(url).pathname),
    image: url => /\.(?:ico|svg|jpeg|jpg|png)$/.test(new URL(url).pathname),
    part: url => /img\/.+?\/.+?\.png$/.test(new URL(url).pathname),
    html: url => /(?:\/|\.html)$/.test(new URL(url).pathname),
    google: url => url.includes('gstatic')
}
fetch.net = req => {
    req = new Request(req.url.replace(/go-shoot\.github\.io(?!\/X)/, 'go-shoot.github.io/X') + 
        (is.internal(req.url) && is.volatile(req.url) ? `?${Math.random()}` : ''), is.google(req.url) ? null : {mode: 'no-cors'});
    return fetch(req).then(res => 
        (res.status < 400 && is.cacheable(req.url) ? fetch.cache(res) : Promise.resolve(res))
        .then(res => is.html(req.url) ? Head.add(res) : res)
    ).catch(er => {
        console.error(req.url);
        console.error(er);
        new URL(req.url).pathname == '/' && self.registration.unregister();
    });
}
fetch.cache = res => caches.open(is.part(res.url) ? 'X/parts' : 'X')
    .then(cache => cache.put(res.url.replace(/[?#].*$/, ''), res.clone()))
    .then(() => res);

const Head = {
    url: '/X/include/head.html',
    code: `<!DOCTYPE HTML>
    <meta charset=UTF-8>
    <meta name=viewport content='width=device-width,initial-scale=1'>
    <meta name=theme-color content='#b0ff50'>
    <link rel=stylesheet href=/include/common.css>
    <link rel=apple-touch-icon href=/favicon.ico>
    <link rel=manifest href='data:application/manifest+json,{
      "name":"非官方資訊站",
      "display":"standalone",
      "start_url":"https://go-shoot.github.io/X/",
      "theme_color":"rgb(181,251,92)",
      "background_color":"black",
      "icons":[{"src":"https://go-shoot.github.io/X/favicon.png","type":"image/png","sizes":"192x192"},{"src":"https://go-shoot.github.io/X/favicon.ico","type":"image/png","sizes":"512x512","purpose":"maskable"}]
    }'>
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-MJMB14RTQP"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '');
    </script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Yusei+Magic&family=IBM+Plex+Sans+JP:wght@500&display=swap" rel="stylesheet">
    <script src=/include/DB.js></script>
    <script src=/include/UX.js></script>
    `,
    cache: () => caches.open('X').then(cache => cache.put(Head.url, new Response(Head.code))),
    fetch: () => caches.match(Head.url).then(resp => resp.text()),

    add: async resp => new Response(await Head.fetch() + await resp.text(), Head.response(resp)),
            
    response: ({status, statusText, headers}) => ({status, statusText, headers})
}
