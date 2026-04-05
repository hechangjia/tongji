const https = require('https');

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/112.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function search() {
  const html = await fetch('https://html.duckduckgo.com/html/?q=modern+internal+tool+UI+design+trends+Linear+Stripe+Vercel+Retool+data+dashboard');
  const results = [];
  const regex = /<a class="result__snippet[^>]*>([\s\S]*?)<\/a>/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    results.push(match[1].replace(/<[^>]+>/g, '').trim());
  }
  console.log(results.join('\n\n'));
}

search();
