"use client";
import { useEffect, useRef, useState } from "react";

// 배경음악: 모차르트 「작은 별 변주곡」 K.265 — 연주 Simone Renzi, CC BY 3.0 (위키미디어 공용)
// 소리 단추를 눌러야만 켜지고, 켜 두면 전시를 보는 동안 계속 반복된다.
const TRACK = "/music/mozart-k265.mp3";
const CREDIT = "♪ 모차르트 「작은 별 변주곡」 · 연주 Simone Renzi (CC BY 3.0)";

// 소리가 파도처럼 크게·작게 천천히 출렁이는 효과 (한 번 오르내리는 데 PERIOD초)
const LOW = 0.25, HIGH = 0.8, PERIOD = 16;

export default function Music() {
  const audio = useRef(null);
  const ctx = useRef(null);
  const gain = useRef(null);
  const [on, setOn] = useState(false);

  // 아이폰은 audio.volume을 무시하므로 Web Audio의 gain으로 크기를 조절한다
  const setupGain = () => {
    if (ctx.current) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      const c = new AC();
      const g = c.createGain();
      g.gain.value = 0;
      c.createMediaElementSource(audio.current).connect(g).connect(c.destination);
      ctx.current = c;
      gain.current = g;
    } catch {}
  };

  const setLevel = (v) => {
    if (gain.current) gain.current.gain.value = v;
    else if (audio.current) audio.current.volume = v;
  };

  // 켜져 있는 동안: 처음 3초는 살며시 커지고, 그 뒤로는 크게·작게 출렁인다
  useEffect(() => {
    if (!on) return;
    const t0 = performance.now();
    const id = setInterval(() => {
      const s = (performance.now() - t0) / 1000;
      const wave = LOW + (HIGH - LOW) * (0.5 - 0.5 * Math.cos((2 * Math.PI * s) / PERIOD));
      setLevel(wave * Math.min(1, s / 3));
    }, 50);
    return () => clearInterval(id);
  }, [on]);

  const toggle = (e) => {
    e.stopPropagation();
    const a = audio.current;
    if (a.paused) {
      setupGain();
      setLevel(0);
      ctx.current?.resume();
      a.play().then(() => setOn(true)).catch(() => {});
    } else {
      a.pause();
      setOn(false);
    }
  };

  return (
    <>
      <audio ref={audio} src={TRACK} preload="auto" loop />
      <button
        className={`music${on ? " on" : ""}`}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={toggle}
        title={CREDIT}
      >
        {on ? "🎵 소리 끄기" : "🔈 소리 켜기"}
      </button>
      {on && <p className="music-credit">{CREDIT}</p>}
    </>
  );
}
