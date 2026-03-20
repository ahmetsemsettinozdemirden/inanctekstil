client<llm> ClaudeOpus {
  provider "aws-bedrock"
  options {
    model "anthropic.claude-opus-4-6"
    region env.AWS_REGION
  }
}
