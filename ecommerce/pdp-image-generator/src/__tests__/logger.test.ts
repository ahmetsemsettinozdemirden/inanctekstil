import { describe, it, expect, beforeEach, afterAll } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";

// Logger is not exported from generate.ts, so we re-implement a minimal version
// to test the logic. If Logger is ever extracted to its own module, import it directly.

type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0, info: 1, warn: 2, error: 3,
};

interface StepTiming {
  name: string;
  startedAt: number;
  endedAt?: number;
  durationMs?: number;
}

interface RunSummary {
  flow: string;
  startedAt: string;
  endedAt: string;
  totalDurationMs: number;
  steps: { name: string; durationMs: number }[];
  result: "pass" | "fail" | "max_retries" | "error";
  details?: Record<string, unknown>;
}

class Logger {
  private lines: string[] = [];
  private logPath: string;
  private summaryPath: string;
  private minLevel: LogLevel;
  private runStart: number;
  private steps: StepTiming[] = [];
  private currentStep: StepTiming | null = null;
  private flowName: string = "";
  private summaryDetails: Record<string, unknown> = {};
  private result: RunSummary["result"] = "pass";

  constructor(outputDir: string, minLevel: LogLevel = "info") {
    const intDir = path.join(outputDir, "intermediate");
    fs.mkdirSync(intDir, { recursive: true });
    this.logPath = path.join(intDir, "log.txt");
    this.summaryPath = path.join(intDir, "summary.json");
    this.minLevel = minLevel;
    this.runStart = Date.now();
  }

  setFlow(name: string) { this.flowName = name; }
  setResult(result: RunSummary["result"]) { this.result = result; }
  addDetail(key: string, value: unknown) { this.summaryDetails[key] = value; }

  startStep(name: string) {
    this.endStep();
    this.currentStep = { name, startedAt: Date.now() };
    this.info(`--- ${name} ---`);
  }

  endStep() {
    if (this.currentStep) {
      this.currentStep.endedAt = Date.now();
      this.currentStep.durationMs = this.currentStep.endedAt - this.currentStep.startedAt;
      this.steps.push(this.currentStep);
      this.debug(`  [${this.currentStep.name}] completed in ${this.currentStep.durationMs}ms`);
      this.currentStep = null;
    }
  }

  private write(level: LogLevel, msg: string) {
    if (LOG_LEVEL_PRIORITY[level] < LOG_LEVEL_PRIORITY[this.minLevel]) return;
    const ts = new Date().toISOString();
    const tag = level.toUpperCase().padEnd(5);
    const line = `[${ts}] ${tag} ${msg}`;
    this.lines.push(line);
  }

  debug(msg: string) { this.write("debug", msg); }
  info(msg: string) { this.write("info", msg); }
  warn(msg: string) { this.write("warn", msg); }
  error(msg: string) { this.write("error", msg); }
  log(msg: string) { this.info(msg); }

  getLines() { return this.lines; }
  getSteps() { return this.steps; }

  flush() {
    this.endStep();
    const totalMs = Date.now() - this.runStart;
    this.info(`Total duration: ${(totalMs / 1000).toFixed(1)}s`);
    fs.writeFileSync(this.logPath, this.lines.join("\n") + "\n");

    const summary: RunSummary = {
      flow: this.flowName,
      startedAt: new Date(this.runStart).toISOString(),
      endedAt: new Date().toISOString(),
      totalDurationMs: totalMs,
      steps: this.steps.map((s) => ({ name: s.name, durationMs: s.durationMs ?? 0 })),
      result: this.result,
      ...(Object.keys(this.summaryDetails).length > 0 && { details: this.summaryDetails }),
    };
    fs.writeFileSync(this.summaryPath, JSON.stringify(summary, null, 2));
  }
}

const tmpDir = path.join(os.tmpdir(), "logger-test-" + Date.now());

beforeEach(() => {
  fs.mkdirSync(tmpDir, { recursive: true });
});

afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("Logger", () => {
  describe("log levels", () => {
    it("filters out debug messages at info level", () => {
      const outDir = path.join(tmpDir, "level-filter");
      const logger = new Logger(outDir, "info");
      logger.debug("should not appear");
      logger.info("should appear");
      expect(logger.getLines()).toHaveLength(1);
      expect(logger.getLines()[0]).toContain("should appear");
    });

    it("includes debug messages at debug level", () => {
      const outDir = path.join(tmpDir, "level-debug");
      const logger = new Logger(outDir, "debug");
      logger.debug("debug msg");
      logger.info("info msg");
      expect(logger.getLines()).toHaveLength(2);
    });

    it("filters info and debug at warn level", () => {
      const outDir = path.join(tmpDir, "level-warn");
      const logger = new Logger(outDir, "warn");
      logger.debug("no");
      logger.info("no");
      logger.warn("yes");
      logger.error("yes");
      expect(logger.getLines()).toHaveLength(2);
    });

    it("only shows errors at error level", () => {
      const outDir = path.join(tmpDir, "level-error");
      const logger = new Logger(outDir, "error");
      logger.debug("no");
      logger.info("no");
      logger.warn("no");
      logger.error("yes");
      expect(logger.getLines()).toHaveLength(1);
    });

    it("tags lines with level name", () => {
      const outDir = path.join(tmpDir, "level-tags");
      const logger = new Logger(outDir, "debug");
      logger.debug("d");
      logger.info("i");
      logger.warn("w");
      logger.error("e");
      expect(logger.getLines()[0]).toContain("DEBUG");
      expect(logger.getLines()[1]).toContain("INFO");
      expect(logger.getLines()[2]).toContain("WARN");
      expect(logger.getLines()[3]).toContain("ERROR");
    });
  });

  describe("step timing", () => {
    it("tracks step start and end", () => {
      const outDir = path.join(tmpDir, "step-basic");
      const logger = new Logger(outDir, "debug");
      logger.startStep("Upload");
      logger.endStep();
      const steps = logger.getSteps();
      expect(steps).toHaveLength(1);
      expect(steps[0].name).toBe("Upload");
      expect(steps[0].durationMs).toBeGreaterThanOrEqual(0);
    });

    it("auto-ends previous step when starting a new one", () => {
      const outDir = path.join(tmpDir, "step-auto-end");
      const logger = new Logger(outDir, "debug");
      logger.startStep("Step 1");
      logger.startStep("Step 2");
      logger.endStep();
      const steps = logger.getSteps();
      expect(steps).toHaveLength(2);
      expect(steps[0].name).toBe("Step 1");
      expect(steps[1].name).toBe("Step 2");
    });

    it("endStep is safe to call with no active step", () => {
      const outDir = path.join(tmpDir, "step-noop");
      const logger = new Logger(outDir);
      logger.endStep(); // should not throw
      expect(logger.getSteps()).toHaveLength(0);
    });

    it("flush auto-ends the current step", () => {
      const outDir = path.join(tmpDir, "step-flush-end");
      const logger = new Logger(outDir, "debug");
      logger.startStep("Running");
      logger.flush();
      expect(logger.getSteps()).toHaveLength(1);
      expect(logger.getSteps()[0].name).toBe("Running");
    });
  });

  describe("flush output", () => {
    it("writes log.txt to intermediate directory", () => {
      const outDir = path.join(tmpDir, "flush-log");
      const logger = new Logger(outDir);
      logger.info("hello");
      logger.flush();
      const logPath = path.join(outDir, "intermediate", "log.txt");
      expect(fs.existsSync(logPath)).toBe(true);
      const content = fs.readFileSync(logPath, "utf-8");
      expect(content).toContain("hello");
    });

    it("writes summary.json with flow and result", () => {
      const outDir = path.join(tmpDir, "flush-summary");
      const logger = new Logger(outDir);
      logger.setFlow("lifestyle:TUL-001:room-01");
      logger.setResult("pass");
      logger.addDetail("bestScore", 8);
      logger.addDetail("attempts", 1);
      logger.flush();

      const summaryPath = path.join(outDir, "intermediate", "summary.json");
      const summary: RunSummary = JSON.parse(fs.readFileSync(summaryPath, "utf-8"));
      expect(summary.flow).toBe("lifestyle:TUL-001:room-01");
      expect(summary.result).toBe("pass");
      expect(summary.details).toEqual({ bestScore: 8, attempts: 1 });
      expect(summary.totalDurationMs).toBeGreaterThanOrEqual(0);
      expect(summary.startedAt).toBeTruthy();
      expect(summary.endedAt).toBeTruthy();
    });

    it("omits details key when no details added", () => {
      const outDir = path.join(tmpDir, "flush-no-details");
      const logger = new Logger(outDir);
      logger.flush();

      const summaryPath = path.join(outDir, "intermediate", "summary.json");
      const summary = JSON.parse(fs.readFileSync(summaryPath, "utf-8"));
      expect(summary.details).toBeUndefined();
    });

    it("includes step timings in summary", () => {
      const outDir = path.join(tmpDir, "flush-steps");
      const logger = new Logger(outDir);
      logger.startStep("Upload");
      logger.startStep("Generate");
      logger.flush();

      const summaryPath = path.join(outDir, "intermediate", "summary.json");
      const summary: RunSummary = JSON.parse(fs.readFileSync(summaryPath, "utf-8"));
      expect(summary.steps).toHaveLength(2);
      expect(summary.steps[0].name).toBe("Upload");
      expect(summary.steps[1].name).toBe("Generate");
    });

    it("appends total duration line to log", () => {
      const outDir = path.join(tmpDir, "flush-duration");
      const logger = new Logger(outDir);
      logger.flush();

      const logPath = path.join(outDir, "intermediate", "log.txt");
      const content = fs.readFileSync(logPath, "utf-8");
      expect(content).toMatch(/Total duration: \d+\.\ds/);
    });
  });

  describe("log alias", () => {
    it("log() writes at info level", () => {
      const outDir = path.join(tmpDir, "alias");
      const logger = new Logger(outDir, "info");
      logger.log("via log");
      expect(logger.getLines()).toHaveLength(1);
      expect(logger.getLines()[0]).toContain("INFO");
    });
  });
});
