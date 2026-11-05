import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import API from "../api/axios";
import "../styles/Chatbot.css";

/* ------------------------------------------------------------------ */
/* Configuration                                                       */
/* ------------------------------------------------------------------ */
const STORAGE_KEY = "eshop_chat_history_v1";
const MAX_INPUT_LENGTH = 500;
const CONTEXT_WINDOW = 6; // messages sent to the API for context
const REQUEST_TIMEOUT_MS = 30000;

const GREETING = {
  id: "greeting",
  role: "assistant",
  content: "Hello! Welcome to E-Shop Ethiopia. How can I help you today? (እኔ እንዴት ልርዳዎት እችላለሁ?)",
};

const QUICK_REPLIES = [
  "Track my order",
  "Payment methods",
  "Delivery times",
  "Return policy",
];

const ERROR_TEXT = "I couldn't reach the server. Check your connection and try again.";
const LANGUAGE_REQUEST = /\b(?:answer|reply|respond|speak|write)\b.{0,30}\b(english|amharic|oromo|tigrinya)\b|\b(?:in|use)\s+(english|amharic|oromo|tigrinya)\b/i;

const getRequestedLanguage = (history, latestText) => {
  const messagesToCheck = [...history, { role: "user", content: latestText }]
    .filter((message) => message.role === "user")
    .reverse();
  const request = messagesToCheck.find((message) => LANGUAGE_REQUEST.test(message.content));
  if (request) {
    const language = request.content.match(/\b(english|amharic|oromo|tigrinya)\b/i)?.[1]?.toLowerCase();
    return { english: "en", amharic: "am", oromo: "om", tigrinya: "ti" }[language] || null;
  }
  if (/afaan oromoo|afaan oromiffa/i.test(latestText)) return "om";
  if (/ትግርኛ|ብትግርኛ/.test(latestText)) return "ti";
  if (/[ሀ-ፚ]/.test(latestText)) return "am";
  return null;
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
const createId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const loadHistory = () => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) && parsed.length ? parsed : [GREETING];
  } catch {
    return [GREETING];
  }
};

