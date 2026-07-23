export function isAdminNavItemActive(pathname: string, href: string): boolean {
  if (href === '/admin') {
    return pathname === href
  }
  return pathname === href || pathname.startsWith(`${href}/`)
}
