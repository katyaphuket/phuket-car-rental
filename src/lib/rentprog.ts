const RENTPROG_BASE_URL = process.env.RENTPROG_BASE_URL ?? "https://rentprog.net/api/v1/public/";
const TOKEN_TTL_MS = 5 * 60 * 1000;

export type RentProgFreeCar = {
  id: number;
  car_name: string;
  year: number;
  transmission: string;
};

export type RentProgCarData = {
  car_name: string;
  car_class: string | null;
  transmission: string | null;
  selected_price: number;
  deposit: number;
  hours_limit?: number;
};

let cachedToken: { token: string; expiresAt: number } | null = null;
let pendingTokenRequest: Promise<string> | null = null;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function requestAuthToken(attempt = 0): Promise<string> {
  const companyToken = process.env.RENTPROG_COMPANY_TOKEN;
  if (!companyToken) {
    throw new Error("RENTPROG_COMPANY_TOKEN is not set");
  }

  const res = await fetch(
    `${RENTPROG_BASE_URL}get_token?company_token=${encodeURIComponent(companyToken)}`
  );

  if (res.status === 429 && attempt < 5) {
    await sleep(500 * (attempt + 1));
    return requestAuthToken(attempt + 1);
  }

  if (!res.ok) {
    throw new Error(`RentProg get_token failed: ${res.status}`);
  }

  const data: { token: string } = await res.json();
  cachedToken = { token: data.token, expiresAt: Date.now() + TOKEN_TTL_MS };
  return data.token;
}

// Several car_data requests can fire in parallel (see mapWithConcurrency in
// api/cars/route.ts); without deduping, each would race to request its own
// token and trip RentProg's rate limit on get_token.
async function getAuthToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }

  if (!pendingTokenRequest) {
    pendingTokenRequest = requestAuthToken().finally(() => {
      pendingTokenRequest = null;
    });
  }

  return pendingTokenRequest;
}

async function rentprogGet<T>(path: string, params: Record<string, string>, attempt = 0): Promise<T> {
  const token = await getAuthToken();
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${RENTPROG_BASE_URL}${path}?${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 429 && attempt < 5) {
    const retryAfterHeader = Number(res.headers.get("retry-after"));
    const delayMs = Number.isFinite(retryAfterHeader) && retryAfterHeader > 0
      ? retryAfterHeader * 1000
      : 500 * (attempt + 1);
    await sleep(delayMs);
    return rentprogGet<T>(path, params, attempt + 1);
  }

  if (!res.ok) {
    throw new Error(`RentProg ${path} failed: ${res.status}`);
  }
  return res.json();
}

export function fetchFreeCars(startDate: string, endDate: string) {
  return rentprogGet<RentProgFreeCar[]>("free_cars", {
    start_date: startDate,
    end_date: endDate,
  });
}

export function fetchCarData(id: number, startDate: string, endDate: string, days: number) {
  return rentprogGet<RentProgCarData>("car_data", {
    id: String(id),
    start_date: startDate,
    end_date: endDate,
    days: String(days),
  });
}
