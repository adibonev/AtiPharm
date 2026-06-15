import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE } from "@/lib/auth";

async function login(formData: FormData) {
  "use server";
  const pw = String(formData.get("password") || "");
  if (pw && pw === process.env.APP_PASSWORD) {
    (await cookies()).set(AUTH_COOKIE, "1", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
    redirect("/composer");
  }
  redirect("/login?error=1");
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="login">
      <form action={login} className="login-card">
        <img src="/logo.png" alt="Аптека Атифарм" />
        <h1>Вход</h1>
        {error && <p className="err">Грешна парола</p>}
        <input
          type="password"
          name="password"
          placeholder="Парола"
          autoFocus
          autoComplete="current-password"
        />
        <button type="submit">Влез</button>
      </form>
    </main>
  );
}
