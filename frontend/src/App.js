import { useState, useRef, useEffect } from "react";

const css = `
  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: #f0f2f5;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    min-height: 100vh;
  }

  .app-wrapper {
    display: flex;
    flex-direction: column;
    height: 100vh;
    max-width: 860px;
    margin: 0 auto;
    background: #fff;
    box-shadow: 0 0 40px rgba(0,0,0,0.08);
  }

  /* ── HEADER ── */
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 24px;
    background: #007bff;
    color: white;
    flex-shrink: 0;
  }
  .header h2 {
    font-size: clamp(16px, 3vw, 22px);
    font-weight: 600;
    letter-spacing: 0.3px;
  }
  .clear-btn {
    padding: 7px 16px;
    border-radius: 6px;
    border: 1px solid rgba(255,255,255,0.5);
    background: transparent;
    color: white;
    cursor: pointer;
    font-size: 13px;
    transition: background 0.2s;
  }
  .clear-btn:hover { background: rgba(255,255,255,0.15); }

  /* ── CHAT BOX ── */
  .chat-box {
    flex: 1;
    overflow-y: auto;
    padding: 20px 24px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    background: #f7f8fa;
  }
  .chat-box::-webkit-scrollbar { width: 4px; }
  .chat-box::-webkit-scrollbar-thumb { background: #ccc; border-radius: 4px; }

  /* ── MESSAGES ── */
  .msg-row {
    display: flex;
    align-items: flex-end;
    gap: 8px;
  }
  .msg-row.user { flex-direction: row-reverse; }

  .avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 700;
  }
  .avatar.ai { background: #007bff; color: white; }
  .avatar.user { background: #28a745; color: white; }

  .bubble {
    max-width: min(72%, 560px);
    padding: 11px 15px;
    border-radius: 16px;
    font-size: 14px;
    line-height: 1.65;
    white-space: pre-wrap;
    word-break: break-word;
  }
  .bubble.ai {
    background: #fff;
    border: 1px solid #e3e6ea;
    border-bottom-left-radius: 4px;
    color: #1a1a2e;
    box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  }
  .bubble.user {
    background: #007bff;
    color: white;
    border-bottom-right-radius: 4px;
  }
  .bubble.error {
    background: #fff0f0;
    border-color: #ffcccc;
    color: #cc0000;
  }

  /* thinking dots */
  .thinking { display: flex; gap: 5px; padding: 14px 16px; }
  .dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: #aaa; animation: bounce 1.2s infinite;
  }
  .dot:nth-child(2) { animation-delay: 0.2s; }
  .dot:nth-child(3) { animation-delay: 0.4s; }
  @keyframes bounce {
    0%, 60%, 100% { transform: translateY(0); }
    30% { transform: translateY(-8px); background: #007bff; }
  }

  /* ── IMAGE PREVIEW ── */
  .preview-wrap {
    padding: 8px 24px 0;
    display: flex;
    align-items: center;
    gap: 10px;
    background: #fff;
    flex-shrink: 0;
  }
  .preview-img {
    height: 64px;
    max-width: 100px;
    border-radius: 8px;
    border: 1px solid #ddd;
    object-fit: cover;
  }
  .remove-img {
    width: 22px; height: 22px;
    border-radius: 50%; border: none;
    background: #dc3545; color: white;
    font-size: 12px; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }

  /* ── INPUT AREA ── */
  .input-area {
    padding: 14px 24px 18px;
    background: #fff;
    border-top: 1px solid #e8eaed;
    flex-shrink: 0;
  }
  .input-row {
    display: flex;
    gap: 8px;
    align-items: center;
  }
  .attach-btn {
    width: 40px; height: 40px;
    border-radius: 10px;
    border: 1px solid #ddd;
    background: #f7f8fa;
    font-size: 17px;
    cursor: pointer;
    flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.2s;
  }
  .attach-btn:hover { background: #e8eaed; }

  .text-input {
    flex: 1;
    padding: 10px 14px;
    border-radius: 10px;
    border: 1px solid #ddd;
    font-size: 15px;
    font-family: inherit;
    outline: none;
    background: #f7f8fa;
    transition: border-color 0.2s, background 0.2s;
    min-width: 0;
    resize: none;
    line-height: 1.5;
    max-height: 120px;
    overflow-y: auto;
  }
  .text-input:focus { border-color: #007bff; background: #fff; }
  .text-input::placeholder { color: #aaa; }

  .send-btn {
    width: 42px; height: 42px;
    border-radius: 10px;
    border: none;
    background: #007bff;
    color: white;
    font-size: 18px;
    cursor: pointer;
    flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.2s, transform 0.1s, opacity 0.2s;
  }
  .send-btn:hover:not(:disabled) { background: #0056cc; transform: scale(1.05); }
  .send-btn:disabled { opacity: 0.45; cursor: not-allowed; }

  .hint {
    margin-top: 7px;
    font-size: 11px;
    color: #aaa;
    text-align: center;
  }

  /* ── RESPONSIVE ── */

  /* Tablet */
  @media (max-width: 768px) {
    .app-wrapper { max-width: 100%; box-shadow: none; }
    .chat-box { padding: 14px 14px; }
    .input-area { padding: 10px 14px 14px; }
    .preview-wrap { padding: 6px 14px 0; }
    .bubble { max-width: 82%; font-size: 14px; }
    .hint { display: none; }
  }

  /* Mobile */
  @media (max-width: 480px) {
    .header { padding: 12px 16px; }
    .chat-box { padding: 10px 10px; gap: 10px; }
    .input-area { padding: 8px 10px 12px; }
    .preview-wrap { padding: 6px 10px 0; }
    .bubble { max-width: 88%; font-size: 13.5px; padding: 9px 12px; }
    .avatar { width: 27px; height: 27px; font-size: 11px; }
    .text-input { font-size: 16px; } /* prevent iOS zoom */
    .send-btn { width: 40px; height: 40px; }
    .attach-btn { width: 38px; height: 38px; }
  }

  /* Large desktop */
  @media (min-width: 1200px) {
    .app-wrapper { max-width: 960px; }
    .bubble { font-size: 15px; }
  }
`;

