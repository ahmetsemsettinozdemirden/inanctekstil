import sharp from 'sharp';
import pngToIco from 'png-to-ico';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Read source SVGs
const iconSvg = readFileSync(join(__dirname, 'logo/inanc-tekstil-icon.svg'));
const stackedSvg = readFileSync(join(__dirname, 'logo/inanc-tekstil-logo-stacked.svg'));

// Ensure output dirs exist
mkdirSync(join(__dirname, 'favicon'), { recursive: true });
mkdirSync(join(__dirname, 'social'), { recursive: true });
mkdirSync(join(__dirname, 'logo-png'), { recursive: true });

async function buildFavicons() {
  console.log('Building favicons...');

  // favicon-32x32.png
  await sharp(iconSvg).resize(32, 32).png().toFile(join(__dirname, 'favicon/favicon-32x32.png'));
  console.log('  favicon-32x32.png');

  // 16x16 for ICO
  await sharp(iconSvg).resize(16, 16).png().toFile(join(__dirname, 'favicon/favicon-16x16.png'));

  // favicon.ico (16 + 32)
  const icoBuffer = await pngToIco([
    join(__dirname, 'favicon/favicon-16x16.png'),
    join(__dirname, 'favicon/favicon-32x32.png'),
  ]);
  writeFileSync(join(__dirname, 'favicon/favicon.ico'), icoBuffer);
  console.log('  favicon.ico');

  // apple-touch-icon.png (180x180, icon centered with padding)
  const iconPadded180 = await sharp(iconSvg).resize(120, 120).png().toBuffer();
  await sharp({ create: { width: 180, height: 180, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } } })
    .composite([{ input: iconPadded180, gravity: 'centre' }])
    .png()
    .toFile(join(__dirname, 'favicon/apple-touch-icon.png'));
  console.log('  apple-touch-icon.png');

  // android-chrome-192x192.png
  const iconPadded192 = await sharp(iconSvg).resize(128, 128).png().toBuffer();
  await sharp({ create: { width: 192, height: 192, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } } })
    .composite([{ input: iconPadded192, gravity: 'centre' }])
    .png()
    .toFile(join(__dirname, 'favicon/android-chrome-192x192.png'));
  console.log('  android-chrome-192x192.png');

  // android-chrome-512x512.png
  const iconPadded512 = await sharp(iconSvg).resize(340, 340).png().toBuffer();
  await sharp({ create: { width: 512, height: 512, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } } })
    .composite([{ input: iconPadded512, gravity: 'centre' }])
    .png()
    .toFile(join(__dirname, 'favicon/android-chrome-512x512.png'));
  console.log('  android-chrome-512x512.png');

  // favicon.svg (copy of icon SVG)
  writeFileSync(
    join(__dirname, 'favicon/favicon.svg'),
    readFileSync(join(__dirname, 'logo/inanc-tekstil-icon.svg'))
  );
  console.log('  favicon.svg');
}

async function buildLogoPngs() {
  console.log('Building logo PNGs...');

  const logoSvg = readFileSync(join(__dirname, 'logo/inanc-tekstil-logo.svg'));
  const logoWhiteSvg = readFileSync(join(__dirname, 'logo/inanc-tekstil-logo-white.svg'));
  const stackedWhiteSvg = readFileSync(join(__dirname, 'logo/inanc-tekstil-logo-stacked-white.svg'));

  // Horizontal navy — 800px wide
  await sharp(logoSvg).resize(800, null).png().toFile(join(__dirname, 'logo-png/inanc-tekstil-logo.png'));
  console.log('  inanc-tekstil-logo.png');

  // Horizontal white — 800px wide (transparent BG)
  await sharp(logoWhiteSvg).resize(800, null).png().toFile(join(__dirname, 'logo-png/inanc-tekstil-logo-white.png'));
  console.log('  inanc-tekstil-logo-white.png');

  // Stacked navy — 400x400
  const stackedNavyResized = await sharp(stackedSvg).resize(360, 180).png().toBuffer();
  await sharp({ create: { width: 400, height: 400, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } } })
    .composite([{ input: stackedNavyResized, gravity: 'centre' }])
    .png()
    .toFile(join(__dirname, 'logo-png/inanc-tekstil-logo-stacked.png'));
  console.log('  inanc-tekstil-logo-stacked.png');

  // Stacked white — 400x400 (transparent BG)
  const stackedWhiteResized = await sharp(stackedWhiteSvg).resize(360, 180).png().toBuffer();
  await sharp({ create: { width: 400, height: 400, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: stackedWhiteResized, gravity: 'centre' }])
    .png()
    .toFile(join(__dirname, 'logo-png/inanc-tekstil-logo-stacked-white.png'));
  console.log('  inanc-tekstil-logo-stacked-white.png');
}

async function buildSocialAssets() {
  console.log('Building social assets...');

  // instagram-profile.png (400x400, icon centered on white)
  const iconForInsta = await sharp(iconSvg).resize(260, 260).png().toBuffer();
  await sharp({ create: { width: 400, height: 400, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } } })
    .composite([{ input: iconForInsta, gravity: 'centre' }])
    .png()
    .toFile(join(__dirname, 'social/instagram-profile.png'));
  console.log('  instagram-profile.png');

  // og-image.png (1200x630)
  const stackedForOg = await sharp(stackedSvg).resize(360, 180).png().toBuffer();

  const taglineSvg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="40">
    <text x="400" y="30" text-anchor="middle" font-family="Inter, 'Helvetica Neue', Arial, sans-serif" font-weight="500" font-size="18" fill="#1B2A4A">Ölçünüze Özel Dikim Perde — İskenderun</text>
  </svg>`);
  const taglinePng = await sharp(taglineSvg).png().toBuffer();

  await sharp({ create: { width: 1200, height: 630, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } } })
    .composite([
      { input: stackedForOg, top: 160, left: 420 },
      { input: taglinePng, top: 380, left: 200 },
    ])
    .png()
    .toFile(join(__dirname, 'social/og-image.png'));
  console.log('  og-image.png');
}

async function main() {
  await buildFavicons();
  await buildLogoPngs();
  await buildSocialAssets();
  console.log('\nAll assets built successfully!');
}

main().catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});
