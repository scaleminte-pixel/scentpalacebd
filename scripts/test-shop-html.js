async function checkShop() {
  const res = await fetch('http://localhost:3000/shop');
  const html = await res.text();
  const matches = html.match(/src="([^"]+)"/g) || [];
  console.log('Total img/script src in shop HTML:', matches.length);
  const imgMatches = matches.filter(m => m.includes('images'));
  console.log('Image src in shop HTML:', imgMatches.slice(0, 15));

  // Also check /api/products output
  const apiRes = await fetch('http://localhost:3000/api/products');
  const apiData = await apiRes.json();
  console.log('API Products sample images:', apiData.products.slice(0, 4).map(p => ({ name: p.name, img: p.images })));
}

checkShop().catch(console.error);

