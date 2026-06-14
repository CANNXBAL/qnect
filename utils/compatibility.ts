import { Profile } from "@/components/ProfileCard";

const currentUser = {
  mode: "RP",
  platform: "PC",
  games: ["FiveM", "VRChat", "Phasmophobia"],
  lookingFor: ["RP Partner", "Friends"],
  vibes: ["Story Driven", "Night Owl", "Chill"],
};

export function calculateCompatibility(profile: Profile) {
  let score = 40;

  if (profile.mode === currentUser.mode) {
    score += 15;
  }

  if (profile.platform === currentUser.platform) {
    score += 10;
  }

  score += getSharedCount(profile.games, currentUser.games) * 8;
  score += getSharedCount(profile.lookingFor, currentUser.lookingFor) * 7;
  score += getSharedCount(profile.vibes, currentUser.vibes) * 5;

  return Math.min(score, 99);
}

export function getCompatibilityBreakdown(profile: Profile) {
  const reasons: string[] = [];

  if (profile.mode === currentUser.mode) {
    reasons.push("Same primary mode");
  }

  if (profile.platform === currentUser.platform) {
    reasons.push("Same platform");
  }

  const sharedGames = getSharedCount(profile.games, currentUser.games);
  if (sharedGames > 0) {
    reasons.push(`${sharedGames} shared game${sharedGames > 1 ? "s" : ""}`);
  }

  const sharedLookingFor = getSharedCount(
    profile.lookingFor,
    currentUser.lookingFor
  );

  if (sharedLookingFor > 0) {
    reasons.push("Similar goals");
  }

  const sharedVibes = getSharedCount(profile.vibes, currentUser.vibes);

  if (sharedVibes > 0) {
    reasons.push("Similar vibes");
  }

  return reasons;
}

function getSharedCount(listA: string[], listB: string[]) {
  return listA.filter((item) => listB.includes(item)).length;
}