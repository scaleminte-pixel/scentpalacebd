const https = require('https');

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml'
      }
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(d));
    }).on('error', reject);
  });
}

async function searchParfumo(query) {
  try {
    const html = await get('https://www.parfumo.com/s_perfumes.php?lt=4&filter=' + encodeURIComponent(query));
    const imgMatches = html.match(/https:\/\/media\.parfumo\.com\/perfumes\/[^\s"'>]+/gi);
    return Array.from(new Set(imgMatches || []));
  } catch(e) {
    return [];
  }
}

async function run() {
  const qList = ['Rayhaan Azul', 'Vanilla Vibe', 'Shiyaka', 'Hawas', 'Najdia', 'Chaos Extrait', '9PM', 'Odyssey', 'Jean Lowe', 'Marwa'];
  for (const q of qList) {
    const imgs = await searchParfumo(q);
    console.log(q, '->', imgs.slice(0, 2));
  }
}

run();
