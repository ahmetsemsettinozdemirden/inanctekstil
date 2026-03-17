/**
 * Satori + resvg renderer for text overlays and compositing.
 *
 * Strategy:
 *   1. Sharp handles image manipulation (resize, gradient, compositing)
 *   2. Satori + resvg renders text/UI as transparent PNG
 *   3. Sharp composites the text layer onto the base image
 */
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import fs from "fs";
import path from "path";
import sharp from "sharp";

// ---------------------------------------------------------------------------
// Font loading
// ---------------------------------------------------------------------------

const FONTS_DIR = path.resolve(__dirname, "../../assets/fonts");

const fontCache = new Map<string, ArrayBuffer>();

function loadFont(filename: string): ArrayBuffer {
  if (!fontCache.has(filename)) {
    fontCache.set(filename, fs.readFileSync(path.join(FONTS_DIR, filename)).buffer as ArrayBuffer);
  }
  return fontCache.get(filename)!;
}

function getFonts() {
  return [
    { name: "Inter", data: loadFont("Inter-Regular.ttf"), weight: 400 as const, style: "normal" as const },
    { name: "Inter", data: loadFont("Inter-Bold.ttf"), weight: 700 as const, style: "normal" as const },
    { name: "Inter", data: loadFont("Inter-ExtraBold.ttf"), weight: 800 as const, style: "normal" as const },
  ];
}

// ---------------------------------------------------------------------------
// Core: Satori node → PNG buffer
// ---------------------------------------------------------------------------

type SatoriNode = {
  type: string;
  props: Record<string, any>;
};

async function renderToPng(node: SatoriNode, width: number, height: number): Promise<Buffer> {
  const svg = await satori(node as any, {
    width,
    height,
    fonts: getFonts(),
  });

  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: width },
  });
  const pngData = resvg.render();
  return Buffer.from(pngData.asPng());
}

// ---------------------------------------------------------------------------
// Hero Banner
// ---------------------------------------------------------------------------

export interface HeroBannerOptions {
  /** AI-generated base image path (room/curtain scene) */
  baseImagePath: string;
  /** Small text above the headline */
  headline: string;
  /** Bold main text */
  subHeadline: string;
  /** Big discount text, e.g. "%10 AZ ODE!" */
  discount: string;
  /** CTA button text, e.g. "ALISVERISE BASLA" */
  cta: string;
  /** Small disclaimer at bottom */
  disclaimer?: string;
  /** Logo image path (optional) */
  logoPath?: string;
  /** Background color for the text zone */
  bgColor?: string;
  /** Primary text color */
  textColor?: string;
  /** Accent color (discount, CTA) */
  accentColor?: string;
  /** Output dimensions */
  width?: number;
  height?: number;
}

const HERO_DEFAULTS = {
  bgColor: "#F5F0EB",
  textColor: "#5C4033",
  accentColor: "#C17F59",
  width: 2160,
  height: 780,
};

export async function renderHeroBanner(opts: HeroBannerOptions): Promise<Buffer> {
  const width = opts.width ?? HERO_DEFAULTS.width;
  const height = opts.height ?? HERO_DEFAULTS.height;
  const bgColor = opts.bgColor ?? HERO_DEFAULTS.bgColor;
  const textColor = opts.textColor ?? HERO_DEFAULTS.textColor;
  const accentColor = opts.accentColor ?? HERO_DEFAULTS.accentColor;

  // 1. Use the full AI base image — it already has clean empty space on the
  //    left side for text overlay. Just resize to banner dimensions.
  const canvas = await sharp(opts.baseImagePath)
    .resize(width, height, { fit: "cover", position: "right" })
    .png()
    .toBuffer();

  // 3. Render text overlay with Satori
  const textZoneWidth = Math.round(width * 0.45);

  const children: SatoriNode[] = [];

  // Logo (if provided)
  if (opts.logoPath && fs.existsSync(opts.logoPath)) {
    const logoBase64 = fs.readFileSync(opts.logoPath).toString("base64");
    const ext = path.extname(opts.logoPath).slice(1);
    const mime = ext === "svg" ? "image/svg+xml" : `image/${ext}`;
    children.push({
      type: "img",
      props: {
        src: `data:${mime};base64,${logoBase64}`,
        width: 120,
        height: 40,
        style: { marginBottom: 20 },
      },
    });
  }

  // Headline
  children.push({
    type: "div",
    props: {
      style: {
        fontSize: 32,
        fontWeight: 700,
        color: textColor,
        letterSpacing: 1,
      },
      children: opts.headline,
    },
  });

  // Sub-headline
  children.push({
    type: "div",
    props: {
      style: {
        fontSize: 48,
        fontWeight: 700,
        color: textColor,
        marginTop: 8,
      },
      children: opts.subHeadline,
    },
  });

  // Discount
  children.push({
    type: "div",
    props: {
      style: {
        fontSize: 96,
        fontWeight: 800,
        color: accentColor,
        marginTop: 8,
        lineHeight: 1,
      },
      children: opts.discount,
    },
  });

  // CTA button
  children.push({
    type: "div",
    props: {
      style: {
        display: "flex",
        marginTop: 24,
        paddingLeft: 28,
        paddingRight: 28,
        paddingTop: 12,
        paddingBottom: 12,
        border: `2px solid ${accentColor}`,
        borderRadius: 4,
        fontSize: 18,
        fontWeight: 700,
        color: accentColor,
        letterSpacing: 2,
      },
      children: opts.cta,
    },
  });

  // Disclaimer
  if (opts.disclaimer) {
    children.push({
      type: "div",
      props: {
        style: {
          fontSize: 13,
          fontWeight: 400,
          color: textColor,
          opacity: 0.6,
          marginTop: 24,
          lineHeight: 1.5,
          textAlign: "center" as const,
          maxWidth: textZoneWidth - 120,
        },
        children: opts.disclaimer,
      },
    });
  }

  const textNode: SatoriNode = {
    type: "div",
    props: {
      style: {
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "center",
        width: textZoneWidth,
        height,
        paddingLeft: 60,
        paddingRight: 40,
      },
      children,
    },
  };

  const textPng = await renderToPng(textNode, textZoneWidth, height);

  // 4. Composite text onto canvas
  const final = await sharp(canvas)
    .composite([{ input: textPng, left: 0, top: 0 }])
    .webp({ quality: 90 })
    .toBuffer();

  return final;
}

