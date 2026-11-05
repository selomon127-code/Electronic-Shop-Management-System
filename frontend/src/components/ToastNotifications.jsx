/* eslint-disable react-refresh/only-export-components */
import { useCallback, useEffect, useRef, useState } from "react";
import "./ToastNotifications.css";

const TOAST_EVENT = "app:toast";
const TOAST_TYPES = new Set(["success", "error", "warning", "info"]);
let nextToastId = 0;

export function useToast() {
  return useCallback((type, message, duration = 4000) => {
    if (!TOAST_TYPES.has(type)) {
      throw new Error(`Unsupported toast type: ${type}`);
    }
    if (!String(message).trim()) {
      throw new Error("Toast message cannot be empty.");
    }
    if (!Number.isFinite(duration) || duration <= 0) {
      throw new Error("Toast duration must be a positive number.");
    }

    window.dispatchEvent(
      new CustomEvent(TOAST_EVENT, {
        detail: { id: ++nextToastId, type, message: String(message), duration },
      }),
    );
  }, []);
}

export default function ToastNotifications() {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    window.clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  useEffect(() => {
    const handleToast = (event) => {
      const toast = event.detail;
      setToasts((current) => [...current, toast].slice(-4));
      timers.current.set(
        toast.id,
        window.setTimeout(() => dismiss(toast.id), toast.duration),
      );
    };

    window.addEventListener(TOAST_EVENT, handleToast);
    return () => {
      window.removeEventListener(TOAST_EVENT, handleToast);
      timers.current.forEach((timer) => window.clearTimeout(timer));
      timers.current.clear();
    };
  }, [dismiss]);

  return (
    <div className="toast-viewport" aria-label="Notifications">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`global-toast ${toast.type}`}
          role={toast.type === "error" ? "alert" : "status"}
        >
          <span className="global-toast-icon" aria-hidden="true">
            {toast.type === "success" ? "✓" : toast.type === "error" ? "!" : toast.type === "warning" ? "⚠" : "i"}
          </span>
          <span className="global-toast-message">{toast.message}</span>
          <button
            type="button"
            className="global-toast-dismiss"
            aria-label="Dismiss notification"
            onClick={() => dismiss(toast.id)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
