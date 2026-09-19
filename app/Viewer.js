"use client";

import { useEffect, useMemo, useRef, useState } from "react";

// 동화책을 화면 가득 크게 열어 넘겨 보는 창
export default function Viewer({ book, canReview, onClose }) {
  const pages = book.pages || [];
  const [wide, setWide] = useState(false);
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState("next");
  const seen = useRef(1);
  const touch = useRef(null);

  useEffect(() => {
    const on = () => setWide(window.innerWidth / window.innerHeight > 1.15);
    on();
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);

  // 넓은 화면은 두 쪽씩 펼쳐 보기(표지는 한 쪽)
  const views = useMemo(() => {
    if (!wide || pages.length < 3) return pages.map((_, i) => [i]);
    const v = [[0]];
    for (let i = 1; i < pages.length; i += 2) v.push(i + 1 < pages.length ? [i, i + 1] : [i]);
    return v;
  }, [wide, pages]);

  const cur = Math.min(idx, views.length - 1);
  const last = cur === views.length - 1;

  const go = (d) => {
    const next = cur + d;
    if (next < 0) return;
    if (next >= views.length) return onClose(canReview);
    setDir(d > 0 ? "next" : "prev");
    setIdx(next);
    seen.current = Math.max(seen.current, next + 1);
  };
  // 몇 쪽이라도 읽은 사람에게만 후기를 권한다
  const close = () => onClose(canReview && seen.current >= Math.min(3, views.length));

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight" || e.key === " ") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // 다음 쪽 그림을 미리 받아 둔다
  useEffect(() => {
    for (const v of [views[cur + 1], views[cur + 2]]) (v || []).forEach((i) => { new Image().src = pages[i]; });
  }, [cur, views, pages]);

  // 그림 없이 주소만 있는 전자책
  if (!pages.length) {
    return (
      <div className="viewer">
        <button className="v-close" onClick={() => onClose(false)} aria-label="닫기">✕</button>
        <div className="v-link">
          {book.cover && <img src={book.cover} alt="" />}
          <h2>{book.title}</h2>
          <p>{book.org}</p>
          <a className="btn-main" href={book.link} target="_blank" rel="noopener noreferrer">📖 전자책 열기 (새 창)</a>
          {canReview && <button className="btn-ghost light" onClick={() => onClose(true)}>다 봤어요 · 후기 남기기</button>}
        </div>
      </div>
    );
  }

  return (
    <div
      className="viewer"
      onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touch.current == null) return;
        const dx = e.changedTouches[0].clientX - touch.current;
        touch.current = null;
        if (Math.abs(dx) > 45) go(dx < 0 ? 1 : -1);
      }}
    >
      <div className="v-head">
        <div>
          <strong>{book.title}</strong>
          <span>{book.org}</span>
        </div>
        <button className="v-close" onClick={close} aria-label="닫기">✕</button>
      </div>

      <div className="v-stage">
        <button className="v-zone left" onClick={() => go(-1)} aria-label="이전 쪽" disabled={cur === 0}>
          <i>‹</i>
        </button>
        <div key={`${cur}-${wide}`} className={`v-pages ${dir}${views[cur].length === 2 ? " spread" : ""}`}>
          {views[cur].map((i) => (
            <img key={i} src={pages[i]} alt={`${i + 1}쪽`} draggable={false} />
          ))}
        </div>
        <button className="v-zone right" onClick={() => go(1)} aria-label="다음 쪽">
          <i>›</i>
        </button>
      </div>

      <div className="v-foot">
        <div className="v-bar"><b style={{ width: `${((cur + 1) / views.length) * 100}%` }} /></div>
        <span>{views[cur].map((i) => i + 1).join("–")} / {pages.length}</span>
        {last && canReview && (
          <button className="btn-main" onClick={() => onClose(true)}>다 봤어요! 후기 남기기 ✍</button>
        )}
      </div>
    </div>
  );
}
