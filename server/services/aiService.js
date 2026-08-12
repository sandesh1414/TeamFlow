const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Helper — one call used by all 4 features
const generate = async (prompt) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3.1-flash-lite',
    contents: prompt,
  });
  return response.text.trim();
};

// ── FEATURE 1: TASK SUMMARIZER ──
const summarizeTask = async (task) => {
  const commentsText = task.comments && task.comments.length > 0
    ? task.comments.map((c) => `- ${c.author?.name || 'Someone'}: "${c.text}"`).join('\n')
    : 'No comments yet.';

  const prompt = `
You are a project management assistant helping a software team.

TASK TITLE: ${task.title}
TASK DESCRIPTION: ${task.description || 'No description provided.'}
PRIORITY: ${task.priority}
STATUS: ${task.status}
ASSIGNED TO: ${task.assignedTo?.name || 'Unassigned'}
COMMENTS:
${commentsText}

Summarize in EXACTLY 3 bullet points. One sentence each.
Cover: (1) what the task is, (2) current status from comments, (3) blockers or next steps.
Format:
- [first point]
- [second point]
- [third point]

No intro or extra text outside the 3 bullets.
`;
  return await generate(prompt);
};

// ── FEATURE 2: SMART TASK SPLITTER ──
const splitTask = async (taskTitle, teamMembers = []) => {
  const memberNames = teamMembers.length > 0
    ? teamMembers.map((m) => m.user?.name || m.name).join(', ')
    : 'No specific members';

  const prompt = `
You are a project management assistant for a software development team.

HIGH-LEVEL TASK: "${taskTitle}"
TEAM MEMBERS: ${memberNames}

Break this into 5 to 6 specific actionable subtasks a developer can immediately work on.

Respond with ONLY a valid JSON array. No explanation, no markdown, no code blocks.
Raw JSON only, starting with [ and ending with ].

[
  {
    "title": "specific task starting with a verb",
    "description": "2-3 sentences on exactly what to do",
    "priority": "low or medium or high or urgent",
    "estimatedHours": 2
  }
]
`;

  let text = await generate(prompt);

  if (text.includes('```json')) text = text.split('```json')[1].split('```')[0].trim();
  else if (text.includes('```')) text = text.split('```')[1].split('```')[0].trim();

  const subtasks = JSON.parse(text);
  if (!Array.isArray(subtasks)) throw new Error('AI did not return a valid task list');
  return subtasks;
};

// ── FEATURE 3: AUTO PRIORITY TAGGER ──
const suggestPriority = async (title, description = '') => {
  const prompt = `
You are a project management assistant that assigns task priorities.

Respond with ONLY one word — exactly one of: low, medium, high, urgent

- urgent: production broken, security issue, blocking the whole team
- high: important feature, significant bug, needed this sprint
- medium: normal feature work, minor bug, scheduled work
- low: nice to have, documentation, minor polish

TASK TITLE: ${title}
DESCRIPTION: ${description || 'None'}

One word only. No punctuation. No explanation.
`;

  const text = await generate(prompt);
  const cleaned = text.toLowerCase().trim();
  const validPriorities = ['low', 'medium', 'high', 'urgent'];
  return validPriorities.includes(cleaned) ? cleaned : 'medium';
};

// ── FEATURE 4: TEAM CHAT ASSISTANT (RAG) ──
const askAssistant = async (question, tasks, teamName) => {
  const now = new Date();

  const taskContext = tasks.length === 0
    ? 'No tasks exist yet.'
    : tasks.map((task) => {
        const isOverdue = task.dueDate && new Date(task.dueDate) < now && task.status !== 'done';
        const daysOverdue = isOverdue
          ? Math.floor((now - new Date(task.dueDate)) / (1000 * 60 * 60 * 24))
          : null;
        return `
TASK: ${task.title}
  Status: ${task.status === 'todo' ? 'To Do' : task.status === 'inprogress' ? 'In Progress' : 'Done'}
  Priority: ${task.priority}
  Assigned to: ${task.assignedTo?.name || 'Unassigned'}
  Due: ${task.dueDate ? new Date(task.dueDate).toDateString() : 'No due date'}
  ${isOverdue ? `OVERDUE by ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''}` : ''}
`.trim();
      }).join('\n\n');

  const prompt = `
You are a helpful project assistant for team "${teamName}".
Answer questions about the team's tasks concisely (under 150 words).
Use actual task names and people's names. Plain text only, no markdown.

CURRENT DATE: ${now.toDateString()}
TASKS (${tasks.length} total):
${taskContext}

QUESTION: ${question}
`;

  return await generate(prompt);
};

module.exports = { summarizeTask, splitTask, suggestPriority, askAssistant };