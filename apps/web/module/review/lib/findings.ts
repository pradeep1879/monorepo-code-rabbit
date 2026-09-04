export const findingSeverities = ["critical", "high", "medium", "low"] as const;

export type FindingSeverity = (typeof findingSeverities)[number];

export const findingStatuses = ["open", "in_progress", "resolved"] as const;

export type FindingStatus = (typeof findingStatuses)[number];

export type ParsedFinding = {
  title: string;
  description: string;
  severity: FindingSeverity;
  category?: string;
  filePath?: string;
  lineStart?: number;
  lineEnd?: number;
};

const severityPattern = /\[(critical|high|medium|low)\]/i;
const filePattern = /^\s*[-*]?\s*file:\s*(.+)$/i;
const linePattern = /^\s*[-*]?\s*lines?:\s*(\d+)(?:\s*[-–]\s*(\d+))?/i;

const normalizeSeverity = (value: string): FindingSeverity => {
  const severity = value.toLowerCase() as FindingSeverity;
  return findingSeverities.includes(severity) ? severity : "medium";
};

const cleanMarkdown = (value: string) =>
  value.replace(/[`*_]/g, "").replace(/\s+/g, " ").trim();

const getIssuesSection = (review: string) => {
  const match = review.match(
    /(?:^|\n)\s*(?:#{0,6}\s*)?(?:\d+[.)]\s*)?issues\s*:?\s*\n([\s\S]*?)(?=\n\s*(?:#{0,6}\s*)?(?:\d+[.)]\s*)?(?:suggestions|final verdict|strengths|summary|walkthrough|short poem)\b|$)/i,
  );
  return match?.[1] ?? "";
};

export const parseReviewFindings = (review: string): ParsedFinding[] => {
  const lines = getIssuesSection(review).split("\n");
  const findings: ParsedFinding[] = [];
  let current: ParsedFinding | undefined;

  const saveCurrent = () => {
    if (current?.title) findings.push(current);
  };

  for (const line of lines) {
    const issueLine = line.match(/^\s*(?:[-*]|\d+[.)])\s+(.+)$/);
    if (issueLine && !filePattern.test(line) && !linePattern.test(line)) {
      saveCurrent();
      const raw = issueLine[1] ?? "";
      const severityMatch = raw.match(severityPattern);
      const withoutSeverity = raw.replace(severityPattern, "").trim();
      const [titlePart, descriptionPart] = withoutSeverity.split(
        /\s+[—–-]\s+/,
        2,
      );
      current = {
        title: cleanMarkdown(titlePart ?? withoutSeverity),
        description: cleanMarkdown(descriptionPart ?? withoutSeverity),
        severity: normalizeSeverity(severityMatch?.[1] ?? "medium"),
      };
      continue;
    }

    if (!current) continue;
    const fileMatch = line.match(filePattern);
    if (fileMatch?.[1]) {
      current.filePath = cleanMarkdown(fileMatch[1]);
      continue;
    }
    const lineMatch = line.match(linePattern);
    if (lineMatch?.[1]) {
      current.lineStart = Number(lineMatch[1]);
      current.lineEnd = Number(lineMatch[2] ?? lineMatch[1]);
    }
  }

  saveCurrent();
  return findings;
};
