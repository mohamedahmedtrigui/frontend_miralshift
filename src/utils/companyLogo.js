// company.logo is either 2-letter initials or a storage path/filename
// (e.g. "logos/xxx.png"). When logo_url is unset (no image, or an orphaned
// path left over from a storage migration — see CompanyLogoStorage on the
// backend), naively displaying `company.logo` as text would leak that raw
// path into the badge instead of showing initials.
export function companyBadgeText(company) {
  if (company?.logo && !company.logo.includes('/')) {
    return company.logo;
  }
  return company?.name ? company.name.substring(0, 2).toUpperCase() : 'CO';
}