/* ------------------------------------------------------------------ */
/* Sub-components                                                      */
/* ------------------------------------------------------------------ */
const Message = React.memo(function Message({ message, onRetry, addToCart, user }) {
  const isUser = message.role === "user";
  return (
    <div
      className={`chatbot__msg chatbot__msg--${isUser ? "user" : "bot"}${
        message.isError ? " chatbot__msg--error" : ""
      }`}
    >
      <span className="chatbot__text">{message.content}</span>
      {message.recommendations?.length > 0 && (
        <div className="chatbot__recommendations">
          {message.recommendations.map((product) => (
            <article key={product._id} className="chatbot__product">
              <img src={product.image || "https://placehold.co/72x72?text=Product"} alt="" />
              <div className="chatbot__product-info">
                <strong>{product.name}</strong>
                <span>{Number(product.price * (1 - (Number(product.discount) || 0) / 100)).toLocaleString()} ETB</span>
                <Link to={`/product/${product._id}`}>View product</Link>
              </div>
              {user && addToCart && product.stock > 0 && (
                <button type="button" className="chatbot__add" onClick={() => addToCart(product)}>
                  Add
                </button>
              )}
            </article>
          ))}
        </div>
      )}
      {message.isError && onRetry && (
        <button type="button" className="chatbot__retry" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
});

function TypingIndicator() {
  return (
    <div className="chatbot__msg chatbot__msg--bot" aria-label="Assistant is typing">
      <span className="chatbot__dots" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */
function AIChatbotWidget({ addToCart, user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(loadHistory);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const endRef = useRef(null);
  const inputRef = useRef(null);
  const toggleRef = useRef(null);
  const abortRef = useRef(null);
  const lastUserTextRef = useRef("");

  /* Persist conversation for the browser session */
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-50)));
    } catch {
      /* storage unavailable: ignore */
    }
  }, [messages]);

  /* Auto-scroll */
  useEffect(() => {
    if (isOpen) endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isLoading, isOpen]);

  /* Focus management */
  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  /* Cancel any in-flight request on unmount */
  useEffect(() => () => abortRef.current?.abort(), []);

  const closeChat = useCallback(() => {
    setIsOpen(false);
    toggleRef.current?.focus();
  }, []);

  /* Close on Escape */
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => e.key === "Escape" && closeChat();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, closeChat]);

  /* Core send logic */
  const sendMessage = useCallback(
    async (rawText) => {
      const text = rawText.trim();
      if (!text || isLoading) return;

      lastUserTextRef.current = text;
      const userMessage = { id: createId(), role: "user", content: text };

      // Build context from current state; skip error bubbles and the greeting
      const context = [...messages, userMessage]
        .filter((m) => !m.isError && m.id !== GREETING.id)
        .slice(-CONTEXT_WINDOW)
        .map(({ role, content }) => ({ role, content }));

      setMessages((prev) => [
        ...prev.filter((m) => !m.isError),
        userMessage,
      ]);
      setInput("");
      setIsLoading(true);

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const { data } = await API.post(
          "/ai/chat",
          {
            messages: context,
            language: getRequestedLanguage(messages, text),
          },
          { signal: controller.signal, timeout: REQUEST_TIMEOUT_MS }
        );

        setMessages((prev) => [
          ...prev,
          {
            id: createId(),
            role: "assistant",
            content: data?.reply || "Sorry, I didn't get a response. Please try again.",
            recommendations: Array.isArray(data?.recommendations) ? data.recommendations : [],
          },
        ]);
      } catch (error) {
        if (error?.code === "ERR_CANCELED" || error?.name === "CanceledError") return;
        const rateLimited = error?.response?.status === 429;
        const unavailable = error?.response?.status === 503;
        if (unavailable) {
          console.warn("Chatbot service is temporarily unavailable:", error?.response?.data);
        } else {
          console.error("❌ Chatbot error:", error?.response?.data || error);
        }
        setMessages((prev) => [
          ...prev,
          {
            id: createId(),
            role: "assistant",
            isError: !unavailable,
            content: unavailable
              ? error.response?.data?.reply || "Live chat is temporarily unavailable. You can still browse products or try again shortly."
              : rateLimited
                ? "You're sending messages too quickly. Please wait a moment."
                : ERROR_TEXT,
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, isLoading]
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleRetry = () => {
    setMessages((prev) => {
      const next = prev.filter((m) => !m.isError);
      const last = next[next.length - 1];
      return last?.role === "user" ? next.slice(0, -1) : next;
    });
    setTimeout(() => sendMessage(lastUserTextRef.current), 0);
  };

  const clearChat = () => {
    abortRef.current?.abort();
    setIsLoading(false);
    setMessages([GREETING]);
    inputRef.current?.focus();
  };

  const showQuickReplies = useMemo(
    () => messages.length === 1 && messages[0].id === GREETING.id,
    [messages]
  );

  const lastIndex = messages.length - 1;
  const canSend = input.trim().length > 0 && !isLoading;

  return (
    <>
      <button
        ref={toggleRef}
        type="button"
        className={`chatbot__toggle${isOpen ? " is-open" : ""}`}
        onClick={() => (isOpen ? closeChat() : setIsOpen(true))}
        aria-label={isOpen ? "Close chat" : "Open chat"}
        aria-expanded={isOpen}
        aria-controls="chatbot-panel"
      >
        <span aria-hidden="true">{isOpen ? "✕" : "💬"}</span>
      </button>

      {isOpen && (
        <section
          id="chatbot-panel"
          className="chatbot"
          role="dialog"
          aria-label="E-Shop customer support chat"
        >
          <header className="chatbot__header">
            <span className="chatbot__avatar" aria-hidden="true">🤖</span>
            <div className="chatbot__title">
              <strong>E-Shop Support</strong>
              <small>
                <span className="chatbot__status" aria-hidden="true" />
                Online · replies instantly
              </small>
            </div>
            <button
              type="button"
              className="chatbot__clear"
              onClick={clearChat}
              aria-label="Start a new conversation"
              title="New conversation"
            >
              ↺
            </button>
          </header>

          <div
            className="chatbot__messages"
            role="log"
            aria-live="polite"
            aria-relevant="additions"
          >
            {messages.map((msg, i) => (
              <Message
                key={msg.id || i}
                message={msg}
                onRetry={msg.isError && i === lastIndex ? handleRetry : undefined}
                addToCart={addToCart}
                user={user}
              />
            ))}

            {showQuickReplies && (
              <div className="chatbot__chips">
                {QUICK_REPLIES.map((q) => (
                  <button
                    key={q}
                    type="button"
                    className="chatbot__chip"
                    onClick={() => sendMessage(q)}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {isLoading && <TypingIndicator />}
            <div ref={endRef} />
          </div>

          <form className="chatbot__form" onSubmit={handleSubmit}>
            <label htmlFor="chatbot-input" className="chatbot__sr">
              Type your message
            </label>
            <input
              id="chatbot-input"
              ref={inputRef}
              type="text"
              className="chatbot__input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              maxLength={MAX_INPUT_LENGTH}
              autoComplete="off"
              disabled={isLoading}
            />
            <button
              type="submit"
              className="chatbot__send"
              disabled={!canSend}
              aria-label="Send message"
            >
              ➤
            </button>
          </form>
        </section>
      )}
    </>
  );
}

export default AIChatbotWidget;