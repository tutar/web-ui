export interface ScheduledTask {
	id: string;
	name: string;
	content: string;
	scheduleType: "Once" | "Hourly" | "Daily" | "Weekly" | "Monthly";
	time: string; // ISO string for once, cron expression for periodic
	projectId: string;
	model: string;
	status: "active" | "paused";
}
