import { execFileSync } from "node:child_process"

const EPOCH = new Date(0).toISOString()

function readGitDate(repoDir, args) {
  try {
    return execFileSync("git", args, {
      cwd: repoDir,
      encoding: "utf8",
    }).trim()
  } catch {
    return ""
  }
}

export function lastModifiedForPath(
  repoDir,
  source,
  readDate = (args) => readGitDate(repoDir, args),
) {
  const sourceDate = readDate(["log", "-1", "--format=%cI", "--", source]).trim()
  if (sourceDate) return sourceDate

  const checkoutDate = readDate(["log", "-1", "--format=%cI"]).trim()
  return checkoutDate || EPOCH
}
