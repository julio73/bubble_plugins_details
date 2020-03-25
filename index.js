const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({headless: false});
  const page = await browser.newPage();
  await page.goto('https://bubble.io/plugins', {timeout: 0, waitUntil: "networkidle0"});

  const elements = await page.evaluate(() => {
    return [...document.querySelectorAll('.RepeatingGroup .group-item')].map((el) => {
      const link = el.querySelector('a.clickable-element');
      return {name: el.innerText, link: link ? link.getAttribute('href') : null};
    });
  });
  
  elements.forEach((x) => {console.log(x.name, x.link)});
  await browser.close();
})();