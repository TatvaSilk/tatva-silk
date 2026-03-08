"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useCartCount } from "@/hooks/useCartCount";
import CartDrawer from "@/components/CartDrawer";

export default function HeaderNav() {
  const router = useRouter();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [q, setQ] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const liveCount = useCartCount();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null);
    });
  }, [supabase]);

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    if (q.trim()) router.push(`/products?search=${encodeURIComponent(q)}`);
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <>
      {/* MAIN HEADER */}
      <header style={{ background: "#131921", color: "#fff" }}>
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            height: 64,
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "0 16px",
            whiteSpace: "nowrap",
          }}
        >
          {/* LOGO */}
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: "#0f172a",
                display: "grid",
                placeItems: "center",
                fontWeight: 800,
              }}
            >
              TS
            </div>
            <strong>Tatva Silk</strong>
          </Link>

          {/* SEARCH */}
          <form
            onSubmit={onSearch}
            style={{ display: "flex", flex: 1, maxWidth: 520 }}
          >
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search Tatva Silk"
              style={{
                flex: 1,
                padding: "8px 10px",
                borderRadius: "6px 0 0 6px",
                border: "none",
              }}
            />
            <button
              type="submit"
              style={{
                padding: "0 16px",
                background: "#febd69",
                border: "none",
                borderRadius: "0 6px 6px 0",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Search
            </button>
          </form>

          {/* ACCOUNT */}
          <div
            onMouseEnter={() => setMenuOpen(true)}
            onMouseLeave={() => setMenuOpen(false)}
            style={{ position: "relative", cursor: "pointer" }}
          >
            <div style={{ fontSize: 12, opacity: 0.9 }}>
              Hello, {userEmail ? userEmail.split("@")[0] : "sign in"}
            </div>
            <div style={{ fontWeight: 700 }}>Account & Lists ▾</div>

            {menuOpen && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: "100%",
                  background: "#fff",
                  color: "#111",
                  borderRadius: 8,
                  minWidth: 220,
                  padding: 12,
                  zIndex: 9999,
                  boxShadow: "0 10px 30px rgba(0,0,0,.25)",
                }}
              >
                {userEmail ? (
                  <button
                    onClick={signOut}
                    style={{
                      width: "100%",
                      padding: 8,
                      border: "1px solid #ddd",
                      borderRadius: 6,
                      cursor: "pointer",
                    }}
                  >
                    Sign out
                  </button>
                ) : (
                  <Link href="/account">Sign in</Link>
                )}
              </div>
            )}
          </div>

          {/* ORDERS */}
          <Link href="/orders" style={{ fontWeight: 700 }}>
            Orders
          </Link>

          {/* CART */}
          <button
            onClick={() =>
              window.dispatchEvent(new CustomEvent("cart:open"))
            }
            style={{
              position: "relative",
              background: "none",
              border: "none",
              color: "#fff",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            🛒 Cart
            <span
              style={{
                position: "absolute",
                top: -6,
                right: -10,
                background: "#f08804",
                color: "#111",
                borderRadius: 999,
                fontSize: 12,
                padding: "0 6px",
              }}
            >
              {liveCount}
            </span>
          </button>
        </div>

        {/* CATEGORY BAR */}
        <nav style={{ background: "#232f3e" }}>
          <div
            style={{
              maxWidth: 1280,
              margin: "0 auto",
              height: 40,
              display: "flex",
              alignItems: "center",
              gap: 18,
              padding: "0 16px",
            }}
          >
            {[
              "Banarasi",
              "Kanjivaram",
              "Patola",
              "Soft Silk",
              "Wedding",
              "Gifts",
              "Today’s Deals",
            ].map((c) => (
              <Link
                key={c}
                href={`/products?category=${c.toLowerCase().replace(" ", "-")}`}
                style={{
                  color: "#fff",
                  fontSize: 14,
                  textDecoration: "none",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "#febd69")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "#fff")
                }
              >
                {c}
              </Link>
            ))}
          </div>
        </nav>
      </header>

      <CartDrawer />
    </>
  );
}
