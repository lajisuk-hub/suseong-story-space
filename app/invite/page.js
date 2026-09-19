import Invite from "./Invite";
import { INVITE } from "../../data/invite";

export const metadata = {
  title: `초대합니다 | ${INVITE.title}`,
  description: "아이들의 하루가 동화책이 되어 우주에 떠오릅니다. 소중한 분들을 초대합니다.",
  openGraph: {
    title: `💌 ${INVITE.title}에 초대합니다`,
    description: "아이들의 하루가 동화책이 되어 우주에 떠오릅니다",
    images: ["/og-invite.jpg"],
  },
};

export default function Page() {
  return <Invite />;
}
