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
    height: 100dvh;
    max-width: 860px;
    margin: 0 auto;
    background: #fff;
    box-shadow: 0 0 40px rgba(0,0,0,0.08);
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 20px;
    background: #007bff;
    color: white;
    flex-shrink: 0;
  }
  .header h2 { font-size: clamp(15px, 3vw, 20px); font-weight: 600; }
  .clear-btn {
    padding: 6px 14px; border-radius: 6px;
    border: 1px solid rgba(255,255,255,0.5);
    background: transparent; color: white;
    cursor: pointer; font-size: 13px;
  }
  .clear-btn:hover { background: rgba(255,255,255,0.15); }

  .chat-box {
    flex: 1; overflow-y: auto;
    padding: 16px; display: flex;
    flex-direction: column; gap: 10px;
    background: #f7f8fa;
    -webkit-overflow-scrolling: touch;
  }
  .chat-box::-webkit-scrollbar { width: 3px; }
  .chat-box::-webkit-scrollbar-thumb { background: #ccc; border-radius: 4px; }

  .msg-row { display: flex; align-items: flex-end; gap: 8px; }
  .msg-row.user { flex-direction: row-reverse; }

  .avatar {
    width: 30px; height: 30px; border-radius: 50%;
    flex-shrink: 0; display: flex;
    align-items: center; justify-content: center;
    font-size: 12px; font-weight: 700;
  }
  .avatar.ai { background: #007bff; color: white; }
  .avatar.user { background: #28a745; color: white; }

  .bubble {
    max-width: min(75%, 580px);
    padding: 10px 14px; border-radius: 16px;
    font-size: 14px; line-height: 1.65;
    white-space: pre-wrap; word-break: break-word;
  }
  .bubble.ai {
    background: #fff; border: 1px solid #e3e6ea;
    border-bottom-left-radius: 4px; color: #1a1a2e;
    box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  }
  .bubble.user {
    background: #007bff; color: white;
    border-bottom-right-radius: 4px;
  }
  .bubble.error { background: #fff0f0; border-color: #ffcccc; color: #cc0000; }

  .thinking { display: flex; gap: 5px; padding: 12px 14px; }
  .dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: #aaa; animation: bounce 1.2s infinite;
  }
  .dot:nth-child(2) { animation-delay: 0.2s; }
  .dot:nth-child(3) { animation-delay: 0.4s; }
  @keyframes bounce {
    0%,60%,100% { transform: translateY(0); }
    30% { transform: translateY(-7px); background: #007bff; }
  }

  .preview-area {
    padding: 8px 16px 0;
    display: flex; flex-wrap: wrap; gap: 8px;
    background: #fff; flex-shrink: 0;
  }
  .preview-chip {
    display: flex; align-items: center; gap: 6px;
    background: #f0f4ff; border: 1px solid #ccd;
    border-radius: 8px; padding: 5px 10px;
    font-size: 12px; color: #333; max-width: 200px;
  }
  .preview-chip span {
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .preview-img-thumb {
    height: 52px; max-width: 80px;
    border-radius: 6px; object-fit: cover;
    border: 1px solid #ddd;
  }
  .remove-chip {
    width: 18px; height: 18px; border-radius: 50%;
    border: none; background: #dc3545;
    color: white; font-size: 10px;
    cursor: pointer; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
  }

  .input-area {
    padding: 10px 14px 14px;
    background: #fff;
    border-top: 1px solid #e8eaed;
    flex-shrink: 0;
  }
  .input-row { display: flex; gap: 7px; align-items: flex-end; }

  .attach-btn {
    width: 40px; height: 40px; border-radius: 10px;
    border: 1px solid #ddd; background: #f7f8fa;
    font-size: 17px; cursor: pointer; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.2s;
  }
  .attach-btn:hover { background: #e8eaed; }

  .text-input {
    flex: 1; padding: 10px 13px;
    border-radius: 10px; border: 1px solid #ddd;
    font-size: 16px; font-family: inherit;
    outline: none; background: #f7f8fa;
    transition: border-color 0.2s;
    min-width: 0; resize: none;
    line-height: 1.5; max-height: 110px;
    overflow-y: auto;
    -webkit-appearance: none;
  }
  .text-input:focus { border-color: #007bff; background: #fff; }
  .text-input::placeholder { color: #aaa; }

  .send-btn {
    width: 42px; height: 42px; border-radius: 10px;
    border: none; background: #007bff;
    color: white; font-size: 18px;
    cursor: pointer; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.15s, opacity 0.2s;
    -webkit-tap-highlight-color: transparent;
  }
  .send-btn:hover:not(:disabled) { background: #0056cc; }
  .send-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  .hint { margin-top: 6px; font-size: 11px; color: #bbb; text-align: center; }

  /* Tablet */
  @media (max-width: 768px) {
    .app-wrapper { max-width: 100%; box-shadow: none; }
    .bubble { max-width: 85%; }
    .hint { display: none; }
  }
  /* Mobile */
  @media (max-width: 480px) {
    .header { padding: 10px 14px; }
    .chat-box { padding: 10px 10px; }
    .input-area { padding: 8px 10px 10px; }
    .preview-area { padding: 6px 10px 0; }
    .bubble { max-width: 90%; font-size: 13.5px; padding: 9px 12px; }
    .avatar { width: 26px; height: 26px; font-size: 11px; }
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
  const [attachments, setAttachments] = useState([]); // [{type, name, mime, data, preview}]
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // ── FILE HANDLER ──
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target.result;
        const base64 = dataUrl.split(",")[1];
        const mime = file.type || "application/octet-stream";
        const isImage = mime.startsWith("image/");
        const isAudio = mime.startsWith("audio/");
        setAttachments(prev => [...prev, {
          name: file.name,
          mime,
          data: base64,
          preview: isImage ? dataUrl : null,
          type: isImage ? "image" : isAudio ? "audio" : "file",
        }]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const removeAttachment = (idx) => {
    setAttachments(prev => prev.filter((_, i) => i !== idx));
  };

  const handleInput = (e) => {
    setInput(e.target.value);
    const ta = textareaRef.current;
    if (ta) { ta.style.height = "auto"; ta.style.height = ta.scrollHeight + "px"; }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  // ── SEND ──
  const sendMessage = async () => {
    if ((!input.trim() && !attachments.length) || loading) return;

    const userMessage = {
      role: "user",
      content: input.trim() || `(${attachments.map(a => a.name).join(", ")})`
    };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    const sentAttachments = [...attachments];
    setAttachments([]);
    setLoading(true);

    const payload = {
      messages: updatedMessages,
      files: sentAttachments.map(a => ({ name: a.name, mime: a.mime, data: a.data }))
    };

    try {
      const res = await fetch("https://kbassistant-63e1.onrender.com/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.answer }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Something went wrong. Please try again.",
        isError: true
      }]);
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (type) => {
    if (type === "audio") return "🎵";
    if (type === "image") return "🖼️";
    return "📄";
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
                <div className="dot"/><div className="dot"/><div className="dot"/>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Attachment previews */}
        {attachments.length > 0 && (
          <div className="preview-area">
            {attachments.map((a, i) => (
              <div key={i} className="preview-chip">
                {a.preview
                  ? <img src={a.preview} alt={a.name} className="preview-img-thumb" />
                  : <span>{getFileIcon(a.type)}</span>
                }
                <span title={a.name}>{a.name}</span>
                <button className="remove-chip" onClick={() => removeAttachment(i)}>✕</button>
              </div>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="input-area">
          <div className="input-row">
            {/* Single file input — accepts image, pdf, audio, and common docs */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,audio/*,.pdf,.doc,.docx,.txt,.md,.csv,.json,.py,.js,.ts,.html,.css"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
            <button
              className="attach-btn"
              onClick={() => fileInputRef.current.click()}
              title="Attach file"
            >
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
              disabled={loading || (!input.trim() && !attachments.length)}
              title="Send"
            >
              ➤
            </button>
          </div>
          <div className="hint">Enter to send · Shift+Enter for new line</div>
        </div>

      </div>
    </>
  );
}

export default App;