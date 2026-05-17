export const DUMMY_PROJECTS = [
	{
		id: "1",
		name: "Agent Learning",
		description: "Harness, Agent",
		lastMessageAt: "28 days ago",
	},
	{
		id: "2",
		name: "Personal Assistant",
		description: "Daily tasks and scheduling",
		lastMessageAt: "2 days ago",
	},
];

export const DUMMY_CHATS = [
	{
		id: "c1",
		title: "TAOR框架在Claude-Code中的工程实现",
		lastMessageAt: "28 days ago",
	},
	{
		id: "c2",
		title: "ReAct、CoT、ToT在Claude中的工程实现",
		lastMessageAt: "28 days ago",
	},
];

export const DUMMY_MESSAGES = [
	{
		id: "m1",
		role: "user",
		content: "Explain the TAOR framework.",
	},
	{
		id: "m2",
		role: "agent",
		processSteps: [
			{
				id: "s1",
				title: "思考 (Reasoning)",
				type: "reasoning",
				content:
					"I need to explain the TAOR framework in the context of Claude-Code. TAOR usually stands for Think, Act, Observe, Reflect. I should search for recent implementations.",
			},
			{
				id: "s2",
				title: "工具调用 (Tool Call): search_web",
				type: "tool_call",
				content: '{"query": "TAOR framework implementation in Claude"}',
			},
			{
				id: "s3",
				title: "工具结果 (Tool Result)",
				type: "tool_result",
				content:
					"Searching found 10 results. The top results indicate that TAOR involves a loop where the agent thinks about the task, acts by calling a tool, observes the result, and reflects on whether the goal is achieved.",
			},
		],
		content:
			"The TAOR (Think, Act, Observe, Reflect) framework is a cognitive architecture often used in LLM agents like Claude-Code to break down complex tasks. \n\nHere is how it works:\n1. **Think**: The agent analyzes the user prompt and plans the next step.\n2. **Act**: The agent executes a tool (e.g., read file, search web).\n3. **Observe**: The agent reads the output of the tool.\n4. **Reflect**: The agent evaluates if the output moves it closer to the goal, and adjusts the plan if necessary.",
	},
	{
		id: "m3",
		role: "user",
		content: "能给我生成一段基于该框架的代码吗？",
	},
	{
		id: "m4",
		role: "agent",
		processSteps: [
			{
				id: "s4",
				title: "思考 (Reasoning)",
				type: "reasoning",
				content:
					"The user wants code based on the TAOR framework. I will write a simple Python class demonstrating Think, Act, Observe, and Reflect methods.",
			},
			{
				id: "s5",
				title: "工具调用 (Tool Call): generate_code",
				type: "tool_call",
				content: '{"language": "python", "framework": "TAOR"}',
			},
		],
		content:
			'当然可以。下面是一个基于 TAOR 框架的简单 Python 实现示例：\n\n```python\nclass TAORAgent:\n    def think(self, prompt):\n        print(f"Thinking about: {prompt}")\n        return "plan"\n\n    def act(self, plan):\n        print(f"Executing: {plan}")\n        return "result"\n\n    def observe(self, result):\n        print(f"Observing: {result}")\n        return "evaluation"\n\n    def reflect(self, evaluation):\n        print(f"Reflecting on: {evaluation}")\n        return True \n\n    def run(self, prompt):\n        goal_reached = False\n        while not goal_reached:\n            plan = self.think(prompt)\n            result = self.act(plan)\n            evaluation = self.observe(result)\n            goal_reached = self.reflect(evaluation)\n```',
	},
];

export const SUB_AGENTS = [
	{ id: "sa1", name: "SearchAgent", status: "completed", progress: 100 },
	{ id: "sa2", name: "SummarizeAgent", status: "in-progress", progress: 45 },
	{ id: "sa3", name: "WriteAgent", status: "pending", progress: 0 },
];
