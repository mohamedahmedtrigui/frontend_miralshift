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
