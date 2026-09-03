// Mirrors the backend's User::canDo() (app/Models/User.php), which itself
// mirrors Role::canDo() per role: an employee can now cumulate several
// roles, and any ONE of them granting the action is enough — roles only add
// permissions, they never take one away.
export const can = (user, resource, action) => {
  const roles = user?.roles || [];
  return roles.some((role) => {
    if (role.access_level === 'full') return true;
    if (role.access_level === 'none') return false;
    return (role.permissions?.[resource] || []).includes(action);
  });
};

// Mirrors User::canAccessInterface() — independent of the create/read/
// update/delete matrix above: whether ANY of the user's roles can navigate
// to a given screen (e.g. 'calendar', 'users'). An empty/missing
// interface_access list on a role means "all interfaces" for that role,
// same convention as allowed_zones/companies.
export const canAccessInterface = (user, interfaceKey) => {
  const roles = user?.roles || [];
  return roles.some((role) => {
    if (role.access_level === 'full') return true;
    if (role.access_level === 'none') return false;
    if (!role.interface_access || role.interface_access.length === 0) return true;
    return role.interface_access.includes(interfaceKey);
  });
};
