// All permissionable admin sections (tiles).
// Keep this in sync with admin/page.tsx dashTiles.
export const ALL_TILE_KEYS = [
  "notifications",
  "messages",
  "users",
  "prayers",
  "tiles",
  "modules",
  "referral",
  "bypass",
  "settings",
  "stats",
  "errors",
  "login",
] as const;

export type TileKey = typeof ALL_TILE_KEYS[number];

export interface AdminGroup {
  id: string;
  name: string;
  description?: string;
}

// Stored in app_settings['admin_groups'] as JSON array of AdminGroup
// Stored in app_settings['admin_group_members'] as JSON: { [groupId]: userId[] }
// Stored in app_settings['admin_tile_permissions'] as JSON: { [groupId]: TileKey[] }
