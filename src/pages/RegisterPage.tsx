/**
 * Minimal registration page for the managed web UI.
 */
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../auth/AuthContext";

export function RegisterPage() {
	const { register } = useAuth();
	const navigate = useNavigate();
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	return (
		<div className="min-h-screen bg-theme-base text-theme-text flex items-center justify-center px-6">
			<form
				className="w-full max-w-md bg-theme-surface border border-theme-border rounded-2xl p-8 flex flex-col gap-4"
				onSubmit={async (event) => {
					event.preventDefault();
					setIsSubmitting(true);
					setError(null);

					try {
						await register({ username, password });
						navigate("/chats", { replace: true });
					} catch (nextError) {
						setError(nextError instanceof Error ? nextError.message : "Registration failed");
					} finally {
						setIsSubmitting(false);
					}
				}}
			>
				<div className="flex flex-col gap-1">
					<h1 className="text-2xl font-semibold">Register</h1>
					<p className="text-sm text-theme-text-secondary">
						Create a personal account before multi-tenant features arrive.
					</p>
				</div>

				<label className="flex flex-col gap-2 text-sm">
					<span>Username</span>
					<input
						className="bg-theme-surface-hover border border-theme-border rounded-lg px-3 py-2 outline-none"
						value={username}
						onChange={(event) => setUsername(event.target.value)}
					/>
				</label>

				<label className="flex flex-col gap-2 text-sm">
					<span>Password</span>
					<input
						type="password"
						className="bg-theme-surface-hover border border-theme-border rounded-lg px-3 py-2 outline-none"
						value={password}
						onChange={(event) => setPassword(event.target.value)}
					/>
				</label>

				{error ? <div className="text-sm text-red-400 whitespace-pre-wrap">{error}</div> : null}

				<button
					type="submit"
					disabled={isSubmitting}
					className="bg-theme-accent text-black rounded-lg px-4 py-2 font-medium disabled:opacity-60"
				>
					{isSubmitting ? "Creating account..." : "Create account"}
				</button>

				<p className="text-sm text-theme-text-secondary">
					Already have an account?{" "}
					<Link className="text-theme-accent" to="/login">
						Sign in
					</Link>
				</p>
			</form>
		</div>
	);
}
