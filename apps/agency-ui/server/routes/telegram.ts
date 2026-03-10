import { Router, Request, Response } from "express";
import { readFileSync, existsSync, writeFileSync } from "fs";
import path from "path";
import { broadcast } from "../index";

const AGENCY_ROOT = process.env.AGENCY_ROOT || "/root/yaswarm-swarm/projects/yaswarm-desk-workspace/agency";
const ENV_PATH = path.join(AGENCY_ROOT, ".env");
const AGENCY_CONFIG_PATH = path.join(AGENCY_ROOT, "config", "agency-config.json");

const router = Router();

interface ThreadInfo {
  id: number;
  name: string;
  department: string;
  botHandle: string;
  tokenEnv: string;
}

interface BotInfo {
  handle: string;
  name: string;
  department: string;
  tokenEnv: string;
  thread_id: number | null;
  tokenConfigured: boolean;
  hasThread: boolean;
}

const GROUP_CHAT_ID = Number(process.env.YASWARM_TELEGRAM_GROUP_CHAT_ID || "-1003851268051");

function loadEnvTokens(): Record<string, string> {
  const tokens: Record<string, string> = {};
  if (!existsSync(ENV_PATH)) return tokens;

  const content = readFileSync(ENV_PATH, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;

    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    tokens[key] = val;
  }
  return tokens;
}

function formatEnvAssignment(key: string, value: string): string {
  const needsQuotes = /[\s#"']/g.test(value) || value.includes("=");
  if (!needsQuotes) return `${key}=${value}`;
  const escaped = value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n");
  return `${key}="${escaped}"`;
}

function upsertEnvFileKey(filePath: string, key: string, value: string): void {
  const newLine = formatEnvAssignment(key, value);
  const raw = existsSync(filePath) ? readFileSync(filePath, "utf-8") : "";
  const lines = raw ? raw.split(/\r?\n/) : [];
  let replaced = false;

  const updatedLines = lines.map((line) => {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=/);
    if (match && match[1] === key) {
      replaced = true;
      return newLine;
    }
    return line;
  });

  if (!replaced) {
    if (updatedLines.length > 0 && updatedLines[updatedLines.length - 1].trim() !== "") {
      updatedLines.push("");
    }
    updatedLines.push(newLine);
  }

  writeFileSync(filePath, `${updatedLines.join("\n").replace(/\n*$/, "")}\n`, "utf-8");
}

