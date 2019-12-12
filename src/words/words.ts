export function getWords(): string[] {
  const result = require("fs").readFileSync("./src/words/rus.txt", "utf8");
  return (result as string).split("\r\n");
}
