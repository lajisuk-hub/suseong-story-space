"use client";
import { useEffect, useRef, useState } from "react";

// 잔잔한 피아노 배경음악 (모두 저작권이 끝난 곡·연주 — 위키미디어 공용, 퍼블릭 도메인)
// 여러 곡이면 차례로 이어서 틀고, 끝나면 처음부터 다시.
const TRACKS = ["/music/satie.mp3", "/music/debussy.mp3", "/music/chopin.mp3"];
const VOLUME = 0.45;

// 브라우저는 화면을 한 번 누르기 전엔 소리를 막는다 → 첫 터치/클릭 때 살며시 시작.
// 왼쪽 위 🎵 단추로 끄고 켤 수 있다.
export default function Music() {
  const audio = useRef(null);
  const idx = useRef(0);
  const offByUser = useRef(false);
  const [on, setOn] = useState(false);

  const fadeIn = (a) => {
    a.volume = 0;
    const t = setInterval(() => {
      a.volume = Math.min(VOLUME, a.volume + VOLUME / 30);
      if (a.volume >= VOLUME) clearInterval(t);
    }, 100);
  };

  const start = () => {
    const a = audio.current;
    if (!a || !a.paused) return;
    a.play().then(() => { setOn(true); fadeIn(a); }).catch(() => {});
  };

  useEffect(() => {
    const first = (e) => {
      if (offByUser.current || e.target?.closest?.(".music")) return; // 단추는 toggle이 처리
      start();
    };
    window.addEventListener("pointerdown", first, true);
    window.addEventListener("keydown", first, true);
    start(); // 이미 허용된 화면이면 바로 시작
    return () => {
      window.removeEventListener("pointerdown", first, true);
      window.removeEventListener("keydown", first, true);
    };
  }, []);

  const next = () => {
    const a = audio.current;
    idx.current = (idx.current + 1) % TRACKS.length;
    a.src = TRACKS[idx.current];
    a.play().catch(() => {});
  };

  const toggle = (e) => {
    e.stopPropagation();
    const a = audio.current;
    if (a.paused) { offByUser.current = false; start(); }
    else { offByUser.current = true; a.pause(); setOn(false); }
  };

  return (
    <>
      <audio ref={audio} src={TRACKS[0]} preload="auto" loop={TRACKS.length === 1} onEnded={next} />
      <button
        className={`music${on ? " on" : ""}`}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={toggle}
        aria-label={on ? "배경음악 끄기" : "배경음악 켜기"}
        title={on ? "배경음악 끄기" : "배경음악 켜기"}
      >
        {on ? "🎵" : "🔇"}
      </button>
    </>
  );
}
