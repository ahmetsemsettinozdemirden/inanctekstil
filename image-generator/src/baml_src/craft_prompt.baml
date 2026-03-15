// CraftLifestylePrompt
// Takes structured fabric + room descriptions and produces an optimized
// image editing prompt for nano-banana-2/edit that maximizes photorealism.
//
// The model sees the actual swatch and room images too — this function
// crafts the TEXT prompt that accompanies them.

function CraftLifestylePrompt(
  fabric: FabricDescription,
  room: RoomDescription,
  swatch_image: image,
  room_image: image
) -> CraftedPrompt {
  client BedrockSonnet
  prompt #"
    {{ _.role("user") }}

    You are an expert prompt engineer for AI image generation, specializing in
    photorealistic interior design photography. Your task is to write a prompt
    for the "nano-banana-2/edit" model (Google Gemini 3.1 Flash Image).

    This model takes multiple input images and a text prompt. It performs
    semantic image editing — it understands "replace X with Y" instructions
    naturally without needing masks.

    CONTEXT:
    - Image 1 (first in image_urls): A room photo that already has a curtain
    - Image 2 (second in image_urls): A close-up swatch of the target fabric
    - The model will replace the curtain in Image 1 with curtains made from
      the fabric in Image 2

    FABRIC DETAILS:
    - Type: {{ fabric.curtain_type }}
    - Color: {{ fabric.color }}
    - Pattern: {{ fabric.pattern }}
    - Material: {{ fabric.material }}
    - Transparency: {{ fabric.transparency }}
    - Texture: {{ fabric.texture }}
    - Weight: {{ fabric.weight }}

    ROOM DETAILS:
    - Room: {{ room.room_type }}
    - Walls: {{ room.wall_color }}
    - Floor: {{ room.floor_type }}
    - Props: {{ room.props }}
    - Lighting: {{ room.lighting }}
    - Window: {{ room.window_type }}

    Here is the actual swatch image for reference:
    {{ swatch_image }}

    Here is the actual room template for reference:
    {{ room_image }}

    WRITE A PROMPT that:
    1. Clearly instructs the model to replace ONLY the curtain fabric
    2. Preserves all room elements (walls, floor, furniture, plants, lighting)
    3. Describes how the curtain should drape based on fabric type:
       - tul: light, airy, semi-transparent, soft pencil pleats, light filters through
       - fon: heavy, rich folds, pinch pleats, pulled to one side, floor-length
       - blackout: thick, opaque, blocks all light, deep uniform folds
       - saten: smooth, subtle sheen, clean lines
    4. Specifies realistic fabric physics (gravity, weight, fold depth)
    5. Emphasizes photorealism: natural lighting, no AI artifacts, professional interior photography
    6. Is concise (under 200 words) — the model works better with focused instructions

    CRITICAL RULES:
    - Never ask the model to add text to the image
    - Never reference "AI" or "generated" in the prompt
    - Use "first image" and "second image" to reference inputs
    - Be specific about what to KEEP unchanged
    - Describe the desired curtain appearance in vivid physical terms

    {{ ctx.output_format }}
  "#
}

// CraftTexturePrompt
// Generates a prompt for creating enhanced fabric texture close-ups.

function CraftTexturePrompt(
  fabric: FabricDescription,
  swatch_image: image
) -> CraftedPrompt {
  client BedrockSonnet
  prompt #"
    {{ _.role("user") }}

    You are an expert prompt engineer for AI image generation. Write a prompt
    for "nano-banana-2/edit" to create a professional product photography
    close-up of a curtain fabric.

    The model receives ONE input image: a raw swatch card photo of the fabric.
    It should transform this into a polished product photograph.

    FABRIC DETAILS:
    - Type: {{ fabric.curtain_type }}
    - Color: {{ fabric.color }}
    - Pattern: {{ fabric.pattern }}
    - Material: {{ fabric.material }}
    - Texture: {{ fabric.texture }}
    - Weight: {{ fabric.weight }}

    Here is the actual swatch image:
    {{ swatch_image }}

    WRITE A PROMPT that creates a professional textile product photograph:
    1. The fabric shown softly pleated with visible folds filling the frame
    2. Even, diffused studio lighting from above revealing texture detail
    3. Sharp focus on the textile surface
    4. No background — only the fabric fills the frame
    5. The exact same color, pattern, and texture as the input
    6. Professional product photography quality

    Keep the prompt under 100 words. Be specific about lighting and composition.

    {{ ctx.output_format }}
  "#
}

// CraftBannerPrompt
// Generates a prompt for hero banners — wide composition with empty text zone.

function CraftBannerPrompt(
  fabric: FabricDescription,
  room: RoomDescription,
  swatch_image: image,
  room_image: image,
  text_side: string
) -> CraftedPrompt {
  client BedrockSonnet
  prompt #"
    {{ _.role("user") }}

    You are an expert prompt engineer for AI image generation. Write a prompt
    for "nano-banana-2/edit" to create a wide cinematic banner image (21:9).

    The model receives:
    - Image 1: A room photo with a curtain
    - Image 2: Target fabric swatch

    FABRIC: {{ fabric.curtain_type }}, {{ fabric.color }}, {{ fabric.material }}
    ROOM: {{ room.room_type }}, {{ room.wall_color }} walls

    Here is the swatch: {{ swatch_image }}
    Here is the room: {{ room_image }}

    COMPOSITION REQUIREMENT:
    - The room/curtain scene must be on the OPPOSITE side of "{{ text_side }}"
      (if text_side is "left", put the scene on the RIGHT; if "bottom", put the scene on TOP)
    - The {{ text_side }} 40% of the image must be clean, softly blurred empty
      space (plain wall or gentle gradient) suitable for text overlay
    - The transition between the empty zone and the room scene should be smooth

    Write a prompt under 150 words that produces a cinematic, wide-format
    interior photograph with this asymmetric composition. Emphasize warm
    natural lighting and photorealism.

    {{ ctx.output_format }}
  "#
}
