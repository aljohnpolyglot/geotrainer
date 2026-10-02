import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { createServer } from 'node:http';
import test from 'node:test';
import { captureTip, countryJobs, openChrome, scrollPage, waitForPage } from './capture-plonkit-browser.mjs';

test('country source keeps only map-linked country tips', () => {
  const source = { countries: [
    { code: 'BW', pageUrl: 'https://www.plonkit.net/botswana', tips: [{ id: 'a1B2', image: 'https://www.plonkit.net/images/botswana/car.png' }] },
    { code: 'US-AK', pageUrl: 'https://www.plonkit.net/alaska', tips: [{ id: 'c3D4', image: 'https://www.plonkit.net/images/alaska/car.png' }] },
  ] };
  assert.equal(countryJobs(source).length, 1);
  assert.equal(countryJobs(source)[0].slug, 'botswana');
});

test('Chrome scrolls native HTML and exports its loaded tip image', {
  skip: !existsSync(process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'),
}, async () => {
  const chrome = await openChrome(undefined, { headless: true });
  try {
    const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lXcAAAAASUVORK5CYII=';
    const html = `<div style="height:1800px"></div><div id="a1B2"><a href="https://goo.gl/maps/test"><img loading="lazy" src="data:image/png;base64,${png}"></a></div>`;
    await chrome.call('Page.navigate', { url: `data:text/html,${encodeURIComponent(html)}` });
    for (let i = 0; i < 20 && !(await chrome.evaluate('document.getElementById("a1B2")')); i++) await new Promise(resolve => setTimeout(resolve, 100));
    await scrollPage(chrome, 10);
    const data = await captureTip(chrome, 'a1B2');
    assert.ok(data && Buffer.from(data, 'base64').length > 20);
    assert.match(await chrome.evaluate('document.documentElement.outerHTML'), /a1B2/);
    await chrome.call('Page.navigate', { url: 'data:text/html,<div id="a1B2"><a href="https://goo.gl/maps/test"><img></a></div>' });
    for (let i = 0; i < 20 && !(await chrome.evaluate('document.getElementById("a1B2")')); i++) await new Promise(resolve => setTimeout(resolve, 100));
    const recovered = await captureTip(chrome, 'a1B2', undefined, `data:image/png;base64,${png}`);
    assert.ok(recovered && Buffer.from(recovered, 'base64').length > 20);
  } finally { await chrome.close(); }
});

test('capture waits for a browser challenge to reveal the country guide', {
  skip: !existsSync(process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'),
}, async () => {
  const server = createServer((_request, response) => {
    response.setHeader('Content-Type', 'text/html');
    response.end(`<title>Just a moment...</title><script>
      setTimeout(() => {
        document.title = 'Botswana';
        document.body.innerHTML = '<div id="a1B2"><a href="https://goo.gl/maps/test"><img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lXcAAAAASUVORK5CYII="></a></div>';
      }, 250);
    </script>`);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let chrome;
  try {
    chrome = await openChrome(undefined, { headless: true });
    await chrome.call('Page.navigate', { url: `http://127.0.0.1:${server.address().port}/botswana` });
    await waitForPage(chrome, { slug: 'botswana', tips: [{ id: 'a1B2', mapUrl: 'https://goo.gl/maps/test' }] }, [], 50);
    assert.equal(await chrome.evaluate('document.title'), 'Botswana');
  } finally {
    await chrome?.close();
    server.close();
  }
});
