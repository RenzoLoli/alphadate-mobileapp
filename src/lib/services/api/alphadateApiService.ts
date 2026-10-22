import { fetchAuthSession } from "aws-amplify/auth";
import { create } from "axios";

import { deriveLetter, normalizeLetter } from "@/lib/utils/letters";

import { AlphabetDatesResponse } from "./responses/alphabetDatesResponse";
import { BaseResponse } from "./responses/base";

const apiClient = create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(
  async (config) => {
    // console.log("config: ", JSON.stringify(config));

    const session = await fetchAuthSession();

    if (session?.tokens?.accessToken) {
      console.log("TOKEN exists");
      config.headers.Authorization = `Bearer ${session.tokens.accessToken.toString()}`;
    }

    return config;
  },
  (error) => {
    console.log("error: ", error);
    return Promise.reject(error);
  }
);

export class AlphadateService {
  async createAlphabetDate({
    title,
    description,
    tags,
  }: {
    title: string;
    description: string;
    tags: string[];
  }): Promise<BaseResponse> {
    console.log("#####################################");
    try {
      console.log("REQUEST 'createAlphabetDate'");
      const response = await apiClient.post(`/alphabets/dates`, {
        title,
        description,
        tags,
      });

      console.log("STATUS: ", response.status);
      if (response.status === 201) {
        const data = response.data;

        return {
          message: data.message,
          ok: true,
        };
      }

      const nError = new Error("Something went wrong");
      Object.assign(nError, {
        status: response.status,
      });

      throw nError;
    } catch (error: any) {
      console.log("STATUS: ", error.status);
      console.log("ERROR: ", error);
      return {
        message: error.message || "Something went wrong",
        ok: false,
      };
    }
  }

  async deleteAlphabetDate(dateId: string): Promise<BaseResponse> {
    console.log("#####################################");
    try {
      console.log("REQUEST 'deleteAlphabetDate'");
      const response = await apiClient.delete(`/alphabets/dates/${dateId}`);

      console.log("STATUS: ", response.status);
      if (response.status === 200 || response.status === 204) {
        console.log("DATE Deleted");
        return {
          message: response.data?.message || "Date deleted",
          ok: true,
        };
      }

      const nError = new Error("Something went wrong");
      Object.assign(nError, {
        status: response.status,
      });

      throw nError;
    } catch (error: any) {
      console.log("STATUS: ", error.status);
      console.log("ERROR: ", error);
      return {
        message: error.message || "Something went wrong",
        ok: false,
      };
    }
  }

  async getAlphabetDates(): Promise<AlphabetDatesResponse> {
    console.log("#####################################");
    try {
      console.log("REQUEST 'getAlphabetDates'");
      const response = await apiClient.get(`/alphabets`);

      console.log("STATUS: ", response.status);
      if (response.status === 200) {
        const data = response.data;

        console.log("DATA Received");
        return {
          message: data.message,
          ok: true,
          length: data.dates?.length ?? 0,
          dates: (data.dates ?? []).map((date: any) => ({
            ...date,
            letter:
              normalizeLetter(date.letter) ??
              deriveLetter(`${date.title ?? ""} ${date.description ?? ""}`),
          })),
        };
      }

      const nError = new Error("Something went wrong");
      Object.assign(nError, {
        status: response.status,
      });

      throw nError;
    } catch (error: any) {
      console.log("STATUS: ", error.status);
      console.log("ERROR: ", error);
      return {
        message: error.message || "Something went wrong",
        ok: false,
        length: 0,
        dates: [],
      };
    }
  }
}
