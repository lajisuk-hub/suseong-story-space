import Invite from "./Invite";
import { INVITE } from "../../data/invite";

const TITLE = INVITE.title.replace(/\n/g, " ");

export const metadata = {
  title: `초대합니다 | ${TITLE}`,
  description: `${INVITE.date} ${INVITE.time} · ${INVITE.place} (${INVITE.note}). ANARCHIVE — AI로 앞서가는 보육의 미래, 그 성과를 전합니다.`,
  openGraph: {
    title: `💌 ${TITLE}에 초대합니다`,
    description: `${INVITE.date} ${INVITE.time} · ${INVITE.place} (${INVITE.note}) — AI로 앞서가는 보육의 미래, 그 성과를 전합니다`,
    images: ["/og-invite.jpg"],
  },
};

export default function Page() {
  return <Invite />;
}
