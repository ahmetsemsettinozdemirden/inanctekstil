// --- Enums ---

enum CurtainType {
  Tul
  Fon
  Blackout
  Saten
}

enum FlowType {
  PdpLifestyle
  PdpTexture
  HeroBanner
  CollectionCard
  CategoryHeader
  SocialPost
}

// --- Input types ---

class FabricDescription {
  curtain_type    CurtainType
  color           string       @description("Primary color in English: white, cream, anthracite, petrol blue, etc.")
  pattern         string?      @description("Pattern description if any: plain, striped, floral, geometric, etc. Null if solid.")
  material        string       @description("Material: polyester, cotton-blend, velvet, linen, etc.")
  transparency    string       @description("Transparency level: opaque, semi-transparent, sheer, blackout")
  texture         string       @description("Texture feel: smooth, woven mesh, heavy velvet, crisp linen, etc.")
  weight          string       @description("Fabric weight: light, medium, heavy")
}

class RoomDescription {
  room_type       string       @description("Room type: modern living room, bedroom, children's room, etc.")
  wall_color      string       @description("Wall color: beige, white, dark brown, etc.")
  floor_type      string       @description("Floor type: light wood parquet, dark wood, tile, etc.")
  props           string[]     @description("Room props: side table, potted plant, rug, floor cushion, etc.")
  lighting        string       @description("Lighting: natural daylight from window, warm ambient, soft diffused, etc.")
  window_type     string       @description("Window: large single window with rod, floor-to-ceiling, double window, etc.")
}

// --- Output types ---

class CraftedPrompt {
  prompt          string       @description("The optimized image generation prompt for nano-banana-2/edit")
  reasoning       string       @description("Brief explanation of prompt choices for debugging")
  negative_cues   string[]     @description("Things the prompt explicitly avoids or prevents")
}

class QualityScore {
  overall         int          @description("Overall quality 1-10")
  fabric_fidelity int          @description("How well the generated curtain matches the swatch: 1-10")
  room_coherence  int          @description("Room elements preserved correctly: 1-10")
  realism         int          @description("Photorealism level: 1-10")
  lighting        int          @description("Lighting consistency and quality: 1-10")
  curtain_drape   int          @description("Realistic fabric draping and pleats: 1-10")
  pass            bool         @description("True if overall >= 7 and no individual score < 5")
  issues          string[]     @description("Specific issues found, empty if pass is true")
  improvement     string?      @description("Suggested prompt adjustment if pass is false")
}
