const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

function fetchBuffer(url, redirects = 5) {
  return new Promise((resolve, reject) => {
    if (redirects < 0) return reject(new Error('Too many redirects: ' + url));
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Referer': 'https://www.google.com/'
      }
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let redirectUrl = res.headers.location;
        if (!redirectUrl.startsWith('http')) {
          const u = new URL(url);
          redirectUrl = new URL(redirectUrl, u.origin).href;
        }
        return fetchBuffer(redirectUrl, redirects - 1).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    });
    req.on('error', reject);
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('Timeout fetching ' + url));
    });
  });
}

const products = [
  {
    id: 1,
    slug: 'rayhaan-azul',
    name: 'Rayhaan Azul',
    url: 'https://media.parfumo.com/perfumes/60/6032ee_azul-rayhaan_1200.jpg?width=720&aspect_ratio=1:1'
  },
  {
    id: 2,
    slug: 'rayhaan-tonquin-giza',
    name: 'Rayhaan Tonquin Giza',
    url: 'https://rayhaanperfumes.me/cdn/shop/files/1TonquinGiza.jpg?v=1780927163'
  },
  {
    id: 3,
    slug: 'rayhaan-vanilla-vibe',
    name: 'Rayhaan Vanilla Vibe',
    url: 'https://arabicparfums.com/cdn/shop/files/vanilla-vibe-de-rayhaan-sobre-fondo-blanco-con-sus-notas-olfativas.png?v=1792148217&width=800'
  },
  {
    id: 4,
    slug: 'rayhaan-equinox',
    name: 'Rayhaan Equinox',
    url: 'https://buyperfumeinbangladesh.com/wp-content/uploads/2026/10/Rayhaan-Equinox-EDP-100ml.jpeg'
  },
  {
    id: 5,
    slug: 'rayhaan-vantage',
    name: 'Rayhaan Vantage',
    url: 'https://perfumiabd.com/wp-content/uploads/2026/10/Rayhaan-Vantage.png'
  },
  {
    id: 6,
    slug: 'rayhaan-amazonica',
    name: 'Rayhaan Amazonica',
    url: 'https://perfumeshop.com.bd/wp-content/uploads/2026/10/66221.png'
  },
  {
    id: 7,
    slug: 'hawas-malibu',
    name: 'Hawas Malibu',
    url: 'https://aromatica.one/cdn/shop/files/Rasasi-Hawas-Malibu-EDP_c630abc2-c93f-442e-b57a-537d07d85ef5.png?format=webp&v=1791448815&width=800'
  },
  {
    id: 8,
    slug: 'hawas-london',
    name: 'Hawas London',
    url: 'https://aromatica.one/cdn/shop/files/Rasasi-Hawas-London-EDP_9f335035-05b6-48f0-89f3-ccf8dbe4b46e.png?format=webp&v=1791445937&width=800'
  },
  {
    id: 9,
    slug: 'hawas-chrome',
    name: 'Hawas Chrome',
    url: 'https://perfumeworld.com.bd/images/thumbs/0002199_rasasi-hawas-chrome_625.webp'
  },
  {
    id: 10,
    slug: 'hawas-ice-freeze',
    name: 'Hawas Ice Freeze',
    url: 'https://aromatica.one/cdn/shop/files/Rasasi-Hawas-Ice-EDP_7e0bd83f-9df9-4798-8b34-b33dbb72e123.png?format=webp&v=1791448246&width=800'
  },
  {
    id: 11,
    slug: 'khadlaj-shiyaka-shadow',
    name: 'Khadlaj Shiyaka Shadow',
    url: 'https://khadlaj-perfumes.com/cdn/shop/files/Shiyaaka_Shadow-3.jpg?v=1783943040'
  },
  {
    id: 12,
    slug: 'khadlaj-shiyaka-snow',
    name: 'Khadlaj Shiyaka Snow',
    url: 'https://perfumiabd.com/wp-content/uploads/2026/04/Khadlaj-Shiyaka-Snow.png'
  },
  {
    id: 13,
    slug: 'khadlaj-island',
    name: 'Khadlaj Island',
    url: 'https://perfumiabd.com/wp-content/uploads/2025/05/Khadlaj-Island.png'
  },
  {
    id: 14,
    slug: 'khadlaj-island-dreams',
    name: 'Khadlaj Island Dreams',
    url: 'https://khadlaj-perfumes.com/cdn/shop/files/Island_Dreams-3_800x800.jpg?v=1783940088'
  },
  {
    id: 15,
    slug: 'lattafa-najdia-intense',
    name: 'Lattafa Najdia Intense',
    url: 'https://perfumiabd.com/wp-content/uploads/2023/09/Lattafa-Najdia.png'
  },
  {
    id: 16,
    slug: 'lattafa-opulent-dubai',
    name: 'Lattafa Opulent Dubai',
    url: 'http://www.lattafa-usa.com/cdn/shop/files/1_7d5801be-0a5e-4ac4-bffc-3bee4a3c7a6b.png?v=1756143162'
  },
  {
    id: 17,
    slug: 'lattafa-blue-oud',
    name: 'Lattafa Blue Oud',
    url: 'http://www.lattafa-usa.com/cdn/shop/files/1_fa208a6d-6068-477a-a317-9770a42112f0.png?v=1747500637'
  },
  {
    id: 18,
    slug: 'lattafa-opulent-oud',
    name: 'Lattafa Opulent Oud',
    url: 'http://www.lattafaindia.com/cdn/shop/files/01_b445cba5-b089-47aa-9748-500ec8e3f582.png?v=1768991989'
  },
  {
    id: 19,
    slug: 'lattafa-yara-elixir',
    name: 'Lattafa Yara Elixir',
    url: 'https://cdn.fragrancenet.com/images/photos/900x900/442124.png'
  },
  {
    id: 20,
    slug: 'lattafa-asad-elixir',
    name: 'Lattafa Asad Elixir',
    url: 'https://cdn.fragrancenet.com/images/photos/box-bottle/900x900/446455.png'
  },
  {
    id: 21,
    slug: 'lattafa-fakhar',
    name: 'Lattafa Fakhar',
    url: 'https://perfumiabd.com/wp-content/uploads/2023/09/Lattafa-Fakhar.png.webp'
  },
  {
    id: 22,
    slug: 'french-avenue-chaos-extrait',
    name: 'French Avenue Chaos Extrait',
    url: 'https://zaoud.it/cdn/shop/files/french-avenue-Chaos-extrait-perfume-bottle-against-white-background.jpg?v=1753724952'
  },
  {
    id: 23,
    slug: 'french-avenue-royal-taboo',
    name: 'French Avenue Aromatic Royal Taboo',
    url: 'https://cdn2.jomashop.com/media/catalog/product/cache/b3e31d40bbb1abcc90b26106659d5d3f/f/r/french-avenue-x-aromatix-unisex-royal-taboo-edp-spray-3-3-oz-fragrances-6290360379227.jpg'
  },
  {
    id: 24,
    slug: 'french-avenue-frostbite',
    name: 'French Avenue Frostbite',
    url: 'https://media.parfumo.com/perfumes/3a/3a7b31_frostbite-french-avenue_1200.jpg?width=720&aspect_ratio=1:1'
  },
  {
    id: 25,
    slug: 'afnan-9pm',
    name: 'Afnan 9PM',
    url: 'https://cdn.fragrancenet.com/images/photos/900x900/325997.png'
  },
  {
    id: 26,
    slug: 'afnan-9pm-nightout',
    name: 'Afnan 9PM Nightout',
    url: 'https://media.parfumo.com/perfumes/cb/cb1111_9pm-night-out-afnan-perfumes_1200.jpg?width=720&aspect_ratio=1:1'
  },
  {
    id: 27,
    slug: 'afnan-supremacy-ce',
    name: 'Afnan Supremacy CE',
    url: 'https://perfumiabd.com/wp-content/uploads/2025/02/Afnan-Supremacy-Collectiors-Edition.png'
  },
  {
    id: 28,
    slug: 'armaf-odyssey-mango',
    name: 'Armaf Odyssey Mango',
    url: 'http://armaf.com/cdn/shop/files/ODYSSEYGOMANGO2.png?v=1767893488&width=2048'
  },
  {
    id: 29,
    slug: 'armaf-odyssey-mandarin-sky',
    name: 'Armaf Odyssey Mandarin Sky',
    url: 'http://armaf.com/cdn/shop/files/odysseymandarinsky-bottle.jpg?v=1739111516&width=2048'
  },
  {
    id: 30,
    slug: 'jean-lowe-vibe',
    name: 'Jean Lowe Vibe',
    url: 'https://zaoud.it/cdn/shop/files/Jean-Lowe-vibe-perfume-bottle-against-white-background.jpg?v=1761594982'
  },
  {
    id: 31,
    slug: 'jean-lowe-immortal',
    name: 'Jean Lowe Immortal',
    url: 'https://luxurious-fragrances.com/wp-content/uploads/2025/11/parfum-jean-lowe-vibe-maison-alhambra.jpg'
  },
  {
    id: 32,
    slug: 'arabiyat-prestige-marwa-tester',
    name: 'Arabiyat Prestige Marwa (Tester)',
    url: 'https://media.parfumo.com/perfumes/8d/8d54ab_marwa-arabiyat_1200.jpg?width=720&aspect_ratio=1:1'
  },
  {
    id: 33,
    slug: 'arabiyat-prestige-marwa-extrait-60ml',
    name: 'Arabiyat Prestige Marwa Extrait De Parfum 60ml',
    url: 'https://media.parfumo.com/perfumes/8d/8d54ab_marwa-arabiyat_1200.jpg?width=720&aspect_ratio=1:1'
  },
  {
    id: 34,
    slug: 'al-wataniah-kayan-terra',
    name: 'Kayyan Terra',
    url: 'https://perfumeshop.com.bd/wp-content/uploads/2026/07/12815-600x800.webp'
  },
  {
    id: 35,
    slug: 'al-wataniah-kayan-midnight',
    name: 'Midnight',
    url: 'https://perfumeshop.com.bd/wp-content/uploads/2026/07/Al-Wataniah-Kayaan-Midnight_20260715_014330_0000.png'
  },
  {
    id: 36,
    slug: 'rasasi-hawas-kobra',
    name: 'Kobra',
    url: 'https://cdn.klassy.com.bd/uploads/assets/products/rasasi-hawas-kobra-eau-de-parfum-edp-100ml-xxurty.webp'
  },
  {
    id: 37,
    slug: 'lattafa-dynasty',
    name: 'Dynasty',
    url: 'https://tashrifbd.com/wp-content/uploads/2026/04/Dynasty-Perfume-100ml-EDP-Lattafa-175285654.webp'
  },
  {
    id: 38,
    slug: 'khadlaj-island-vanilla-dunes',
    name: 'Vanilla Dunes Total',
    url: 'https://perfumiabd.com/wp-content/uploads/2025/10/Khadlaj-Island-Vanilla-Dunes.png'
  },
  {
    id: 39,
    slug: 'french-avenue-zenith-tobacco-blue',
    name: 'Zenith Tobacco+ Blue',
    url: 'https://perfumiabd.com/wp-content/uploads/2026/08/French-Avenue-Zenith-Tobacco.png'
  },
  {
    id: 40,
    slug: 'french-avenue-zenith-santal',
    name: 'Zenith Santal',
    url: 'https://media.parfumo.com/perfumes/81/81a9a3_zenith-santal-french-avenue_1200.jpg?width=720&aspect_ratio=1:1'
  },
  {
    id: 41,
    slug: 'french-avenue-vulcan-feu',
    name: 'Vulcan Feu',
    url: 'https://buyperfumeinbangladesh.com/wp-content/uploads/2025/11/French-Avenue-Vulcan-Feu-EDP-for-Men-and-Women-100ml-300x300.jpeg'
  },
  {
    id: 42,
    slug: 'french-avenue-vulcan-sable',
    name: 'Vulcan Sable',
    url: 'https://media.parfumo.com/perfumes/dc/dcfb6b_vulcan-sable-french-avenue_1200.jpg?width=720&aspect_ratio=1:1'
  },
  {
    id: 43,
    slug: 'swiss-arabian-rose-01',
    name: 'Swiss Rose 01',
    url: 'https://swissarabian.com/cdn/shop/files/Rose01.webp?v=1782897569'
  }
];