// ---------------------------------------------------------------------------
// Collection Card
// ---------------------------------------------------------------------------

export interface CollectionCardOptions {
  /** AI-generated base image path */
  baseImagePath: string;
  /** Collection name, e.g. "REBORN KOLEKSIYONU" */
  collectionName: string;
  /** Output dimensions */
  width?: number;
  height?: number;
  /** Corner radius */
  borderRadius?: number;
  /** Gradient band height as fraction of total height */
  gradientFraction?: number;
}

const CARD_DEFAULTS = {
  width: 1280,
  height: 1040,
  borderRadius: 12,
  gradientFraction: 0.2,
};

export async function renderCollectionCard(opts: CollectionCardOptions): Promise<Buffer> {
  const width = opts.width ?? CARD_DEFAULTS.width;
  const height = opts.height ?? CARD_DEFAULTS.height;
  const radius = opts.borderRadius ?? CARD_DEFAULTS.borderRadius;
  const gradFrac = opts.gradientFraction ?? CARD_DEFAULTS.gradientFraction;
  const gradHeight = Math.round(height * gradFrac);

  // 1. Resize base image to fill card
  const resized = await sharp(opts.baseImagePath)
    .resize(width, height, { fit: "cover", position: "center" })
    .png()
    .toBuffer();

  // 2. Create dark gradient overlay at bottom
  const gradientSvg = Buffer.from(`
    <svg width="${width}" height="${height}">
      <defs>
        <linearGradient id="g" x1="0" y1="${height - gradHeight}" x2="0" y2="${height}" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="black" stop-opacity="0"/>
          <stop offset="1" stop-color="black" stop-opacity="0.65"/>
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#g)"/>
    </svg>
  `);

  // 3. Render text with Satori
  const textNode: SatoriNode = {
    type: "div",
    props: {
      style: {
        display: "flex",
        width,
        height,
        alignItems: "flex-end",
        justifyContent: "center",
        paddingBottom: Math.round(gradHeight * 0.3),
      },
      children: [
        {
          type: "div",
          props: {
            style: {
              fontSize: 32,
              fontWeight: 700,
              color: "white",
              letterSpacing: 3,
              textAlign: "center" as const,
            },
            children: opts.collectionName.toUpperCase(),
          },
        },
      ],
    },
  };

  const textPng = await renderToPng(textNode, width, height);

  // 4. Composite: base + gradient + text
  let composite = sharp(resized)
    .composite([
      { input: gradientSvg, blend: "over" },
      { input: textPng, blend: "over" },
    ]);

  // 5. Apply rounded corners mask
  const roundedMask = Buffer.from(`
    <svg width="${width}" height="${height}">
      <rect width="${width}" height="${height}" rx="${radius}" ry="${radius}" fill="white"/>
    </svg>
  `);

  const withGradientAndText = await composite.png().toBuffer();

  const final = await sharp(withGradientAndText)
    .composite([{ input: roundedMask, blend: "dest-in" }])
    .png({ quality: 90 })
    .toBuffer();

  return final;
}
