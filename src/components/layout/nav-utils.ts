/**
 * Determines whether a given route is a high-stakes decision/contract page.
 * Decision pages (such as `/plans/:planId`) use contextual full-screen mode on mobile,
 * hiding the persistent 5-item bottom nav to dedicate maximum viewport height
 * to financial terms and the sticky decision dock.
 */
export function isDecisionRoute(pathname: string): boolean {
  return pathname.startsWith('/plans/') && pathname !== '/plans'
}
