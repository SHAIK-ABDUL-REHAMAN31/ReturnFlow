"use client";

import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { CheckCircle } from "lucide-react";
import { approveReturn } from "../../features/returns/returnsSlice.js";
import { Button } from "../ui/Button.jsx";

export function ApproveButton({ returnId, onApproved }) {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleApprove = async () => {
    setLoading(true);
    setError(null);

    try {
      const resultAction = await dispatch(
        approveReturn({ returnId, note: "Approved via Merchant Console" }),
      );

      if (approveReturn.fulfilled.match(resultAction)) {
        const approvedReturn = resultAction.payload || {};
        const immediateReturn = {
          ...approvedReturn,
          status: "LABEL_GENERATED",
          labelKey: approvedReturn.labelKey || "pending-label",
        };

        if (onApproved) onApproved(immediateReturn);
      } else {
        setError(resultAction.payload?.message || "Approval failed");
      }
    } catch (err) {
      setError(err.message || "Unexpected approval error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "inline-flex",
        flexDirection: "column",
        gap: "0.35rem",
      }}
    >
      <Button
        variant="primary"
        icon={CheckCircle}
        loading={loading}
        disabled={loading}
        onClick={handleApprove}
      >
        Approve Return
      </Button>
      {error && (
        <span style={{ fontSize: "0.75rem", color: "var(--color-error)" }}>
          {error}
        </span>
      )}
    </div>
  );
}
