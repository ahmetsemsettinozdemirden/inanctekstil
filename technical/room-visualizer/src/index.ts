import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { cors } from "hono/cors";
import logger from "./lib/logger.ts";
import { visualizeRoute } from "./routes/visualize.ts";

const app = new Hono();

app.use(
	"*",
	cors({
		origin: "https://inanctekstil.store",
		allowMethods: ["GET", "POST", "OPTIONS"],
		allowHeaders: ["Content-Type"],
		exposeHeaders: ["X-Product-Title", "X-Attempts-Used", "X-Final-Score"],
	}),
);

app.use(
	"*",
	bodyLimit({
		maxSize: 12 * 1024 * 1024,
		onError: (c) => {
			return c.json(
				{
					success: false,
					error: {
						code: "VALIDATION_ERROR",
						message: "Request body too large",
					},
				},
				413,
			);
		},
	}),
);

app.get("/health", (c) => {
	return c.json({ ok: true });
});

app.route("/api/visualize", visualizeRoute);

const port = Number(process.env.PORT ?? "3000");
logger.info({ event: "server_start", port }, "Room visualizer starting");

export default {
	port,
	fetch: app.fetch,
};
