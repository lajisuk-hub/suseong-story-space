"use client";

import { useEffect, useState } from "react";
import { DEFAULT_BOOKS } from "../../data/books";
import { loadBooks, saveBooks, loadReviews, setReviewHidden, uploadPage, loadRsvps } from "../../lib/supabase";

const PASSWORD = "1234";

// PDF 한 권을 쪽마다 그림(JPG)으로 바꿔 보관소에 올린다.
async function pdfToPages(file, bookId, onProgress) {
  const pdfjs = await import("pdfjs-dist/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const urls = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    onProgress(`${i} / ${pdf.numPages}쪽 올리는 중…`);
    const page = await pdf.getPage(i);
    const base = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: 1200 / Math.max(base.width, base.height) });
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // intent:'print' — 탭이 가려져 있어도 멈추지 않게
    await page.render({ canvasContext: ctx, viewport, intent: "print" }).promise;
    const blob = await new Promise((ok) => canvas.toBlob(ok, "image/jpeg", 0.86));
    urls.push(await uploadPage(bookId, i - 1, blob));
  }
  return urls;
}

export default function Admin() {
  const [ok, setOk] = useState(false);
  const [pw, setPw] = useState("");
  const [books, setBooks] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [rsvps, setRsvps] = useState([]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState("");
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
    if (sessionStorage.getItem("story-admin") === "1") setOk(true);
  }, []);

  const refreshReviews = () => loadReviews().then((r) => setReviews(r.reverse())).catch(() => setMsg("후기를 못 불러왔어요(보관소 확인 필요)"));

  useEffect(() => {
    if (!ok) return;
    loadBooks().then((b) => setBooks(b && b.length ? b : DEFAULT_BOOKS));
    refreshReviews();
    loadRsvps().then(setRsvps).catch(() => {});
  }, [ok]);

  if (!ok) {
    return (
      <div className="admin">
        <div className="admin-in" style={{ maxWidth: 360, marginTop: 80 }}>
          <h1>전시관 관리</h1>
          <p className="note">비밀번호를 넣어 주세요.</p>
          <form
            className="row"
            style={{ marginTop: 12 }}
            onSubmit={(e) => {
              e.preventDefault();
              if (pw === PASSWORD) { sessionStorage.setItem("story-admin", "1"); setOk(true); }
              else setMsg("비밀번호가 달라요");
            }}
          >
            <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus style={{ flex: 1 }} />
            <button className="b primary">들어가기</button>
          </form>
          <p className="msg" style={{ marginTop: 8 }}>{msg}</p>
        </div>
      </div>
    );
  }
  if (!books) return <div className="admin"><div className="admin-in">불러오는 중…</div></div>;

  const edit = (id, patch) => setBooks((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  const move = (i, d) =>
    setBooks((prev) => {
      const next = [...prev];
      const j = i + d;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const onPdf = async (book, file) => {
    if (!file) return;
    setBusy(book.id);
    try {
      // 같은 이름으로는 덮어쓸 수 없어 올릴 때마다 새 폴더를 쓴다
      const folder = `${book.id}-${Date.now().toString(36)}`;
      const urls = await pdfToPages(file, folder, setMsg);
      edit(book.id, { pages: urls, cover: urls[0] });
      setMsg(`${urls.length}쪽을 올렸어요. 아래 「저장하기」를 눌러야 전시관에 나타나요.`);
    } catch (e) {
      setMsg(`올리기 실패: ${e.message}`);
    }
    setBusy("");
  };

  const save = async () => {
    setBusy("save");
    try {
      await saveBooks(books);
      setMsg("저장했어요 ✅ 전시관을 새로 열면 바로 보여요.");
    } catch (e) {
      setMsg(`저장 실패: ${e.message}`);
    }
    setBusy("");
  };

  const toggle = async (r) => {
    try {
      await setReviewHidden(r, !r.hidden);
      setReviews((prev) => prev.map((x) => (x.id === r.id ? { ...x, hidden: !r.hidden } : x)));
    } catch (e) {
      setMsg(`실패: ${e.message}`);
    }
  };

  const titleOf = (id) => books.find((b) => b.id === id)?.title || "";

  return (
    <div className="admin">
      <div className="admin-in">
        <h1>동화책 우주 전시관 관리</h1>
        <div className="links">
          <span>📱 참여자용 주소: <a href="/" target="_blank">{origin}/</a></span>
          <span>💌 모바일 초대장: <a href="/invite" target="_blank">{origin}/invite</a></span>
          <span>🖥 행사장 큰 화면용(QR 포함): <a href="/show" target="_blank">{origin}/show</a> — 열고 나서 F11을 누르면 화면 가득 찹니다</span>
        </div>

        <h2>1. 동화책 ({books.length}권)</h2>
        <p className="note">PDF를 올리면 쪽마다 그림으로 바뀌어 넘겨 볼 수 있게 됩니다. 표지는 첫 쪽이 자동으로 쓰입니다.</p>
        {books.map((b, i) => (
          <div className="card" key={b.id}>
            {b.cover ? <img src={b.cover} alt="" /> : <img alt="" />}
            <div className="fields">
              <label>책 제목<input type="text" value={b.title} onChange={(e) => edit(b.id, { title: e.target.value })} /></label>
              <label>만든 기관<input type="text" value={b.org} onChange={(e) => edit(b.id, { org: e.target.value })} /></label>
              <div className="row">
                <label className="b primary" style={{ cursor: "pointer", color: "#fff" }}>
                  {busy === b.id ? "올리는 중…" : b.pages?.length ? `PDF 다시 올리기 (지금 ${b.pages.length}쪽)` : "📄 PDF 올리기"}
                  <input type="file" accept="application/pdf" hidden disabled={!!busy} onChange={(e) => onPdf(b, e.target.files[0])} />
                </label>
                <button className="b" onClick={() => move(i, -1)} disabled={i === 0}>▲</button>
                <button className="b" onClick={() => move(i, 1)} disabled={i === books.length - 1}>▼</button>
                <button className="b danger" onClick={() => confirm(`「${b.title}」을(를) 목록에서 뺄까요?`) && setBooks((p) => p.filter((x) => x.id !== b.id))}>빼기</button>
              </div>
              {!b.pages?.length && (
                <label>PDF가 없으면 전자책 주소(새 창으로 열림)
                  <input type="url" value={b.link || ""} placeholder="https://" onChange={(e) => edit(b.id, { link: e.target.value.trim() })} />
                </label>
              )}
            </div>
          </div>
        ))}
        <div className="row" style={{ marginTop: 12 }}>
          <button
            className="b primary"
            onClick={() => setBooks((p) => [...p, { id: `b${Date.now().toString(36)}`, title: "새 동화책", org: "", cover: "", pages: [], link: "" }])}
          >
            + 동화책 추가
          </button>
        </div>

        <h2>2. 후기 ({reviews.filter((r) => !r.hidden).length}개 떠 있음)</h2>
        <p className="note">알맞지 않은 글은 「숨기기」를 누르면 몇 초 안에 모든 화면에서 사라집니다.</p>
        <div className="row" style={{ margin: "8px 0" }}><button className="b" onClick={refreshReviews}>↻ 새로 고침</button></div>
        <table>
          <tbody>
            {reviews.map((r) => (
              <tr key={r.id} className={r.hidden ? "hidden" : ""}>
                <td>{r.text}</td>
                <td style={{ color: "#8d7cc0", fontSize: 12 }}>{titleOf(r.bookId)}</td>
                <td style={{ color: "#8d7cc0", fontSize: 12, whiteSpace: "nowrap" }}>{new Date(r.at).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                <td style={{ textAlign: "right" }}><button className={`b${r.hidden ? "" : " danger"}`} onClick={() => toggle(r)}>{r.hidden ? "다시 보이기" : "숨기기"}</button></td>
              </tr>
            ))}
            {!reviews.length && <tr><td>아직 후기가 없어요.</td></tr>}
          </tbody>
        </table>

        <h2>3. 초대장 참석 회신 (참석 {rsvps.filter((r) => r.attend === "yes").reduce((a, r) => a + (Number(r.count) || 1), 0)}명 · 불참 {rsvps.filter((r) => r.attend === "no").length}건)</h2>
        <table>
          <tbody>
            {rsvps.map((r) => (
              <tr key={r.id}>
                <td>{r.name}</td>
                <td style={{ color: "#8d7cc0" }}>{r.org}</td>
                <td>{r.attend === "yes" ? `참석 ${r.count}명` : "불참"}</td>
                <td style={{ color: "#8d7cc0", fontSize: 12, whiteSpace: "nowrap" }}>{new Date(r.at).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
              </tr>
            ))}
            {!rsvps.length && <tr><td>아직 회신이 없어요.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="savebar">
        <span className="msg">{msg}</span>
        <button className="b primary" onClick={save} disabled={!!busy}>{busy === "save" ? "저장 중…" : "저장하기"}</button>
      </div>
    </div>
  );
}
