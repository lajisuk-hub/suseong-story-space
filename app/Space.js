"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import { DEFAULT_BOOKS, SITE } from "../data/books";
import { loadBooks, loadReviews, addReview } from "../lib/supabase";
import { groupReviews, keyOf } from "../lib/words";
import Viewer from "./Viewer";
import ReviewForm from "./ReviewForm";

const COLORS = ["#ffffff", "#ffe9a8", "#ffd6ee", "#cdf1ff", "#dcffd9", "#eadcff"];
const hash = (s) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
const ease = (p) => 1 - Math.pow(1 - p, 3);

export default function Space({ show = false }) {
  const [books, setBooks] = useState(DEFAULT_BOOKS);
  const [reviews, setReviews] = useState([]); // 후기 전체
  const [size, setSize] = useState({ w: 1200, h: 800 });
  const [openBook, setOpenBook] = useState(null);
  const [form, setForm] = useState(null); // {book} | null
  const [picked, setPicked] = useState(null); // 눌러 본 후기 글자(key)
  const [toast, setToast] = useState("");
  const [qr, setQr] = useState("");

  const sinceRef = useRef(null);
  const loadedRef = useRef(false);
  const launchRef = useRef(new Set()); // 새로 떠올라야 하는 글자
  const pulseRef = useRef(new Set()); // 이미 떠 있는데 +1 된 글자
  const wordEls = useRef(new Map());
  const bookEls = useRef(new Map());
  const motion = useRef(new Map());
  const worldRef = useRef(null);
  const thumbRef = useRef(null);
  const starRef = useRef(null);
  const headRef = useRef(null);
  // 카메라: 넓은 우주의 어디를 보고 있는지 (x = 화면 왼쪽 끝의 위치)
  const cam = useRef({ x: null, v: 0, target: null, drag: null, moved: false, idleAt: 0, dir: 1 });

  const say = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  }, []);

  // ── 화면 크기 ──
  useEffect(() => {
    const on = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    on();
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);

  // ── 동화책 목록 ──
  useEffect(() => {
    // 주소 뒤에 ?demo=12 를 붙이면 책이 12권일 때 모습을 미리 볼 수 있다
    const demo = Math.min(40, Number(new URLSearchParams(window.location.search).get("demo")) || 0);
    if (demo) return setBooks(Array.from({ length: demo }, (_, i) => ({ ...DEFAULT_BOOKS[0], id: `demo${i}` })));
    loadBooks().then((b) => b && b.length && setBooks(b));
  }, []);

  // ── 후기: 처음 한 번 전부, 그 뒤로는 새로 생긴 것만 몇 초마다 ──
  const merge = useCallback((rows, markFresh) => {
    if (!rows.length) return;
    for (const r of rows) if (!sinceRef.current || r.at > sinceRef.current) sinceRef.current = r.at;
    setReviews((prev) => {
      const byId = new Map(prev.map((r) => [r.id, r]));
      const known = new Set(prev.filter((r) => !r.hidden).map((r) => keyOf(r.text)));
      for (const r of rows) {
        if (markFresh && !byId.has(r.id) && !r.hidden) {
          const k = keyOf(r.text) || r.text;
          (known.has(k) ? pulseRef : launchRef).current.add(k);
          known.add(k);
        }
        byId.set(r.id, r);
      }
      return [...byId.values()];
    });
  }, []);

  useEffect(() => {
    let stop = false;
    const tick = async () => {
      try {
        const rows = await loadReviews(sinceRef.current);
        if (stop) return;
        merge(rows, loadedRef.current);
        loadedRef.current = true;
      } catch {
        /* 보관소가 잠시 안 되어도 전시는 계속된다 */
      }
    };
    tick();
    const id = setInterval(tick, show ? 4000 : 7000);
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, [merge, show]);

  // ── 큰 화면용 QR ──
  useEffect(() => {
    if (!show) return;
    QRCode.toDataURL(window.location.origin, { width: 480, margin: 1, color: { dark: "#2a1a5e", light: "#ffffff" } })
      .then(setQr)
      .catch(() => {});
  }, [show]);

  // ── 떠다닐 글자 고르기 (많이 나온 말 + 방금 나온 말) ──
  const groups = useMemo(() => groupReviews(reviews), [reviews]);
  const small = size.w < 700;
  const shown = useMemo(() => {
    const limit = small ? 40 : 80;
    if (groups.length <= limit) return groups;
    const top = groups.slice(0, Math.floor(limit / 2));
    const rest = groups.slice(top.length).sort((a, b) => (a.last < b.last ? 1 : -1));
    return [...top, ...rest.slice(0, limit - top.length)];
  }, [groups, small]);
  const maxCount = groups.length ? groups[0].count : 1;
  const fontOf = (count) => {
    const min = show ? 24 : small ? 14 : 19;
    const max = show ? 120 : small ? 44 : 88;
    const p = Math.log(count) / Math.log(Math.max(maxCount, 8));
    return Math.round(min + (max - min) * Math.min(1, p));
  };

  // +1 된 글자는 한 번 반짝
  useEffect(() => {
    for (const k of pulseRef.current) {
      const el = wordEls.current.get(k);
      if (!el) continue;
      el.classList.remove("pulse");
      void el.offsetWidth;
      el.classList.add("pulse");
    }
    pulseRef.current.clear();
  }, [shown]);

  // ── 둥둥 떠다니기 (책·글자·배경·별) ──
  const live = useRef({});
  live.current = { books, shown, size, paused: !!(openBook || form) };

  useEffect(() => {
    const cvs = starRef.current;
    const ctx = cvs.getContext("2d");
    const stars = Array.from({ length: 90 }, () => ({
      x: Math.random(), y: Math.random() * 0.75, r: Math.random() * 1.6 + 0.4,
      p: Math.random() * 6.28, s: Math.random() * 1.5 + 0.5,
    }));
    let shoot = null;
    let raf = 0;
    const t0 = performance.now();

    const frame = (now) => {
      raf = requestAnimationFrame(frame);
      const { books, shown, size, paused } = live.current;
      const { w, h } = size;
      const t = (now - t0) / 1000;
      if (paused) return;

      // 카메라: 손으로 민 만큼 움직이고, 놓으면 스르륵 미끄러지다 멈춘다. 가만히 두면 천천히 흘러간다.
      const { imgW, W } = worldSize(w, h);
      const c = cam.current;
      const maxX = Math.max(0, W - w);
      if (c.x == null) c.x = Math.min(maxX, Math.max(0, imgW / 2 - w / 2));
      const fdt = Math.min(0.05, (now - (c.last || now)) / 1000);
      c.last = now;
      if (!c.drag) {
        if (c.target != null) {
          c.x += (c.target - c.x) * Math.min(1, fdt * 6);
          if (Math.abs(c.target - c.x) < 1) c.target = null;
        } else if (Math.abs(c.v) > 4) {
          c.x += c.v * fdt;
          c.v *= Math.pow(0.04, fdt);
        } else if (now - c.idleAt > (show ? 0 : 6000)) {
          c.x += c.dir * (show ? 30 : 9) * fdt;
        }
      }
      if (c.x <= 0) { c.x = 0; c.dir = 1; c.v = 0; if (c.target != null && c.target < 0) c.target = null; }
      if (c.x >= maxX) { c.x = maxX; c.dir = -1; c.v = 0; if (c.target != null && c.target > maxX) c.target = null; }
      if (worldRef.current) worldRef.current.style.transform = `translate3d(${-c.x}px,0,0)`;
      if (thumbRef.current) {
        thumbRef.current.style.width = `${(w / W) * 100}%`;
        thumbRef.current.style.left = `${(c.x / W) * 100}%`;
      }

      // 별 반짝임 + 가끔 별똥별
      if (cvs.width !== w || cvs.height !== h) { cvs.width = w; cvs.height = h; }
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        ctx.globalAlpha = 0.35 + 0.65 * Math.abs(Math.sin(t * s.s + s.p));
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(s.x * w, s.y * h, s.r, 0, 6.28);
        ctx.fill();
      }
      if (!shoot && Math.random() < 0.004) shoot = { x: Math.random() * w * 0.7, y: Math.random() * h * 0.3, life: 0 };
      if (shoot) {
        shoot.life += 0.02;
        const sx = shoot.x + shoot.life * 420, sy = shoot.y + shoot.life * 170;
        const g = ctx.createLinearGradient(sx, sy, sx - 110, sy - 45);
        g.addColorStop(0, "rgba(255,255,255,.95)");
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.globalAlpha = Math.max(0, 1 - shoot.life);
        ctx.strokeStyle = g;
        ctx.lineWidth = 2.2;
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx - 110, sy - 45); ctx.stroke();
        if (shoot.life >= 1) shoot = null;
      }
      ctx.globalAlpha = 1;

      // 동화책: 가운데 행성 둘레를 천천히 돌며 둥실둥실
      // 그림 세 장마다 가운데를 중심으로 책들이 고리를 이루어 돈다 (책은 세 구역에 차례로 나눠 놓는다)
      const n = books.length;
      const bw = bookWidth(w, h, n);
      const cy = h * 0.46;
      const headH = (headRef.current ? headRef.current.offsetHeight : 100) + 30; // 제목을 가리지 않게
      books.forEach((b, i) => {
        const el = bookEls.current.get(b.id);
        if (!el) return;
        const hub = i % ZONES, j = Math.floor(i / ZONES);
        const k = Math.ceil((n - hub) / ZONES); // 이 구역의 책 수
        const cx = hub * (imgW - overlapOf(imgW)) + imgW / 2;
        const rx = k <= 2 ? Math.min(imgW * 0.2, w * 0.34) : k <= 6 ? Math.min(imgW * 0.37, Math.max(w * 0.95, 320)) : imgW * 0.43;
        // 책이 많으면 안쪽·바깥쪽 고리로 번갈아 놓아 서로 덜 겹치게 한다
        const rings = k <= 6 ? [1] : k <= 14 ? [1, 0.62] : [1, 0.72, 0.44];
        const rf = rings[j % rings.length];
        const ang = (j / k) * 6.2832 + 3.5 + hub * 1.1 + t * 0.035 * (hub % 2 ? -1 : 1);
        const x = cx + Math.cos(ang) * rx * rf + Math.sin(t * 0.5 + i) * 10;
        let y = cy + Math.sin(ang) * h * 0.3 * rf + Math.cos(t * 0.42 + i * 1.7) * 14;
        y = Math.max(bw * 0.72 + headH, Math.min(h - bw * 0.85 - (show ? 50 : 150), y));
        const depth = 0.86 + 0.14 * Math.sin(ang);
        const rz = Math.sin(t * 0.33 + i * 2.1) * 5;
        const ry = Math.sin(t * 0.45 + i * 1.3) * 16;
        el.style.transform = `translate3d(${x}px,${y}px,0) translate(-50%,-50%) scale(${depth}) perspective(800px) rotateZ(${rz}deg) rotateY(${ry}deg)`;
        el.style.zIndex = 20 + Math.round(depth * 10);
      });

      // 후기 글자: 우주를 가로질러 천천히 흘러간다
      const alive = new Set();
      for (const g of shown) {
        alive.add(g.key);
        const el = wordEls.current.get(g.key);
        if (!el) continue;
        let m = motion.current.get(g.key);
        if (!m) {
          const fresh = launchRef.current.delete(g.key);
          const dir = Math.random() < 0.5 ? -1 : 1;
          m = {
            x: Math.random() * W, y: h * (0.08 + Math.random() * 0.8),
            vx: dir * (7 + Math.random() * 14), vy: (Math.random() - 0.5) * 5,
            p: Math.random() * 6.28, born: fresh ? now : 0, last: now,
          };
          if (fresh) { m.x = c.x + w * (0.15 + Math.random() * 0.7); m.y = h * (0.12 + Math.random() * 0.6); m.from = c.x + w / 2; }
          motion.current.set(g.key, m);
        }
        const dt = Math.min(0.05, (now - m.last) / 1000);
        m.last = now;
        m.x += m.vx * dt;
        m.y += m.vy * dt;
        if (!m.wd || now - m.sized > 1500) { m.wd = el.offsetWidth; m.ht = el.offsetHeight; m.sized = now; }
        const half = m.wd / 2 + 20;
        if (m.x < -half) m.x = W + half;
        if (m.x > W + half) m.x = -half;
        if (m.y < h * 0.05 || m.y > h * 0.92) m.vy *= -1;
        let x = m.x, y = m.y + Math.sin(t * 0.6 + m.p) * 9, sc = 1;
        if (m.born) {
          const p = (now - m.born) / 2600;
          if (p >= 1) { m.born = 0; el.classList.remove("fresh"); }
          else {
            const e = ease(p);
            x = m.from + (m.x - m.from) * e;
            y = h * 0.96 + (y - h * 0.96) * e;
            sc = 0.3 + 1.5 * Math.sin(Math.min(1, p * 1.25) * Math.PI) * (1 - p * 0.4) + 0.7 * e;
            el.classList.add("fresh");
          }
        }
        el.style.transform = `translate3d(${x}px,${y}px,0) translate(-50%,-50%) scale(${sc})`;
      }
      for (const k of motion.current.keys()) if (!alive.has(k)) motion.current.delete(k);

      // 글자끼리 겹치면 위아래로 살살 비켜 간다
      const ms = [...motion.current.values()];
      for (let i = 0; i < ms.length; i++) {
        for (let j = i + 1; j < ms.length; j++) {
          const a = ms[i], b = ms[j];
          if (Math.abs(a.x - b.x) > (a.wd + b.wd) / 2 || Math.abs(a.y - b.y) > ((a.ht + b.ht) / 2) * 0.85) continue;
          const push = (a.y <= b.y ? -1 : 1) * 0.35;
          a.y += push;
          b.y -= push;
        }
      }
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  // ── 손가락·마우스로 밀어서 우주 돌아다니기 ──
  const busy = !!(openBook || form || picked);
  const onDown = (e) => {
    if (busy) return;
    const c = cam.current;
    c.drag = { sx: e.clientX, cx: c.x, lx: e.clientX, lt: performance.now() };
    c.moved = false;
    c.v = 0;
    c.target = null;
  };
  const onMove = (e) => {
    const c = cam.current;
    if (!c.drag) return;
    const dx = e.clientX - c.drag.sx;
    if (Math.abs(dx) > 7) c.moved = true;
    const now = performance.now();
    const dt = Math.max(1, now - c.drag.lt);
    c.v = c.v * 0.6 + ((c.drag.lx - e.clientX) / dt) * 1000 * 0.4;
    c.drag.lx = e.clientX;
    c.drag.lt = now;
    c.x = c.drag.cx - dx;
  };
  const onUp = () => {
    const c = cam.current;
    if (!c.drag) return;
    c.drag = null;
    c.idleAt = performance.now();
    if (!c.moved) c.v = 0;
    // 밀었을 때만 바로 뒤따르는 click을 막는다 (click이 안 오는 경우를 대비해 곧 풀어 준다)
    setTimeout(() => (c.moved = false), 60);
  };
  // 밀다가 손을 뗀 곳에 책이 있어도 열리지 않게
  const onClickCapture = (e) => {
    if (!cam.current.moved) return;
    cam.current.moved = false;
    e.stopPropagation();
    e.preventDefault();
  };
  const step = (d) => {
    const c = cam.current;
    c.target = (c.target ?? c.x) + d * size.w * 0.7;
    c.idleAt = performance.now();
  };
  const onWheel = (e) => {
    if (busy) return;
    const c = cam.current;
    c.x += Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    c.target = null;
    c.idleAt = performance.now();
  };
  useEffect(() => {
    const onKey = (e) => {
      if (live.current.paused) return;
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // ── 후기 띄우기 ──
  const launch = async (text, bookId) => {
    const k = keyOf(text) || text;
    const exists = groups.some((g) => g.key === k);
    (exists ? pulseRef : launchRef).current.add(k);
    const local = { id: `local-${Date.now()}`, text, bookId, hidden: false, at: new Date().toISOString() };
    try {
      local.id = await addReview(text, bookId);
    } catch {
      say("인터넷이 불안정해서 지금은 내 화면에만 보여요");
    }
    setReviews((prev) => [...prev, local]);
  };

  const plusOne = async (g) => {
    let done = [];
    try { done = JSON.parse(sessionStorage.getItem("story-plus") || "[]"); } catch {}
    if (done.includes(g.key)) return say("이미 마음을 보탰어요 💜");
    try { sessionStorage.setItem("story-plus", JSON.stringify([...done, g.key])); } catch {}
    setPicked(null);
    await launch(g.text, g.bookId);
  };

  const bw = bookWidth(size.w, size.h, books.length);
  const world = worldSize(size.w, size.h);
  const pickedGroup = picked && groups.find((g) => g.key === picked);
  const bookTitle = (id) => books.find((b) => b.id === id)?.title;
  const total = reviews.filter((r) => !r.hidden).length;

  return (
    <main
      className={`space${show ? " show" : ""}`}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onPointerLeave={onUp}
      onClickCapture={onClickCapture}
      onWheel={onWheel}
    >
      <div className="world" ref={worldRef} style={{ width: world.W }}>
        {[1, 2, 3].map((k, i) => (
          <div
            key={k}
            className={`bg${i ? " blend" : ""}`}
            style={{
              left: i * (world.imgW - world.overlap), width: world.imgW,
              backgroundImage: `url(/space${k}.jpg)`, "--ov": `${world.overlap}px`,
            }}
          />
        ))}
        <div className="veil" />

      {shown.map((g) => (
        <button
          key={g.key}
          ref={(el) => (el ? wordEls.current.set(g.key, el) : wordEls.current.delete(g.key))}
          className="word"
          style={{ fontSize: fontOf(g.count), color: COLORS[hash(g.key) % COLORS.length], zIndex: 5 + Math.min(10, g.count) }}
          onClick={() => !show && setPicked(g.key)}
        >
          {g.text}
        </button>
      ))}

      {books.map((b) => (
        <button
          key={b.id}
          ref={(el) => (el ? bookEls.current.set(b.id, el) : bookEls.current.delete(b.id))}
          className="book"
          style={{ width: bw }}
          onClick={() => setOpenBook(b)}
          aria-label={`${b.title} 열기`}
        >
          <span className="book-body">
            <img src={b.cover} alt="" draggable={false} />
          </span>
          {books.length <= 14 && <span className="book-title">{b.title}</span>}
        </button>
      ))}

      </div>

      <canvas className="stars" ref={starRef} />

      <header className="top" ref={headRef}>
        <h1>{SITE.title}</h1>
        <p className="top-sub">{SITE.subtitle}</p>
        <div className="track"><b ref={thumbRef} /></div>
      </header>

      {!show && (
        <>
          <button className="nav left" onClick={() => step(-1)} aria-label="왼쪽으로 이동">‹</button>
          <button className="nav right" onClick={() => step(1)} aria-label="오른쪽으로 이동">›</button>
        </>
      )}
      {!show && (
        <footer className="bottom">
          <p className="guide">👆 {SITE.guide}</p>
          <button className="btn-write" onClick={() => setForm({ book: null })}>✍ 소감 한마디 띄우기</button>
          <p className="count">지금까지 떠오른 소감 {total}개</p>
        </footer>
      )}

      {show && (
        <aside className="qr-card">
          {qr && <img src={qr} alt="전시관 QR" />}
          <div>
            <strong>휴대폰으로 찍어 보세요</strong>
            <span>동화책을 읽고 소감을 남기면<br />이 우주에 글자가 떠올라요</span>
            <em>소감 {total}개</em>
          </div>
        </aside>
      )}

      {pickedGroup && (
        <div className="dim" onClick={() => setPicked(null)}>
          <div className="bubble" onClick={(e) => e.stopPropagation()}>
            <p className="bubble-text">“{pickedGroup.text}”</p>
            <p className="bubble-meta">
              {bookTitle(pickedGroup.bookId) ? `『${bookTitle(pickedGroup.bookId)}』을 읽고 · ` : ""}
              {pickedGroup.count}명이 같은 마음
            </p>
            <button className="btn-main" onClick={() => plusOne(pickedGroup)}>나도 같은 마음이에요 💜</button>
            <button className="btn-ghost" onClick={() => setPicked(null)}>닫기</button>
          </div>
        </div>
      )}

      {openBook && (
        <Viewer
          book={openBook}
          canReview={!show}
          onClose={(askReview) => {
            const b = openBook;
            setOpenBook(null);
            if (askReview && !show) setForm({ book: b });
          }}
        />
      )}

      {form && (
        <ReviewForm
          book={form.book}
          books={books}
          popular={groups.slice(0, 6).map((g) => g.text)}
          onCancel={() => setForm(null)}
          onSubmit={(text, bookId) => {
            setForm(null);
            launch(text, bookId);
          }}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}

// 우주 그림 세 장을 옆으로 이어 붙인 넓은 세상의 크기
const ZONES = 3;
const overlapOf = (imgW) => Math.round(imgW * 0.1);
function worldSize(w, h) {
  const imgW = Math.round(Math.max(h * (1672 / 941), w * 0.7));
  const overlap = overlapOf(imgW);
  return { imgW, overlap, W: imgW * ZONES - overlap * (ZONES - 1) };
}

// 책이 많을수록 표지를 작게 (세 구역에 나뉘므로 구역당 권수로 따진다)
function bookWidth(w, h, n) {
  const per = Math.ceil(n / ZONES);
  const k = per <= 2 ? 0.2 : per <= 5 ? 0.14 : per <= 10 ? 0.125 : per <= 16 ? 0.11 : 0.09;
  return Math.round(Math.max(96, Math.sqrt(w * h) * k));
}