function parseThreadId(value: unknown): number | null {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

function withAt(handle: string): string {
  const trimmed = handle.trim();
  if (!trimmed) return "";
  return trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
}

function titleCase(input: string): string {
  return input
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

function depToHistoryKey(dep: string): string {
  if (dep === "CEO") return "ceo";
  return dep.toLowerCase().replace(/\s+/g, "-");
}

function readAgencyConfig(): any | null {
  if (!existsSync(AGENCY_CONFIG_PATH)) return null;
  try {
    return JSON.parse(readFileSync(AGENCY_CONFIG_PATH, "utf-8"));
  } catch {
    return null;
  }
}

function saveAgencyConfig(config: any): void {
  writeFileSync(AGENCY_CONFIG_PATH, `${JSON.stringify(config, null, 2)}\n`, "utf-8");
}

function buildBotDirectory(): BotInfo[] {
  const tokens = loadEnvTokens();
  const cfg = readAgencyConfig();
  const bots: BotInfo[] = [];

  if (cfg?.ceo) {
    const ceoTokenEnv = String(cfg.ceo.token_env || "YASWARM_CEO_BOT_TOKEN");
    bots.push({
      handle: withAt(String(cfg.ceo.bot_id || "yaswarm_ceo_bot")),
      name: String(cfg.ceo.bot_name || "YaSwarm CEO"),
      department: "CEO",
      tokenEnv: ceoTokenEnv,
      thread_id: parseThreadId(cfg.ceo.topic_thread_id),
      tokenConfigured: Boolean(tokens[ceoTokenEnv] || process.env[ceoTokenEnv]),
      hasThread: parseThreadId(cfg.ceo.topic_thread_id) !== null,
    });
  }

  const departments = (cfg?.departments || {}) as Record<string, any>;
  for (const [depKey, depCfg] of Object.entries(departments)) {
    const tokenEnv = String(depCfg?.token_env || `YASWARM_${depKey.toUpperCase().replace(/[^A-Z0-9]+/g, "_")}_BOT_TOKEN`);
    const threadId = parseThreadId(depCfg?.topic_thread_id);
    bots.push({
      handle: withAt(String(depCfg?.bot_id || `yaswarm_${depKey}_bot`)),
      name: String(depCfg?.bot_name || `YaSwarm ${titleCase(depKey)}`),
      department: depKey,
      tokenEnv,
      thread_id: threadId,
      tokenConfigured: Boolean(tokens[tokenEnv] || process.env[tokenEnv]),
      hasThread: threadId !== null,
    });
  }

  return bots;
}

function buildThreads(): ThreadInfo[] {
  const directory = buildBotDirectory();
  const withThreads = directory.filter((b) => b.thread_id !== null);
  const cfg = readAgencyConfig();

  const dynamic: ThreadInfo[] = withThreads.map((b) => ({
    id: Number(b.thread_id),
    name: b.name,
    department: b.department,
    botHandle: b.handle,
    tokenEnv: b.tokenEnv,
  }));

  const seenIds = new Set(dynamic.map((t) => t.id));

  const headsThreadId = parseThreadId(cfg?.ceo?.heads_topic_thread_id);
  if (headsThreadId !== null && !seenIds.has(headsThreadId)) {
    dynamic.push({
      id: headsThreadId,
      name: String(cfg?.ceo?.heads_topic_name || "Department Heads Bridge"),
      department: "heads",
      botHandle: withAt(String(cfg?.ceo?.bot_id || "yaswarm_ceo_bot")),
      tokenEnv: String(cfg?.ceo?.token_env || "YASWARM_CEO_BOT_TOKEN"),
    });
    seenIds.add(headsThreadId);
  }

  return dynamic;
}

async function createForumTopic(botToken: string, name: string): Promise<{ ok: boolean; threadId?: number; error?: string }> {
  try {
    const telegramUrl = `https://api.telegram.org/bot${botToken}/createForumTopic`;
    const response = await fetch(telegramUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: GROUP_CHAT_ID,
        name,
      }),
    });
    const data = await response.json();
    const threadId = Number(data?.result?.message_thread_id);
    if (!response.ok || !data?.ok || !Number.isFinite(threadId) || threadId <= 0) {
      return { ok: false, error: data?.description || "createForumTopic failed" };
    }
    return { ok: true, threadId };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

interface EventLine {
  ts?: string;
  source_type?: string;
  update_id?: number;
  message_id?: number;
  date?: number;
  chat_id?: number;
  chat_type?: string;
  chat_title?: string;
  thread_id?: number;
  from_id?: number;
  username?: string;
  first_name?: string;
  from_is_bot?: boolean;
  text?: string;
  media_type?: string;
  file_id?: string;
  reply_to_message_id?: number;
}

interface HistoryEntry {
  role: "user" | "assistant";
  text: string;
}

type DeptHistoryData = Record<string, HistoryEntry[]>;

interface UnifiedMessage {
  id: string;
  direction: "inbound" | "outbound";
  role: "user" | "assistant";
  text: string;
  ts?: string;
  from_id?: number;
  username?: string;
  first_name?: string;
  from_is_bot?: boolean;
  message_id?: number;
  reply_to_message_id?: number;
  media_type?: string;
  department?: string;
  botHandle?: string;
  source: "events" | "history";
}

function readEventsLog(): EventLine[] {
  const eventsPath = path.join(AGENCY_ROOT, "logs", "telegram-bridge.events.jsonl");
  if (!existsSync(eventsPath)) return [];

  const content = readFileSync(eventsPath, "utf-8");
  const events: EventLine[] = [];
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      events.push(JSON.parse(trimmed));
    } catch {
      // Skip malformed lines.
    }
  }
  return events;
}

function readDeptHistoryFile(deptKey: string): DeptHistoryData {
  const fpath = path.join(AGENCY_ROOT, "logs", `dept-${deptKey}.history.json`);
  if (!existsSync(fpath)) return {};
  try {
    const content = readFileSync(fpath, "utf-8");
    return JSON.parse(content) as DeptHistoryData;
  } catch {
    return {};
  }
}

