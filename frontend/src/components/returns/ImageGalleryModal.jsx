"use client";

import React, { useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Camera, Download } from "lucide-react";
import { Modal } from "../ui/Modal.jsx";

export function ImageGalleryModal({
  isOpen,
  onClose,
  images = [],
  currentIndex = 0,
  onIndexChange = () => {},
}) {
  const total = images.length;

  const handlePrev = useCallback(
    (e) => {
      e?.stopPropagation();
      if (total <= 1) return;
      const nextIdx = (currentIndex - 1 + total) % total;
      onIndexChange(nextIdx);
    },
    [currentIndex, total, onIndexChange],
  );

  const handleNext = useCallback(
    (e) => {
      e?.stopPropagation();
      if (total <= 1) return;
      const nextIdx = (currentIndex + 1) % total;
      onIndexChange(nextIdx);
    },
    [currentIndex, total, onIndexChange],
  );

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "ArrowRight") {
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, handlePrev, handleNext]);

  if (!isOpen || total === 0) return null;

  const currentItem = images[currentIndex];
  const currentUrl =
    typeof currentItem === "string" ? currentItem : currentItem?.url;
  const currentKey =
    typeof currentItem === "string"
      ? currentItem
      : currentItem?.key || currentItem?.name;
  const displayName =
    currentKey?.split("/")?.pop() || `Photo #${currentIndex + 1}`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Image Evidence"
      maxWidth="920px"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            padding: "2px 0 6px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              minWidth: 0,
            }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                backgroundColor: "rgba(248, 250, 135, 0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-accent)",
                flexShrink: 0,
              }}
            >
              <Camera size={16} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "#f1f5f5",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {displayName}
              </div>
              <div style={{ fontSize: "11px", color: "#c5d0ce" }}>
                Evidence photo {currentIndex + 1} of {total}
              </div>
            </div>
          </div>

          {currentUrl && (
            <a
              href={currentUrl}
              target="_blank"
              rel="noreferrer"
              download
              title="Download original image"
              style={{
                color: "#edf1f4",
                padding: "8px",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textDecoration: "none",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <Download size={16} />
            </a>
          )}
        </div>

        <div
          style={{
            position: "relative",
            minHeight: "340px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#0d1f23",
            borderRadius: "12px",
            border: "1px solid rgba(248, 250, 135, 0.12)",
            overflow: "hidden",
            padding: "14px",
          }}
        >
          {currentUrl ? (
            <img
              src={currentUrl}
              alt={displayName}
              style={{
                maxWidth: "100%",
                maxHeight: "58vh",
                objectFit: "contain",
                borderRadius: "8px",
                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.35)",
              }}
            />
          ) : (
            <div style={{ textAlign: "center", color: "#c5d0ce" }}>
              <Camera size={44} style={{ opacity: 0.3, marginBottom: "8px" }} />
              <div style={{ fontSize: "13px" }}>
                Image preview not available
              </div>
              <div
                style={{ fontSize: "11px", marginTop: "4px", color: "#9aa9a7" }}
              >
                {currentKey}
              </div>
            </div>
          )}

          {total > 1 && (
            <button
              type="button"
              onClick={handlePrev}
              style={{
                position: "absolute",
                left: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                backgroundColor: "rgba(25,52,56,0.8)",
                border: "1px solid rgba(248,250,135,0.2)",
                color: "#edf1f4",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
              }}
              title="Previous photo (Left Arrow)"
            >
              <ChevronLeft size={20} />
            </button>
          )}

          {total > 1 && (
            <button
              type="button"
              onClick={handleNext}
              style={{
                position: "absolute",
                right: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                backgroundColor: "rgba(25,52,56,0.8)",
                border: "1px solid rgba(248,250,135,0.2)",
                color: "#edf1f4",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
              }}
              title="Next photo (Right Arrow)"
            >
              <ChevronRight size={20} />
            </button>
          )}

          <div
            style={{
              position: "absolute",
              bottom: "12px",
              left: "50%",
              transform: "translateX(-50%)",
              padding: "3px 12px",
              borderRadius: "20px",
              backgroundColor: "rgba(25,52,56,0.9)",
              border: "1px solid rgba(248,250,135,0.15)",
              fontSize: "11px",
              fontWeight: 500,
              color: "#edf1f4",
            }}
          >
            {currentIndex + 1} / {total}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: "8px",
            overflowX: "auto",
            padding: "2px 0 0",
            scrollbarWidth: "thin",
          }}
        >
          {images.map((item, idx) => {
            const url = typeof item === "string" ? item : item?.url;
            const isSelected = idx === currentIndex;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => onIndexChange(idx)}
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "8px",
                  overflow: "hidden",
                  border: isSelected
                    ? "2px solid var(--color-accent)"
                    : "1px solid rgba(255,255,255,0.10)",
                  padding: 0,
                  cursor: "pointer",
                  opacity: isSelected ? 1 : 0.6,
                  backgroundColor: "#1c2d31",
                  flexShrink: 0,
                }}
                title={`Open photo ${idx + 1}`}
              >
                {url ? (
                  <img
                    src={url}
                    alt={`Thumb ${idx + 1}`}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#c5d0ce",
                      fontSize: "10px",
                    }}
                  >
                    #{idx + 1}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}
