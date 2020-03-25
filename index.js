const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://bubble.io/plugins');
  const content = await page.content();
  console.log(content);
  await browser.close();
})();