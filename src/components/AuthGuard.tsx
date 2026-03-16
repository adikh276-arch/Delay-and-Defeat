import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { pool } from "@/lib/db";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [isAuthResolved, setIsAuthResolved] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    async function handleAuth() {
      try {
        const params = new URLSearchParams(location.search);
        const token = params.get("token");

        if (token) {
          const res = await fetch("https://api.mantracare.com/user/user-info", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
          });

          if (!res.ok) throw new Error("Verification failed");

          const data = await res.json();
          if (data && data.user_id) {
            sessionStorage.setItem("user_id", data.user_id);
            // Remove token from URL without replacing the whole path unexpectedly
            window.history.replaceState({}, "", window.location.pathname);
            
            try {
              const checkUser = await pool.query('SELECT * FROM users WHERE id = $1', [data.user_id]);
              if (checkUser.rowCount === 0) {
                 await pool.query('INSERT INTO users (id) VALUES ($1)', [data.user_id]);
              }
            } catch (dbErr) {
               console.error("Neon DB Initialization failed: ", dbErr);
            }
          } else {
            throw new Error("Missing user_id");
          }
        }

        if (!sessionStorage.getItem("user_id")) {
          // If no user_id available and no token provided, redirect
          window.location.href = "/token";
          return;
        }

        setIsAuthResolved(true);
      } catch (err) {
        window.location.href = "/token";
      }
    }
    
    handleAuth();
  }, [location.search, navigate]);

  if (!isAuthResolved) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse text-sm">Authenticating...</p>
      </div>
    );
  }

  return <>{children}</>;
}
