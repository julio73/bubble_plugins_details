const puppeteer = require('puppeteer');
const cliProgress = require('cli-progress');

(async () => {
  const browser = await puppeteer.launch({defaultViewport: null});
  const page = await browser.newPage();
  console.log('Loading plugins page https://bubble.io/plugins ...');
  await page.goto('https://bubble.io/plugins', {timeout: 0});
  
  // Scroll through the page to load the plugin list
  console.log('Scrolling through all plugins...');
  await scrollToBottom(page);

  // Collect plugins' name and url values
  const plugins = await page.evaluate(() => {
    return [...document.querySelectorAll('.RepeatingGroup .group-item')].map((plugin) => {
      const link = plugin.querySelector('a.clickable-element');
      return {name: plugin.innerText, link: link ? link.getAttribute('href') : null};
    });
  });

  // Build a CSV table
  let csvTable = [];
  let csvPrintOrder = ['name','license','pricing','one_time_price','usage','rating','author','date_created','date_modified','link'];
  csvTable.push(csvPrintOrder.reduce((acc, next) => `${acc}${JSON.stringify(next)},`, ""));

  console.log('Gathering plugin details...');
  const retrievalProgressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
  retrievalProgressBar.start(plugins.length, 0);
  for (let plugin of plugins) {
    let allValues = {...plugin};
    if (/^https:\/\/bubble\.io\/plugin\/.+$/.test(plugin.link)) {
      await page.goto(plugin.link);
      // Retrieve plugin details from JSON objects in client db
      let urlParts = plugin.link.split('-');
      let pluginId = urlParts[urlParts.length - 1];
      let pluginData = await page.evaluate((pluginId) => Lib().db_instance()._locals[pluginId].raw, pluginId);
      
      if (pluginData) {
        // Retrieve plugin author details
        let authorId = pluginData.owner_user != null ? pluginData.owner_user.split('__LOOKUP__')[1] : null;
        let authorData = authorId ? await page.evaluate((authorId) => Lib().db_instance()._locals[authorId].raw, authorId) : null;
        
        // Fill in values from corresponding fields
        allValues.license = pluginData.license_text != null ? pluginData.license_text : '';
        allValues.pricing =  pluginData.price_number != null ? `${pluginData.price_number}` : '';
        allValues.one_time_price = pluginData.one_time_price_number != null ? `${pluginData.one_time_price_number}` : '';
        allValues.usage = `${pluginData.usage_count_number}`;
        allValues.rating = pluginData.all_versions_rating_number != null ? `${pluginData.all_versions_rating_number}` : '';
        if (authorData) {
          allValues.author = `${authorData.plugin_builder_name_text}${authorData.plugin_builder_email_text != null ? ' (' + authorData.plugin_builder_email_text + ')' : ''}`;
        }
        allValues.date_created = new Date(pluginData['Created Date']).toUTCString();
        allValues.date_modified = new Date(pluginData['Modified Date']).toUTCString();
      }
    }
    // Push the values to the table
    csvTable.push(csvPrintOrder.reduce((acc, next) => `${acc}${JSON.stringify(allValues[next] != null ? allValues[next] : '')},`, ""));
    retrievalProgressBar.increment();
  };
  retrievalProgressBar.stop();
  console.log('\n\n');

  // Print out the table
  for (const line of csvTable) {
    console.log(line);
  }

  await browser.close();
})();

async function scrollToBottom(page) {
  const delay = 400;
  while (await page.evaluate(() => document.scrollingElement.scrollTop + window.innerHeight < document.scrollingElement.scrollHeight)) {
    await page.evaluate(() => { document.scrollingElement.scrollBy(0, window.innerHeight); });
    await page.waitFor(delay);
  }
}