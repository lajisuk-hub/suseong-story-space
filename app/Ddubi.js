"use client";

import { useEffect, useRef, useState } from "react";

// 수성구 공식 캐릭터 뚜비가 콩콩 뛰며 화면을 돌아다닙니다.
// (suseong-ai-hub의 FloatingDdubi를 옮겨 온 것 — 그림 8장을 빠르게 바꿔 영상처럼 보이게 한다)
const FRAMES = Array.from({ length: 8 }, (_, i) => `/ddubi/hop${i + 1}.png`);

const LINES = [
  "안녕! 나는 수성구 친구 뚜비야 💚",
  "떠다니는 동화책을 눌러서 읽어 봐!",
  "화면을 옆으로 밀면 더 넓은 우주가 있어!",
  "다 읽고 소감을 남기면 글자가 우주에 떠올라!",
  "같은 말이 모이면 글자가 점점 커진대!",
];

export default function Ddubi({ paused = false, talk = true }) {
  const ref = useRef(null);
  const [frame, setFrame] = useState(0);
  const [line, setLine] = useState("");
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
      const top = 110, maxY = Math.max(top, window.innerHeight - size * 1.1 - 150);
      x += vx;
      y += vy;
      if (x <= 0) { x = 0; vx = Math.abs(vx); }
      if (x >= maxX) { x = maxX; vx = -Math.abs(vx); }
      if (y <= top) { y = top; vy = Math.abs(vy); }
      if (y >= maxY) { y = maxY; vy = -Math.abs(vy); }
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  // 누르면 말풍선으로 안내해 준다
  const speak = () => {
    if (!talk) return;
    setLine((cur) => LINES[(LINES.indexOf(cur) + 1) % LINES.length]);
    state.current.hover = true;
    clearTimeout(state.current.timer);
    state.current.timer = setTimeout(() => { setLine(""); state.current.hover = false; }, 3200);
  };

  return (
    <button ref={ref} className="ddubi" onClick={speak} aria-label="수성구 캐릭터 뚜비" style={{ visibility: paused ? "hidden" : "visible" }}>
      {line && <span className="ddubi-say">{line}</span>}
      <img src={FRAMES[frame]} alt="" draggable={false} />
    </button>
  );
}
