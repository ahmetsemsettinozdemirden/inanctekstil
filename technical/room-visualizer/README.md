# room-visualizer

AI room visualizer service for Odanda Gör. Accepts a room photo + Shopify product ID and returns a generated image with curtains composited in.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `FAL_API_KEY` | fal.ai API key (from fal.ai dashboard) |
| `FAL_MODEL` | fal.ai model ID (default: `fal-ai/nano-banana-pro`) |
| `SHOPIFY_ACCESS_TOKEN` | Shopify Admin API access token |
| `SHOPIFY_STORE_DOMAIN` | Shopify store domain (e.g. `inanctekstil.store`) |
| `AWS_ACCESS_KEY_ID` | IAM key with `bedrock:InvokeModel` permission |
| `AWS_SECRET_ACCESS_KEY` | IAM secret |
| `AWS_REGION` | AWS region for Bedrock (e.g. `us-east-1`) |

## Deploy

```bash
# 1. Sync source to server
rsync -av --exclude node_modules --exclude baml_client \
  technical/room-visualizer/ root@5.75.165.158:/opt/room-visualizer/

# 2. Add env vars to server .env
# Edit /opt/inanctekstil/.env on the server and add:
#   FAL_API_KEY=<from fal.ai dashboard>
#   FAL_MODEL=fal-ai/nano-banana-pro
#   SHOPIFY_STORE_DOMAIN=inanctekstil.store
#   AWS_ACCESS_KEY_ID=<IAM key>
#   AWS_SECRET_ACCESS_KEY=<secret>
#   AWS_REGION=us-east-1

# 3. Copy docker-compose service entry into /opt/inanctekstil/docker-compose.yml

# 4. Start the container
ssh root@5.75.165.158 "cd /opt/inanctekstil && docker compose up -d --build room-visualizer"

# 5. Apply DNS (adds visualizer.inanctekstil.store → 5.75.165.158)
cd technical/gitopsprod && terraform apply
```
