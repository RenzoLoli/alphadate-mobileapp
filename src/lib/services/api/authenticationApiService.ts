import {
  AlphabetDatesResponse,
  DATE_STATUS,
} from "./responses/alphabetDatesResponse";

export class AuthenticationApiService {
  async login(email: string, password: string): Promise<AlphabetDatesResponse> {
    return {
      message: "success",
      ok: true,
      length: 1,
      dates: [
        {
          userId: "1",
          dateId: "1",
          letter: "a",
          title: "Alphabet Date",
          description: "Description",
          tags: ["tag1", "tag2"],
          status: DATE_STATUS.published,
        },
      ],
    };
  }
}
