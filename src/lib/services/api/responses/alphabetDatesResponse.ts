import { Letter } from "@/lib/utils/letters";

import { BaseResponse } from "./base";

export interface AlphabetDate {
  userId: string;
  dateId: string;

  letter: Letter;
  title: string;
  description: string;

  tags: string[];
  //
  // creationDate: Date;
  // updatedAt: Date;
}

export interface AlphabetDatesResponse extends BaseResponse {
  length: number;
  dates: AlphabetDate[];
}
