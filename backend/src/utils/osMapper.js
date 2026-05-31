/**
 * Normalizes OS platform string to match schema enum.
 */
export const mapOS = (rawOs) => {
  if (!rawOs || typeof rawOs !== "string") return "unknown";
  const normalized = rawOs.toLowerCase().trim();
  if (normalized.startsWith("win")) return "windows";
  if (normalized.startsWith("darwin")) return "macos";
  if (normalized.startsWith("mac")) return "macos";
  if (normalized.startsWith("linux")) return "linux";
  if (normalized.startsWith("ubuntu")) return "ubuntu";
  if (normalized.startsWith("debian")) return "debian";
  if (normalized.startsWith("centos")) return "centos";
  return "unknown";
};
