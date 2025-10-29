// backend/controllers/chatController.js
import { getOpenAIClient } from "../services/openaiClient.js";
import { getThreadId, setThreadId } from "../services/threadsStore.js";

function buildUserContentFromMessages(messages, hint) {
  const transcript = (messages || [])
    .map((m) => `${m.from}: ${m.text}`)
    .join("\n");
  const prefix =
    "You are drafting a single concise reply for a social messaging conversation. Be helpful, polite, and match the user's tone. Use plain text only.\n\n";
  const hintLine = hint ? `Additional instruction: ${hint}\n\n` : "";
  return `${prefix}${hintLine}Conversation transcript (latest last):\n${transcript}\n\nYour reply:`;
}

async function waitForRunCompletion(client, threadId, runId, timeoutMs = 60000) {
  const startedAt = Date.now();
  let delay = 500;
  // Simple exponential backoff polling
  while (Date.now() - startedAt < timeoutMs) {
    const run = await client.beta.threads.runs.retrieve(threadId, runId);
    if (run.status === "completed") return;
    if (["failed", "cancelled", "expired"].includes(run.status)) {
      throw new Error(`Run ended with status: ${run.status}`);
    }
    await new Promise((r) => setTimeout(r, delay));
    delay = Math.min(delay * 1.5, 3000);
  }
  throw new Error("Run timed out waiting for completion");
}

export async function replyWithAssistant(req, res) {
  try {
    const { assistantId } = req.params;
    const { conversationId, messages, hint } = req.body || {};

    if (!assistantId || !conversationId) {
      return res
        .status(400)
        .json({ error: "assistantId (param) and conversationId (body) are required" });
    }

    const client = getOpenAIClient();

    let threadId = await getThreadId(assistantId, conversationId);
    if (!threadId) {
      const thread = await client.beta.threads.create({});
      threadId = thread.id;
      await setThreadId(assistantId, conversationId, threadId);
    }

    const userContent = buildUserContentFromMessages(messages, hint);

    await client.beta.threads.messages.create(threadId, {
      role: "user",
      content: userContent,
    });

    const run = await client.beta.threads.runs.create(threadId, {
      assistant_id: assistantId,
    });

    await waitForRunCompletion(client, threadId, run.id);

    const list = await client.beta.threads.messages.list(threadId, { limit: 10 });
    const assistantMsg = list.data.find((m) => m.role === "assistant");
    let text = "";
    if (assistantMsg) {
      const parts = assistantMsg.content || [];
      for (const part of parts) {
        if (part.type === "text" && part.text?.value) {
          text += part.text.value;
        }
      }
    }

    if (!text) {
      return res.status(500).json({ error: "Assistant produced no text" });
    }

    res.json({ reply: text, threadId });
  } catch (err) {
    res.status(500).json({ error: "Failed to generate reply", details: err.message });
  }
}
