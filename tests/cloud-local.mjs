// tests/cloud-local.ts
import { DatabaseSync } from "node:sqlite";
import { readdirSync } from "node:fs";
import { hashPassword } from "better-auth/crypto";

// lib/lesson.ts
import { z } from "zod";
var text = z.string().min(1).max(3e3);
var briefSchema = z.object({ topic: text.max(120), standard: z.enum(["InternationalLevel", "HSKLevel", "HSK30Level"]), level: z.string().min(1).max(20), minutes: z.number().int().min(15).max(180), students: z.number().int().min(1).max(100), mode: z.enum(["\u7EBF\u4E0B\u8BFE\u5802", "\u7EBF\u4E0A\u8BFE\u5802"]), outcome: text.max(600), known: z.string().max(2e3), passage: z.string().max(8e3), terms: z.string().max(1200) });
var goalSchema = z.object({ id: text.max(30), text, knowledgeIds: z.array(z.string().max(160)).max(25) });
var activitySchema = z.object({ id: text.max(30), title: text.max(100), minutes: z.number().int().min(1).max(180), goalIds: z.array(z.string().max(30)).max(10), knowledgeIds: z.array(z.string().max(160)).max(25), teacher: text, students: text, grouping: text.max(100), output: text, assessment: text });
var lessonSchema = z.object({ title: text.max(150), goals: z.array(goalSchema).min(1).max(8), activities: z.array(activitySchema).min(2).max(12), materials: z.array(z.object({ title: text.max(100), content: text })).max(12), exercises: z.array(z.object({ question: text, answer: text, goalIds: z.array(z.string().max(30)).max(10), knowledgeIds: z.array(z.string().max(160)).max(25) })).min(1).max(12), board: text, homework: text, notes: z.string().max(3e3) });
var initialBrief = { topic: "\u6BD4\u8F83\u5468\u672B\u51FA\u6E38\u65B9\u6848\u5E76\u63D0\u51FA\u5EFA\u8BAE", standard: "InternationalLevel", level: "3", minutes: 45, students: 20, mode: "\u7EBF\u4E0B\u8BFE\u5802", outcome: "\u5B66\u751F\u80FD\u6BD4\u8F83\u4E24\u4E2A\u51FA\u6E38\u65B9\u6848\uFF0C\u63D0\u51FA\u5EFA\u8BAE\uFF0C\u5E76\u7528\u81F3\u5C11\u4E24\u6761\u7406\u7531\u8BF4\u660E\u5C0F\u7EC4\u7684\u9009\u62E9\u3002", known: "\u65F6\u95F4\u3001\u5730\u70B9\u3001\u4EF7\u683C\uFF1B\u56E0\u4E3A\u2026\u2026\u6240\u4EE5\u2026\u2026", passage: "", terms: "\u4FBF\u5B9C\u3001\u65B9\u4FBF\u3001\u5EFA\u8BAE\u3001\u6BD4\u8F83\u3001\u6BD4" };
function splitTerms(s) {
  return [...new Set(s.split(/[、，,；;\n]+/).map((s2) => s2.trim()).filter(Boolean))].slice(0, 20);
}
function manualKnowledge(brief) {
  return splitTerms(brief.terms).map((name, i) => ({ id: `manual-${i}`, kind: "Word", name, role: "\u6838\u5FC3", verified: false, detail: "\u6559\u5E08\u6307\u5B9A\uFF0C\u5C1A\u672A\u901A\u8FC7\u77E5\u8BC6\u56FE\u8C31\u6838\u9A8C\u3002", example: "", levels: [], relations: [] }));
}
function templateLesson(b, k) {
  const ids2 = k.filter((x) => x.role === "\u6838\u5FC3").map((x) => x.id), names = k.filter((x) => x.role === "\u6838\u5FC3").map((x) => x.name).join("\u3001") || "\u6559\u5E08\u786E\u8BA4\u7684\u76EE\u6807\u8868\u8FBE";
  const weights = [5, 8, 10, 15, 7];
  let allocated = 0;
  const times = weights.map((w, i) => {
    const t = i === 4 ? b.minutes - allocated : Math.max(1, Math.floor(b.minutes * w / 45));
    allocated += t;
    return t;
  });
  const goals = [{ id: "g1", text: `\u5728\u201C${b.topic}\u201D\u60C5\u5883\u4E2D\u7406\u89E3\u5E76\u5C1D\u8BD5\u4F7F\u7528${names}\u3002`, knowledgeIds: ids2 }, { id: "g2", text: b.outcome, knowledgeIds: ids2 }];
  const steps = [
    ["\u590D\u4E60\u4E0E\u60C5\u5883\u5BFC\u5165", "\u5C55\u793A\u672C\u8BFE\u60C5\u5883\uFF0C\u8BE2\u95EE\u5B66\u751F\u5DF2\u6709\u7ECF\u9A8C\uFF1B\u7528\u5DF2\u5B66\u5185\u5BB9\u5B8C\u6210\u4E00\u6B21\u793A\u8303\u3002", "\u4E24\u4EBA\u4E92\u95EE\uFF0C\u8BB0\u5F55\u5DF2\u77E5\u4FE1\u606F\u548C\u4E00\u4E2A\u9700\u8981\u89E3\u51B3\u7684\u95EE\u9898\u3002", "\u4E24\u4EBA\u4E00\u7EC4", "\u4E00\u4EFD\u5DF2\u77E5\u4FE1\u606F\u6E05\u5355", "\u89C2\u5BDF\u662F\u5426\u80FD\u7528\u5DF2\u5B66\u8868\u8FBE\u56DE\u5E94\u3002", ["g1"]],
    ["\u77E5\u8BC6\u5448\u73B0\u4E0E\u7406\u89E3", "\u5448\u73B0\u786E\u8BA4\u8FC7\u7684\u77E5\u8BC6\u70B9\u53CA\u4F8B\u53E5\uFF0C\u6807\u660E\u7528\u6CD5\uFF1B\u8BF7\u5B66\u751F\u89E3\u91CA\u8868\u8FBE\u7684\u4F5C\u7528\u3002\u672A\u6838\u9A8C\u4F8B\u53E5\u7531\u6559\u5E08\u8865\u5145\u3002", "\u6BD4\u8F83\u4F8B\u53E5\uFF0C\u5728\u8BED\u5883\u4E2D\u9009\u62E9\u6070\u5F53\u8868\u8FBE\uFF0C\u5E76\u8BF4\u660E\u7406\u7531\u3002", "\u5168\u73ED\u4E0E\u540C\u4F34", "\u76EE\u6807\u8868\u8FBE\u53CA\u9002\u7528\u60C5\u5883\u914D\u5BF9", "\u7528\u4E00\u95EE\u4E00\u7B54\u68C0\u67E5\u7406\u89E3\uFF0C\u53CA\u65F6\u7EA0\u6B63\u3002", ["g1"]],
    ["\u4FE1\u606F\u5DEE\u64CD\u7EC3", "\u5411 A\u3001B \u53D1\u653E\u4E0D\u540C\u4FE1\u606F\u5361\uFF0C\u8981\u6C42\u901A\u8FC7\u63D0\u95EE\u8865\u5168\u4FE1\u606F\uFF0C\u4E0D\u80FD\u76F4\u63A5\u5C55\u793A\u5361\u7247\u3002", "\u8F6E\u6D41\u63D0\u95EE\u3001\u56DE\u7B54\uFF0C\u4F7F\u7528\u76EE\u6807\u8868\u8FBE\u8865\u5168\u8868\u683C\u3002", "\u4E24\u4EBA\u4E00\u7EC4", "\u4E00\u5F20\u53CC\u65B9\u5171\u540C\u5B8C\u6210\u7684\u4FE1\u606F\u8868", "\u62BD\u67E5\u4FE1\u606F\u51C6\u786E\u6027\u548C\u76EE\u6807\u8868\u8FBE\u4F7F\u7528\u60C5\u51B5\u3002", ["g1", "g2"]],
    ["\u5408\u4F5C\u4EA4\u9645\u4EFB\u52A1", "\u63D0\u51FA\u4E0E\u4E3B\u9898\u76F8\u5173\u3001\u9700\u8981\u5171\u540C\u51B3\u7B56\u7684\u95EE\u9898\u3002\u8981\u6C42\u5C0F\u7EC4\u6BD4\u8F83\u4FE1\u606F\u3001\u534F\u5546\u5E76\u8BF4\u660E\u7406\u7531\uFF1B\u5DE1\u89C6\u63D0\u4F9B\u652F\u67B6\u3002", "\u5206\u5DE5\u4EA4\u6D41\u5404\u81EA\u4FE1\u606F\uFF0C\u534F\u5546\u65B9\u6848\uFF0C\u5F62\u6210\u6709\u7406\u7531\u7684\u5171\u540C\u7ED3\u8BBA\u3002", `${Math.min(4, b.students)}\u4EBA\u4E00\u7EC4`, "\u4E00\u4E2A\u5C0F\u7EC4\u7ED3\u8BBA\u53CA\u81F3\u5C11\u4E24\u6761\u7406\u7531", "\u89C2\u5BDF\u4FE1\u606F\u4EA4\u6362\u3001\u7406\u7531\u662F\u5426\u660E\u786E\uFF0C\u8BB0\u5F55\u76EE\u6807\u8868\u8FBE\u7684\u4F7F\u7528\u3002", ["g2"]],
    ["\u6210\u679C\u5C55\u793A\u4E0E\u53CD\u9988", "\u9080\u8BF7\u4EE3\u8868\u6C47\u62A5\uFF0C\u7528\u76EE\u6807\u5BF9\u5E94\u7684\u68C0\u67E5\u9898\u8FDB\u884C\u8BC4\u4EF7\uFF0C\u5E76\u7ED9\u51FA\u4E00\u6761\u6539\u8FDB\u5EFA\u8BAE\u3002", "\u5C55\u793A\u7ED3\u8BBA\uFF0C\u56DE\u5E94\u540C\u4F34\u95EE\u9898\uFF0C\u5B8C\u6210\u51FA\u53E3\u6761\u3002", "\u5C0F\u7EC4\u6C47\u62A5\u4E0E\u4E2A\u4EBA\u53CD\u601D", "\u6C47\u62A5\u548C\u4E00\u5F20\u4E2A\u4EBA\u51FA\u53E3\u6761", "\u6309\u5185\u5BB9\u5B8C\u6210\u3001\u8868\u8FBE\u6070\u5F53\u3001\u7406\u7531\u5145\u5206\u4E09\u9879\u53CD\u9988\u3002", ["g1", "g2"]]
  ];
  return { title: b.topic, goals, activities: steps.map((s, i) => ({ id: `a${i + 1}`, title: s[0], minutes: times[i], teacher: s[1], students: s[2], grouping: s[3], output: s[4], assessment: s[5], goalIds: s[6], knowledgeIds: ids2 })), materials: [{ title: "\u4FE1\u606F\u5361 A\uFF08\u6A21\u677F\uFF0C\u6559\u5E08\u586B\u5145\uFF09", content: "\u60C5\u5883\uFF1A" + b.topic + "\n\u4F60\u77E5\u9053\uFF1A\u65B9\u6848\u4E00\u7684\u8D39\u7528\u3001\u65F6\u95F4\u3002\n\u4F60\u4E0D\u77E5\u9053\uFF1A\u65B9\u6848\u4E8C\u7684\u4FE1\u606F\u3002\n\u4EFB\u52A1\uFF1A\u5411\u540C\u4F34\u8BE2\u95EE\u4FE1\u606F\uFF1B\u5171\u540C\u4F5C\u51FA\u9009\u62E9\u3002\n\u8D39\u7528\u3001\u65F6\u95F4\u53CA\u5730\u70B9\u7B49\u5177\u4F53\u4FE1\u606F\u8BF7\u6559\u5E08\u6309\u4E3B\u9898\u8865\u5145\u3002" }, { title: "\u4FE1\u606F\u5361 B\uFF08\u6A21\u677F\uFF0C\u6559\u5E08\u586B\u5145\uFF09", content: "\u4F60\u77E5\u9053\uFF1A\u65B9\u6848\u4E8C\u7684\u8D39\u7528\u3001\u65F6\u95F4\u3002\n\u4F60\u4E0D\u77E5\u9053\uFF1A\u65B9\u6848\u4E00\u7684\u4FE1\u606F\u3002\n\u4EFB\u52A1\uFF1A\u56DE\u7B54\u540C\u4F34\u63D0\u95EE\uFF0C\u5E76\u63D0\u51FA\u4E00\u4E2A\u4E0D\u540C\u610F\u89C1\u3002" }, { title: "\u8BFE\u5802\u89C2\u5BDF\u8868", content: "\u25A1 \u4FE1\u606F\u4EA4\u6362\u5B8C\u6574\u3000\u25A1 \u4F7F\u7528\u76EE\u6807\u8868\u8FBE\u3000\u25A1 \u7ED9\u51FA\u7406\u7531\u3000\u25A1 \u56DE\u5E94\u540C\u4F34\n\u8BB0\u5F55\uFF1A\u5B66\u751F\u8868\u73B0\u3001\u9700\u8981\u8865\u5145\u7684\u77E5\u8BC6\u3001\u4E0B\u4E00\u8BFE\u8C03\u6574\u3002" }], exercises: [{ question: "\u9009\u62E9\u672C\u8BFE\u4E00\u4E2A\u76EE\u6807\u8868\u8FBE\uFF0C\u5728\u672C\u8BFE\u60C5\u5883\u4E2D\u8BF4\u4E00\u53E5\u8BDD\uFF0C\u5E76\u8BF4\u660E\u5B83\u8868\u8FBE\u7684\u610F\u601D\u3002", answer: "\u6559\u5E08\u6839\u636E\u5DF2\u786E\u8BA4\u7684\u91CA\u4E49\u548C\u4F7F\u7528\u6761\u4EF6\u6838\u9A8C\uFF1B\u89C2\u5BDF\u8868\u8FBE\u662F\u5426\u7B26\u5408\u8BED\u5883\u3002", goalIds: ["g1"], knowledgeIds: ids2 }, { question: "\u7ED3\u5408\u5C0F\u7EC4\u4EFB\u52A1\u8BF4\u51FA\u4F60\u7684\u9009\u62E9\uFF0C\u5E76\u8BF4\u660E\u7406\u7531\u3002", answer: "\u5F00\u653E\u7B54\u6848\uFF1B\u68C0\u67E5\u4EFB\u52A1\u5B8C\u6210\u3001\u7406\u7531\u6E05\u6670\u3001\u76EE\u6807\u8868\u8FBE\u6070\u5F53\u4E09\u9879\u3002", goalIds: ["g2"], knowledgeIds: ids2 }], board: `\u4E3B\u9898\uFF1A${b.topic}
\u6838\u5FC3\u8868\u8FBE\uFF1A${names}
\u4EFB\u52A1\uFF1A\u4EA4\u6362\u4FE1\u606F \u2192 \u6BD4\u8F83 \u2192 \u534F\u5546 \u2192 \u8BF4\u660E\u7406\u7531`, homework: "\u7528\u672C\u8BFE\u76EE\u6807\u8868\u8FBE\u5B8C\u6210\u4E00\u6BB5\u4E0E\u4E3B\u9898\u76F8\u5173\u7684\u8868\u8FBE\uFF0C\u6807\u51FA\u4F7F\u7528\u7684\u77E5\u8BC6\u70B9\uFF1B\u4E0B\u6B21\u8BFE\u4E0E\u540C\u4F34\u4EA4\u6362\u53CD\u9988\u3002", notes: "\u89C4\u5219\u6A21\u677F\u8349\u7A3F\uFF0C\u672A\u8C03\u7528\u5927\u6A21\u578B\u3002\u5177\u4F53\u60C5\u5883\u3001\u4FE1\u606F\u5361\u6570\u636E\u3001\u4F8B\u53E5\u9002\u5207\u6027\u548C\u6D3B\u52A8\u96BE\u5EA6\u9700\u6559\u5E08\u8865\u5145\u5BA1\u6838\u3002" };
}

