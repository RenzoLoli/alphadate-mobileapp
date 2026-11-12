import {
  AlphabetDate,
  AlphabetDateStatus,
  AlphabetDateStatusCommand,
  DATE_STATUS,
  DATE_STATUS_COMMAND,
} from "@/lib/services/api/responses/alphabetDatesResponse";

/** `DONE` means the user already had the date. */
export function isDateDone(date: Pick<AlphabetDate, "status">): boolean {
  return date.status === DATE_STATUS.done;
}

/** Maps an unknown API value to a known status, defaulting to `PUBLISHED`. */
export function normalizeDateStatus(value: unknown): AlphabetDateStatus {
  return value === DATE_STATUS.done ? DATE_STATUS.done : DATE_STATUS.published;
}

/** Command that moves a date out of its current status. */
export function statusCommandFor(
  status: AlphabetDateStatus
): AlphabetDateStatusCommand {
  return status === DATE_STATUS.done
    ? DATE_STATUS_COMMAND.refresh
    : DATE_STATUS_COMMAND.finish;
}

/** Status a date ends in after applying `command`. */
export function statusAfterCommand(
  command: AlphabetDateStatusCommand
): AlphabetDateStatus {
  return command === DATE_STATUS_COMMAND.finish
    ? DATE_STATUS.done
    : DATE_STATUS.published;
}

/** Done dates first; the incoming order is kept otherwise. */
export function compareDoneFirst(a: AlphabetDate, b: AlphabetDate): number {
  if (isDateDone(a) === isDateDone(b)) {
    return 0;
  }

  return isDateDone(a) ? -1 : 1;
}
