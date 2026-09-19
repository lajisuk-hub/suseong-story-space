"use client";

import { useEffect, useRef, useState } from "react";
import { INVITE as BASE } from "../../data/invite";
import { DEFAULT_BOOKS } from "../../data/books";
import { loadBooks, loadInvite } from "../../lib/supabase";
import Ddubi from "../Ddubi";

// 모바일 초대장: 휴대폰에서 위아래로 넘겨 보는 한 장짜리 페이지
export default function Invite() {
  const [books, setBooks] = useState(DEFAULT_BOOKS);
  const [toast, setToast] = useState("");
  const [INVITE, setInvite] = useState(null); // 관리 화면에서 저장한 내용을 받아 온 뒤에 그린다
  const root = useRef(null);

  useEffect(() => {
    loadBooks().then((b) => b && b.length && setBooks(b));
    const timer = setTimeout(() => setInvite((v) => v || BASE), 2500);
    loadInvite().then((saved) => setInvite({ ...BASE, ...(saved || {}) }));
    return () => clearTimeout(timer);
  }, []);

  // 화면에 들어올 때 스르륵 나타나기
  useEffect(() => {
    if (!INVITE) return;
    const els = root.current.querySelectorAll(".rise");
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("in")),
      { threshold: 0.15 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [INVITE]);

  const say = (m) => {
    setToast(m);
    setTimeout(() => setToast(""), 2500);
  };

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: INVITE.title, text: "초대합니다 ✨", url });
      else {
        await navigator.clipboard.writeText(url);
        say("초대장 주소를 복사했어요");
      }
    } catch {
      /* 공유 창을 그냥 닫은 경우 */
    }
  };

  if (!INVITE) return <div className="inv" />;

  const covers = books.flatMap((b) => (b.pages?.length > 12 ? [b.pages[0], b.pages[6], b.pages[12]] : [b.cover])).filter(Boolean);
  const q = encodeURIComponent(INVITE.mapQuery);

  return (
    <div className="inv" ref={root}>
      {/* 1. 표지 */}
      <section className="inv-cover">
        <div className="inv-sky" />
        <div className="inv-stars" />
        <img className="inv-float f1" src={covers[0]} alt="" />
        {covers[1] && <img className="inv-float f2" src={covers[1]} alt="" />}
        {covers[2] && <img className="inv-float f3" src={covers[2]} alt="" />}
        <div className="inv-cover-text">
          <span className="inv-badge">INVITATION</span>
          <p className="inv-hello">초대합니다</p>
          <h1>{INVITE.title.replace(" 성과보고", "\n성과보고")}</h1>
          <p className="inv-lead">{INVITE.lead}</p>
          <p className="inv-when">{INVITE.date}<br />{INVITE.time} · {INVITE.place}</p>
        </div>
        <div className="inv-scroll">아래로 내려 보세요<i>⌄</i></div>
      </section>

      {/* 2. 인사말 */}
      <section className="inv-sec">
        <div className="inv-card rise">
          <p className="inv-eyebrow">✦ 모시는 글 ✦</p>
          <div className="inv-greet">
            {INVITE.greeting.map((line, i) => (line ? <p key={i}>{line}</p> : <br key={i} />))}
          </div>
          <p className="inv-from">{INVITE.from}</p>
        </div>
      </section>

      {/* 3. 행사 안내 */}
      <section className="inv-sec">
        <h2 className="rise">행사 안내</h2>
        <div className="inv-info rise">
          <div><i>📅</i><b>일시</b><span>{INVITE.date}<br />{INVITE.time}</span></div>
          <div><i>📍</i><b>장소</b><span>{INVITE.place}<br /><small>{INVITE.address}</small></span></div>
          <div><i>💜</i><b>모시는 분</b><span>{INVITE.target}</span></div>
        </div>
      </section>

      {/* 4. 행사 순서 */}
      {INVITE.program.length > 0 && (
        <section className="inv-sec">
          <h2 className="rise">행사 순서</h2>
          <ol className="inv-line">
            {INVITE.program.map((p, i) => (
              <li key={i} className="rise">
                <em>{p.time}</em>
                <b>{p.name}</b>
                <span>{p.desc}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* 5. 전시 미리보기 */}
      <section className="inv-sec">
        <h2 className="rise">동화책 전시 미리 보기</h2>
        <p className="inv-note rise">AI와 함께 만든 동화책이 우주에 둥둥 떠다녀요.<br />미리 들어가서 읽어 보실 수 있어요.</p>
        <div className="inv-books rise">
          {books.map((b) => (
            <figure key={b.id}>
              <img src={b.cover} alt="" />
              <figcaption>{b.title}<small>{b.org}</small></figcaption>
            </figure>
          ))}
        </div>
        <a className="inv-btn main rise" href="/">🚀 우주 전시관 미리 들어가 보기</a>
      </section>

      {/* 6. 오시는 길 */}
      <section className="inv-sec">
        <h2 className="rise">오시는 길</h2>
        <div className="inv-card rise">
          <p className="inv-place">{INVITE.place}</p>
          <p className="inv-addr">{INVITE.address}</p>
          {INVITE.mapQuery ? (
            <div className="inv-maps">
              <a className="inv-btn kakao" href={`https://map.kakao.com/link/search/${q}`} target="_blank" rel="noopener noreferrer">카카오맵으로 보기</a>
              <a className="inv-btn naver" href={`https://map.naver.com/p/search/${q}`} target="_blank" rel="noopener noreferrer">네이버지도로 보기</a>
            </div>
          ) : (
            <p className="inv-note">장소가 정해지면 여기에 「카카오맵 · 네이버지도로 보기」 단추가 생겨요.</p>
          )}
        </div>
      </section>

      {/* 7. 관련 문의 */}
      {INVITE.contacts?.length > 0 && (
        <section className="inv-sec">
          <h2 className="rise">관련 문의</h2>
          <div className="inv-contacts rise">
            {INVITE.contacts.map((c, i) => (
              <div key={i}>
                <p><b>{c.name}</b><span>{c.role}</span></p>
                {c.phone && <a href={`tel:${c.phone.replace(/[^0-9+]/g, "")}`}>📞 {c.phone}</a>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 8. 맺음 */}
      <footer className="inv-foot">
        <button className="inv-btn ghost" onClick={share}>💌 초대장 공유하기</button>
        <p>{INVITE.host}</p>
        <p className="inv-credit">캐릭터 ‘뚜비’ ⓒ 대구광역시 수성구청</p>
      </footer>

      <Ddubi />

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
