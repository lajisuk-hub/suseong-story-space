import Invite from "./Invite";
import { INVITE } from "../../data/invite";

const TITLE = INVITE.title.replace(/\n/g, " ");

export const metadata = {
  title: `초대합니다 | ${TITLE}`,
  description: `${INVITE.date} ${INVITE.time} · ${INVITE.place} (${INVITE.note}). ANARCHIVE — AI로 앞서가는 보육의 미래, 그 성과를 전합니다.`,
  openGraph: {
    title: `💌 ${TITLE}에 초대합니다`,
    description: `${INVITE.date} ${INVITE.time} · ${INVITE.place} (${INVITE.note}) — AI로 앞서가는 보육의 미래, 그 성과를 전합니다`,
    // 파일 이름을 바꿔야 카카오톡이 예전에 저장해 둔 그림 대신 새 그림을 가져간다 (2026-09-28 v2)
    images: [{ url: "/og-invite-v2.jpg", width: 1200, height: 630 }],
  },
};

export default function Page() {
  return <Invite />;
}
