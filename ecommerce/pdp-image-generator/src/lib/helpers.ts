import fs from "fs";
import path from "path";
import { CurtainType, type FabricDescription, type RoomDescription } from "../baml_client/types";

// ---------------------------------------------------------------------------
// Catalog types (mirrors products/catalog.json)
// ---------------------------------------------------------------------------

export interface CatalogFabric {
  material: string;
  transparency: string;
  texture: string | null;
  weight: string;
  pattern: string | null;
}

export interface CatalogVariant {
  sku: string;
  colour: string;
  finish: string | null;
  swatch: string;
  shopify: {
    variant_id: string | null;
    status: string;
  };
}

export interface CatalogDesign {
  id: string;
  curtain_type: string;
  design: string;
  width_cm: number;
  price: number;
  composition: string | null;
  fabric: CatalogFabric;
  shopify: {
    product_id: string | null;
    handle: string;
    product_type: string;
    status: string;
    options: string[];
  };
  variants: CatalogVariant[];
}

export interface Catalog {
  designs: CatalogDesign[];
}

// ---------------------------------------------------------------------------
// Manifest types (mirrors assets/input/manifest.json)
// ---------------------------------------------------------------------------

export interface ManifestRoom {
  image: string;
  room_type: string;
  wall_color: string;
  floor_type: string;
  props: string[];
  lighting: string;
  window_type: string;
}

// ---------------------------------------------------------------------------
// Curtain type mapping
// ---------------------------------------------------------------------------

const CURTAIN_TYPE_MAP: Record<string, CurtainType> = {
  TUL:      CurtainType.TUL,
  FON:      CurtainType.FON,
  BLACKOUT: CurtainType.BLACKOUT,
  STN:      CurtainType.STN,
};

// Fallback texture by curtain type when fabric analysis hasn't been run yet
const TEXTURE_FALLBACK: Record<string, string> = {
  TUL:      "fine woven mesh",
  FON:      "smooth woven",
  BLACKOUT: "smooth dense",
  STN:      "smooth satin",
};

// ---------------------------------------------------------------------------
// Converters
// ---------------------------------------------------------------------------

export function toFabricDescription(
  design: Pick<CatalogDesign, "curtain_type" | "fabric">,
  variant: Pick<CatalogVariant, "colour">
): FabricDescription {
  return {
    curtain_type: CURTAIN_TYPE_MAP[design.curtain_type] ?? CurtainType.TUL,
    color:        variant.colour,
    pattern:      design.fabric.pattern,
    material:     design.fabric.material,
    transparency: design.fabric.transparency,
    texture:      design.fabric.texture ?? TEXTURE_FALLBACK[design.curtain_type] ?? "woven",
    weight:       design.fabric.weight,
  };
}

export function toRoomDescription(raw: ManifestRoom): RoomDescription {
  return {
    room_type:   raw.room_type,
    wall_color:  raw.wall_color,
    floor_type:  raw.floor_type,
    props:       raw.props,
    lighting:    raw.lighting,
    window_type: raw.window_type,
  };
}

// ---------------------------------------------------------------------------
// File helpers
// ---------------------------------------------------------------------------

export function saveJson(filePath: string, data: unknown) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

export function loadManifest(manifestPath: string) {
  return JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
}

export function loadCatalog(catalogPath: string): Catalog {
  return JSON.parse(fs.readFileSync(catalogPath, "utf-8")) as Catalog;
}

// ---------------------------------------------------------------------------
// Catalog lookup helpers
// ---------------------------------------------------------------------------

export function findBySku(
  catalog: Catalog,
  sku: string
): { design: CatalogDesign; variant: CatalogVariant } {
  for (const design of catalog.designs) {
    const variant = design.variants.find((v) => v.sku === sku);
    if (variant) return { design, variant };
  }
  throw new Error(`SKU "${sku}" not found in catalog.json`);
}
