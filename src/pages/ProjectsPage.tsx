import { ArrowUpDown, Check, MoreVertical, Plus, Search } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { DUMMY_PROJECTS } from "../data/dummy";

export function ProjectsPage() {
	const navigate = useNavigate();
	const { t } = useTranslation();
	const [isSortOpen, setIsSortOpen] = useState(false);
	const [sortBy, setSortBy] = useState("Recent activity");
	const [searchQuery, setSearchQuery] = useState("");

	const filteredProjects = DUMMY_PROJECTS.filter(
		(p) =>
			p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			p.description.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	return (
		<div className="flex-1 flex flex-col h-full bg-theme-base">
			<div className="h-16 border-b border-theme-border flex items-center justify-between px-6 bg-theme-surface">
				<h1 className="text-sm font-bold uppercase tracking-widest text-theme-text">{t("projects.allProjects")}</h1>
				<div className="flex items-center gap-3">
					<div className="relative">
						<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
							<Search className="h-4 w-4 text-theme-text-secondary" />
						</div>
						<input
							type="text"
							placeholder={t("projects.search", "Search projects...")}
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="bg-theme-base border border-theme-border rounded-md pl-9 pr-3 py-1.5 text-sm text-theme-text focus:outline-none focus:border-theme-accent focus:ring-1 focus:ring-theme-accent transition-colors w-64"
						/>
					</div>
					<div className="relative">
						<button
							onClick={() => setIsSortOpen(!isSortOpen)}
							className="flex items-center gap-2 text-theme-text-secondary hover:text-theme-text px-2 py-1.5 rounded transition-colors"
						>
							<ArrowUpDown className="w-4 h-4" />
							<span className="text-sm font-medium">{sortBy}</span>
						</button>
						{isSortOpen && (
							<div className="absolute top-full mt-1 right-0 bg-theme-surface border border-theme-border rounded-lg shadow-xl py-1 z-20 w-48 text-theme-text">
								<div className="px-3 py-2 text-xs font-semibold text-theme-text-secondary uppercase tracking-wider">
									Sort by
								</div>
								{["Recent activity", "Last edited", "Date created"].map((option) => (
									<button
										key={option}
										onClick={() => {
											setSortBy(option);
											setIsSortOpen(false);
										}}
										className="flex items-center justify-between w-full text-left px-3 py-2 text-sm hover:bg-theme-surface-hover transition-colors"
									>
										{option}
										{sortBy === option && <Check className="w-4 h-4 text-theme-accent" />}
									</button>
								))}
							</div>
						)}
					</div>
					<button className="flex items-center gap-2 bg-theme-surface-hover text-theme-accent border border-theme-accent/30 px-4 py-2 rounded text-[11px] uppercase tracking-widest hover:bg-theme-accent/10 transition-colors">
						<Plus className="w-4 h-4" />
						{t("projects.newProject")}
					</button>
				</div>
			</div>

			<div className="flex-1 overflow-auto p-6">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{filteredProjects.map((project) => (
						<div
							key={project.id}
							className="border border-theme-border rounded p-5 bg-theme-surface hover:border-theme-accent/50 transition-colors cursor-pointer group flex flex-col"
							onClick={() => navigate(`/projects/${project.id}`)}
						>
							<div className="flex justify-between items-start mb-2">
								<h3 className="font-semibold text-lg text-theme-text">{project.name}</h3>
								<button
									className="text-theme-text-secondary opacity-0 group-hover:opacity-100 p-1 rounded hover:text-theme-accent transition-all"
									onClick={(e) => {
										e.stopPropagation(); /* handle menu */
									}}
								>
									<MoreVertical className="w-4 h-4" />
								</button>
							</div>
							<p className="text-theme-text-secondary text-sm mb-4 flex-1">{project.description}</p>
							<div className="text-[10px] uppercase tracking-widest text-theme-text-muted mt-auto">
								{t("projects.lastUpdated")} {project.lastMessageAt}
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
