/**
 * Liveness probe for the platform's health check.
 *
 * Deliberately does NOT call the backend. A health check that depends on another service turns
 * one outage into two: the backend spinning down on Render's free tier would make Render judge
 * *this* service unhealthy and restart or roll it back, when the web server is fine and every
 * static page still renders. Backend reachability is a page-level concern, not a liveness one.
 */
// Redundant but stated: GET handlers have defaulted to dynamic since Next 15, and a health check
// that got prerendered into a static asset would report UP from a dead process.
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ status: "UP" });
}