const outDir = path.join(__dirname, '../public/images/products');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function processProduct(p) {
  const dest = path.join(outDir, `${p.slug}.webp`);
  try {
    console.log(`[${p.id}/43] Fetching ${p.name}...`);
    const buf = await fetchBuffer(p.url);
    
    // Fit inside 720x720 keeping aspect ratio
    const resized = await sharp(buf)
      .resize(720, 720, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .toBuffer();

    // Composite centered onto an 800x800 pure white background
    await sharp({
      create: {
        width: 800,
        height: 800,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    })
      .composite([{ input: resized, gravity: 'center' }])
      .webp({ quality: 88 })
      .toFile(dest);

    const stat = fs.statSync(dest);
    console.log(`✓ Saved ${p.slug}.webp (${Math.round(stat.size / 1024)} KB)`);
    return { id: p.id, slug: p.slug, success: true };
  } catch (err) {
    console.error(`✗ Error on ${p.name} (${p.url}):`, err.message);
    return { id: p.id, slug: p.slug, success: false, error: err.message };
  }
}

async function main() {
  const results = [];
  for (const p of products) {
    const res = await processProduct(p);
    results.push(res);
  }
  const failed = results.filter(r => !r.success);
  console.log('\n--- BATCH SUMMARY ---');
  console.log(`Total: ${results.length}, Successful: ${results.length - failed.length}, Failed: ${failed.length}`);
  if (failed.length > 0) {
    console.log('Failed items:', failed);
  }
}

main();

