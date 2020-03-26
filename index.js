const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({headless: false});
  const page = await browser.newPage();
  await page.goto('https://bubble.io/plugins', {timeout: 0, waitUntil: "networkidle0"});
  
  await scrollToBottom(page);

  const elements = await page.evaluate(() => {
    return [...document.querySelectorAll('.RepeatingGroup .group-item')].map((el) => {
      const link = el.querySelector('a.clickable-element');
      return {name: el.innerText, link: link ? link.getAttribute('href') : null};
    });
  });
  
  elements.forEach((x) => {console.log(x.name, x.link)});
  await browser.close();
})();

async function scrollToBottom(page) {
  const delay = 400;
  process.stdout.write('loading');
  while (await page.evaluate(() => document.scrollingElement.scrollTop + window.innerHeight < document.scrollingElement.scrollHeight)) {
    await page.evaluate(() => { document.scrollingElement.scrollBy(0, window.innerHeight); });
    process.stdout.write('.');
    await page.waitFor(delay);
  }
  process.stdout.write('\n');
}