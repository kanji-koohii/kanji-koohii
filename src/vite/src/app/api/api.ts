import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import { kk_globals_get } from "@app/root-bundle";
import {
  GetDictListForUCS,
  PostUserStoryResponse,
  PostVoteStoryRequest,
  PostVoteStoryResponse,
} from "./models";
import * as TRON from "@lib/tron";

const API_DEFAULT_TIMEOUT = 5000;

// In the future with a proper API we may have: stories, users, etc.
//  for now, `legacy` means the old ajax endpoints (not a standalone API)
export type KoohiiAPI = {
  legacy: LegacyApi;
};

type ApiRequestConfig = Pick<AxiosRequestConfig, "method" | "params" | "data">;

// HttpClient() is a wrapper for axios, which never fails & always returns a TRON message
abstract class HttpClient {
  protected readonly axiosInst: AxiosInstance;

  public constructor(baseURL: string) {
    this.axiosInst = axios.create({
      baseURL: baseURL,
      timeout: API_DEFAULT_TIMEOUT,
    });
  }

  // axios.get() proxy
  public get<T = TRON.TronProps>(uri: string, params: any) {
    const config: ApiRequestConfig = {
      method: "get",
      params,
    };
    return this.request<T>(uri, config);
  }

  // axios.post() proxy
  public post<T = TRON.TronProps>(uri: string, data: any) {
    const config: ApiRequestConfig = {
      method: "post",
      data,
    };
    return this.request<T>(uri, config);
  }

  // generic axios request() which handles the catch() and always resolves to a TRON message
  protected request<T>(uri: string, config: ApiRequestConfig) {
    let requestConfig: AxiosRequestConfig = {
      method: config.method || "get",
      url: uri,
      params: config.params || null, // url parameters
      data: config.data || null, // request body, only PUT/POST/DELETE/PATCH
    };

    return this.axiosInst
      .request(requestConfig)
      .then((res) => {
        const t = TRON.Inst<T>(res.data);

        // helps debugging during development
        if (t.getStatus() === TRON.STATUS.FAILED || t.hasErrors()) {
          console.warn(
            "HttpClient() TRON error(s): \n" + t.getErrors().join("\n")
          );
        }

        return t;
      })
      .catch((error) => {
        // we basically never want to fail, and always return a valid tron message

        let t = TRON.Inst<T>({ status: TRON.STATUS.FAILED });

        // The request was made and the server responded with a status code that falls out of the range of 2xx
        if (error.response) {
          console.warn(
            "HttpClient(response error): status code ",
            error.response.status
          );
          t.setErrors(
            `Oops! Server responded with error ${error.response.status}`
          );
        }
        // The request was made but no response was received -- `error.request` is an instance of XMLHttpRequest in the browser
        else if (error.request) {
          console.warn("HttpClient(request error): ", error);
          t.setErrors(
            `Oops! The request timed out, please try again in a moment.`
          );
        }

        // Something happened in setting up the request that triggered an Error
        else {
          console.warn("HttpClient(unknown error): ", error.message);
          t.setErrors("Request error");
        }

        return Promise.resolve(t);
      });
  }
}

// a singleton class api for the legacy ajax endpoints, *always* resolves to TRON message
export class LegacyApi extends HttpClient {
  private static instance?: LegacyApi;

  constructor(baseUrl: string) {
    super(baseUrl);
  }

  static getInstance(baseUrl: string) {
    if (!this.instance) {
      this.instance = new LegacyApi(baseUrl);
    }

    return this.instance;
  }

  postUserStory(
    ucsId: number,
    txtStory: string,
    isPublic: boolean,
    reviewMode: boolean
  ) {
    return this.post<PostUserStoryResponse>("/study/editstory", {
      ucsCode: ucsId,
      reviewMode,
      postStoryEdit: txtStory,
      postStoryPublic: isPublic,
    });
  }

  // Shared Stories action : star / report / copy
  ajaxSharedStory(params: PostVoteStoryRequest) {
    return this.post<PostVoteStoryResponse>("/study/ajax", params);
  }

  // get vocab entries for the Dictionary (example words for given kanji)
  getDictListForUCS(ucsId: number, getKnownKanji: boolean) {
    return this.get<GetDictListForUCS>("/study/dict", {
      ucs: ucsId,
      reqKnownKanji: getKnownKanji,
    });
  }

  setVocabForCard(ucs: number, dictid: number) {
    return this.post("/study/vocabpick", {
      ucs: ucs,
      dictid: dictid,
    });
  }

  deleteVocabForCard(ucs: number) {
    return this.post("/study/vocabdelete", { ucs });
  }
}

export function getApi(): KoohiiAPI {
  const baseUrl = kk_globals_get('BASE_URL') as string;

  // base url to account for dev/test envs, no trailing slash
  const apiBaseUrl = kk_globals_get('BASE_URL').replace(/\/$/, "");

  return {
    legacy: LegacyApi.getInstance(apiBaseUrl),
  };
}
