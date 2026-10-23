/** Semver precedence, including numeric prerelease identifiers. */
export function compareUpdateVersions(left: string, right: string): number {
  const parse = (value: string) => value.replace(/^v/, "").split("+")[0].split("-");
  const [leftCore, ...leftSuffix] = parse(left);
  const [rightCore, ...rightSuffix] = parse(right);
  const leftNumbers = leftCore.split(".").map(Number);
  const rightNumbers = rightCore.split(".").map(Number);
  for (let index = 0; index < 3; index++) {
    const difference = leftNumbers[index] - rightNumbers[index];
    if (difference) return difference;
  }
  if (!leftSuffix.length || !rightSuffix.length) return rightSuffix.length - leftSuffix.length;
  const leftParts = leftSuffix.join("-").split(".");
  const rightParts = rightSuffix.join("-").split(".");
  for (let index = 0; index < Math.max(leftParts.length, rightParts.length); index++) {
    const a = leftParts[index];
    const b = rightParts[index];
    if (a === b) continue;
    if (a === undefined) return -1;
    if (b === undefined) return 1;
    const aNumeric = /^\d+$/.test(a);
    const bNumeric = /^\d+$/.test(b);
    if (aNumeric && bNumeric) return Number(a) - Number(b);
    if (aNumeric !== bNumeric) return aNumeric ? -1 : 1;
    return a < b ? -1 : 1;
  }
  return 0;
}
