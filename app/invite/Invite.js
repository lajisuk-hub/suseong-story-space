"use client";

import { useEffect, useRef, useState } from "react";
import { INVITE } from "../../data/invite";
import { DEFAULT_BOOKS } from "../../data/books";
import { loadBooks, addRsvp } from "../../lib/supabase";

// 모바일 초대장: 휴대폰에서 위아래로 넘겨 보는 한 장짜리 페이지
export default function Invite() {
  const [books, setBooks] = useState(DEFAULT_BOOKS);
  const [toast, setToast] = useState("");
  const root = useRef(null);

  useEffect(() => {
    loadBooks().then((b) => b && b.length && setBooks(b));
  }, []);

  // 화면에 들어올 때 스르륵 나타나기
  useEffect(() => {
    const els = root.current.querySelectorAll(".rise");
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("in")),
      { threshold: 0.15 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

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
          <span className="inv-badge">INVITATION · 초대합니다</span>
          <h1>{INVITE.title}</h1>
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
        <h2 className="rise">동화책 우주 전시관</h2>
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

      {/* 7. 참석 회신 */}
      {INVITE.rsvp && <Rsvp say={say} />}

      {/* 8. 맺음 */}
      <footer className="inv-foot">
        <button className="inv-btn ghost" onClick={share}>💌 초대장 공유하기</button>
        <p>{INVITE.contact}</p>
        <p>{INVITE.host}</p>
      </footer>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function Rsvp({ say }) {
  const [d, setD] = useState({ name: "", org: "", attend: "yes", count: 1 });
  const [state, setState] = useState("idle"); // idle | sending | done
  const set = (patch) => setD((prev) => ({ ...prev, ...patch }));

  const send = async () => {
    if (!d.name.trim()) return say("성함을 적어 주세요");
    setState("sending");
    try {
      await addRsvp({ name: d.name.trim().slice(0, 20), org: d.org.trim().slice(0, 30), attend: d.attend, count: d.attend === "yes" ? d.count : 0 });
      setState("done");
    } catch {
      setState("idle");
      say("지금은 전송이 안 돼요. 잠시 뒤 다시 눌러 주세요");
    }
  };

  return (
    <section className="inv-sec">
      <h2 className="rise">참석 여부 알려 주기</h2>
      <div className="inv-card rise">
        {state === "done" ? (
          <p className="inv-thanks">{d.attend === "yes" ? "고맙습니다! 행사장에서 반갑게 뵙겠습니다 💜" : "알려 주셔서 고맙습니다. 전시관은 온라인으로도 언제든 보실 수 있어요 💜"}</p>
        ) : (
          <>
            <div className="inv-choice">
              <button className={d.attend === "yes" ? "on" : ""} onClick={() => set({ attend: "yes" })}>😊 참석해요</button>
              <button className={d.attend === "no" ? "on" : ""} onClick={() => set({ attend: "no" })}>🙏 어려워요</button>
            </div>
            <input placeholder="성함" value={d.name} maxLength={20} onChange={(e) => set({ name: e.target.value })} />
            <input placeholder="소속 (예: ○○어린이집 · 학부모)" value={d.org} maxLength={30} onChange={(e) => set({ org: e.target.value })} />
            {d.attend === "yes" && (
              <div className="inv-count">
                <span>함께 오시는 인원</span>
                <button onClick={() => setD((p) => ({ ...p, count: Math.max(1, p.count - 1) }))}>−</button>
                <b>{d.count}명</b>
                <button onClick={() => setD((p) => ({ ...p, count: Math.min(10, p.count + 1) }))}>＋</button>
              </div>
            )}
            <button className="inv-btn main" onClick={send} disabled={state === "sending"}>{state === "sending" ? "보내는 중…" : "회신 보내기"}</button>
          </>
        )}
      </div>
    </section>
  );
}
