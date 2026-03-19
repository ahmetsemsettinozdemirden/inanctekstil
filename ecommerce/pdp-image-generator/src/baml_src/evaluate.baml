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

    1. FABRIC FIDELITY: Does the generated curtain EXACTLY match the swatch's color,
       texture, and pattern? Is the color precisely right (BEYAZ must be pure white,
       not grey or cream)? Is the transparency level correct (TUL must be nearly
       see-through; blackout must block all light completely)?

    2. ROOM COHERENCE: Are all room elements preserved? Check: wall color,
       floor, furniture, plants, side tables, cushions.
       Are there two curtain panels (left AND right)? Are there any added or missing objects?

    3. REALISM: Does this look like a real photograph? Check for:
       - AI artifacts (distorted edges, impossible geometry, floating objects)
       - Consistent shadows and reflections
       - Natural-looking fabric physics
       - Believable color grading

    4. LIGHTING: Is the lighting consistent between the curtain and the room?
       Does light interact correctly with the fabric (TUL should glow and be
       backlit by window light; FON should cast shadow; BLACKOUT blocks all light)?

    5. CURTAIN DRAPE: Do the pleats and folds look physically correct for
       this fabric weight? Does gravity affect the fabric naturally?

    6. ROD HIDDEN: Is the curtain rod and ALL hardware COMPLETELY hidden? There must be ZERO
       visible metal rod, rings, O-rings, hooks, brackets, or any hardware.
       The curtain top must disappear cleanly behind the smooth plaster cornice (kartonpiyer) —
       no curtain heading tape, pleat hooks, or fabric visible above the cornice line.
       ALSO check: is there any colored rectangle, valance, roman blind, or window panel
       visible between the curtain top and the cornice? If yes, score 1 — the area above
       the curtain must be ONLY smooth white plaster cornice, nothing else.
       Score 10 if perfectly hidden with clean white cornice and no colored element above.

    7. HEM CLEARANCE: Is there a clearly visible gap of bare floor between the
       curtain hem and the baseboard? The curtain must NOT touch, brush, or pool
       on the floor. The gap should be approximately 10–15 cm of visible floor.
       Score 10 if perfect clearance, 1 if curtain touches or pools on the floor.

    8. OVERALL: Would this image be convincing on an e-commerce product page?
       Would a customer believe this is a real interior design photo?

    PASS CONDITION: pass=true only if:
    - overall >= 7
    - rod_hidden >= 7 (rod must be hidden)
    - hem_clearance >= 7 (curtain must not touch floor)
    - no other individual score < 5

    If pass=false, describe the specific issues and suggest exactly how to adjust the prompt.

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
