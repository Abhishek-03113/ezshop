import { Link, getRouteApi } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { afterSignInPath, type SignInMode } from "../auth/sign-in-search.ts";
import { AppBar, BrandLink } from "../components/app-bar.tsx";
import { usePageTitle } from "../hooks/use-page-title.ts";
import { useSignIn } from "../hooks/use-session.ts";

const signInRouteApi = getRouteApi("/login");

const COPY: Record<SignInMode, { title: string; lead: string; submit: string; pending: string }> = {
  signin: {
    title: "Sign in to Picky",
    lead: "Your library and comparisons are waiting.",
    submit: "Sign in",
    pending: "Signing in…",
  },
  signup: {
    title: "Create your Picky account",
    lead: "Save products and compare them, on any device. Reading specs in the extension never needs an account.",
    submit: "Create account",
    pending: "Creating account…",
  },
};

/** Email + password form for signing in or, with ?mode=signup, creating an account. */
export function SignInPage() {
  const search = signInRouteApi.useSearch();
  const mode: SignInMode = search.mode ?? "signin";
  const copy = COPY[mode];
  // The tab reads "Sign in · Picky"; the heading would repeat the site name.
  usePageTitle(copy.submit);
  const signIn = useSignIn(mode, afterSignInPath(search));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const submit = (event: FormEvent) => {
    event.preventDefault();
    signIn.mutate({ email: email.trim(), password });
  };
  return (
    <>
      <AppBar>
        <BrandLink />
      </AppBar>
      <main className="page narrow sign-in">
        <div className="sign-in-intro">
          <h1>{copy.title}</h1>
          <p className="subtle">{copy.lead}</p>
        </div>
        <form className="card sign-in-card" onSubmit={submit}>
          <label className="sign-in-field">
            <span>Email</span>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label className="sign-in-field">
            <span>Password</span>
            <input
              type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              required
              minLength={mode === "signup" ? 8 : undefined}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          {signIn.isError ? (
            <p className="form-error" role="alert">
              {signIn.error.message}
            </p>
          ) : null}
          <button type="submit" className="primary-button" disabled={signIn.isPending}>
            {signIn.isPending ? copy.pending : copy.submit}
          </button>
        </form>
        <ModeSwitch mode={mode} redirect={search.redirect} />
      </main>
    </>
  );
}

/** Link to the other form, keeping where to go afterwards. */
function ModeSwitch({ mode, redirect }: { mode: SignInMode; redirect: string | undefined }) {
  const other: SignInMode = mode === "signin" ? "signup" : "signin";
  const search = { redirect, mode: other === "signup" ? other : undefined };
  return (
    <p className="hint sign-in-switch">
      {mode === "signin" ? "New to Picky? " : "Already have an account? "}
      <Link to="/login" search={search}>
        {mode === "signin" ? "Create an account" : "Sign in"}
      </Link>
    </p>
  );
}
