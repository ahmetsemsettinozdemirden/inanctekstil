import { Hono } from "hono";
import { getDesigns, getDesign, updateDesign, type UpdateDesignInput } from "../lib/catalog.ts";
import { logger } from "../lib/logger.ts";

export const catalogRouter = new Hono();

catalogRouter.get("/", async (c) => {
  const designs = await getDesigns();
  logger.debug({ count: designs.length }, "GET /api/catalog");
  return c.json(designs);
});

catalogRouter.get("/:id", async (c) => {
  const id = c.req.param("id");
  const design = await getDesign(id);
  return c.json(design);
});

catalogRouter.patch("/:id", async (c) => {
  const id = c.req.param("id");

  let body: UpdateDesignInput;
  try {
    body = await c.req.json<UpdateDesignInput>();
  } catch {
    return c.json({ error: "INVALID_JSON", message: "Request body must be valid JSON" }, 400);
  }

  const updated = await updateDesign(id, body);
  logger.info({ id, fields: Object.keys(body) }, "Design updated");
  return c.json(updated);
});
