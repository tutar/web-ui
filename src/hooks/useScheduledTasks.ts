import { useState, useEffect } from "react";
import { ScheduledTask } from "../types";
import { DUMMY_PROJECTS } from "../data/dummy";

const LOCAL_STORAGE_KEY = "agentos_scheduled_tasks_v2";

const initialDummyTasks: ScheduledTask[] = [
  {
    id: "task-1",
    name: "Weekly Market Report",
    content: "Extract market trends, key events, and summarize into a 3-page markdown report focusing on AI and tech sectors.",
    scheduleType: "Weekly",
    time: "2026-05-18T09:00",
    projectId: "p1",
    model: "Sonnet 4.6",
    status: "active",
  },
  {
    id: "task-2",
    name: "Daily Support Triage",
    content: "Read recent support tickets in the database, categorize them into 'Bug', 'Feature', 'Inquiry', and tag the relevant team members. Skip resolved tickets.",
    scheduleType: "Daily",
    time: "2026-05-13T08:00",
    projectId: "p2",
    model: "Haiku",
    status: "active",
  },
  {
    id: "task-3",
    name: "Monthly Invoice Processing",
    content: "Scan all uploaded invoices for the current month, extract total amounts, vendor names, and dates, and format them as a CSV for accounting.",
    scheduleType: "Monthly",
    time: "2026-05-31T17:00",
    projectId: "p1",
    model: "Sonnet 4.6",
    status: "paused",
  }
];

export function useScheduledTasks() {
  const [tasks, setTasks] = useState<ScheduledTask[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return initialDummyTasks;
      }
    }
    return initialDummyTasks;
  });

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  return { tasks, setTasks };
}
