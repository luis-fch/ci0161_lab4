// The user shape returned to clients. Never includes passwordHash.
export type SafeUser = {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
};

export function toSafeUser(u: SafeUser): SafeUser {
  return { id: u.id, email: u.email, name: u.name, avatarUrl: u.avatarUrl };
}
