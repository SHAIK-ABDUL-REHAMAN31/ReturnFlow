'use client';

import React, { useEffect, useCallback } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Camera,
  Download,
} from 'lucide-react';
import { Button } from '../ui/Button.jsx';

/**
 * ImageGalleryModal
 * Allows merchant/user to inspect uploaded evidence photos in an enlarged modal.
 * Supports:
 * - Left/Right navigation (buttons & keyboard arrows)
 * - Click backdrop to close
 * - Escape key to close
 * - Counter indicator (Image X of Y)
 * - Direct decision actions (Approve / Reject) for merchant
 */
export function ImageGalleryModal({
  isOpen,
  onClose,
  images = [],
  currentIndex = 0,
  onIndexChange,
  isMerchant = false,
  onApprove,
  onReject,
  returnStatus = 'PENDING_REVIEW',
}) {
  const total = images.length;

  const handlePrev = useCallback(
    (e) => {
      e?.stopPropagation();
      if (total <= 1) return;
      const nextIdx = (currentIndex - 1 + total) % total;
      onIndexChange(nextIdx);
    },
    [currentIndex, total, onIndexChange]
  );

  const handleNext = useCallback(
    (e) => {
      e?.stopPropagation();
      if (total <= 1) return;
      const nextIdx = (currentIndex + 1) % total;
      onIndexChange(nextIdx);
    },
    [currentIndex, total, onIndexChange]
  );

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handlePrev, handleNext]);

  if (!isOpen || total === 0) return null;

  const currentItem = images[currentIndex];
  const currentUrl = typeof currentItem === 'string' ? currentItem : currentItem?.url;
  const currentKey = typeof currentItem === 'string' ? currentItem : currentItem?.key || currentItem?.name;
  const displayName = currentKey?.split('/')?.pop() || `Photo #${currentIndex + 1}`;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(10, 15, 29, 0.85)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.2s ease',
      }}
    >
      {/* Modal Dialog Content (Click inside does not trigger backdrop close) */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          maxWidth: '920px',
          width: '100%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0f172a',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.65)',
          overflow: 'hidden',
        }}
      >
        {/* Top Header Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(99, 102, 241, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#818cf8',
              }}
            >
              <Camera size={18} />
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#f8fafc' }}>
                {displayName}
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                Image {currentIndex + 1} of {total} • Customer Return Evidence
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {currentUrl && (
              <a
                href={currentUrl}
                target="_blank"
                rel="noreferrer"
                download
                title="Download original image"
                style={{
                  color: '#94a3b8',
                  padding: '6px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textDecoration: 'none',
                }}
              >
                <Download size={18} />
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                color: '#cbd5e1',
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
              }}
              title="Close modal (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Center Image Viewing Area with Navigation Arrows */}
        <div
          style={{
            position: 'relative',
            flex: 1,
            minHeight: '380px',
            maxHeight: '62vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#020617',
            padding: '16px',
            overflow: 'hidden',
          }}
        >
          {/* Main Image */}
          {currentUrl ? (
            <img
              src={currentUrl}
              alt={displayName}
              style={{
                maxWidth: '100%',
                maxHeight: '58vh',
                objectFit: 'contain',
                borderRadius: '8px',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
              }}
            />
          ) : (
            <div style={{ textAlign: 'center', color: '#94a3b8' }}>
              <Camera size={48} style={{ opacity: 0.4, marginBottom: '8px' }} />
              <div>Image preview not available for this key.</div>
              <div style={{ fontSize: '11px', marginTop: '4px' }}>{currentKey}</div>
            </div>
          )}

          {/* Left Arrow Button */}
          {total > 1 && (
            <button
              type="button"
              onClick={handlePrev}
              style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                backgroundColor: 'rgba(15, 23, 42, 0.75)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                transition: 'all 0.15s ease',
              }}
              title="Previous photo (Left Arrow)"
            >
              <ChevronLeft size={24} />
            </button>
          )}

          {/* Right Arrow Button */}
          {total > 1 && (
            <button
              type="button"
              onClick={handleNext}
              style={{
                position: 'absolute',
                right: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                backgroundColor: 'rgba(15, 23, 42, 0.75)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                transition: 'all 0.15s ease',
              }}
              title="Next photo (Right Arrow)"
            >
              <ChevronRight size={24} />
            </button>
          )}

          {/* Slide Indicator Dots / Counter at Bottom of Image */}
          <div
            style={{
              position: 'absolute',
              bottom: '12px',
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '4px 12px',
              borderRadius: '20px',
              backgroundColor: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              fontSize: '12px',
              fontWeight: 500,
              color: '#f8fafc',
            }}
          >
            {currentIndex + 1} / {total}
          </div>
        </div>

        {/* Bottom Footer: Thumbnails Row & Merchant Decision Actions */}
        <div
          style={{
            padding: '14px 20px',
            backgroundColor: 'rgba(15, 23, 42, 0.98)',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          {/* Thumbnails row */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '2px 0', maxWidth: '420px' }}>
            {images.map((item, idx) => {
              const url = typeof item === 'string' ? item : item?.url;
              const isSelected = idx === currentIndex;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onIndexChange(idx)}
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    border: isSelected
                      ? '2px solid #818cf8'
                      : '1px solid rgba(255, 255, 255, 0.15)',
                    padding: 0,
                    cursor: 'pointer',
                    opacity: isSelected ? 1 : 0.6,
                    backgroundColor: '#1e293b',
                    flexShrink: 0,
                    transition: 'all 0.15s ease',
                  }}
                >
                  {url ? (
                    <img
                      src={url}
                      alt={`Thumb ${idx + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#94a3b8',
                        fontSize: '10px',
                      }}
                    >
                      #{idx + 1}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Merchant Decision Actions (Direct decision after viewing images per §Requirement 2) */}
          {isMerchant && returnStatus === 'PENDING_REVIEW' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                Decision:
              </span>
              <Button
                variant="danger"
                size="sm"
                icon={XCircle}
                onClick={() => {
                  onClose();
                  if (onReject) onReject();
                }}
              >
                Reject Return
              </Button>
              <Button
                variant="success"
                size="sm"
                icon={CheckCircle}
                onClick={() => {
                  onClose();
                  if (onApprove) onApprove();
                }}
              >
                Accept & Approve
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
