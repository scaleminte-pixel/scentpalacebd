const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixImages() {
  const productsDir = path.join(process.cwd(), 'public', 'images', 'products');
  const imagesDir = path.join(process.cwd(), 'public', 'images');

  if (!fs.existsSync(productsDir)) {
    fs.mkdirSync(productsDir, { recursive: true });
  }

  // 1. Ensure banner-gift-sets.jpg is in productsDir too
  const bannerSrc = path.join(imagesDir, 'banner-gift-sets.jpg');
  const bannerDest = path.join(productsDir, 'banner-gift-sets.jpg');
  if (fs.existsSync(bannerSrc) && !fs.existsSync(bannerDest)) {
    fs.copyFileSync(bannerSrc, bannerDest);
  }

  // 2. Mapping of product slugs to source file in public/images/products/
  const fileMappings = {
    'oud-ambre': 'oud-ambre.jpg',
    'royal-saffron': 'royal-saffron.jpg',
    'bleu-oud': 'bleu-oud.jpg',
    'rose-imperiale': 'rose-oud.jpg',
    'sultan-vetiver': 'oud-prestige.jpg',
    'musk-kashmir': 'musk-khatam.jpg',
    'leather-majesty': 'bleu-prestige.jpg',
    'amber-supreme': 'imperial-amber.jpg',
    'tobacco-noir': 'oud-noir.jpg',
    'vanilla-d-or': 'desert-bloom.jpg',
    'bergamot-royale': 'bergamot-velvet.jpg',
    'discovery-coffret': 'banner-gift-sets.jpg',
  };

  // 3. For each mapping, create aliases: slug-1.jpg, slug.jpg, etc.
  for (const [slug, srcFile] of Object.entries(fileMappings)) {
    const srcPath = path.join(productsDir, srcFile);
    if (!fs.existsSync(srcPath)) {
      console.warn('Source file missing:', srcPath);
      continue;
    }

    // Create slug.jpg if different from srcFile
    const slugJpg = path.join(productsDir, `${slug}.jpg`);
    if (!fs.existsSync(slugJpg)) {
      fs.copyFileSync(srcPath, slugJpg);
    }

    // Create slug-1.jpg
    const slug1Jpg = path.join(productsDir, `${slug}-1.jpg`);
    if (!fs.existsSync(slug1Jpg)) {
      fs.copyFileSync(srcPath, slug1Jpg);
    }

    // Create slug-2.jpg
    const slug2Jpg = path.join(productsDir, `${slug}-2.jpg`);
    if (!fs.existsSync(slug2Jpg)) {
      fs.copyFileSync(srcPath, slug2Jpg);
    }

    console.log(`Created image aliases for: ${slug} (from ${srcFile})`);
  }

  // 4. Update database products with verified images
  const dbUpdates = [
    { slug: 'oud-ambre', images: ['/images/products/oud-ambre.jpg', '/images/products/oud-ambre-1.jpg', '/images/ingredient-amber.jpg'] },
    { slug: 'royal-saffron', images: ['/images/products/royal-saffron.jpg', '/images/products/royal-saffron-1.jpg', '/images/ingredient-saffron.jpg'] },
    { slug: 'bleu-oud', images: ['/images/products/bleu-oud.jpg', '/images/products/bleu-oud-1.jpg', '/images/scent-oud.jpg'] },
    { slug: 'rose-imperiale', images: ['/images/products/rose-imperiale.jpg', '/images/products/rose-imperiale-1.jpg', '/images/scent-floral.jpg'] },
    { slug: 'sultan-vetiver', images: ['/images/products/sultan-vetiver.jpg', '/images/products/sultan-vetiver-1.jpg', '/images/scent-oud.jpg'] },
    { slug: 'musk-kashmir', images: ['/images/products/musk-kashmir.jpg', '/images/products/musk-kashmir-1.jpg', '/images/scent-floral.jpg'] },
    { slug: 'leather-majesty', images: ['/images/products/leather-majesty.jpg', '/images/products/leather-majesty-1.jpg', '/images/scent-citrus.jpg'] },
    { slug: 'amber-supreme', images: ['/images/products/amber-supreme.jpg', '/images/products/amber-supreme-1.jpg', '/images/ingredient-amber.jpg'] },
    { slug: 'tobacco-noir', images: ['/images/products/tobacco-noir.jpg', '/images/products/tobacco-noir-1.jpg', '/images/scent-oud.jpg'] },
    { slug: 'vanilla-d-or', images: ['/images/products/vanilla-d-or.jpg', '/images/products/vanilla-d-or-1.jpg', '/images/scent-floral.jpg'] },
    { slug: 'bergamot-royale', images: ['/images/products/bergamot-royale.jpg', '/images/products/bergamot-royale-1.jpg', '/images/scent-citrus.jpg'] },
    { slug: 'discovery-coffret', images: ['/images/products/banner-gift-sets.jpg', '/images/products/discovery-coffret.jpg', '/images/banner-gift-sets.jpg'] },
  ];

  for (const item of dbUpdates) {
    await prisma.product.updateMany({
      where: { slug: item.slug },
      data: {
        images: JSON.stringify(item.images),
      },
    });
    console.log(`Updated DB images for product: ${item.slug}`);
  }

  console.log('All product images and database records updated successfully!');
}

fixImages()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });

