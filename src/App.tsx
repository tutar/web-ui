/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { ChatPage } from './pages/ChatPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { SkillsPage, ConnectorsPage } from './pages/ManagePages';
import { SkillDetailPage } from './pages/SkillDetailPage';
import { AutomationPage } from './pages/AutomationPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
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
      </Routes>
    </BrowserRouter>
  );
}