function getMergedMessages(threadId: number): UnifiedMessage[] {
  const threads = buildThreads();
  const thread = threads.find((t) => t.id === threadId);
  if (!thread) return [];

  const allEvents = readEventsLog();
  const threadEvents = allEvents.filter((e) => e.thread_id === threadId);

  const chatKey = `${GROUP_CHAT_ID}:${threadId}`;
  const generalKey = String(GROUP_CHAT_ID);

  const filesToCheck = new Set<string>();
  filesToCheck.add(depToHistoryKey(thread.department));
  filesToCheck.add("ceo");

  const historyConversations: { dept: string; entries: HistoryEntry[] }[] = [];
  for (const fileKey of filesToCheck) {
    const data = readDeptHistoryFile(fileKey);
    for (const key of [chatKey, generalKey]) {
      if (key && data[key] && data[key].length > 0) {
        historyConversations.push({ dept: fileKey, entries: data[key] });
      }
    }
    if (fileKey === "ceo" && data["5415191188"]) {
      historyConversations.push({ dept: "ceo", entries: data["5415191188"] });
    }
  }

  const assistantResponses: { dept: string; text: string; afterUserText: string }[] = [];
  const seenPrefixes = new Set<string>();

  for (const { dept, entries } of historyConversations) {
    for (let i = 0; i < entries.length; i++) {
      if (entries[i].role !== "assistant") continue;
      const prefix = entries[i].text.slice(0, 80);
      if (seenPrefixes.has(prefix)) continue;
      seenPrefixes.add(prefix);

      const prevUser = i > 0 && entries[i - 1].role === "user" ? entries[i - 1].text : "";
      assistantResponses.push({ dept, text: entries[i].text, afterUserText: prevUser });
    }
  }

  const merged: UnifiedMessage[] = [];
  const usedResponses = new Set<number>();

  for (const ev of threadEvents) {
    merged.push({
      id: `ev-${ev.message_id ?? ev.update_id ?? merged.length}`,
      direction: "inbound",
      role: "user",
      text: ev.text || (ev.media_type ? `[${ev.media_type}]` : ""),
      ts: ev.ts,
      from_id: ev.from_id,
      username: ev.username,
      first_name: ev.first_name,
      from_is_bot: ev.from_is_bot,
      message_id: ev.message_id,
      reply_to_message_id: ev.reply_to_message_id,
      media_type: ev.media_type,
      source: "events",
    });

    const evText = (ev.text || "").trim();
    if (!evText) continue;

    for (let ri = 0; ri < assistantResponses.length; ri++) {
      if (usedResponses.has(ri)) continue;
      const resp = assistantResponses[ri];
      const histUserText = resp.afterUserText.trim();
      if (!histUserText) continue;

      const matches =
        histUserText === evText ||
        evText.startsWith(histUserText.slice(0, 50)) ||
        histUserText.startsWith(evText.slice(0, 50));

      if (!matches) continue;

      usedResponses.add(ri);
      const respDept = resp.dept === "ceo" ? "CEO" : resp.dept;
      const ceoThread = threads.find((t) => t.department === "CEO");
      const respThread = resp.dept === "ceo" ? ceoThread : thread;

      merged.push({
        id: `hist-${ri}-${respDept}`,
        direction: "outbound",
        role: "assistant",
        text: resp.text,
        ts: ev.ts ? new Date(new Date(ev.ts).getTime() + 2000).toISOString() : undefined,
        from_is_bot: true,
        department: respDept,
        botHandle: respThread?.botHandle,
        source: "history",
      });
      break;
    }
  }

  for (let ri = 0; ri < assistantResponses.length; ri++) {
    if (usedResponses.has(ri)) continue;
    const resp = assistantResponses[ri];
    const respDept = resp.dept === "ceo" ? "CEO" : resp.dept;
    const ceoThread = threads.find((t) => t.department === "CEO");
    const respThread = resp.dept === "ceo" ? ceoThread : thread;

    if (resp.afterUserText) {
      merged.push({
        id: `hist-user-${ri}`,
        direction: "inbound",
        role: "user",
        text: resp.afterUserText,
        from_is_bot: false,
        source: "history",
      });
    }

    merged.push({
      id: `hist-resp-${ri}-${respDept}`,
      direction: "outbound",
      role: "assistant",
      text: resp.text,
      from_is_bot: true,
      department: respDept,
      botHandle: respThread?.botHandle,
      source: "history",
    });
  }

  return merged;
}

router.get("/telegram/threads", (_req: Request, res: Response): void => {
  try {
    const threads = buildThreads();
    const events = readEventsLog();
    const threadCounts: Record<number, number> = {};
    const lastMessage: Record<number, string> = {};

    for (const ev of events) {
      const tid = ev.thread_id ?? 0;
      threadCounts[tid] = (threadCounts[tid] || 0) + 1;
      if (ev.ts) lastMessage[tid] = ev.ts;
    }

    for (const t of threads) {
      const merged = getMergedMessages(t.id);
      if (merged.length > (threadCounts[t.id] || 0)) {
        threadCounts[t.id] = merged.length;
      }
    }

    res.json({
      threads: threads.map((t) => ({
        ...t,
        messageCount: threadCounts[t.id] || 0,
        lastActivity: lastMessage[t.id] || null,
      })),
      groupChatId: GROUP_CHAT_ID,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: "Failed to list threads", detail: message });
  }
});

