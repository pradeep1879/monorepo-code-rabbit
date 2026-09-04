export class PatchApplicationError extends Error {
  constructor(
    public readonly code: "PATCH_INVALID" | "PATCH_CONFLICT" | "STALE_SHA",
    message: string,
  ) {
    super(message);
  }
}

const normalizePath = (path: string) => path.replace(/^([ab])\//, "");

const findSequence = (source: string[], sequence: string[], from: number) => {
  if (!sequence.length) return Math.max(0, Math.min(from, source.length));
  for (
    let index = Math.max(0, from);
    index <= source.length - sequence.length;
    index += 1
  ) {
    if (
      source.slice(index, index + sequence.length).join("\n") ===
      sequence.join("\n")
    )
      return index;
  }
  return -1;
};

export const applyUnifiedPatch = (
  currentContent: string,
  patch: string,
  expectedPath: string,
) => {
  const lines = patch.replace(/\r\n/g, "\n").split("\n");
  const header = lines.find((line) => line.startsWith("--- "));
  const target = lines.find((line) => line.startsWith("+++ "));
  if (!header || !target)
    throw new PatchApplicationError(
      "PATCH_INVALID",
      "Patch headers are missing",
    );

  const patchPath = normalizePath(target.slice(4).trim().split("\t")[0] ?? "");
  if (!patchPath || patchPath !== expectedPath)
    throw new PatchApplicationError(
      "PATCH_INVALID",
      "Patch target does not match the approved file",
    );

  const hunks = lines.filter((line) => line.startsWith("@@ "));
  if (!hunks.length)
    throw new PatchApplicationError(
      "PATCH_INVALID",
      "Patch must contain a unified diff hunk",
    );

  const source = currentContent.replace(/\r\n/g, "\n").split("\n");
  let offset = 0;
  for (const hunkHeader of hunks) {
    const index = lines.indexOf(hunkHeader);
    const match = hunkHeader.match(
      /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/,
    );
    if (!match)
      throw new PatchApplicationError(
        "PATCH_INVALID",
        "Invalid unified diff hunk",
      );
    const start = Number(match[1]) - 1 + offset;
    const hunkLines: string[] = [];
    for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
      const line = lines[cursor] ?? "";
      if (line.startsWith("@@ ")) break;
      if (line.startsWith("\\")) continue;
      if (!line || /^[ +-]/.test(line)) hunkLines.push(line);
    }
    const original: string[] = [];
    const replacement: string[] = [];
    for (const line of hunkLines) {
      if (line.startsWith(" ") || (!line && line !== ""))
        original.push(line.slice(1));
      if (line.startsWith(" ")) replacement.push(line.slice(1));
      else if (line.startsWith("-")) original.push(line.slice(1));
      else if (line.startsWith("+")) replacement.push(line.slice(1));
    }
    const actualStart = findSequence(source, original, start);
    if (actualStart < 0)
      throw new PatchApplicationError(
        "PATCH_CONFLICT",
        "Patch context no longer matches the file",
      );
    source.splice(actualStart, original.length, ...replacement);
    offset += actualStart - start + replacement.length - original.length;
  }
  return source.join("\n");
};
