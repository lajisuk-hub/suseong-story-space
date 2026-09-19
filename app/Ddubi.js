"use client";

import { useEffect, useRef, useState } from "react";

// 수성구 공식 캐릭터 뚜비가 콩콩 뛰며 초대장 화면을 돌아다닙니다.
// (suseong-ai-hub의 FloatingDdubi를 옮겨 온 것 — 그림 8장을 빠르게 바꿔 영상처럼 보이게 한다)
const FRAMES = Array.from({ length: 8 }, (_, i) => `/ddubi/hop${i + 1}.png`);

const LINES = [
  "안녕! 나는 수성구 친구 뚜비야 💚",
  "발표회에 꼭 놀러 와! 기다릴게~",
  "아래로 내리면 행사 안내가 있어!",
  "동화책 우주 전시관도 미리 구경해 봐!",
  "친구들에게도 초대장을 보내 줘 💌",
];

export default function Ddubi({ paused = false, talk = true }) {
  const ref = useRef(null);
  const [frame, setFrame] = useState(0);
  const [line, setLine] = useState("");
  const [pos, setPos] = useState({ shift: 0, below: false }); // 말풍선이 화면 밖으로 나가지 않게
  const state = useRef({ paused, hover: false });
  state.current.paused = paused;

  useEffect(() => {
    FRAMES.forEach((src) => { new Image().src = src; });
    const t = setInterval(() => setFrame((f) => (f + 1) % FRAMES.length), 100);
    return () => clearInterval(t);
  }, []);

  // 벽(화면 가장자리)에 닿으면 방향을 바꾸며 계속 돌아다닌다
  useEffect(() => {
    const el = ref.current;
    const size = el.offsetWidth || 130;
    let x = Math.random() * Math.max(0, window.innerWidth - size);
    let y = window.innerHeight * (0.25 + Math.random() * 0.4);
    let vx = (Math.random() < 0.5 ? -1 : 1) * (0.7 + Math.random() * 0.5);
    let vy = (Math.random() < 0.5 ? -1 : 1) * (0.5 + Math.random() * 0.4);
    let raf;
    const step = () => {
      raf = requestAnimationFrame(step);
      if (state.current.paused || state.current.hover) return;
      const maxX = Math.max(0, window.innerWidth - size);
      const top = 8, maxY = Math.max(top, window.innerHeight - size * 1.15);
      x += vx;
      y += vy;
      if (x <= 0) { x = 0; vx = Math.abs(vx); }
      if (x >= maxX) { x = maxX; vx = -Math.abs(vx); }
      if (y <= top) { y = top; vy = Math.abs(vy); }
      if (y >= maxY) { y = maxY; vy = -Math.abs(vy); }
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      state.current.x = x + size / 2;
      state.current.y = y;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  // 누르면 말풍선으로 안내해 준다
  const speak = () => {
    if (!talk) return;
    const cx = state.current.x || 0, half = 108;
    setPos({ shift: Math.max(half + 8 - cx, 0) - Math.max(cx + half + 8 - window.innerWidth, 0), below: (state.current.y || 0) < 90 });
    setLine((cur) => LINES[(LINES.indexOf(cur) + 1) % LINES.length]);
    state.current.hover = true;
    clearTimeout(state.current.timer);
    state.current.timer = setTimeout(() => { setLine(""); state.current.hover = false; }, 3200);
  };

  return (
    <button ref={ref} className="ddubi" onClick={speak} aria-label="수성구 캐릭터 뚜비" style={{ visibility: paused ? "hidden" : "visible" }}>
      {line && <span className={`ddubi-say${pos.below ? " below" : ""}`} style={{ marginLeft: pos.shift }}>{line}</span>}
      <img src={FRAMES[frame]} alt="" draggable={false} />
    </button>
  );
}
