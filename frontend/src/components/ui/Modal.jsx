"use client";

import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "540px",
}) {
  const overlayRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow || "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  const modalContent = (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(23, 38, 40, 0.7)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        animation: "rfModalFadeIn 0.2s ease-out",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth,
          maxHeight: "calc(100vh - 4rem)",
          backgroundColor: "var(--color-primary)",
          borderRadius: "14px",
          border: "1px solid rgba(248, 250, 135, 0.18)",
          boxShadow: "0 20px 50px rgba(25, 52, 56, 0.2)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          animation: "rfModalSlideUp 0.25s ease-out",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "1rem 1.25rem",
            borderBottom: "1px solid rgba(255, 255, 255, 0.09)",
            flexShrink: 0,
            background: "rgba(255, 255, 255, 0.015)",
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: "1rem",
              fontWeight: 500,
              color: "var(--color-accent)",
              letterSpacing: "-0.01em",
            }}
          >
            {title}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              color: "#e6e7e2",
              cursor: "pointer",
              padding: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "8px",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(248, 250, 135, 0.12)";
              e.currentTarget.style.borderColor = "rgba(248, 250, 135, 0.25)";
              e.currentTarget.style.color = "var(--color-accent)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.06)";
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
              e.currentTarget.style.color = "#e6e7e2";
            }}
            title="Close (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        <div
          style={{
            padding: "1.5rem",
            overflowY: "auto",
            flex: 1,
            overscrollBehavior: "contain",
            background:
              "linear-gradient(180deg, rgba(25,52,56,0.94) 0%, rgba(25,52,56,0.98) 100%)",
          }}
        >
          {children}
        </div>
      </div>

      <style>{`
        @keyframes rfModalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes rfModalSlideUp {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );

  if (typeof document !== "undefined") {
    return createPortal(modalContent, document.body);
  }
  return null;
}
