// CraftLifestylePrompt
// Takes structured fabric + room descriptions and produces an optimized
// image editing prompt for nano-banana-pro/edit that maximizes photorealism.
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
    for the "nano-banana-pro/edit" model (Google Gemini Flash Image Pro).

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
    3. Describes the EXACT color from the swatch — be explicit:
       - BEYAZ = pure bright white, not grey, not cream, not off-white
       - KREM = warm ivory cream
       - Use the swatch image as the absolute color reference
    4. Specifies the correct hanging style per fabric type:
       - TUL: ONE continuous full-width panel hanging straight, covering the entire window
         width from left edge to right edge — do NOT pull to sides, do NOT split into two
         separate pulled-back panels; the fabric hangs centered and flat across the window
       - FON: TWO panels, one pulled to the left and one to the right, tied back or stacked
       - BLACKOUT: TWO panels hanging closed, fully covering the window
       - STN: TWO panels hanging straight, one on each side, partially overlapping center
    5. Describes how the curtain should drape based on fabric type:
       - TUL: near see-through fine mesh, pure white, very airy and light — light floods through
         from behind, creating a bright glowing effect; soft vertical flow, barely any folds,
         covers full window width; the window should be visible THROUGH the fabric, not around it
       - FON: fully opaque, heavy rich folds, pinch pleats, pulled to one or both sides
       - BLACKOUT: zero light transmission, thick uniform folds, blocks all light completely
       - STN: smooth satin sheen, subtle reflective highlight, clean minimal folds
    6. MANDATORY ARCHITECTURAL CONSTRAINTS — these MUST be in every prompt:
       - The smooth white plaster cornice (kartonpiyer) at the ceiling-wall junction must
         remain fully intact — NO metal rod, rings, or hardware of any kind
       - The curtain top must disappear completely behind the cornice — NO visible curtain
         heading, tape, hooks, or pleat rings above the cornice line
       - There must be NO window valance, roman blind, roller blind, or any colored panel
         between the curtains and the cornice — the area above the curtain top is ONLY
         the smooth white cornice and white ceiling; if you see a gap there, fill it with
         smooth white plaster, not terracotta or any wall color
       - The curtain hem MUST end at least 15 cm above the floor on BOTH panels equally —
         the gap must be consistent across the full width, left edge to right edge;
         the curtain must NOT touch, brush, or pool on the floor at ANY point
    7. Specifies realistic fabric physics (gravity, weight, fold depth)
    8. Emphasizes photorealism: natural lighting, no AI artifacts, professional interior photography
    9. Is concise (under 250 words) — be direct and specific

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
