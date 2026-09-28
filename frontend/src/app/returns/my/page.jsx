"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { ArrowUpRight, PackageCheck, Search } from "lucide-react";
import { fetchReturns } from "../../../features/returns/returnsSlice.js";
import { ReturnStatusBadge } from "../../../components/returns/ReturnStatusBadge.jsx";
import { Card } from "../../../components/ui/Card.jsx";
import { Button } from "../../../components/ui/Button.jsx";

export default function MyReturnsPage() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { items, loading } = useSelector((state) => state.returns);

  useEffect(() => {
    if (!user?.email) return;
    dispatch(fetchReturns({ page: 1, limit: 50 }));
  }, [dispatch, user?.email]);

  const customerReturns = items.filter(
    (ret) => ret.customerEmail === user?.email,
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "var(--color-bg-subtle)",
      }}
    >
      <header
        style={{
          height: "64px",
          borderBottom: "1px solid var(--color-border-subtle)",
          backgroundColor: "var(--color-bg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 32px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              backgroundColor: "var(--color-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-text-on-dark)",
            }}
          >
            <PackageCheck size={18} strokeWidth={1.75} />
          </div>
          <span
            style={{
              fontSize: "18px",
              fontWeight: 500,
              letterSpacing: "-0.01em",
              color: "var(--color-text-primary)",
            }}
          >
            My <span style={{ color: "var(--color-primary)" }}>Returns</span>
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Link href="/returns/new">
            <Button variant="secondary" size="sm">
              Submit Return
            </Button>
          </Link>
        </div>
      </header>

      <main
        style={{
          flex: 1,
          padding: "48px 24px",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div style={{ width: "100%", maxWidth: "960px" }}>
          <div style={{ marginBottom: "24px" }}>
            <h1
              style={{
                fontSize: "32px",
                color: "var(--color-text-primary)",
                marginBottom: "8px",
                letterSpacing: "-0.03em",
              }}
            >
              My Returns
            </h1>
            <p
              style={{ color: "var(--color-text-secondary)", fontSize: "14px" }}
            >
              Track every return request and monitor review progress without
              merchant controls.
            </p>
          </div>

          {loading && customerReturns.length === 0 ? (
            <Card>
              <div
                style={{
                  padding: "2rem",
                  textAlign: "center",
                  color: "var(--color-text-muted)",
                }}
              >
                Loading your return history...
              </div>
            </Card>
          ) : customerReturns.length === 0 ? (
            <Card>
              <div style={{ padding: "2.5rem 2rem", textAlign: "center" }}>
                <Search
                  size={28}
                  color="var(--color-text-muted)"
                  style={{ marginBottom: "0.75rem" }}
                />
                <h3
                  style={{
                    margin: "0 0 0.5rem",
                    color: "var(--color-text-primary)",
                  }}
                >
                  No return requests yet
                </h3>
                <p
                  style={{
                    color: "var(--color-text-secondary)",
                    marginBottom: "1rem",
                  }}
                >
                  Your submitted requests will appear here as soon as they are
                  reviewed.
                </p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Link href="/returns/new">
                    <Button variant="primary">Start a Return</Button>
                  </Link>
                  <Link href="/track">
                    <Button variant="secondary" icon={Search}>Look Up by Order #</Button>
                  </Link>
                </div>
              </div>
            </Card>
          ) : (
            <div style={{ display: "grid", gap: "16px" }}>
              {customerReturns.map((ret) => (
                <Link
                  key={ret._id}
                  href={ret.trackingToken ? `/track/${ret.trackingToken}` : `/returns/${ret._id}`}
                  style={{ textDecoration: "none" }}
                >
                  <Card padding="1.25rem">
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "12px",
                        flexWrap: "wrap",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "var(--color-text-muted)",
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            marginBottom: "4px",
                          }}
                        >
                          {ret.returnNumber}
                        </div>
                        <div
                          style={{
                            fontSize: "18px",
                            fontWeight: 600,
                            color: "var(--color-text-primary)",
                          }}
                        >
                          {ret.orderNumber}
                        </div>
                      </div>

                      <ReturnStatusBadge status={ret.status} />
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(170px, 1fr))",
                        gap: "12px",
                        marginTop: "16px",
                        fontSize: "13px",
                        color: "var(--color-text-secondary)",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: "11px",
                            color: "var(--color-text-muted)",
                            marginBottom: "4px",
                          }}
                        >
                          Items
                        </div>
                        <div>{ret.items?.length || 0} item(s)</div>
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: "11px",
                            color: "var(--color-text-muted)",
                            marginBottom: "4px",
                          }}
                        >
                          Refund estimate
                        </div>
                        <div>${ret.refundAmount?.toFixed(2) || "0.00"}</div>
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: "11px",
                            color: "var(--color-text-muted)",
                            marginBottom: "4px",
                          }}
                        >
                          Last update
                        </div>
                        <div>
                          {ret.updatedAt
                            ? new Date(ret.updatedAt).toLocaleDateString()
                            : "Pending"}
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        marginTop: "16px",
                      }}
                    >
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "var(--color-primary)",
                        }}
                      >
                        View status <ArrowUpRight size={14} />
                      </span>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
