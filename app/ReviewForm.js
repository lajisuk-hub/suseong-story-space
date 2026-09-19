"use client";

import { useState } from "react";
import { QUICK_WORDS } from "../data/books";
import { MAX_LEN, cleanText, hasBadWord } from "../lib/words";

// 책을 다 본 뒤 후기 한마디를 쓰는 창
export default function ReviewForm({ book, books, popular, onCancel, onSubmit }) {
  const [bookId, setBookId] = useState(book?.id || (books.length === 1 ? books[0].id : ""));
  const [text, setText] = useState("");
  const [err, setErr] = useState("");

  const chips = [...new Set([...popular, ...QUICK_WORDS])].slice(0, 9);
  const chosen = books.find((b) => b.id === bookId);

  const send = () => {
    const t = cleanText(text);
    if (!t) return setErr("한마디를 적어 주세요");
    if (hasBadWord(t)) return setErr("모두가 함께 보는 화면이에요. 고운 말로 적어 주세요 🙏");
    onSubmit(t, bookId);
  };

  return (
    <div className="dim" onClick={onCancel}>
      <div className="form" onClick={(e) => e.stopPropagation()}>
        <p className="form-emoji">🚀</p>
        <h2>소감 한마디를 우주에 띄워 주세요</h2>
        {book ? (
          <p className="form-book">『{book.title}』 잘 보셨나요?</p>
        ) : books.length > 1 ? (
          <select value={bookId} onChange={(e) => setBookId(e.target.value)} aria-label="어떤 동화책인가요?">
            <option value="">어떤 동화책을 보셨나요? (안 골라도 돼요)</option>
            {books.map((b) => (
              <option key={b.id} value={b.id}>{b.title}</option>
            ))}
          </select>
        ) : (
          chosen && <p className="form-book">『{chosen.title}』 어떠셨나요?</p>
        )}

        <div className="form-input">
          <input
            autoFocus
            value={text}
            maxLength={MAX_LEN}
            placeholder="예) 아이 마음이 느껴져 뭉클했어요"
            onChange={(e) => { setText(e.target.value); setErr(""); }}
            onKeyDown={(e) => e.key === "Enter" && !e.nativeEvent.isComposing && send()}
          />
          <span>{text.length}/{MAX_LEN}</span>
        </div>

        <p className="form-hint">눌러서 고를 수도 있어요 · 같은 말이 모이면 글자가 커져요</p>
        <div className="chips">
          {chips.map((c) => (
            <button key={c} className={text === c ? "on" : ""} onClick={() => { setText(c); setErr(""); }}>{c}</button>
          ))}
        </div>

        {err && <p className="form-err">{err}</p>}
        <button className="btn-main" onClick={send}>우주로 띄우기 ✨</button>
        <button className="btn-ghost" onClick={onCancel}>다음에 할게요</button>
      </div>
    </div>
  );
}
