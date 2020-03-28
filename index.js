const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({defaultViewport: null});
  const page = await browser.newPage();
  
  let pluginsResponse = null;
  page.on('response', async (response) => {
    const req = response.request();
    if (req.resourceType() == 'xhr' && req.method() == 'POST' && req.postData().includes('get_integrated_plugins')) {
      console.log('Intercept plugins request...');
      pluginsResponse = JSON.parse(await response.text());
    }
  });
  
  console.log('Load plugins page https://bubble.io/plugins ...');
  await page.goto('https://bubble.io/plugins');
  
  let allPlugins = []
  if (pluginsResponse.ret) {
    console.log('Retrieve JSON response...');
    allPlugins = pluginsResponse.ret;
  }
  
  console.log('Printout all plugins as csv table...\n\n');
  let csvPrintOrder = ['name','price','creator_name','creator_id','meta_id'];
  console.log(csvPrintOrder.reduce((acc, next) => `${acc}${JSON.stringify(next)},`, ""));
  for (let plugin of allPlugins) {
    console.log(csvPrintOrder.reduce((acc, next) => `${acc}${JSON.stringify(plugin[next] != null ? plugin[next] : '')},`, ""));
  }

  await browser.close();
})();