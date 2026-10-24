// Client error reports (src/lib/report.ts, ADR 0011): an uncaught error or rejection on the page goes to /api/report/
// with sendBeacon, which survives leaving the page. Errors of other origins and of browser extensions stay out.
import { createReporter, errorReport, REPORT_PATH } from "../lib/report";

const report = createReporter((body) => {
  navigator.sendBeacon?.(REPORT_PATH, new Blob([body], { type: "application/json" }));
});

// String() throws for an object without a prototype; a throw here would raise one more error event.
function describe(reason: unknown): string {
  try {
    return String(reason);
  } catch {
    return "unhandled rejection";
  }
}

addEventListener("error", (event) => {
  const stack: unknown = event.error instanceof Error ? event.error.stack : undefined;
  report(
    errorReport(
      { message: event.message, file: event.filename, line: event.lineno, column: event.colno, stack },
      location.href,
      location.origin,
    ),
  );
});

addEventListener("unhandledrejection", (event) => {
  const reason: unknown = event.reason;
  const error = reason instanceof Error;
  report(
    errorReport(
      {
        message: error ? `${reason.name}: ${reason.message}` : describe(reason),
        stack: error ? reason.stack : undefined,
      },
      location.href,
      location.origin,
    ),
  );
});
