// Role -> permissions. Roles are assigned only from the command line (npm run set-role), never from the web UI.
export const PERMS = {
  admin: ['users:read', 'users:write', 'users:delete', 'users:export', 'orders:read', 'orders:write', 'messages:read', 'messages:write'],
  staff: ['users:read', 'orders:read', 'orders:write', 'messages:read', 'messages:write'],
  member: [],
};
export const permsFor = (role) => PERMS[role] || [];
