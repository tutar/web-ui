/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import { Layout } from "./components/layout/Layout";
import { AutomationPage } from "./pages/AutomationPage";
import { ChatPage } from "./pages/ChatPage";
import { LoginPage } from "./pages/LoginPage";
import { ConnectorsPage, SkillsPage } from "./pages/ManagePages";
import { ProjectDetailPage } from "./pages/ProjectDetailPage";
import { ProjectsPage } from "./pages/ProjectsPage";
import { RegisterPage } from "./pages/RegisterPage";
import { SkillDetailPage } from "./pages/SkillDetailPage";

function RequireAuth() {
	const { currentUser, isLoading } = useAuth();

	if (isLoading) {
		return (
			<div className="min-h-screen bg-theme-base text-theme-text flex items-center justify-center">Loading...</div>
		);
	}

	if (!currentUser) {
		return <Navigate to="/login" replace />;
	}

	return <Outlet />;
}

function PublicOnlyRoute() {
	const { currentUser, isLoading } = useAuth();

	if (isLoading) {
		return (
			<div className="min-h-screen bg-theme-base text-theme-text flex items-center justify-center">Loading...</div>
		);
	}

	if (currentUser) {
		return <Navigate to="/chats" replace />;
	}

	return <Outlet />;
}

export default function App() {
	return (
		<AuthProvider>
			<BrowserRouter>
				<Routes>
					<Route element={<PublicOnlyRoute />}>
						<Route path="/login" element={<LoginPage />} />
						<Route path="/register" element={<RegisterPage />} />
					</Route>

					<Route element={<RequireAuth />}>
						<Route path="/" element={<Layout />}>
							<Route index element={<Navigate to="/chats" replace />} />
							<Route path="chats" element={<ChatPage />} />
							<Route path="chats/:chatId" element={<ChatPage />} />
							<Route path="projects" element={<ProjectsPage />} />
							<Route path="projects/:projectId" element={<ProjectDetailPage />} />
							<Route path="skills" element={<SkillsPage />} />
							<Route path="skills/:skillId" element={<SkillDetailPage />} />
							<Route path="connectors" element={<ConnectorsPage />} />
							<Route path="automation" element={<AutomationPage />} />
						</Route>
					</Route>
				</Routes>
			</BrowserRouter>
		</AuthProvider>
	);
}
