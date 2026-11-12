import { Letter } from "@/lib/utils/letters";

import { BaseResponse } from "./base";

/** Values the API returns in `date.status`. */
export const DATE_STATUS = {
  published: "PUBLISHED",
  done: "DONE",
} as const;

/** Values the update endpoint accepts in the `status` body field. */
export const DATE_STATUS_COMMAND = {
  finish: "finish",
  refresh: "refresh",
} as const;

/** `PUBLISHED` is the stand-by state; `DONE` means the user already had it. */
export type AlphabetDateStatus = (typeof DATE_STATUS)[keyof typeof DATE_STATUS];

export type AlphabetDateStatusCommand =
  (typeof DATE_STATUS_COMMAND)[keyof typeof DATE_STATUS_COMMAND];

export interface AlphabetDate {
  userId: string;
  dateId: string;

  letter: Letter;
  title: string;
  description: string;

  tags: string[];
  status: AlphabetDateStatus;
  //
  // creationDate: Date;
  // updatedAt: Date;
}

export interface AlphabetDatesResponse extends BaseResponse {
  length: number;
  dates: AlphabetDate[];
}