router.get("/telegram/messages", (req: Request, res: Response): void => {
  try {
    const threadId = req.query.thread_id ? Number(req.query.thread_id) : undefined;
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    const offset = Number(req.query.offset) || 0;

    let messages: UnifiedMessage[];
    if (threadId !== undefined) {
      messages = getMergedMessages(threadId);
    } else {
      const events = readEventsLog();
      messages = events.map((ev, idx) => ({
        id: `ev-${ev.message_id ?? ev.update_id ?? idx}`,
        direction: "inbound" as const,
        role: "user" as const,
        text: ev.text || (ev.media_type ? `[${ev.media_type}]` : ""),
        ts: ev.ts,
        from_id: ev.from_id,
        username: ev.username,
        first_name: ev.first_name,
        from_is_bot: ev.from_is_bot,
        message_id: ev.message_id,
        reply_to_message_id: ev.reply_to_message_id,
        media_type: ev.media_type,
        source: "events" as const,
      }));
    }

    const total = messages.length;
    const start = Math.max(0, total - offset - limit);
    const end = total - offset;
    const page = messages.slice(Math.max(0, start), Math.max(0, end));

    res.json({ messages: page, total, hasMore: start > 0 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: "Failed to read messages", detail: message });
  }
});

router.post("/telegram/send", async (req: Request, res: Response): Promise<void> => {
  try {
    const { text, thread_id } = req.body as { text?: string; thread_id?: number };

    if (!text || typeof text !== "string") {
      res.status(400).json({ error: "text is required" });
      return;
    }

    if (thread_id === undefined || typeof thread_id !== "number") {
      res.status(400).json({ error: "thread_id is required" });
      return;
    }

    const thread = buildThreads().find((t) => t.id === thread_id);
    if (!thread) {
      res.status(400).json({ error: `Unknown thread_id: ${thread_id}` });
      return;
    }

    const tokens = loadEnvTokens();
    const botToken = tokens[thread.tokenEnv] || process.env[thread.tokenEnv] || process.env.YASWARM_CEO_BOT_TOKEN;

    if (!botToken) {
      res.status(500).json({ error: `Bot token not found for ${thread.department} (env: ${thread.tokenEnv})` });
      return;
    }

    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const payload = {
      chat_id: GROUP_CHAT_ID,
      message_thread_id: thread_id,
      text,
      parse_mode: "Markdown",
    };

    const telegramRes = await fetch(telegramUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const telegramData = await telegramRes.json();
    if (!telegramRes.ok || !telegramData.ok) {
      res.status(502).json({ error: "Telegram API error", detail: telegramData.description || "Unknown error" });
      return;
    }

    res.json({ ok: true, message_id: telegramData.result?.message_id, thread_id, department: thread.department });

    broadcast({
      type: "telegram_update",
      thread_id,
      department: thread.department,
      message_id: telegramData.result?.message_id,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: "Failed to send message", detail: message });
  }
});

router.post("/telegram/who", async (req: Request, res: Response): Promise<void> => {
  try {
    const directory = buildBotDirectory();
    const ceo = directory.find((b) => b.department === "CEO" && b.thread_id !== null) || directory.find((b) => b.thread_id !== null);
    if (!ceo?.thread_id) {
      res.status(400).json({ error: "No configured Telegram thread found in agency-config.json" });
      return;
    }
    const requestedThread = Number(req.body?.thread_id);
    const targetThreadId = Number.isFinite(requestedThread) && requestedThread > 0
      ? requestedThread
      : Number(ceo.thread_id);

    const thread = buildThreads().find((t) => t.id === targetThreadId);
    if (!thread) {
      res.status(400).json({ error: `Unknown thread_id: ${targetThreadId}` });
      return;
    }

    const tokens = loadEnvTokens();
    const botToken = tokens[thread.tokenEnv] || process.env[thread.tokenEnv] || process.env.YASWARM_CEO_BOT_TOKEN;

    if (!botToken) {
      res.status(500).json({ error: `Bot token not found for ${thread.department} (env: ${thread.tokenEnv})` });
      return;
    }

    const whoMessage = `🤖 **Agency Bot Roll Call**\n\nHey team! Could each bot please introduce themselves and clarify:\n\n1️⃣ **Who you are** / what you're called\n2️⃣ **What you're responsible for** in the agency\n3️⃣ **Who you report to** (if applicable)\n\nJust trying to get a clear picture of everyone's role so we know who to reach out to for what. Thanks! 🙏`;

    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const payload = {
      chat_id: GROUP_CHAT_ID,
      message_thread_id: targetThreadId,
      text: whoMessage,
      parse_mode: "Markdown",
    };

    const telegramRes = await fetch(telegramUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const telegramData = await telegramRes.json();
    if (!telegramRes.ok || !telegramData.ok) {
      res.status(502).json({ error: "Telegram API error", detail: telegramData.description || "Unknown error" });
      return;
    }

    res.json({
      ok: true,
      message_id: telegramData.result?.message_id,
      thread_id: targetThreadId,
      department: thread.department,
    });

    broadcast({
      type: "telegram_update",
      thread_id: targetThreadId,
      department: thread.department,
      message_id: telegramData.result?.message_id,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: "Failed to send who request", detail: message });
  }
});

router.get("/telegram/bots", (_req: Request, res: Response): void => {
  const bots = buildBotDirectory();
  res.json({ bots, total: bots.length, bridged: bots.filter((b) => b.hasThread).length });
});

router.put("/telegram/bot-token", (req: Request, res: Response): void => {
  try {
    const tokenEnv = String(req.body?.tokenEnv || "").trim().toUpperCase();
    const token = String(req.body?.token ?? "").trim();

    if (!tokenEnv) {
      res.status(400).json({ error: "tokenEnv is required" });
      return;
    }
    if (!/^[A-Z_][A-Z0-9_]*$/.test(tokenEnv)) {
      res.status(400).json({ error: "Invalid tokenEnv format" });
      return;
    }
    if (!token) {
      res.status(400).json({ error: "token is required" });
      return;
    }

    upsertEnvFileKey(ENV_PATH, tokenEnv, token);
    res.json({ ok: true, tokenEnv, path: ENV_PATH });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: "Failed to save bot token", detail: message });
  }
});

