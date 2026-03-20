export interface EvaluationResult {
	score: number;
	has_curtains: boolean;
	feedback: string;
}

type BamlEvaluator = {
	evaluate: (
		imageBase64: string,
		productName: string,
	) => Promise<EvaluationResult>;
};

// Replaced in tests via setEvaluatorClient
let _evaluator: BamlEvaluator | null = null;

export function setEvaluatorClient(client: BamlEvaluator): void {
	_evaluator = client;
}

async function getEvaluator(): Promise<BamlEvaluator> {
	if (_evaluator) return _evaluator;

	// Load BAML client at runtime to avoid static import issues
	const { b } = await import("../../baml_client/async_client.ts");
	const { Image } = await import("@boundaryml/baml");

	return {
		evaluate: async (imageBase64: string, productName: string) => {
			const image = Image.fromBase64("image/jpeg", imageBase64);
			const result = await b.EvaluateRoomImage(image, productName);
			return {
				score: result.score,
				has_curtains: result.has_curtains,
				feedback: result.feedback,
			};
		},
	};
}

export async function evaluateImage(
	imageBuffer: Buffer,
	productName: string,
): Promise<EvaluationResult> {
	const evaluator = await getEvaluator();
	const base64 = imageBuffer.toString("base64");
	return evaluator.evaluate(base64, productName);
}
