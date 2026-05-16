import React, { useState } from "react";
import {
  Plus,
  Search,
  MoreVertical,
  Database,
  Globe,
  Wrench,
  ChevronDown,
  ChevronRight,
  Folder,
  FileText,
  FileCode,
  CheckCircle2,
  Circle,
  Eye,
  Code,
  File as FileIcon,
  Box,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { AddSkillDialog } from "../components/AddSkillDialog";
import SyntaxHighlighter from "react-syntax-highlighter";
import { github } from "react-syntax-highlighter/dist/esm/styles/hljs";

export function SkillsPage() {
  const { t } = useTranslation();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isAddSkillOpen, setIsAddSkillOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"preview" | "code">("preview");

  const [isPersonalSkillsOpen, setIsPersonalSkillsOpen] = useState(true);
  const [isSkillOpen, setIsSkillOpen] = useState(true);
  const [expandedDirs, setExpandedDirs] = useState<Record<string, boolean>>({});
  const [selectedNodeId, setSelectedNodeId] = useState("skill-1");
  const [isSkillEnabled, setIsSkillEnabled] = useState(true);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  const toggleDir = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedDirs((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const findNode = (nodes: any[], id: string): any => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findNode(node.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const skill = {
    id: "skill-1",
    name: "skill-creator",
    providedBy: "Anthropic",
    trigger: "Slash command + auto",
    description:
      "Create new skills, modify and improve existing skills, and measure skill performance. Use when users want to create a skill from scratch, edit, or optimize an existing skill, run evals to test a skill, benchmark skill performance with variance analysis, or optimize a skill's description for better triggering accuracy.",
    content: `The skill creator is liable to be used by people across a wide range of familiarity with coding jargon. If you haven't heard (and how could you, it's only very recently that it started), there's a trend now where the power of Claude is inspiring plumbers to open up their terminals, parents and grandparents to google "how to install npm". On the other hand, the bulk of users are probably fairly computer-literate.

So please pay attention to context cues to understand how to phrase your communication! In the default case, just to give you some idea:

- "evaluation" and "benchmark" are borderline, but OK
- for "JSON" and "assertion" you want to see serious cues from the user that they know what those things are before using them without explaining them

It's OK to briefly explain terms if you're in doubt, and feel free to clarify terms with a short definition if you're unsure if the user will get it.`,
    files: [
      { id: "f1", name: "SKILL.md", type: "file" },
      {
        id: "f2",
        name: "agents",
        type: "folder",
        children: [{ id: "f2-1", name: "example_agent.py", type: "file" }],
      },
      { id: "f3", name: "assets", type: "folder", children: [] },
      { id: "f4", name: "eval-viewer", type: "folder", children: [] },
      { id: "f5", name: "references", type: "folder", children: [] },
      {
        id: "f6",
        name: "scripts",
        type: "folder",
        children: [{ id: "f6-1", name: "generate.sh", type: "file" }],
      },
      { id: "f7", name: "LICENSE.txt", type: "file" },
    ],
  };

  const renderTree = (nodes: any[], level = 0) => {
    return nodes.map((node) => (
      <div key={node.id} className="flex flex-col">
        <div
          className={`flex items-center gap-1.5 pr-4 py-1.5 cursor-pointer transition-colors
            ${node.id === selectedNodeId ? "text-theme-text font-medium bg-theme-surface-hover shadow-sm rounded-r-md" : "text-theme-text-secondary hover:text-theme-text hover:bg-theme-surface-hover/50"}
          `}
          style={{ paddingLeft: `${level * 16 + 48}px` }}
          onClick={(e) => {
            setSelectedNodeId(node.id);
            if (node.type === "folder") toggleDir(node.id, e);
          }}
        >
          {node.type === "folder" ? (
            expandedDirs[node.id] ? (
              <ChevronDown
                strokeWidth={2}
                className="w-3.5 h-3.5 text-theme-text-muted"
              />
            ) : (
              <ChevronRight
                strokeWidth={2}
                className="w-3.5 h-3.5 text-theme-text-muted"
              />
            )
          ) : (
            <div className="w-3.5 h-3.5 flex-shrink-0" /> /* Placeholder to align files */
          )}
          {node.type === "folder" ? (
            <Folder
              fill="currentColor"
              strokeWidth={0}
              className="w-4 h-4 text-theme-text-muted"
            />
          ) : (
            <FileText
              strokeWidth={1.5}
              className={`w-4 h-4 ${node.name === "SKILL.md" ? "text-theme-accent" : "text-theme-text-muted"}`}
            />
          )}
          <span className="truncate">{node.name}</span>
        </div>
        {node.type === "folder" &&
          expandedDirs[node.id] &&
          node.children &&
          renderTree(node.children, level + 1)}
      </div>
    ));
  };

  const selectedFile =
    selectedNodeId !== skill.id ? findNode(skill.files, selectedNodeId) : null;
  const isRenderableFile =
    selectedFile &&
    (selectedFile.name.endsWith(".md") || selectedFile.name.endsWith(".html"));

  return (
    <div className="flex-1 flex h-full bg-theme-base overflow-hidden">
      {/* Left Sidebar */}
      <div className="w-72 border-r border-theme-border flex flex-col bg-theme-base flex-shrink-0 relative z-10">
        <div className="h-16 px-4 flex items-center justify-between relative mt-2">
          <h2 className="font-semibold text-lg text-theme-text">Skills</h2>
          <div className="flex items-center gap-1">
            <button className="p-1.5 text-theme-text-secondary hover:text-theme-text transition-colors rounded-md hover:bg-theme-surface-hover">
              <Search className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsPopoverOpen(!isPopoverOpen)}
              className={`p-1.5 transition-colors rounded-md ${
                isPopoverOpen
                  ? "bg-theme-surface-hover text-theme-text"
                  : "text-theme-text-secondary hover:text-theme-text hover:bg-theme-surface-hover"
              }`}
            >
              <Plus className="w-4 h-4" />
            </button>
            {/* Popover */}
            {isPopoverOpen && (
              <div className="absolute top-12 right-2 bg-theme-surface border border-theme-border rounded-lg shadow-xl py-1 z-20 w-48 text-theme-text">
                <button
                  onClick={() => setIsPopoverOpen(false)}
                  className="flex items-center gap-3 w-full text-left px-3 py-2 text-sm hover:bg-theme-surface-hover transition-colors"
                >
                  <svg
                    className="w-4 h-4 text-theme-text-secondary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    ></path>
                  </svg>
                  Browse skills
                </button>
                <button
                  onClick={() => {
                    setIsPopoverOpen(false);
                    setIsAddSkillOpen(true);
                  }}
                  className="flex items-center gap-3 w-full text-left px-3 py-2 text-sm hover:bg-theme-surface-hover transition-colors"
                >
                  <Plus className="w-4 h-4 text-theme-text-secondary" />
                  Create skill
                  <ChevronRight className="w-3 h-3 text-theme-text-secondary ml-auto" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pb-4">
          <div
            className="px-4 py-2 flex items-center gap-2 text-xs font-semibold text-theme-text-secondary uppercase tracking-wider cursor-pointer hover:bg-theme-surface-hover transition-colors"
            onClick={() => setIsPersonalSkillsOpen(!isPersonalSkillsOpen)}
          >
            {isPersonalSkillsOpen ? (
              <ChevronDown strokeWidth={2} className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight strokeWidth={2} className="w-3.5 h-3.5" />
            )}
            Personal skills
          </div>

          {isPersonalSkillsOpen && (
            <div className="flex flex-col mt-1 space-y-0.5 text-sm">
              {/* Skill Root */}
              <div
                className={`flex items-center gap-2 px-3 pl-4 py-1.5 mx-2 cursor-pointer transition-colors rounded-md font-medium
                  ${selectedNodeId === skill.id ? "bg-theme-surface-active text-theme-text" : "hover:bg-theme-surface-hover text-theme-text-secondary hover:text-theme-text"}`}
                onClick={() => {
                  setIsSkillOpen(!isSkillOpen);
                  setSelectedNodeId(skill.id);
                }}
              >
                {isSkillOpen ? (
                  <ChevronDown
                    strokeWidth={2}
                    className="w-3.5 h-3.5 text-theme-text-secondary"
                  />
                ) : (
                  <ChevronRight
                    strokeWidth={2}
                    className="w-3.5 h-3.5 text-theme-text-secondary"
                  />
                )}
                <Box className="w-4 h-4 text-theme-accent" />
                {skill.name}
              </div>

              {/* Files */}
              {isSkillOpen && (
                <div className="mt-1 flex flex-col font-mono text-[13px]">
                  {renderTree(skill.files)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Content */}
      <div className="flex-1 flex flex-col bg-theme-surface overflow-hidden">
        {/* Header Section */}
        {selectedNodeId === skill.id ? (
          <>
            <div className="px-8 py-6 border-b border-theme-border flex flex-col gap-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-theme-text">
                  {skill.name}
                </h2>
                <div className="flex items-center gap-4">
                  {/* Toggle Switch */}
                  <button
                    onClick={() => setIsSkillEnabled(!isSkillEnabled)}
                    className={`w-11 h-6 rounded-full flex items-center px-0.5 transition-colors ${isSkillEnabled ? "bg-blue-500" : "bg-theme-border hover:bg-theme-border/80"}`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full transition-transform ${isSkillEnabled ? "translate-x-5" : "translate-x-0"} shadow-sm`}
                    ></div>
                  </button>

                  <div className="relative">
                    <button
                      onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                      className="p-1 text-theme-text-secondary hover:text-theme-text hover:bg-theme-surface-hover rounded transition-colors"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                    {isMoreMenuOpen && (
                      <div className="absolute right-0 top-full mt-1 w-32 bg-theme-surface border border-theme-border rounded-lg shadow-xl py-1 z-10 text-theme-text">
                        <button
                          onClick={() => setIsMoreMenuOpen(false)}
                          className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-theme-surface-hover transition-colors"
                        >
                          Uninstall
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-16 text-sm">
                <div>
                  <div className="text-theme-text-secondary text-[11px] uppercase tracking-wider font-semibold mb-1">
                    Provided by
                  </div>
                  <div className="text-theme-text font-medium text-sm">
                    {skill.providedBy}
                  </div>
                </div>
                <div>
                  <div className="text-theme-text-secondary text-[11px] uppercase tracking-wider font-semibold mb-1">
                    Trigger
                  </div>
                  <div className="text-theme-text font-medium text-sm">
                    {skill.trigger}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-theme-text-secondary text-[11px] uppercase tracking-wider font-semibold mb-2 flex items-center gap-1.5">
                  Description
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                  </svg>
                </div>
                <p className="text-theme-text text-sm leading-relaxed max-w-4xl">
                  {skill.description}
                </p>
              </div>
            </div>
            {/* Empty space below header */}
            <div className="flex-1 bg-theme-base flex items-center justify-center text-theme-text-secondary text-sm">
              Select a file to view its contents
            </div>
          </>
        ) : selectedFile && selectedFile.type === "file" ? (
          <div className="flex-1 flex flex-col overflow-hidden bg-theme-base">
            <div className="h-14 px-6 border-b border-theme-border flex items-center justify-between bg-theme-surface flex-shrink-0">
              <div className="flex items-center gap-2 text-theme-text font-medium text-sm">
                {selectedFile.name === "SKILL.md" ? (
                  <div className="p-1 min-w-5 min-h-5 bg-theme-accent/10 rounded flex items-center justify-center">
                    <FileText className="w-3.5 h-3.5 text-theme-accent" />
                  </div>
                ) : (
                  <div className="p-1 min-w-5 min-h-5 bg-theme-surface-hover rounded border border-theme-border flex items-center justify-center">
                    <FileCode className="w-3.5 h-3.5 text-theme-text-secondary" />
                  </div>
                )}
                <span>{selectedFile.name}</span>
              </div>

              {isRenderableFile && (
                <div className="flex items-center bg-theme-surface-active rounded-md border border-theme-border p-0.5">
                  <button
                    onClick={() => setViewMode("preview")}
                    className={`p-1.5 rounded-md transition-colors ${viewMode === "preview" ? "bg-theme-surface border border-theme-border shadow-sm text-theme-text" : "text-theme-text-secondary hover:text-theme-text"}`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setViewMode("code")}
                    className={`p-1.5 rounded-md transition-colors ${viewMode === "code" ? "bg-theme-surface border border-theme-border shadow-sm text-theme-text" : "text-theme-text-secondary hover:text-theme-text"}`}
                  >
                    <Code className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-8">
              <div className="max-w-4xl mx-auto border border-theme-border bg-theme-surface rounded-xl overflow-hidden min-h-[calc(100vh-12rem)] shadow-sm">
                {isRenderableFile && viewMode === "preview" ? (
                  <div className="p-8 text-theme-text text-base leading-relaxed space-y-4">
                    <p>
                      The skill creator is liable to be used by people across a
                      wide range of familiarity with coding jargon. If you
                      haven't heard (and how could you, it's only very recently
                      that it started), there's a trend now where the power of
                      Claude is inspiring plumbers to open up their terminals,
                      parents and grandparents to google "how to install npm".
                      On the other hand, the bulk of users are probably fairly
                      computer-literate.
                    </p>
                    <p>
                      So please pay attention to context cues to understand how
                      to phrase your communication! In the default case, just to
                      give you some idea:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 mt-4 marker:text-theme-text-secondary">
                      <li>
                        "evaluation" and "benchmark" are borderline, but OK
                      </li>
                      <li>
                        for "JSON" and "assertion" you want to see serious cues
                        from the user that they know what those things are
                        before using them without explaining them
                      </li>
                    </ul>
                    <p className="mt-4">
                      It's OK to briefly explain terms if you're in doubt, and
                      feel free to clarify terms with a short definition if
                      you're unsure if the user will get it.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto text-[13px]">
                    <SyntaxHighlighter
                      language={
                        selectedFile.name.split(".").pop() === "md"
                          ? "markdown"
                          : selectedFile.name.split(".").pop()
                      }
                      style={github}
                      customStyle={{
                        background: "transparent",
                        padding: "2rem",
                        margin: 0,
                      }}
                    >
                      {selectedFile.name === "SKILL.md"
                        ? skill.content
                        : "// Default mock content for " +
                          selectedFile.name +
                          "\n\n"}
                    </SyntaxHighlighter>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 bg-theme-base flex items-center justify-center text-theme-text-secondary text-sm">
            Select a file to view
          </div>
        )}
      </div>

      <AddSkillDialog
        isOpen={isAddSkillOpen}
        onClose={() => setIsAddSkillOpen(false)}
      />
    </div>
  );
}

export function ConnectorsPage() {
  const { t } = useTranslation();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const [selectedConnectorId, setSelectedConnectorId] = useState("github");

  const connectors = [
    {
      id: "github",
      name: "GitHub Integration",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
        </svg>
      ),
    },
    {
      id: "google-drive",
      name: "Google Drive",
      icon: (
        <svg
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21.1 11.5L14.7 1h-8L21.1 11.5zM2.9 11.5L9.3 1H10l-6.4 10.5zM2 12.5h12.7l-6 10.5h-5l-1.7-2.9L2 12.5zM15 12.5h7L16 23h-7l6-10.5z" />
        </svg>
      ),
    },
    {
      id: "email-imap",
      name: "Email IMAP",
      icon: <Globe className="w-4 h-4" />,
    },
  ];

  const selectedConnector =
    connectors.find((c) => c.id === selectedConnectorId) || connectors[0];

  return (
    <div className="flex-1 flex h-full bg-theme-base overflow-hidden">
      {/* Left Sidebar */}
      <div className="w-64 border-r border-theme-border flex flex-col bg-theme-surface flex-shrink-0">
        <div className="h-16 px-4 flex items-center justify-between border-b border-theme-border relative">
          <h2 className="font-semibold text-lg text-theme-text">Connectors</h2>
          <div className="flex items-center gap-2">
            <button className="p-1 text-theme-text-secondary hover:text-theme-text transition-colors rounded hover:bg-theme-surface-hover">
              <Search className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsPopoverOpen(!isPopoverOpen)}
              className="p-1 text-theme-text-secondary hover:text-theme-text transition-colors rounded hover:bg-theme-surface-hover"
            >
              <Plus className="w-4 h-4" />
            </button>
            {/* Popover */}
            {isPopoverOpen && (
              <div className="absolute top-12 right-2 bg-theme-surface border border-theme-border rounded-lg shadow-xl py-1 z-10 w-48 text-theme-text">
                <button
                  onClick={() => setIsPopoverOpen(false)}
                  className="flex items-center gap-3 w-full text-left px-3 py-2 text-sm hover:bg-theme-surface-hover transition-colors"
                >
                  <svg
                    className="w-4 h-4 text-theme-text-secondary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    ></path>
                  </svg>
                  Browse connectors
                </button>
                <button
                  onClick={() => setIsPopoverOpen(false)}
                  className="flex items-center gap-3 w-full text-left px-3 py-2 text-sm hover:bg-theme-surface-hover transition-colors"
                >
                  <MoreVertical className="w-4 h-4 text-theme-text-secondary" />
                  Add custom connector
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          <div className="px-4 py-2 flex items-center gap-2 text-xs text-theme-text-secondary">
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              ></path>
            </svg>
            Not connected
          </div>
          <div className="px-2 space-y-1">
            {connectors.map((connector) => (
              <button
                key={connector.id}
                onClick={() => setSelectedConnectorId(connector.id)}
                className={`flex items-center gap-3 w-full text-left px-3 py-2 rounded-md font-medium text-sm transition-colors ${
                  selectedConnectorId === connector.id
                    ? "bg-theme-surface-active text-theme-text"
                    : "hover:bg-theme-surface-hover text-theme-text-secondary hover:text-theme-text"
                }`}
              >
                {connector.icon}
                {connector.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Content */}
      <div className="flex-1 flex flex-col items-center justify-center bg-theme-base p-6 text-center">
        <div className="w-16 h-16 bg-theme-surface rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-theme-border">
          <div className="w-8 h-8 text-theme-text">
            {selectedConnector.icon}
          </div>
        </div>
        <p className="text-theme-text-secondary text-base mb-6">
          You are not connected to {selectedConnector.name} yet.
        </p>
        <button className="bg-theme-text text-theme-base font-semibold px-6 py-2 rounded-lg text-sm hover:opacity-90 transition-opacity">
          Connect
        </button>
      </div>
    </div>
  );
}
