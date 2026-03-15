import fs from "fs";
import path from "path";
import { CurtainType, type FabricDescription, type RoomDescription } from "../baml_client/types";

interface ManifestFabric {
  curtain_type: string;
  color: string;
  pattern: string | null;
  material: string;
  transparency: string;
  texture: string;
  weight: string;
}

interface ManifestRoom {
  room_type: string;
  wall_color: string;
  floor_type: string;
  props: string[];
  lighting: string;
  window_type: string;
}

const CURTAIN_TYPE_MAP: Record<string, CurtainType> = {
  Tul: CurtainType.Tul,
  Fon: CurtainType.Fon,
  Blackout: CurtainType.Blackout,
  Saten: CurtainType.Saten,
};

export function toFabricDescription(raw: ManifestFabric): FabricDescription {
  return {
    curtain_type: CURTAIN_TYPE_MAP[raw.curtain_type] ?? CurtainType.Tul,
    color: raw.color,
    pattern: raw.pattern,
    material: raw.material,
    transparency: raw.transparency,
    texture: raw.texture,
    weight: raw.weight,
  };
}

export function toRoomDescription(raw: ManifestRoom): RoomDescription {
  return {
    room_type: raw.room_type,
    wall_color: raw.wall_color,
    floor_type: raw.floor_type,
    props: raw.props,
    lighting: raw.lighting,
    window_type: raw.window_type,
  };
}

export function saveJson(filePath: string, data: unknown) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

export function loadManifest(manifestPath: string) {
  return JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
}
