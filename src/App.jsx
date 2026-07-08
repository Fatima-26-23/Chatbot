import { useState, useRef, useEffect } from "react";
import { Send, Settings, Terminal, AlertCircle } from "lucide-react";
import "./index.css";

const MODEL = "llama-3.3-70b-versatile";

export default function GroqChat() {
  const [apiKey, setApiKey] = useState("");
  const [showSettings, setShowSettings] = useState(true);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;
    if (!apiKey.trim()) {
      setError("Add your Groq API key first.");
      setShowSettings(true);
      return;
    }

    setError("");
    const nextMessages = [...messages, { role: "user", content: text }];
    setMessages([...nextMessages, { role: "assistant", content: "" }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({
          model: MODEL,
          messages: nextMessages,
          stream: true,
        }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody?.error?.message || `Request failed (${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop(); // keep incomplete line for next chunk

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const payload = trimmed.slice(5).trim();
          if (payload === "[DONE]") continue;

          try {
            const json = JSON.parse(payload);
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) {
              fullText += delta;
              setMessages((prev) => {
                const copy = [...prev];
                copy[copy.length - 1] = { role: "assistant", content: fullText };
                return copy;
              });
            }
          } catch {
            // ignore malformed partial JSON chunk
          }
        }
      }
    } catch (err) {
      setError(err.message || "Something went wrong reaching Groq.");
      setMessages((prev) => prev.filter((m, i) => !(i === prev.length - 1 && m.role === "assistant" && m.content === "")));
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="groqchat">
      {/* Title bar */}
      <div className="groqchat-titlebar">
        <div className="groqchat-titlebar-left">
          <Terminal size={16} color="#F55036" />
          <span className="groqchat-titlebar-label">
            groqchat <span className="groqchat-titlebar-sep">/</span> {MODEL}
          </span>
        </div>
        <button
          onClick={() => setShowSettings((s) => !s)}
          aria-label="Toggle settings"
          className={`groqchat-settings-toggle${showSettings ? " active" : ""}`}
        >
          <Settings size={16} />
        </button>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="groqchat-settings">
          <label className="groqchat-settings-label">GROQ_API_KEY</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="gsk_..."
            className="groqchat-settings-input"
          />
          <p className="groqchat-settings-hint">
            Get a free key at console.groq.com/keys. Stored only in this session, never sent anywhere but api.groq.com.
          </p>
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="groqchat-messages">
        {messages.length === 0 && (
          <div className="groqchat-empty">$ send a message to start the session</div>
        )}

        {messages.map((m, i) => (
          <div key={i} className="groqchat-message">
            <span className={`groqchat-message-role ${m.role === "user" ? "user" : "assistant"}`}>
              {m.role === "user" ? "you" : "groq"}
            </span>
            {m.role === "assistant" && m.content === "" && loading && i === messages.length - 1 ? (
              <span className="groqchat-typing">
                <span className="groqchat-typing-dot" />
                <span className="groqchat-typing-dot" />
                <span className="groqchat-typing-dot" />
              </span>
            ) : (
              <span className="groqchat-message-content">{m.content}</span>
            )}
          </div>
        ))}

        {error && (
          <div className="groqchat-error">
            <AlertCircle size={14} className="groqchat-error-icon" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="groqchat-inputrow">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          className="groqchat-textarea"
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          className="groqchat-send"
          aria-label="Send"
        >
          <Send size={16} color="#0B0D0C" />
        </button>
      </div>
    </div>
  );
}