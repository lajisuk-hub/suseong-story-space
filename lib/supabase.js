import { createClient } from "@supabase/supabase-js";

// 수성구 AI선도기관 홈페이지(suseong-ai-hub)와 같은 Supabase 프로젝트·같은 표를 씁니다.
// (publishable key는 공개용 키라서 코드에 넣어도 됩니다)
const SUPABASE_URL = "https://pgywpdodatjfpivxmymn.supabase.co";
const SUPABASE_KEY = "sb_publishable_FeO3LdfFBB6KEwblcZPa2w_sW9dVuUg";

// 표 하나(id, data, updated_at)에 줄 이름으로 구분해 담는다.
//  - story-books      : 동화책 목록
//  - sr-<시각>-<난수> : 후기 한 건
//  - story-invite     : 모바일 초대장 내용
export const TABLE = "suseong_hub_content";
export const BUCKET = "suseong-hub";
const BOOKS_ID = "story-books";
const REVIEW_PREFIX = "sr-";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── 동화책 목록 ──────────────────────────────────────────
export async function loadBooks() {
  try {
    const { data, error } = await supabase.from(TABLE).select("data").eq("id", BOOKS_ID).maybeSingle();
    if (error || !data || !Array.isArray(data.data?.books)) return null;
    return data.data.books;
  } catch {
    return null;
  }
}

export async function saveBooks(books) {
  const { error } = await supabase
    .from(TABLE)
    .upsert({ id: BOOKS_ID, data: { books }, updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
}

// ── 후기 ────────────────────────────────────────────────
const toReview = (row) => ({
  id: row.id,
  text: String(row.data?.text || ""),
  bookId: row.data?.bookId || "",
  hidden: !!row.data?.hidden,
  at: row.updated_at,
});

// since(마지막으로 본 시각) 이후에 생기거나 바뀐 후기만 가져온다.
// PostgREST는 한 번에 1000줄까지만 주므로 끝까지 나눠 읽는다.
export async function loadReviews(since) {
  const all = [];
  for (let from = 0; ; from += 1000) {
    let q = supabase
      .from(TABLE)
      .select("id,data,updated_at")
      .like("id", `${REVIEW_PREFIX}%`)
      .order("updated_at", { ascending: true })
      .range(from, from + 999);
    if (since) q = q.gte("updated_at", since);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    all.push(...data);
    if (data.length < 1000) break;
  }
  return all.map(toReview);
}

export async function addReview(text, bookId) {
  const id = `${REVIEW_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const { error } = await supabase.from(TABLE).insert({ id, data: { text, bookId, hidden: false } });
  if (error) throw new Error(error.message);
  return id;
}

export async function setReviewHidden(review, hidden) {
  const { error } = await supabase
    .from(TABLE)
    .update({
      data: { text: review.text, bookId: review.bookId, hidden },
      updated_at: new Date().toISOString(),
    })
    .eq("id", review.id);
  if (error) throw new Error(error.message);
}

// ── 모바일 초대장 내용 (줄 이름: story-invite) ────────────
export async function loadInvite() {
  try {
    const { data, error } = await supabase.from(TABLE).select("data").eq("id", "story-invite").maybeSingle();
    return error || !data ? null : data.data;
  } catch {
    return null;
  }
}

export async function saveInvite(invite) {
  const { error } = await supabase
    .from(TABLE)
    .upsert({ id: "story-invite", data: invite, updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
}

// ── 책 쪽 그림 올리기 ────────────────────────────────────
export async function uploadPage(bookId, index, blob) {
  const name = `story/${bookId}/p${String(index + 1).padStart(2, "0")}.jpg`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(name, blob, { contentType: "image/jpeg", cacheControl: "31536000" });
  if (error) throw new Error(error.message);
  return supabase.storage.from(BUCKET).getPublicUrl(name).data.publicUrl;
}
