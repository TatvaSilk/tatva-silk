"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useCartCount } from "@/hooks/useCartCount";
import CartDrawer from "@/components/CartDrawer";

type DeliveryPref = { pin: string; label: string };

export default function HeaderNav() {
  const router = useRouter();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Search
  const [q, setQ] = useState("");

  // Deliver-to
  const [openZip, setOpenZip] = useState(false);
  const [pin, setPin] = useState("");
  const [delivery, setDelivery] = useState<DeliveryPref | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Auth
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  // Dropdown
  const [menuOpen, setMenuOpen] = useState(false);

  // Cart count (live from Supabase)
  const liveCount = useCartCount();

  useEffect(() => {
    try {
      const raw = localStorage.getItem("ts.delivery");
      if (raw) {
        const parsed = JSON.parse(raw) as DeliveryPref;
        setDelivery(parsed);
      } else {
        setDelivery({ pin: "396321", label: "Billimora, Navsari, Gujarat" });
      }
    } catch {}

    supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      if (!u) return;
      setUserEmail(u.email ?? null);
      const name =
        (u.user_metadata?.name as string | undefined) ||
        (u.user_metadata?.full_name as string | undefined) ||
        null;
      setUserName(name);
    });
  }, [supabase]);

  const greeting = userName
    ? `Hello, ${userName.split(" ")[0]}`
    : userEmail
    ? `Hello, ${userEmail.split("@")[0]}`
    : "Hello, sign in";

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    const t = q.trim();
    if (!t) return;
    router.push(`/products?search=${encodeURIComponent(t)}`);
  }

  function openZipDialog() {
    setPin(delivery?.pin ?? "");
    setErr(null);
    setOpenZip(true);
  }

  async function saveZip(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const normalized = pin.trim();
    if (!/^\d{6}$/.test(normalized)) {
      setErr("Please enter a valid 6-digit PIN.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/pincode?pin=${normalized}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`Lookup failed (${res.status})`);
      const json = await res.json();
      const label = json?.label || `PIN ${normalized}`;
      const pref = { pin: normalized, label };
      setDelivery(pref);
      localStorage.setItem("ts.delivery", JSON.stringify(pref));
      setOpenZip(false);
    } catch (e: any) {
      setErr(e?.message ?? "Could not resolve PIN. Try again.");
    } finally {
      setSaving(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <>
      {/* HEADER BAR */}
      <header
        style={{
          background: "#1f2937",
          color: "#fff",
          position: "relative",
          zIndex: 999,
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "10px 16px",
            display: "grid",
            gridTemplateColumns: "220px 1fr auto auto auto",
            gap: 16,
            alignItems: "center",
          }}
        >
          {/* Logo + Deliver to */}
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <Link href="/" style={{ display: "flex", gap: 10, alignItems: "center", color: "inherit", textDecoration: "none" }}>
              <span
                style={{
                  display: "inline-grid",
                  placeItems: "center",
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  background: "#111827",
                  border: "1px solid #334155",
                  fontWeight: 800,
                }}
              >
                TS
              </span>
              <div>
                <div style={{ fontWeight: 800, lineHeight: 1 }}>Tatva Silk</div>
                <button
                  onClick={openZipDialog}
                  style={{
                    all: "unset",
                    cursor: "pointer",
                    fontSize: 11,
                    opacity: 0.9,
                  }}
                >
                  Deliver to <strong>{delivery?.label}</strong>
                </button>
              </div>
            </Link>
          </div>

          {/* Secondary Deliver-to */}
          <div className="hide-md" style={{ fontSize: 12 }}>
            Deliver to <strong>{delivery?.label}</strong>
          </div>

          {/* SEARCH */}
          <form onSubmit={onSearch} style={{ display: "flex", gap: 8 }}>
            <select
              defaultValue="all"
              style={{
                padding: "8px 10px",
                borderRadius: 6,
                border: "1px solid #334155",
                background: "#111827",
                color: "#e5e7eb",
              }}
            >
              <option value="all">All</option>
              <option value="saree">Saree</option>
              <option value="banarasi">Banarasi</option>
            </select>

            <input
              placeholder="Search Tatva Silk"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              style={{
                flex: 1,
                padding: "10px 12px",
                borderRadius: 6,
                border: "1px solid #334155",
                background: "#111827",
                color: "#e5e7eb",
              }}
            />

            <button
              type="submit"
              style={{
                padding: "10px 14px",
                borderRadius: 6,
                background: "#f59e0b",
                border: "1px solid #f59e0b",
                color: "#111",
              }}
            >
              Search
            </button>
          </form>

          {/* LANGUAGE */}
          <div style={{ fontSize: 12 }}>Language <strong>EN</strong></div>

          {/* ACCOUNT & LISTS (menu) */}
          <div
            style={{ position: "relative", cursor: "pointer" }}
            onMouseEnter={() => setMenuOpen(true)}
            onMouseLeave={() => setMenuOpen(false)}
          >
            <div style={{ fontSize: 12, color: "#a1a1aa" }}>{greeting}</div>
            <div style={{ fontWeight: 700 }}>Account &amp; Lists ▾</div>

            {menuOpen && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: "100%",
                  marginTop: 8,
                  background: "#fff",
                  color: "#111",
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  minWidth: 340,
                  zIndex: 2000,
                  boxShadow: "0 12px 24px rgba(0,0,0,0.15)",
                  padding: 16,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {!userEmail && (
                  <div style={{ textAlign: "center", marginBottom: 12 }}>
                    <Link href="/account">Sign in</Link>
                  </div>
                )}

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 12,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>
                      Your Account
                    </div>
                    <ul style={{ lineHeight: 1.8 }}>
                      <li><Link href="/orders">Your Orders</Link></li>
                      <li><Link href="/account">Profile</Link></li>
                      <li><Link href="/account/addresses">Manage Addresses</Link></li>
                      <li><Link href="/account/payments">Payment Methods</Link></li>
                    </ul>
                  </div>

                  <div>
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>
                      Quick Actions
                    </div>
                    <ul style={{ lineHeight: 1.8 }}>
                      <li><Link href="/products?category=banarasi">Banarasi</Link></li>
                      <li><Link href="/products?category=patola">Patola</Link></li>
                      <li><Link href="/products?category=soft-silk">Soft Silk</Link></li>
                      <li><Link href="/today-deals">Today’s deals</Link></li>
                    </ul>
                  </div>
                </div>

                {userEmail && (
                  <div style={{ textAlign: "right", marginTop: 12 }}>
                    <button
                      onClick={signOut}
                      style={{
                        background: "#f3f4f6",
                        border: "1px solid #e5e7eb",
                        padding: "8px 12px",
                        borderRadius: 6,
                        cursor: "pointer",
                      }}
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RETURNS & ORDERS */}
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 12, color: "#a1a1aa" }}>Returns</div>
            <div style={{ fontWeight: 700 }}>
              <Link href="/orders">&amp; Orders</Link>
            </div>
          </div>

          {/* CART button → opens Drawer */}
          <div style={{ textAlign: "right", position: "relative" }}>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('cart:open'))}
              style={{ all: 'unset', cursor: 'pointer' }}
              aria-label="Open cart"
            >
              🛒 Cart
              <span
                style={{
                  position: "absolute",
                  right: -12,
                  top: -6,
                  background: "#ef4444",
                  color: "white",
                  borderRadius: 999,
                  fontSize: 12,
                  lineHeight: "18px",
                  minWidth: 18,
                  height: 18,
                  textAlign: "center",
                  padding: "0 4px",
                }}
              >
                {liveCount}
              </span>
            </button>
          </div>
        </div>

        {/* Secondary nav */}
        <nav style={{ background: "#111827" }}>
          <div
            style={{
              maxWidth: 1280,
              margin: "0 auto",
              padding: "6px 16px",
              display: "flex",
              gap: 14,
              fontSize: 14,
            }}
          >
            <Link href="/products?category=banarasi">Banarasi</Link>
            <Link href="/products?category=kanjivaram">Kanjivaram</Link>
            <Link href="/products?category=patola">Patola</Link>
            <Link href="/products?category=soft-silk">Soft Silk</Link>
            <Link href="/wedding">Wedding</Link>
            <Link href="/gifts">Gifts</Link>
            <Link href="/today-deals">Today’s Deals</Link>
          </div>
        </nav>
      </header>

      {/* Cart Drawer lives here (once per page) */}
      <CartDrawer />

      {/* ZIP MODAL */}
      {openZip && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.35)",
            display: "grid",
            placeItems: "center",
            zIndex: 5000,
          }}
          onClick={() => !saving && setOpenZip(false)}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={saveZip}
            style={{
              width: "min(92vw, 420px)",
              background: "#fff",
              borderRadius: 12,
              border: "1px solid #ccc",
              padding: 16,
            }}
          >
            <h3 style={{ margin: "2px 0 10px" }}>Deliver to</h3>
            <p style={{ margin: "0 0 10px", color: "#666", fontSize: 14 }}>
              Enter your 6‑digit PIN/ZIP to see delivery location.
            </p>

            <input
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              placeholder="e.g., 396321"
              value={pin}
              onChange={(e) =>
                setPin(e.target.value.replace(/[^\d]/g, "").slice(0, 6))
              }
              autoFocus
              disabled={saving}
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 8,
                border: "1px solid #ccc",
              }}
            />

            {err && (
              <div style={{ color: "crimson", marginTop: 8, fontSize: 13 }}>
                {err}
              </div>
            )}

            <div
              style={{
                display: "flex",
                gap: 8,
                marginTop: 12,
                justifyContent: "flex-end",
              }}
            >
              <button
                type="button"
                onClick={() => setOpenZip(false)}
                disabled={saving}
                style={{
                  padding: "8px 12px",
                  background: "#f3f4f6",
                  border: "1px solid #ccc",
                  borderRadius: 8,
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: "8px 12px",
                  background: "#f59e0b",
                  color: "#fff",
                  border: "1px solid #f59e0b",
                  borderRadius: 8,
                }}
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
