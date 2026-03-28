import type { BannerQuoteInput } from "@/lib/validators/banner";

type FetchLike = typeof fetch;

type HitokotoPayload = {
  hitokoto?: string;
  from?: string | null;
  from_who?: string | null;
};

function buildHitokotoApiUrl() {
  const url = new URL("https://v1.hitokoto.cn/");
  url.searchParams.set("encode", "json");
  url.searchParams.set("min_length", "12");
  url.searchParams.set("max_length", "80");
  for (const category of ["d", "h", "i", "k"]) {
    url.searchParams.append("c", category);
  }
  return url.toString();
}

function normalizeHitokotoAuthor(payload: HitokotoPayload) {
  const fromWho = payload.from_who?.trim();
  const from = payload.from?.trim();

  if (fromWho && from) {
    return `${fromWho}《${from}》`;
  }

  return fromWho || from || "";
}

export function buildHitokotoBannerDraft(
  payload: HitokotoPayload,
): BannerQuoteInput {
  const content = payload.hitokoto?.trim();

  if (!content) {
    throw new Error("一言服务未返回可用内容");
  }

  return {
    content,
    author: normalizeHitokotoAuthor(payload),
    sourceType: "CUSTOM",
    status: "INACTIVE",
  };
}

export async function fetchHitokotoBannerDraft(
  fetchImpl: FetchLike = fetch,
): Promise<BannerQuoteInput> {
  const response = await fetchImpl(buildHitokotoApiUrl(), {
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("一言服务暂时不可用");
  }

  return buildHitokotoBannerDraft((await response.json()) as HitokotoPayload);
}
