/**
 * Browser auth context for the standalone web UI.
 *
 * The web client treats login session state as an API concern and only keeps
 * the current user snapshot plus the minimal register/login/logout actions.
 */
import type React from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getApiBaseUrl } from "../lib/api-base-url";

const API_BASE_URL = getApiBaseUrl();

export type CurrentUser = {
	userId: string;
	username: string;
	status: string;
	createdAt: string;
	lastLoginAt: string | null;
};

type AuthContextValue = {
	currentUser: CurrentUser | null;
	isLoading: boolean;
	login(input: { username: string; password: string }): Promise<void>;
	register(input: { username: string; password: string }): Promise<void>;
	logout(): Promise<void>;
	refreshCurrentUser(): Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const fetchJson = async (input: RequestInfo | URL, init?: RequestInit) => {
	const response = await fetch(input, {
		credentials: "include",
		...init,
		headers: {
			"content-type": "application/json",
			...(init?.headers || {}),
		},
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(errorText || `request failed: ${response.status}`);
	}

	return response.json();
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	const refreshCurrentUser = useCallback(async () => {
		try {
			const response = await fetch(`${API_BASE_URL}/me`, {
				credentials: "include",
			});

			if (response.status === 401) {
				setCurrentUser(null);
				return;
			}

			if (!response.ok) {
				throw new Error(`request failed: ${response.status}`);
			}

			setCurrentUser((await response.json()) as CurrentUser);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		void refreshCurrentUser();
	}, [refreshCurrentUser]);

	const login = useCallback(async (input: { username: string; password: string }) => {
		const user = (await fetchJson(`${API_BASE_URL}/auth/login`, {
			method: "POST",
			body: JSON.stringify(input),
		})) as CurrentUser;

		setCurrentUser(user);
	}, []);

	const register = useCallback(async (input: { username: string; password: string }) => {
		const user = (await fetchJson(`${API_BASE_URL}/auth/register`, {
			method: "POST",
			body: JSON.stringify(input),
		})) as CurrentUser;

		setCurrentUser(user);
	}, []);

	/**
	 * Clear the browser auth state even if the server-side login session has
	 * already expired or the logout response fails to deserialize.
	 *
	 * The UI should always leave the protected area once the user explicitly
	 * requests logout; backend invalidation is best-effort from the browser.
	 */
	const logout = useCallback(async () => {
		try {
			const response = await fetch(`${API_BASE_URL}/auth/logout`, {
				method: "POST",
				credentials: "include",
				headers: {
					"content-type": "application/json",
				},
			});

			if (!response.ok && response.status !== 401) {
				const errorText = await response.text();
				throw new Error(errorText || `request failed: ${response.status}`);
			}
		} catch (error) {
			console.error("Failed to invalidate login session during logout", error);
		} finally {
			setCurrentUser(null);
		}
	}, []);

	const value = useMemo<AuthContextValue>(
		() => ({
			currentUser,
			isLoading,
			login,
			register,
			logout,
			refreshCurrentUser,
		}),
		[currentUser, isLoading, login, logout, refreshCurrentUser, register],
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
	const value = useContext(AuthContext);

	if (!value) {
		throw new Error("useAuth must be used within AuthProvider");
	}

	return value;
};
