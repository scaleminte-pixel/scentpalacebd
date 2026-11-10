const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svg = `
<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <rect width="64" height="64" rx="14" fill="#141312"/>
  <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-family="serif" font-size="38" font-weight="bold" fill="#FAF7F2">R</text>
  <circle cx="46" cy="46" r="4" fill="#D45520"/>
</svg>
`;

async function main() {
  const buf = Buffer.from(svg.trim());
  const outputPath = path.join(process.cwd(), 'public', 'favicon.ico');
  await sharp(buf).png().toFile(outputPath);
  console.log('Default favicon.ico created successfully at:', outputPath);
}

main().catch(console.error);

