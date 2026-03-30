const PROFILE_KEY = "wagenpark_profile_v1";

export interface UserProfile {
  name: string;
  principalId: string;
}

export function getProfile(principalId: string): UserProfile | null {
  try {
    const raw = localStorage.getItem(`${PROFILE_KEY}_${principalId}`);
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch {
    return null;
  }
}

export function saveProfile(profile: UserProfile): void {
  localStorage.setItem(
    `${PROFILE_KEY}_${profile.principalId}`,
    JSON.stringify(profile),
  );
}
