export function getWords(): string[] {
  return require("fs").readFileSync("./src/words/rus.txt", "utf8");
}
