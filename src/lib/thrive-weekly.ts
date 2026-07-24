const issueReferencePatterns = [
  /\bthrive\s+weekly\s+issue\s+\d+\b/gi,
  /\(\s*issue\s+\d+\s*\)/gi,
  /\bissue\s+\d+\b/gi,
];

export function stripIssueReferences(value?: string) {
  if (!value) return value;

  const cleaned = issueReferencePatterns.reduce(
    (result, pattern) => result.replace(pattern, " "),
    value,
  );

  return cleaned
    .replace(/\s+([,:;.!?])/g, "$1")
    .replace(/([(:-])\s{2,}/g, "$1 ")
    .replace(/\s{2,}/g, " ")
    .replace(/^[\s,:;.\-\u2013\u2014|]+|[\s,:;.\-\u2013\u2014|]+$/g, "")
    .trim();
}