// tests/cloud-local.ts
import assert from "node:assert/strict";
var dir = ".wrangler/state/v3/d1/miniflare-D1DatabaseObject/";
var db = new DatabaseSync(dir + readdirSync(dir).find((f) => f.endsWith(".sqlite") && f !== "metadata.sqlite"));
var base = "http://127.0.0.1:5173";
var prefix = "qa" + Date.now();
var password = crypto.randomUUID() + "Ab1!";
var requestNumber = 0;
async function call(path, data, cookie = "") {
  const r = await fetch(base + path, { method: data ? "POST" : "GET", headers: { "CF-Connecting-IP": "198.51.100." + ++requestNumber, Origin: base, "Content-Type": "application/json", Cookie: cookie }, body: data ? JSON.stringify(data) : void 0 });
  return { r, d: await r.json() };
}
async function login(username, pw = password) {
  const x = await call("/api/account/login", { username, password: pw });
  assert.equal(x.r.status, 200, JSON.stringify(x.d));
  return x.r.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
}
var ids = [prefix + "a", prefix + "b", prefix + "admin"];
var workspace = "";
try {
  const hash = await hashPassword(password);
  for (const id of ids) {
    db.prepare("INSERT INTO auth_user(id,name,email,email_verified,created_at,updated_at) VALUES(?,?,?,?,?,?)").run(id, "Disposable QA", id + "@example.invalid", 0, Date.now(), Date.now());
    db.prepare("INSERT INTO auth_account(id,account_id,provider_id,user_id,password,created_at,updated_at) VALUES(?,?,?,?,?,?,?)").run(id, id, "credential", id, hash, Date.now(), Date.now());
    db.prepare("INSERT INTO site_accounts(user_id,username,role,enabled,created_at) VALUES(?,?,?,?,?)").run(id, id, id.endsWith("admin") ? "admin" : "user", 1, Date.now());
  }
  const [a, b, admin] = await Promise.all(ids.map((id) => login(id)));
  assert.equal((await call("/api/account/me", void 0, a)).d.user.username, ids[0]);
  assert.equal((await call("/api/admin/accounts", void 0, a)).r.status, 403);
  assert.equal((await call("/api/admin/usage", void 0, a)).r.status, 403);
  assert.equal((await call("/api/admin/accounts", { action: "create", username: prefix + "x", name: "No permission", password }, a)).r.status, 403);
  const created = await call("/api/admin/accounts", { action: "create", username: prefix + "created", name: "Created fixture", password }, admin);
  assert.equal(created.r.status, 200, JSON.stringify(created.d));
  ids.push(created.d.id);
  const createdId = created.d.id;
  const createdCookie = await login(prefix + "created");
  assert.equal((await call("/api/account/me", void 0, createdCookie)).d.user.role, "user");
  const k = manualKnowledge(initialBrief), draft = { brief: initialBrief, knowledge: k, lesson: templateLesson(initialBrief, k), source: "template", createdAt: (/* @__PURE__ */ new Date()).toISOString() };
  const saved = await call("/api/workspaces", { draft }, a);
  assert.equal(saved.r.status, 200, JSON.stringify(saved.d));
  workspace = saved.d.id;
  assert.equal((await call("/api/workspaces?id=" + workspace, void 0, a)).d.draft.lesson.title, draft.lesson.title);
  assert.equal((await call("/api/workspaces?id=" + workspace, void 0, b)).r.status, 404);
  assert.equal((await call("/api/workspaces", { id: workspace, draft }, b)).r.status, 404);
  assert.equal((await call("/api/workspaces", void 0, b)).d.items.length, 0);
  await call("/api/workspaces", { id: workspace, draft }, a);
  assert.equal((await call("/api/workspaces?id=" + workspace, void 0, a)).d.revisions.length, 2);
  assert.equal((await call("/api/media", { kind: "image", text: "" }, a)).r.status, 422);
  assert.equal((await call("/api/media", { kind: "speech", text: "\u4F60\u597D\u3002" }, a)).r.status, 403);
  assert.equal((await call("/api/media", { kind: "speech", text: "\u4F60\u597D\u3002" })).r.status, 401);
  assert.equal((await call("/api/admin/accounts", { action: "toggle", id: createdId, enabled: false }, admin)).r.status, 200);
  assert.equal((await call("/api/workspaces", void 0, createdCookie)).r.status, 401);
  assert.equal((await call("/api/account/login", { username: prefix + "created", password })).r.status, 401);
  await call("/api/admin/accounts", { action: "toggle", id: createdId, enabled: true }, admin);
  const newPw = crypto.randomUUID() + "Cc2!";
  assert.equal((await call("/api/admin/accounts", { action: "reset", id: createdId, password: newPw }, admin)).r.status, 200);
  assert.equal((await call("/api/account/login", { username: prefix + "created", password })).r.status, 401);
  await login(prefix + "created", newPw);
  db.prepare("INSERT INTO usage_events(id,user_id,kind,status,model,created_at) VALUES(?,?,?,?,?,?)").run(prefix, ids[0], "image", "success", "fixture-only", Date.now());
  const stats = await call("/api/admin/usage", void 0, admin);
  assert.equal(stats.r.status, 200);
  assert.ok(stats.d.recent.some((x) => x.username === ids[0] && x.model === "fixture-only"));
  assert.equal((await call("/api/auth/sign-up/email", { email: "fixture@example.invalid", password, name: "fixture" })).r.status, 403);
  await call("/api/auth/sign-out", {}, a);
  assert.equal((await call("/api/workspaces", void 0, a)).r.status, 401);
  console.log("PASS: unverified assigned-account login, cloud isolation, admin access control, create/disable/reset, session revocation, usage reporting, missing-media guards and blocked public signup.");
} finally {
  if (workspace) {
    db.prepare("DELETE FROM lesson_revisions WHERE workspace_id=?").run(workspace);
    db.prepare("DELETE FROM lesson_workspaces WHERE id=?").run(workspace);
  }
  for (const id of ids) {
    db.prepare("DELETE FROM usage_events WHERE user_id=?").run(id);
    db.prepare("DELETE FROM site_daily_usage WHERE user_id=?").run(id);
    db.prepare("DELETE FROM auth_session WHERE user_id=?").run(id);
    db.prepare("DELETE FROM auth_account WHERE user_id=?").run(id);
    db.prepare("DELETE FROM site_accounts WHERE user_id=?").run(id);
    db.prepare("DELETE FROM auth_user WHERE id=?").run(id);
  }
  db.close();
}
