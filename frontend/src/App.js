import { useState, useRef, useEffect } from "react";

function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: "user", content: input.trim() };
    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("https://kbassistant-63e1.onrender.com/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages })
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
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>KB Assistant</h2>
        <button style={styles.clearBtn} onClick={() => setMessages([])}>Clear</button>
      </div>

      <div style={styles.chatBox}>
        {messages.map((msg, i) => (
          <div
            key={i}
            style={msg.role === "user" ? styles.userMessage : {
              ...styles.botMessage,
              ...(msg.isError ? styles.errorMessage : {})
            }}
          >
            {msg.content}
          </div>
        ))}

        {loading && <div style={styles.botMessage}>Thinking...</div>}
        <div ref={bottomRef} />
      </div>

      <div style={styles.inputBox}>
        <input
          style={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything..."
          onKeyDown={(e) => e.key === "Enter" && !loading && sendMessage()}
          disabled={loading}
        />
        <button
          style={{ ...styles.button, opacity: loading || !input.trim() ? 0.6 : 1 }}
          onClick={sendMessage}
          disabled={loading || !input.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "600px",
    margin: "auto",
    padding: "20px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px"
  },
  title: {
    margin: 0
  },
  clearBtn: {
    padding: "6px 14px",
    borderRadius: "5px",
    border: "1px solid #ccc",
    background: "white",
    cursor: "pointer",
    fontSize: "14px"
  },
  chatBox: {
    border: "1px solid #ccc",
    borderRadius: "10px",
    padding: "10px",
    height: "400px",
    overflowY: "auto",
    marginBottom: "10px",
    background: "#f9f9f9"
  },
  userMessage: {
    textAlign: "right",
    margin: "10px",
    padding: "10px",
    background: "#d1e7dd",
    borderRadius: "10px",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word"
  },
  botMessage: {
    textAlign: "left",
    margin: "10px",
    padding: "10px",
    background: "#e2e3e5",
    borderRadius: "10px",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word"
  },
  errorMessage: {
    background: "#f8d7da",
    color: "#842029"
  },
  inputBox: {
    display: "flex",
    gap: "10px"
  },
  input: {
    flex: 1,
    padding: "10px",
    borderRadius: "5px",
    border: "1px solid #ccc"
  },
  button: {
    padding: "10px 15px",
    borderRadius: "5px",
    border: "none",
    background: "#007bff",
    color: "white",
    cursor: "pointer"
  }
};

export default App;