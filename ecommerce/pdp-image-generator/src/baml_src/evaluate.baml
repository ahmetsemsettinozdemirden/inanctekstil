// EvaluateLifestyleImage
// Evaluates a generated lifestyle image against the original swatch
// and room template for photorealism and fabric fidelity.

function EvaluateLifestyleImage(
  generated_image: image,
  swatch_image: image,
  room_image: image,
  fabric: FabricDescription,
  prompt_used: string
) -> QualityScore {
  client BedrockSonnet
  prompt #"
    {{ _.role("user") }}

    You are a professional interior design photographer and quality inspector.
    Evaluate this AI-generated product image for an e-commerce curtain store.

    ORIGINAL ROOM TEMPLATE:
    {{ room_image }}

    ORIGINAL FABRIC SWATCH:
    {{ swatch_image }}

    GENERATED IMAGE:
    {{ generated_image }}

    FABRIC EXPECTED:
    - Type: {{ fabric.curtain_type }}
    - Color: {{ fabric.color }}
    - Material: {{ fabric.material }}
    - Transparency: {{ fabric.transparency }}
    - Texture: {{ fabric.texture }}

    PROMPT USED:
    {{ prompt_used }}

    Score each dimension 1-10:

    1. FABRIC FIDELITY: Does the generated curtain match the swatch's color,
       texture, and pattern? Is the transparency level correct (sheer tul
       should be see-through, blackout should block light)?

    2. ROOM COHERENCE: Are all room elements preserved? Check: wall color,
       floor, furniture, plants, side tables, cushions, curtain rod/pelmet.
       Are there any added or missing objects?

    3. REALISM: Does this look like a real photograph? Check for:
       - AI artifacts (distorted edges, impossible geometry, floating objects)
       - Consistent shadows and reflections
       - Natural-looking fabric physics
       - Believable color grading

    4. LIGHTING: Is the lighting consistent between the curtain and the room?
       Does light interact correctly with the fabric (tul should glow with
       backlight, fon should cast shadows)?

    5. CURTAIN DRAPE: Do the pleats and folds look physically correct for
       this fabric weight? Does gravity affect the fabric naturally?

    6. OVERALL: Would this image be convincing on an e-commerce product page?
       Would a customer believe this is a real photo?

    If ANY individual score is below 5, or overall is below 7, set pass=false
    and describe the specific issues and suggest how to adjust the prompt.

    {{ ctx.output_format }}
  "#
}

// EvaluateTextureImage
// Evaluates a generated texture close-up against the original swatch.

function EvaluateTextureImage(
  generated_image: image,
  swatch_image: image,
  fabric: FabricDescription
) -> QualityScore {
  client BedrockHaiku
  prompt #"
    {{ _.role("user") }}

    Evaluate this generated fabric close-up photograph against the original swatch.

    ORIGINAL SWATCH:
    {{ swatch_image }}

    GENERATED TEXTURE IMAGE:
    {{ generated_image }}

    EXPECTED: {{ fabric.color }} {{ fabric.material }}, {{ fabric.texture }}

    Score 1-10 on:
    1. FABRIC FIDELITY: Color and texture match the original swatch
    2. ROOM COHERENCE: N/A for texture shots — score 10
    3. REALISM: Professional product photography quality
    4. LIGHTING: Even, diffused studio lighting
    5. CURTAIN DRAPE: Pleats/folds look natural
    6. OVERALL: Suitable for e-commerce product gallery

    pass=true if overall >= 7 and no score < 5.

    {{ ctx.output_format }}
  "#
}
