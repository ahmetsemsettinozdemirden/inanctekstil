// AnalyzeSwatch
// Takes a fabric swatch photo and extracts structured fabric properties.
// Used by add-product CLI to auto-populate manifest entries.

function AnalyzeSwatch(
  swatch_image: image
) -> FabricDescription {
  client BedrockSonnet
  prompt #"
    {{ _.role("user") }}

    You are a textile expert specializing in curtain fabrics for a Turkish
    curtain retailer. Analyze this fabric swatch photo and extract its
    physical properties.

    {{ swatch_image }}

    Determine:

    1. CURTAIN TYPE — classify as one of:
       - TUL: sheer/semi-transparent tulle, voile, or net fabrics
       - FON: opaque drape curtains (not blackout), medium-heavy weight
       - BLACKOUT: thick, fully light-blocking fabrics
       - STN: smooth satin or satin-like lining fabrics

    2. COLOR — primary color in English (e.g. white, cream, anthracite,
       petrol blue, dusty rose, champagne gold). Be specific.

    3. PATTERN — describe the pattern if any (striped, floral, geometric,
       damask, etc.). Return null if the fabric is solid/plain.

    4. MATERIAL — best guess from visual texture (polyester, cotton-blend,
       velvet, linen, silk-blend, etc.)

    5. TRANSPARENCY — one of: sheer, semi-transparent, opaque, blackout

    6. TEXTURE — describe the tactile/visual texture (smooth, woven mesh,
       heavy velvet, crisp linen, soft voile, ribbed, etc.)

    7. WEIGHT — one of: light, medium, heavy

    Base your analysis ONLY on what you can see in the image. If unsure
    between two options, pick the more likely one for a Turkish curtain
    retailer's product line.

    {{ ctx.output_format }}
  "#
}
