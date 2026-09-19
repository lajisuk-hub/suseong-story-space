// 전시관에 기본으로 들어 있는 동화책 목록입니다.
// 관리자 화면(/admin)에서 저장하면 그 내용이 이 목록보다 먼저 쓰입니다.

const pages = (folder, n) =>
  Array.from({ length: n }, (_, i) => `/books/${folder}/p${String(i + 1).padStart(2, "0")}.jpg`);

export const DEFAULT_BOOKS = [
  {
    id: "palace2",
    title: "우리 하루, 안녕",
    org: "국공립수성더팰리스2차어린이집",
    cover: "/books/palace2/p01.jpg",
    pages: pages("palace2", 25),
    link: "",
  },
];

export const SITE = {
  title: "수성구 AI 선도기관 성과보고회",
  subtitle: "동화책 우주 전시관",
  guide: "옆으로 밀어 우주를 여행하고, 동화책을 눌러 보세요",
};

// 후기 쓸 때 눌러서 고를 수 있는 말
export const QUICK_WORDS = ["감동이에요", "따뜻해요", "사랑스러워요", "최고예요", "뭉클해요", "또 보고 싶어요"];