router.post("/telegram/sync-bridges", async (_req: Request, res: Response): Promise<void> => {
  try {
    const cfg = readAgencyConfig();
    if (!cfg?.departments || typeof cfg.departments !== "object") {
      res.status(400).json({ error: "agency-config departments missing" });
      return;
    }

    const envTokens = loadEnvTokens();
    const creatorEnv = String(cfg?.ceo?.token_env || "YASWARM_CEO_BOT_TOKEN");
    const creatorToken = envTokens[creatorEnv] || process.env[creatorEnv] || process.env.YASWARM_CEO_BOT_TOKEN;
    if (!creatorToken) {
      res.status(400).json({
        error: "Missing creator bot token for bridge provisioning",
        tokenEnv: creatorEnv,
      });
      return;
    }

    const synced: Array<{ department: string; status: string; thread_id: number | null; detail?: string }> = [];

    for (const [depKey, depCfg] of Object.entries(cfg.departments as Record<string, any>)) {
      const current = parseThreadId(depCfg?.topic_thread_id);
      if (current !== null) {
        synced.push({ department: depKey, status: "exists", thread_id: current });
        continue;
      }

      const topicName = String(depCfg?.topic_name || `${depCfg?.department || titleCase(depKey)} Head Bridge`);
      const created = await createForumTopic(creatorToken, topicName);
      if (!created.ok || !created.threadId) {
        synced.push({ department: depKey, status: "failed", thread_id: null, detail: created.error });
        continue;
      }

      depCfg.topic_thread_id = created.threadId;
      depCfg.topic_name = topicName;
      synced.push({ department: depKey, status: "created", thread_id: created.threadId });
    }

    let headsBridge: { status: string; thread_id: number | null; detail?: string } = {
      status: "exists",
      thread_id: parseThreadId(cfg?.ceo?.heads_topic_thread_id),
    };
    if (headsBridge.thread_id === null) {
      const headsName = String(cfg?.ceo?.heads_topic_name || "Department Heads Bridge");
      const createdHeads = await createForumTopic(creatorToken, headsName);
      if (!createdHeads.ok || !createdHeads.threadId) {
        headsBridge = { status: "failed", thread_id: null, detail: createdHeads.error };
      } else {
        cfg.ceo = cfg.ceo || {};
        cfg.ceo.heads_topic_name = headsName;
        cfg.ceo.heads_topic_thread_id = createdHeads.threadId;
        headsBridge = { status: "created", thread_id: createdHeads.threadId };
      }
    }

    cfg.updated_at = new Date().toISOString();
    saveAgencyConfig(cfg);

    res.json({
      ok: true,
      group_chat_id: GROUP_CHAT_ID,
      creator_token_env: creatorEnv,
      department_bridges: synced,
      heads_bridge: headsBridge,
      total_departments: Object.keys(cfg.departments).length,
      bridged_departments: synced.filter((x) => x.thread_id !== null).length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: "Failed to sync bridges", detail: message });
  }
});

export default router;
