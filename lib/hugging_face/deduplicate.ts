export function deduplicate(mcqs: any[]): any[] {
  const seen = new Set();
  return mcqs.filter(mcq => {
    const isDupe = mcqs.some(other => other !== mcq && new StringSimilarity(mcq.question, other.question).similarity() > 0.9);
    if (!isDupe) seen.add(mcq.question);
    return !isDupe;
  });
}