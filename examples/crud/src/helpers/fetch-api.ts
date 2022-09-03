export class FetchError extends Error {
  readonly code: number;
  readonly message: string;

  constructor(message: string, code = 0) {
    super(message);
    this.message = message;
    this.code = code;
  }
}

const defaultMethod = 'GET';
const defaultHeaders = {
  'content-type': 'application/json',
  accept: 'application/json',
};

class FetchApi {
  private abortController: AbortController | undefined;

  abort() {
    this.abortController?.abort();
  }

  get aborted() {
    return this.abortController?.signal.aborted;
  }

  private async fetchApi(url: string, opts: RequestInit = {}) {
    try {
      this.abortController = new AbortController();
      const resp = await fetch(url, {
        method: defaultMethod,
        headers: defaultHeaders,
        ...opts,
        signal: this.abortController.signal,
      });
      if (!resp.ok) {
        const json = await resp.json();
        throw new FetchError(json.message, resp.status);
      }
      if (resp.status === 204) {
        return true;
      }
      const json = await resp.json();
      return json;
    } catch (err) {
      throw err;
    }
  }

  async get(url: string, opts: RequestInit = {}) {
    opts.method = 'GET';
    return await this.fetchApi(url, opts);
  }

  async post(url: string, opts: RequestInit = {}) {
    opts.method = 'POST';
    return await this.fetchApi(url, opts);
  }

  async put(url: string, opts: RequestInit = {}) {
    opts.method = 'PUT';
    return await this.fetchApi(url, opts);
  }

  async delete(url: string, opts: RequestInit = {}) {
    opts.method = 'DELETE';
    return await this.fetchApi(url, opts);
  }
}

export default FetchApi;