export function similarity(a = "", b = "") {
  const left = a.toLowerCase().trim();
  const right = b.toLowerCase().trim();
  if (!left || !right) return 0;
  if (left === right) return 1;

  const distance = levenshtein(left, right);
  const maxLength = Math.max(left.length, right.length);
  return Number((1 - distance / maxLength).toFixed(2));
}

export function similarNameCandidates(name?: string) {
  if (!name) return [];
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length < 2) return [name];
  const first = parts[0];
  const last = parts[parts.length - 1];
  return Array.from(new Set([name, `${first} ${last}`, `${last} ${first}`, `${first[0]} ${last}`]));
}

function levenshtein(a: string, b: string) {
  const matrix = Array.from({ length: b.length + 1 }, (_, row) => [row]);
  for (let col = 0; col <= a.length; col += 1) matrix[0][col] = col;

  for (let row = 1; row <= b.length; row += 1) {
    for (let col = 1; col <= a.length; col += 1) {
      matrix[row][col] =
        b[row - 1] === a[col - 1]
          ? matrix[row - 1][col - 1]
          : Math.min(matrix[row - 1][col - 1] + 1, matrix[row][col - 1] + 1, matrix[row - 1][col] + 1);
    }
  }

  return matrix[b.length][a.length];
}
