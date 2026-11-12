import { fetchAuthSession } from "aws-amplify/auth";
import { create } from "axios";

import { normalizeDateStatus } from "@/lib/utils/dates";
import { deriveLetter, normalizeLetter } from "@/lib/utils/letters";

import {
  type AlphabetDateStatusCommand,
  AlphabetDatesResponse,
} from "./responses/alphabetDatesResponse";
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

      const nError = new Error("Algo salió mal");
      Object.assign(nError, {
        status: response.status,
      });

      throw nError;
    } catch (error: any) {
      console.log("STATUS: ", error.status);
      console.log("ERROR: ", error);
      return {
        message:
          error?.response?.data?.message ?? error.message ?? "Algo salió mal",
        ok: false,
      };
    }
  }

  async updateAlphabetDate({
    dateId,
    title,
    description,
    tags,
    status,
  }: {
    dateId: string;
    title: string;
    description: string;
    tags: string[];
    /** `finish` moves PUBLISHED -> DONE; `refresh` moves DONE -> PUBLISHED. */
    status?: AlphabetDateStatusCommand;
  }): Promise<BaseResponse> {
    console.log("#####################################");
    try {
      console.log("REQUEST 'updateAlphabetDate'");
      const response = await apiClient.put(`/alphabets/dates/${dateId}`, {
        title,
        description,
        tags,
        ...(status ? { status } : {}),
      });

      console.log("STATUS: ", response.status);
      if (response.status === 200) {
        const data = response.data;

        return {
          message: data?.message || "Cita actualizada",
          ok: true,
        };
      }

      const nError = new Error("Algo salió mal");
      Object.assign(nError, {
        status: response.status,
      });

      throw nError;
    } catch (error: any) {
      console.log("STATUS: ", error.status);
      console.log("ERROR: ", error);
      return {
        message:
          error?.response?.data?.message ?? error.message ?? "Algo salió mal",
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
          message: response.data?.message || "Cita eliminada",
          ok: true,
        };
      }

      const nError = new Error("Algo salió mal");
      Object.assign(nError, {
        status: response.status,
      });

      throw nError;
    } catch (error: any) {
      console.log("STATUS: ", error.status);
      console.log("ERROR: ", error);
      return {
        message: error.message || "Algo salió mal",
        ok: false,
      };
    }
  }

  async getAlphabetRecommendations(): Promise<AlphabetDatesResponse> {
    console.log("#####################################");
    try {
      console.log("REQUEST 'getAlphabetRecommendations'");
      const response = await apiClient.get(`/alphabets/recommendations`);

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
            status: normalizeDateStatus(date.status),
          })),
        };
      }

      const nError = new Error("Algo salió mal");
      Object.assign(nError, {
        status: response.status,
      });

      throw nError;
    } catch (error: any) {
      console.log("STATUS: ", error.status);
      console.log("ERROR: ", error);
      return {
        message: error.message || "Algo salió mal",
        ok: false,
        length: 0,
        dates: [],
      };
    }
  }

  async getAlphabetDates(): Promise<AlphabetDatesResponse> {
    console.log("#####################################");
    try {
      console.log("REQUEST 'getAlphabetDates'");
      const response = await apiClient.get(`/alphabets/dates`);

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
            status: normalizeDateStatus(date.status),
          })),
        };
      }

      const nError = new Error("Algo salió mal");
      Object.assign(nError, {
        status: response.status,
      });

      throw nError;
    } catch (error: any) {
      console.log("STATUS: ", error.status);
      console.log("ERROR: ", error);
      return {
        message: error.message || "Algo salió mal",
        ok: false,
        length: 0,
        dates: [],
      };
    }
  }
}