function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImageFile(ev.target.result);
      setImagePreview(ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // auto-resize textarea
  const handleInput = (e) => {
    setInput(e.target.value);
    const ta = textareaRef.current;
    if (ta) { ta.style.height = "auto"; ta.style.height = ta.scrollHeight + "px"; }
  };

  const sendMessage = async () => {
    if ((!input.trim() && !imageFile) || loading) return;

    const userMessage = { role: "user", content: input.trim() || "(image)" };
    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setLoading(true);

    const payload = { messages: updatedMessages };
    if (imageFile) {
      const base64 = imageFile.split(",")[1];
      const mime = imageFile.split(";")[0].split(":")[1];
      payload.files = [{ name: "image", mime, data: base64 }];
    }

    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";

    try {
      const res = await fetch("https://kbassistant-63e1.onrender.com/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.answer }]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Something went wrong. Please try again.", isError: true }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{css}</style>
      <div className="app-wrapper">

        {/* Header */}
        <div className="header">
          <h2>KB Assistant</h2>
          <button className="clear-btn" onClick={() => setMessages([])}>Clear</button>
        </div>

        {/* Chat */}
        <div className="chat-box">
          {messages.map((msg, i) => (
            <div key={i} className={`msg-row ${msg.role}`}>
              <div className={`avatar ${msg.role === "assistant" ? "ai" : "user"}`}>
                {msg.role === "assistant" ? "AI" : "U"}
              </div>
              <div className={`bubble ${msg.role === "assistant" ? "ai" : "user"} ${msg.isError ? "error" : ""}`}>
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="msg-row">
              <div className="avatar ai">AI</div>
              <div className="bubble ai thinking">
                <div className="dot" /><div className="dot" /><div className="dot" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Image preview */}
        {imagePreview && (
          <div className="preview-wrap">
            <img src={imagePreview} alt="preview" className="preview-img" />
            <button className="remove-img" onClick={removeImage}>✕</button>
          </div>
        )}

        {/* Input */}
        <div className="input-area">
          <div className="input-row">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleImageChange}
            />
            <button className="attach-btn" onClick={() => fileInputRef.current.click()} title="Attach image">
              📎
            </button>
            <textarea
              ref={textareaRef}
              className="text-input"
              rows={1}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything…"
              disabled={loading}
            />
            <button
              className="send-btn"
              onClick={sendMessage}
              disabled={loading || (!input.trim() && !imageFile)}
              title="Send"
            >
              ➤
            </button>
          </div>
          <div className="hint">Enter to send &nbsp;·&nbsp; Shift+Enter for new line</div>
        </div>

      </div>
    </>
  );
}

export default App;