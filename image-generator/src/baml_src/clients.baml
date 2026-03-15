// Amazon Bedrock — Claude Sonnet 4 for prompt crafting and image evaluation
// Uses inference profile IDs (required for newer models on Bedrock)
client<llm> BedrockSonnet {
  provider aws-bedrock
  retry_policy Exponential
  options {
    model "us.anthropic.claude-sonnet-4-20250514-v1:0"
    region "us-east-1"
    inference_configuration {
      max_tokens 2048
      temperature 0.7
    }
  }
}

// Bedrock Haiku 4.5 — fast, cheap for quick evaluations
client<llm> BedrockHaiku {
  provider aws-bedrock
  retry_policy Exponential
  options {
    model "us.anthropic.claude-haiku-4-5-20251001-v1:0"
    region "us-east-1"
    inference_configuration {
      max_tokens 1024
      temperature 0.3
    }
  }
}

retry_policy Exponential {
  max_retries 3
  strategy {
    type exponential_backoff
    delay_ms 500
    multiplier 2.0
    max_delay_ms 10000
  }
}
