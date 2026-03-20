class EvaluationResult {
  score        int     @description("1-10 overall quality score of the generated room image")
  has_curtains bool    @description("Are curtains clearly visible on the windows?")
  feedback     string  @description("Brief reason for score")
}

function EvaluateRoomImage(image: image, product_name: string) -> EvaluationResult {
  client ClaudeOpus
  prompt #"
    You are an interior design quality evaluator. Evaluate this AI-generated room image.

    The image should show a room with {{ product_name }} curtains.

    Score the image from 1-10 based on:
    - Realism and photographic quality
    - Natural integration of the curtains
    - Lighting consistency
    - Overall aesthetic quality

    Also determine if curtains are clearly visible on the windows.

    {{ ctx.output_format }}

    {{ _.role("user") }}
    {{ image }}
  "#
}
