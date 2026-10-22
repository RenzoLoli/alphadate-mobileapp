export const LETTERS = [
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "i",
  "j",
  "k",
  "l",
  "m",
  "n",
  "o",
  "p",
  "q",
  "r",
  "s",
  "t",
  "u",
  "v",
  "w",
  "x",
  "y",
  "z",
] as const;

export type Letter = (typeof LETTERS)[number];

export function normalizeLetter(value: unknown): Letter | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const letter = value.trim().toLowerCase();

  return (LETTERS as readonly string[]).includes(letter)
    ? (letter as Letter)
    : undefined;
}

export function deriveLetter(text: string): Letter {
  const match = text.toLowerCase().match(/[a-z]/);

  if (match) {
    return match[0] as Letter;
  }

  return "a";
}
