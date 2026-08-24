// Mirrors the backend's Role::canDo() logic (app/Models/Role.php) so
// buttons for actions the user isn't allowed to perform aren't shown at
// all, instead of only failing after the click.
export const can = (user, resource, action) => {
  const role = user?.role;
  if (!role) return false;
  if (role.access_level === 'full') return true;
  if (role.access_level === 'none') return false;
  return (role.permissions?.[resource] || []).includes(action);
};

// Mirrors Role::canAccessInterface() — independent of the create/read/
// update/delete matrix above: whether this role can even navigate to a
// given screen (e.g. 'calendar', 'users'). An empty/missing interface_access
// list means "all interfaces", same convention as allowed_zones/companies.
export const canAccessInterface = (user, interfaceKey) => {
  const role = user?.role;
  if (!role) return false;
  if (role.access_level === 'full') return true;
  if (role.access_level === 'none') return false;
  if (!role.interface_access || role.interface_access.length === 0) return true;
  return role.interface_access.includes(interfaceKey);
};
