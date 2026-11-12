export type ShareFileStage = "modules" | "write" | "share";

export type ShareFileResult =
  | { ok: true }
  | {
      ok: false;
      reason: "unavailable" | "failed";
      /** Which step stopped the share, so the caller can word the error. */
      stage: ShareFileStage;
      detail?: string;
    };

interface ShareFileParams {
  /** File name including its extension, for example `mi-alphadate.csv`. */
  fileName: string;
  content: string;
  /** Android intent type, for example `text/csv`. */
  mimeType: string;
  /** iOS Uniform Type Identifier. */
  uti: string;
  dialogTitle?: string;
}

function describe(cause: unknown): string {
  if (cause instanceof Error) {
    return `${cause.name}: ${cause.message}`;
  }

  return typeof cause === "string" ? cause : String(cause);
}

/**
 * Current `File` / `Paths` class API. It creates the file with an explicit
 * overwrite so re-sharing the same list does not fail on the previous copy.
 */
async function writeWithClassApi(
  fileName: string,
  content: string
): Promise<string> {
  const { File, Paths } = await import("expo-file-system");
  const file = new File(Paths.cache, fileName);

  file.create({ overwrite: true, intermediates: true });
  file.write(content);

  return file.uri;
}

/**
 * Compatibility path. The legacy module exposes the same cache write as a
 * plain async function on the native module, without the shared-object classes
 * the modern API builds on. It is only reached when the modern call fails,
 * which in practice means the native binary in use is older than the JS.
 */
async function writeWithLegacyApi(
  fileName: string,
  content: string
): Promise<string> {
  const { cacheDirectory, writeAsStringAsync } =
    await import("expo-file-system/legacy");

  if (!cacheDirectory) {
    throw new Error("the cache directory is not available");
  }

  const uri = `${cacheDirectory}${fileName}`;
  await writeAsStringAsync(uri, content, { encoding: "utf8" });

  return uri;
}

/**
 * Writes `content` to the cache and hands the file to the system share sheet.
 *
 * A real file is what makes a `.csv` open in a spreadsheet and a `.md` open in
 * a markdown app: sharing the same bytes as a chat message loses the format on
 * the way. The cache directory is used because the file is disposable the
 * moment the share sheet takes it.
 *
 * Two things can go wrong, and both are reported instead of thrown:
 * - `expo-sharing` resolves its native module while the module is loading, so a
 *   binary built before the module existed fails at import time. Loading it
 *   lazily turns that into a result this function can report.
 * - The write goes through the class API first and falls back to the legacy
 *   module, because a native binary older than the JS can be missing a method
 *   the class API expects.
 */
export async function shareFile({
  fileName,
  content,
  mimeType,
  uti,
  dialogTitle,
}: ShareFileParams): Promise<ShareFileResult> {
  let sharing: typeof import("expo-sharing");

  try {
    sharing = await import("expo-sharing");
  } catch (cause) {
    // The native side is missing, which usually means the app needs a rebuild.
    return {
      ok: false,
      reason: "unavailable",
      stage: "modules",
      detail: describe(cause),
    };
  }

  try {
    if (!(await sharing.isAvailableAsync())) {
      return { ok: false, reason: "unavailable", stage: "modules" };
    }
  } catch (cause) {
    return {
      ok: false,
      reason: "unavailable",
      stage: "modules",
      detail: describe(cause),
    };
  }

  const failures: string[] = [];
  let uri: string | undefined;

  try {
    uri = await writeWithClassApi(fileName, content);
  } catch (cause) {
    failures.push(`class: ${describe(cause)}`);
  }

  if (!uri) {
    try {
      uri = await writeWithLegacyApi(fileName, content);
    } catch (cause) {
      failures.push(`legacy: ${describe(cause)}`);
    }
  }

  if (!uri) {
    return {
      ok: false,
      reason: "failed",
      stage: "write",
      detail: failures.join(" | "),
    };
  }

  try {
    await sharing.shareAsync(uri, { mimeType, UTI: uti, dialogTitle });
  } catch (cause) {
    return {
      ok: false,
      reason: "failed",
      stage: "share",
      detail: describe(cause),
    };
  }

  return { ok: true };
}
