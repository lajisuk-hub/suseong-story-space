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
  const [openOrgs, setOpenOrgs] = useState(false); // AI 선도기관 어린이집 명단 펼침 여부
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
      if (navigator.share) await navigator.share({ title: INVITE.title.replace(/\n/g, " "), text: "초대합니다 ✨", url });
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
          <h1>{INVITE.title}</h1>
          {INVITE.sub && <p className="inv-sub">{INVITE.sub}</p>}
          {INVITE.concept && (
            <div className="inv-concept">
              <b>{INVITE.concept.word}</b>
              <span>{INVITE.concept.ko}</span>
              <span>{INVITE.concept.line}</span>
            </div>
          )}
          <p className="inv-lead">{INVITE.lead}</p>
          <p className="inv-when">{INVITE.date}&ensp;{INVITE.time}<br />{INVITE.note && <>{INVITE.note} · </>}{INVITE.place}</p>
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

      {/* 3. 성과보고회 안내 (일시·장소 + 식순, 담당자 초대장 2쪽 구성) */}
      <section className="inv-sec">
        <h2 className="rise">성과보고회 안내</h2>
        <div className="inv-info rise">
          <div><i>📅</i><b>일시</b><span>{INVITE.date}<br />{INVITE.time}{INVITE.note && <><br /><small>※ {INVITE.note}</small></>}</span></div>
          <div><i>📍</i><b>장소</b><span>{INVITE.place}<br /><small>{INVITE.address}</small></span></div>
          {INVITE.target && <div><i>💜</i><b>모시는 분</b><span>{INVITE.target}</span></div>}
        </div>
        {INVITE.program.length > 0 && (
          <>
            <h3 className="inv-h3 rise">식 순</h3>
            <div className="inv-info inv-steps rise">
              {INVITE.program.map((p, i) => (
                <div key={i}>
                  <i>{p.icon || ["🖼️", "🎤", "✨"][i % 3]}</i>
                  <b>{p.name}{p.time && <small> · {p.time}</small>}</b>
                  <span>{p.desc}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* 4-1. 걸어온 길 */}
      {INVITE.about && (
        <section className="inv-sec">
          <h2 className="rise">걸어온 길</h2>
          {INVITE.sub && <p className="inv-note rise">{INVITE.sub}<br />AI 기반 보육 전문적 학습공동체가 함께한 여섯 달</p>}
          <ol className="inv-line small">
            {INVITE.about.steps.map((s, i) => (
              <li key={i} className="rise">
                <em>{s.when}</em>
                <b>{s.what}</b>
                <span>{s.desc}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* 5. 미리 만나보기(은하수) — 어린이집 명단보다 먼저 나온다 (2026-10-02 원장님 지시) — 예시 영상 + 담당자 초대장의 미리보기 3종 */}
      <section className="inv-sec">
        <h2 className="rise">{INVITE.previewTitle}</h2>
        <p className="inv-note rise">{INVITE.previewText}</p>
        <div className="inv-video rise">
          <video src="/preview.mp4" poster="/preview-poster.jpg" autoPlay muted loop playsInline preload="metadata" />
          <span>예시 화면</span>
        </div>
        {INVITE.links?.length > 0 && (
          <div className="inv-links">
            {INVITE.links.map((l, i) => (
              <div key={i} className="rise">
                <b>· {l.label}</b>
                <span>{l.desc}</span>
                {l.url ? (
                  <a className="inv-btn main" href={l.url} target={l.url.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer">
                    {l.label} →
                  </a>
                ) : (
                  l.note && <em className="inv-lock">🔒 {l.note}</em>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 5-1. AI 선도기관 어린이집 — 명단은 접어 두고 「펼치기」를 누르면 열린다 */}
      {INVITE.participants?.length > 0 && (
        <section className="inv-sec">
          <h2 className="rise">AI 선도기관 어린이집</h2>
          <p className="inv-note inv-orgs-intro rise">{INVITE.participantsIntro}{INVITE.participantsNote && <><br /><small>{INVITE.participantsNote}</small></>}</p>
          <button className="inv-toggle rise" onClick={() => setOpenOrgs((v) => !v)} aria-expanded={openOrgs}>
            {openOrgs ? "접기 ▴" : "펼치기 ▾"}
          </button>
          {openOrgs && (
            <ol className="inv-orgs">
              {INVITE.participants.map((p, i) => (
                <li key={i}>
                  <i>{i + 1}</i>
                  <div>
                    <b>{p.org}</b>
                    <span>📖 {p.book}</span>
                    {p.song && <span>🎵 {p.song}</span>}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}

      {/* 6. 오시는 길 */}
      <section className="inv-sec">
        <h2 className="rise">오시는 길</h2>
        <div className="inv-card compact rise">
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

      {/* 7. 신청방법 (링크·전화번호는 누르면 바로 연결) */}
      {INVITE.apply?.items?.length > 0 && (
        <section className="inv-sec">
          <h2 className="rise">{INVITE.apply.title}</h2>
          {INVITE.apply.sub && <p className="inv-note rise">{INVITE.apply.sub}</p>}
          <div className="inv-links inv-apply">
            {INVITE.apply.items.map((a, i) => (
              <div key={i} className="rise">
                <b>{a.label}</b>
                {a.url && (
                  <>
                    <a className="inv-url" href={a.url} target="_blank" rel="noopener noreferrer">{a.url}</a>
                    <a className="inv-btn main" href={a.url} target="_blank" rel="noopener noreferrer">{a.btn || "신청하러 가기"} →</a>
                  </>
                )}
                {a.phone && <a className="inv-btn tel" href={`tel:${a.phone.replace(/[^0-9+]/g, "")}`}>☎ {a.phone}</a>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 7-1. 관련 문의 (contacts가 비어 있으면 안 보임) */}
      {INVITE.contacts?.length > 0 && (
        <section className="inv-sec">
          <h2 className="rise">관련 문의</h2>
          <div className="inv-contacts compact rise">
            {INVITE.contacts.map((c, i) => (
              <div key={i} className={!c.name && !c.role ? "phone-only" : ""}>
                {(c.name || c.role) && <p><b>{c.name}</b><span>{c.role}</span></p>}
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
