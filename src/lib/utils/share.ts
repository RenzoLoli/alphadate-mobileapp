import { type AlphabetDate } from "@/lib/services/api/responses/alphabetDatesResponse";
import { isDateDone } from "@/lib/utils/dates";
import {
  LETTERS,
  type Letter,
  deriveLetter,
  normalizeLetter,
} from "@/lib/utils/letters";

/** Shapes the same Alphadate can be exported as. */
export const SHARE_FORMATS = ["text", "markdown", "csv"] as const;

export type ShareFormat = (typeof SHARE_FORMATS)[number];

export interface ShareFormatOption {
  value: ShareFormat;
  label: string;
  /** One line under the picker explaining where the format shines. */
  hint: string;
  /**
   * Extension the content is shared as. `undefined` means it travels as a
   * plain text message instead of an attached file.
   */
  extension?: string;
  /** Android intent type. */
  mimeType: string;
  /** iOS Uniform Type Identifier. */
  uti: string;
}

export const SHARE_FORMAT_OPTIONS: ShareFormatOption[] = [
  {
    value: "text",
    label: "Texto",
    hint: "Se envía como mensaje de texto, listo para leer en el chat.",
    mimeType: "text/plain",
    uti: "public.plain-text",
  },
  {
    value: "markdown",
    label: "Markdown",
    hint: "Se envía como archivo .md con casillas para marcar las hechas.",
    extension: "md",
    mimeType: "text/markdown",
    uti: "net.daringfireball.markdown",
  },
  {
    value: "csv",
    label: "CSV",
    hint: "Se envía como archivo .csv, una fila por cita, para abrir en una planilla.",
    extension: "csv",
    mimeType: "text/csv",
    uti: "public.comma-separated-values-text",
  },
];

/**
 * Groups dates by letter, in the same order the wheel shows them.
 *
 * A date whose letter is missing or unknown falls back to the one derived from
 * its title, so sharing never silently drops an entry.
 */
function groupByLetter(
  dates: AlphabetDate[]
): { letter: Letter; dates: AlphabetDate[] }[] {
  const groups = new Map<string, AlphabetDate[]>();

  for (const date of dates) {
    const letter = normalizeLetter(date.letter) ?? deriveLetter(date.title);
    const bucket = groups.get(letter);

    if (bucket) {
      bucket.push(date);
    } else {
      groups.set(letter, [date]);
    }
  }

  return LETTERS.flatMap((letter) => {
    const bucket = groups.get(letter);

    return bucket ? [{ letter, dates: bucket }] : [];
  });
}

function readTags(date: AlphabetDate): string[] {
  return date.tags.map((tag) => tag.trim()).filter(Boolean);
}

/** Descriptions arrive as free text: keep them on one line so the list scans. */
function normalizeDescription(description: string): string {
  return description.replace(/\s+/g, " ").trim();
}

function countLabel(dates: AlphabetDate[]): string {
  return dates.length === 1 ? "1 cita" : `${dates.length} citas`;
}

/**
 * ```
 * • Cena con velas — romántico, tranquilo
 *   Una cena íntima en casa, sin apuro.
 * ```
 */
function formatPrettyDate(date: AlphabetDate): string {
  const tags = readTags(date);
  const description = normalizeDescription(date.description);

  const heading =
    tags.length > 0
      ? `• ${date.title} — ${tags.join(", ")}`
      : `• ${date.title}`;

  return description.length > 0 ? `${heading}\n  ${description}` : heading;
}

function buildPrettyText(dates: AlphabetDate[]): string {
  const blocks = groupByLetter(dates).map(({ letter, dates: items }) =>
    [letter.toUpperCase(), ...items.map(formatPrettyDate)].join("\n")
  );

  return [`Mi Alphadate 💌 — ${countLabel(dates)}`, ...blocks].join("\n\n");
}

/**
 * GitHub-flavoured task list: done dates ship ticked, so the person receiving
 * it can keep marking them without retyping the list.
 */
function buildMarkdown(dates: AlphabetDate[]): string {
  const blocks = groupByLetter(dates).map(({ letter, dates: items }) => {
    const lines = items.map((date) => {
      const box = isDateDone(date) ? "[x]" : "[ ]";
      const tags = readTags(date);
      const description = normalizeDescription(date.description);

      const heading =
        tags.length > 0
          ? `- ${box} **${date.title}** — ${tags.join(", ")}`
          : `- ${box} **${date.title}**`;

      return description.length > 0 ? `${heading}\n  ${description}` : heading;
    });

    return [`## ${letter.toUpperCase()}`, "", ...lines].join("\n");
  });

  return [
    "# Mi Alphadate 💌",
    `${countLabel(dates)} · ${blocks.length} de 26 letras`,
    ...blocks,
  ].join("\n\n");
}

function csvField(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/**
 * One row per date. Tags share a single cell separated by `;` so the column
 * count stays stable when the file reaches a spreadsheet.
 */
function buildCsv(dates: AlphabetDate[]): string {
  const rows = groupByLetter(dates).flatMap(({ letter, dates: items }) =>
    items.map((date) =>
      [
        letter.toUpperCase(),
        csvField(date.title),
        csvField(normalizeDescription(date.description)),
        csvField(readTags(date).join("; ")),
        isDateDone(date) ? "Hecha" : "Pendiente",
      ].join(",")
    )
  );

  return ["Letra,Título,Descripción,Etiquetas,Estado", ...rows].join("\n");
}

/**
 * The whole Alphadate as a shareable string.
 *
 * Deliberately plain in every format: no links, so the text survives being
 * pasted into WhatsApp, a spreadsheet or a task app without turning into noise.
 */
export function buildAlphadateShare(
  dates: AlphabetDate[],
  format: ShareFormat
): string {
  if (dates.length === 0) {
    return "";
  }

  switch (format) {
    case "markdown":
      return buildMarkdown(dates);
    case "csv":
      return buildCsv(dates);
    default:
      return buildPrettyText(dates);
  }
}

/** Short label for the share sheet's subject line. */
export function alphadateShareTitle(dates: AlphabetDate[]): string {
  return `Mi Alphadate — ${countLabel(dates)}`;
}
