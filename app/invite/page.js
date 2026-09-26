import Invite from "./Invite";
import { INVITE } from "../../data/invite";

export const metadata = {
  title: `초대합니다 | ${INVITE.title}`,
  description: `${INVITE.date} ${INVITE.time} · ${INVITE.place}. 수성구 AI 선도기관이 준비한 수성구 영유아를 위한 단 한 권의 동화책! 그 준비과정과 성장과정을 마음 담아 전달합니다.`,
  openGraph: {
    title: `💌 ${INVITE.title}에 초대합니다`,
    description: `${INVITE.date} ${INVITE.time} · ${INVITE.place} — 수성구 영유아를 위한 단 한 권의 동화책! 그 준비과정과 성장과정을 마음 담아 전달합니다`,
    images: ["/og-invite.jpg"],
  },
};

export default function Page() {
  return <Invite />;
}
