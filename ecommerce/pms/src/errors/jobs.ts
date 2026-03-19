import { AppError } from "./base.ts";

export class JobNotFoundError extends AppError {
  constructor(id: string) {
    super(`Job not found: ${id}`, "JOB_NOT_FOUND", 404, { id });
  }
}

export class JobAlreadyRunningError extends AppError {
  constructor(id: string) {
    super(`Job ${id} is already running and cannot be cancelled`, "JOB_ALREADY_RUNNING", 409, { id });
  }
}

export class JobEnqueueError extends AppError {
  constructor(message: string) {
    super(message, "JOB_ENQUEUE_ERROR", 400);
  }
}
