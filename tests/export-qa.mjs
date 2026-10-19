// tests/export-qa.ts
import { writeFile, mkdir } from "node:fs/promises";

// lib/lesson.ts
import { z } from "zod";
var text = z.string().min(1).max(3e3);
var briefSchema = z.object({ topic: text.max(120), standard: z.enum(["InternationalLevel", "HSKLevel", "HSK30Level"]), level: z.string().min(1).max(20), minutes: z.number().int().min(15).max(180), students: z.number().int().min(1).max(100), mode: z.enum(["\u7EBF\u4E0B\u8BFE\u5802", "\u7EBF\u4E0A\u8BFE\u5802"]), outcome: text.max(600), known: z.string().max(2e3), passage: z.string().max(8e3), terms: z.string().max(1200) });
var goalSchema = z.object({ id: text.max(30), text, knowledgeIds: z.array(z.string().max(160)).max(25) });
var activitySchema = z.object({ id: text.max(30), title: text.max(100), minutes: z.number().int().min(1).max(180), goalIds: z.array(z.string().max(30)).max(10), knowledgeIds: z.array(z.string().max(160)).max(25), teacher: text, students: text, grouping: text.max(100), output: text, assessment: text });
var lessonSchema = z.object({ title: text.max(150), goals: z.array(goalSchema).min(1).max(8), activities: z.array(activitySchema).min(2).max(12), materials: z.array(z.object({ title: text.max(100), content: text })).max(12), exercises: z.array(z.object({ question: text, answer: text, goalIds: z.array(z.string().max(30)).max(10), knowledgeIds: z.array(z.string().max(160)).max(25) })).min(1).max(12), board: text, homework: text, notes: z.string().max(3e3) });
var initialBrief = { topic: "\u6BD4\u8F83\u5468\u672B\u51FA\u6E38\u65B9\u6848\u5E76\u63D0\u51FA\u5EFA\u8BAE", standard: "InternationalLevel", level: "3", minutes: 45, students: 20, mode: "\u7EBF\u4E0B\u8BFE\u5802", outcome: "\u5B66\u751F\u80FD\u6BD4\u8F83\u4E24\u4E2A\u51FA\u6E38\u65B9\u6848\uFF0C\u63D0\u51FA\u5EFA\u8BAE\uFF0C\u5E76\u7528\u81F3\u5C11\u4E24\u6761\u7406\u7531\u8BF4\u660E\u5C0F\u7EC4\u7684\u9009\u62E9\u3002", known: "\u65F6\u95F4\u3001\u5730\u70B9\u3001\u4EF7\u683C\uFF1B\u56E0\u4E3A\u2026\u2026\u6240\u4EE5\u2026\u2026", passage: "", terms: "\u4FBF\u5B9C\u3001\u65B9\u4FBF\u3001\u5EFA\u8BAE\u3001\u6BD4\u8F83\u3001\u6BD4" };
function templateLesson(b2, k2) {
  const ids = k2.filter((x) => x.role === "\u6838\u5FC3").map((x) => x.id), names = k2.filter((x) => x.role === "\u6838\u5FC3").map((x) => x.name).join("\u3001") || "\u6559\u5E08\u786E\u8BA4\u7684\u76EE\u6807\u8868\u8FBE";
  const weights = [5, 8, 10, 15, 7];
  let allocated = 0;
  const times = weights.map((w, i) => {
    const t = i === 4 ? b2.minutes - allocated : Math.max(1, Math.floor(b2.minutes * w / 45));
    allocated += t;
    return t;
  });
  const goals = [{ id: "g1", text: `\u5728\u201C${b2.topic}\u201D\u60C5\u5883\u4E2D\u7406\u89E3\u5E76\u5C1D\u8BD5\u4F7F\u7528${names}\u3002`, knowledgeIds: ids }, { id: "g2", text: b2.outcome, knowledgeIds: ids }];
  const steps = [
    ["\u590D\u4E60\u4E0E\u60C5\u5883\u5BFC\u5165", "\u5C55\u793A\u672C\u8BFE\u60C5\u5883\uFF0C\u8BE2\u95EE\u5B66\u751F\u5DF2\u6709\u7ECF\u9A8C\uFF1B\u7528\u5DF2\u5B66\u5185\u5BB9\u5B8C\u6210\u4E00\u6B21\u793A\u8303\u3002", "\u4E24\u4EBA\u4E92\u95EE\uFF0C\u8BB0\u5F55\u5DF2\u77E5\u4FE1\u606F\u548C\u4E00\u4E2A\u9700\u8981\u89E3\u51B3\u7684\u95EE\u9898\u3002", "\u4E24\u4EBA\u4E00\u7EC4", "\u4E00\u4EFD\u5DF2\u77E5\u4FE1\u606F\u6E05\u5355", "\u89C2\u5BDF\u662F\u5426\u80FD\u7528\u5DF2\u5B66\u8868\u8FBE\u56DE\u5E94\u3002", ["g1"]],
    ["\u77E5\u8BC6\u5448\u73B0\u4E0E\u7406\u89E3", "\u5448\u73B0\u786E\u8BA4\u8FC7\u7684\u77E5\u8BC6\u70B9\u53CA\u4F8B\u53E5\uFF0C\u6807\u660E\u7528\u6CD5\uFF1B\u8BF7\u5B66\u751F\u89E3\u91CA\u8868\u8FBE\u7684\u4F5C\u7528\u3002\u672A\u6838\u9A8C\u4F8B\u53E5\u7531\u6559\u5E08\u8865\u5145\u3002", "\u6BD4\u8F83\u4F8B\u53E5\uFF0C\u5728\u8BED\u5883\u4E2D\u9009\u62E9\u6070\u5F53\u8868\u8FBE\uFF0C\u5E76\u8BF4\u660E\u7406\u7531\u3002", "\u5168\u73ED\u4E0E\u540C\u4F34", "\u76EE\u6807\u8868\u8FBE\u53CA\u9002\u7528\u60C5\u5883\u914D\u5BF9", "\u7528\u4E00\u95EE\u4E00\u7B54\u68C0\u67E5\u7406\u89E3\uFF0C\u53CA\u65F6\u7EA0\u6B63\u3002", ["g1"]],
    ["\u4FE1\u606F\u5DEE\u64CD\u7EC3", "\u5411 A\u3001B \u53D1\u653E\u4E0D\u540C\u4FE1\u606F\u5361\uFF0C\u8981\u6C42\u901A\u8FC7\u63D0\u95EE\u8865\u5168\u4FE1\u606F\uFF0C\u4E0D\u80FD\u76F4\u63A5\u5C55\u793A\u5361\u7247\u3002", "\u8F6E\u6D41\u63D0\u95EE\u3001\u56DE\u7B54\uFF0C\u4F7F\u7528\u76EE\u6807\u8868\u8FBE\u8865\u5168\u8868\u683C\u3002", "\u4E24\u4EBA\u4E00\u7EC4", "\u4E00\u5F20\u53CC\u65B9\u5171\u540C\u5B8C\u6210\u7684\u4FE1\u606F\u8868", "\u62BD\u67E5\u4FE1\u606F\u51C6\u786E\u6027\u548C\u76EE\u6807\u8868\u8FBE\u4F7F\u7528\u60C5\u51B5\u3002", ["g1", "g2"]],
    ["\u5408\u4F5C\u4EA4\u9645\u4EFB\u52A1", "\u63D0\u51FA\u4E0E\u4E3B\u9898\u76F8\u5173\u3001\u9700\u8981\u5171\u540C\u51B3\u7B56\u7684\u95EE\u9898\u3002\u8981\u6C42\u5C0F\u7EC4\u6BD4\u8F83\u4FE1\u606F\u3001\u534F\u5546\u5E76\u8BF4\u660E\u7406\u7531\uFF1B\u5DE1\u89C6\u63D0\u4F9B\u652F\u67B6\u3002", "\u5206\u5DE5\u4EA4\u6D41\u5404\u81EA\u4FE1\u606F\uFF0C\u534F\u5546\u65B9\u6848\uFF0C\u5F62\u6210\u6709\u7406\u7531\u7684\u5171\u540C\u7ED3\u8BBA\u3002", `${Math.min(4, b2.students)}\u4EBA\u4E00\u7EC4`, "\u4E00\u4E2A\u5C0F\u7EC4\u7ED3\u8BBA\u53CA\u81F3\u5C11\u4E24\u6761\u7406\u7531", "\u89C2\u5BDF\u4FE1\u606F\u4EA4\u6362\u3001\u7406\u7531\u662F\u5426\u660E\u786E\uFF0C\u8BB0\u5F55\u76EE\u6807\u8868\u8FBE\u7684\u4F7F\u7528\u3002", ["g2"]],
    ["\u6210\u679C\u5C55\u793A\u4E0E\u53CD\u9988", "\u9080\u8BF7\u4EE3\u8868\u6C47\u62A5\uFF0C\u7528\u76EE\u6807\u5BF9\u5E94\u7684\u68C0\u67E5\u9898\u8FDB\u884C\u8BC4\u4EF7\uFF0C\u5E76\u7ED9\u51FA\u4E00\u6761\u6539\u8FDB\u5EFA\u8BAE\u3002", "\u5C55\u793A\u7ED3\u8BBA\uFF0C\u56DE\u5E94\u540C\u4F34\u95EE\u9898\uFF0C\u5B8C\u6210\u51FA\u53E3\u6761\u3002", "\u5C0F\u7EC4\u6C47\u62A5\u4E0E\u4E2A\u4EBA\u53CD\u601D", "\u6C47\u62A5\u548C\u4E00\u5F20\u4E2A\u4EBA\u51FA\u53E3\u6761", "\u6309\u5185\u5BB9\u5B8C\u6210\u3001\u8868\u8FBE\u6070\u5F53\u3001\u7406\u7531\u5145\u5206\u4E09\u9879\u53CD\u9988\u3002", ["g1", "g2"]]
  ];
  return { title: b2.topic, goals, activities: steps.map((s, i) => ({ id: `a${i + 1}`, title: s[0], minutes: times[i], teacher: s[1], students: s[2], grouping: s[3], output: s[4], assessment: s[5], goalIds: s[6], knowledgeIds: ids })), materials: [{ title: "\u4FE1\u606F\u5361 A\uFF08\u6A21\u677F\uFF0C\u6559\u5E08\u586B\u5145\uFF09", content: "\u60C5\u5883\uFF1A" + b2.topic + "\n\u4F60\u77E5\u9053\uFF1A\u65B9\u6848\u4E00\u7684\u8D39\u7528\u3001\u65F6\u95F4\u3002\n\u4F60\u4E0D\u77E5\u9053\uFF1A\u65B9\u6848\u4E8C\u7684\u4FE1\u606F\u3002\n\u4EFB\u52A1\uFF1A\u5411\u540C\u4F34\u8BE2\u95EE\u4FE1\u606F\uFF1B\u5171\u540C\u4F5C\u51FA\u9009\u62E9\u3002\n\u8D39\u7528\u3001\u65F6\u95F4\u53CA\u5730\u70B9\u7B49\u5177\u4F53\u4FE1\u606F\u8BF7\u6559\u5E08\u6309\u4E3B\u9898\u8865\u5145\u3002" }, { title: "\u4FE1\u606F\u5361 B\uFF08\u6A21\u677F\uFF0C\u6559\u5E08\u586B\u5145\uFF09", content: "\u4F60\u77E5\u9053\uFF1A\u65B9\u6848\u4E8C\u7684\u8D39\u7528\u3001\u65F6\u95F4\u3002\n\u4F60\u4E0D\u77E5\u9053\uFF1A\u65B9\u6848\u4E00\u7684\u4FE1\u606F\u3002\n\u4EFB\u52A1\uFF1A\u56DE\u7B54\u540C\u4F34\u63D0\u95EE\uFF0C\u5E76\u63D0\u51FA\u4E00\u4E2A\u4E0D\u540C\u610F\u89C1\u3002" }, { title: "\u8BFE\u5802\u89C2\u5BDF\u8868", content: "\u25A1 \u4FE1\u606F\u4EA4\u6362\u5B8C\u6574\u3000\u25A1 \u4F7F\u7528\u76EE\u6807\u8868\u8FBE\u3000\u25A1 \u7ED9\u51FA\u7406\u7531\u3000\u25A1 \u56DE\u5E94\u540C\u4F34\n\u8BB0\u5F55\uFF1A\u5B66\u751F\u8868\u73B0\u3001\u9700\u8981\u8865\u5145\u7684\u77E5\u8BC6\u3001\u4E0B\u4E00\u8BFE\u8C03\u6574\u3002" }], exercises: [{ question: "\u9009\u62E9\u672C\u8BFE\u4E00\u4E2A\u76EE\u6807\u8868\u8FBE\uFF0C\u5728\u672C\u8BFE\u60C5\u5883\u4E2D\u8BF4\u4E00\u53E5\u8BDD\uFF0C\u5E76\u8BF4\u660E\u5B83\u8868\u8FBE\u7684\u610F\u601D\u3002", answer: "\u6559\u5E08\u6839\u636E\u5DF2\u786E\u8BA4\u7684\u91CA\u4E49\u548C\u4F7F\u7528\u6761\u4EF6\u6838\u9A8C\uFF1B\u89C2\u5BDF\u8868\u8FBE\u662F\u5426\u7B26\u5408\u8BED\u5883\u3002", goalIds: ["g1"], knowledgeIds: ids }, { question: "\u7ED3\u5408\u5C0F\u7EC4\u4EFB\u52A1\u8BF4\u51FA\u4F60\u7684\u9009\u62E9\uFF0C\u5E76\u8BF4\u660E\u7406\u7531\u3002", answer: "\u5F00\u653E\u7B54\u6848\uFF1B\u68C0\u67E5\u4EFB\u52A1\u5B8C\u6210\u3001\u7406\u7531\u6E05\u6670\u3001\u76EE\u6807\u8868\u8FBE\u6070\u5F53\u4E09\u9879\u3002", goalIds: ["g2"], knowledgeIds: ids }], board: `\u4E3B\u9898\uFF1A${b2.topic}
\u6838\u5FC3\u8868\u8FBE\uFF1A${names}
\u4EFB\u52A1\uFF1A\u4EA4\u6362\u4FE1\u606F \u2192 \u6BD4\u8F83 \u2192 \u534F\u5546 \u2192 \u8BF4\u660E\u7406\u7531`, homework: "\u7528\u672C\u8BFE\u76EE\u6807\u8868\u8FBE\u5B8C\u6210\u4E00\u6BB5\u4E0E\u4E3B\u9898\u76F8\u5173\u7684\u8868\u8FBE\uFF0C\u6807\u51FA\u4F7F\u7528\u7684\u77E5\u8BC6\u70B9\uFF1B\u4E0B\u6B21\u8BFE\u4E0E\u540C\u4F34\u4EA4\u6362\u53CD\u9988\u3002", notes: "\u89C4\u5219\u6A21\u677F\u8349\u7A3F\uFF0C\u672A\u8C03\u7528\u5927\u6A21\u578B\u3002\u5177\u4F53\u60C5\u5883\u3001\u4FE1\u606F\u5361\u6570\u636E\u3001\u4F8B\u53E5\u9002\u5207\u6027\u548C\u6D3B\u52A8\u96BE\u5EA6\u9700\u6559\u5E08\u8865\u5145\u5BA1\u6838\u3002" };
}
function checkLesson(l, b2, k2) {
  const issues = [];
  const add = (text2, severity = "warning") => issues.push({ text: text2, severity });
  const total = l.activities.reduce((s, a) => s + a.minutes, 0);
  if (total !== b2.minutes) add(`\u73AF\u8282\u5171 ${total} \u5206\u949F\uFF0C\u4E0E\u8BFE\u65F6 ${b2.minutes} \u5206\u949F\u4E0D\u4E00\u81F4\u3002`, "error");
  const ks = new Set(k2.filter((x) => x.role !== "\u6392\u9664").map((x) => x.id)), gs = new Set(l.goals.map((g) => g.id));
  for (const g of l.goals) {
    if (!l.activities.some((a) => a.goalIds.includes(g.id))) add(`\u76EE\u6807\u300C${g.text}\u300D\u6CA1\u6709\u6D3B\u52A8\u8BAD\u7EC3\u3002`, "error");
    if (!l.exercises.some((e) => e.goalIds.includes(g.id))) add(`\u76EE\u6807\u300C${g.text}\u300D\u6CA1\u6709\u68C0\u67E5\u9898\u3002`, "error");
  }
  for (const x of k2.filter((x2) => x2.role === "\u6838\u5FC3")) {
    if (!l.activities.some((a) => a.knowledgeIds.includes(x.id))) add(`\u6838\u5FC3\u77E5\u8BC6\u300C${x.name}\u300D\u672A\u5173\u8054\u6D3B\u52A8\u3002`, "error");
    if (!l.exercises.some((e) => e.knowledgeIds.includes(x.id))) add(`\u6838\u5FC3\u77E5\u8BC6\u300C${x.name}\u300D\u672A\u5173\u8054\u7EC3\u4E60\u3002`, "error");
  }
  for (const x of [...l.goals, ...l.activities, ...l.exercises]) for (const id of x.knowledgeIds) if (!ks.has(id)) add(`\u51FA\u73B0\u672A\u786E\u8BA4\u6216\u5DF2\u6392\u9664\u7684\u77E5\u8BC6\u6807\u8BC6\uFF1A${id}\u3002`, "error");
  for (const x of [...l.activities, ...l.exercises]) for (const id of x.goalIds) if (!gs.has(id)) add(`\u5F15\u7528\u4E0D\u5B58\u5728\u7684\u6559\u5B66\u76EE\u6807\uFF1A${id}\u3002`, "error");
  const pending = k2.filter((x) => !x.verified && x.role !== "\u6392\u9664");
  if (pending.length) add(`${pending.length} \u4E2A\u77E5\u8BC6\u70B9\u672A\u901A\u8FC7\u56FE\u8C31\u6838\u9A8C\uFF0C\u4E0D\u80FD\u4F5C\u4E3A\u56FE\u8C31\u4E8B\u5B9E\u5F15\u7528\u3002`);
  if (k2.filter((x) => x.role === "\u6838\u5FC3").length > Math.ceil(b2.minutes / 5)) add("\u672C\u8BFE\u6838\u5FC3\u77E5\u8BC6\u91CF\u53EF\u80FD\u504F\u591A\uFF0C\u5EFA\u8BAE\u6309\u5B66\u751F\u57FA\u7840\u5220\u51CF\u3002");
  if (!k2.some((x) => x.role === "\u6838\u5FC3")) add("\u5C1A\u672A\u786E\u8BA4\u672C\u8BFE\u6838\u5FC3\u77E5\u8BC6\u3002", "error");
  if (l.goals.some((g, i) => l.goals.findIndex((x) => x.id === g.id) !== i)) add("\u6559\u5B66\u76EE\u6807\u6807\u8BC6\u91CD\u590D\u3002", "error");
  if (l.activities.some((a, i) => l.activities.findIndex((x) => x.id === a.id) !== i)) add("\u8BFE\u5802\u73AF\u8282\u6807\u8BC6\u91CD\u590D\u3002", "error");
  for (const x of k2.filter((x2) => x2.verified && x2.role !== "\u6392\u9664")) if (!x.scopeConfirmed) add(`\u300C${x.name}\u300D\u5C1A\u672A\u786E\u8BA4\u9002\u5408\u672C\u8BFE\u7684\u4E49\u9879\u4E0E\u4F8B\u53E5\u3002`);
  add("\u7ED3\u6784\u4E0E\u5F15\u7528\u68C0\u67E5\u4E0D\u7B49\u4E8E\u5185\u5BB9\u51C6\u786E\u6027\u8BA4\u8BC1\uFF1BAI\u6D3B\u52A8\u3001\u7EC3\u4E60\u53CA\u65B0\u7F16\u8868\u8FBE\u5FC5\u987B\u7531\u6559\u5E08\u5BA1\u6838\u3002");
  return issues;
}
var standardNames = { InternationalLevel: "\u300A\u7B49\u7EA7\u6807\u51C6\u300B", HSKLevel: "HSK 2.0", HSK30Level: "HSK 3.0" };

// lib/evidence.ts
import { z as z2 } from "zod";
var selectionSchema = z2.object({ id: z2.string().min(1).max(160), name: z2.string().min(1).max(80), kind: z2.enum(["Word", "Grammar", "Character"]), role: z2.enum(["\u6838\u5FC3", "\u590D\u4E60", "\u62D3\u5C55", "\u6392\u9664"]), selectedMeaning: z2.string().max(2500).default(""), selectedExamples: z2.array(z2.string().max(1500)).max(5).default([]), scopeConfirmed: z2.boolean().default(false) });
function groundedBlocks(knowledge) {
  return knowledge.filter((k2) => k2.verified && k2.scopeConfirmed && k2.role !== "\u6392\u9664").map((k2) => ({ knowledgeId: k2.id, name: k2.name, kind: k2.kind, role: k2.role, meaning: k2.selectedMeaning || "", examples: k2.selectedExamples || [], levels: k2.levels, source: "\u56FD\u9645\u4E2D\u6587\u6559\u80B2\u77E5\u8BC6\u56FE\u8C31", url: "https://kg.chineseplus.net", checkedAt: k2.checkedAt, standard: k2.evidence?.standard, query: k2.query, parameters: k2.evidence?.parameters }));
}

// lib/export.ts
async function makeWord(d2, kind = "teacher") {
  const { Document, Packer, Paragraph, HeadingLevel, TextRun, Table, TableRow, TableCell, WidthType, ShadingType, AlignmentType, BorderStyle } = await import("docx");
  const font = { ascii: "Arial", hAnsi: "Arial", eastAsia: "Hiragino Sans GB" };
  const p = (s, indent = true) => s.split("\n").map((line) => new Paragraph({ children: [new TextRun({ text: line, font, size: 22 })], indent: indent ? { firstLine: 440 } : void 0, spacing: { after: 120, line: 340 } }));
  const h = (s) => new Paragraph({ text: s, heading: HeadingLevel.HEADING_1, keepNext: true, spacing: { before: 240, after: 140 } });
  const sub = (s) => new Paragraph({ text: s, heading: HeadingLevel.HEADING_2, keepNext: true, spacing: { before: 200, after: 100 } });
  const title = (s) => new Paragraph({ text: s, heading: HeadingLevel.TITLE });
  const t = (headers, rows, widths) => new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, columnWidths: widths, borders: { top: { style: BorderStyle.SINGLE, size: 4, color: "CAD3C6" }, bottom: { style: BorderStyle.SINGLE, size: 4, color: "CAD3C6" }, left: { style: BorderStyle.SINGLE, size: 4, color: "CAD3C6" }, right: { style: BorderStyle.SINGLE, size: 4, color: "CAD3C6" }, insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: "DCE2D8" }, insideVertical: { style: BorderStyle.SINGLE, size: 4, color: "DCE2D8" } }, rows: [headers, ...rows].map((row, i) => new TableRow({ tableHeader: i === 0, cantSplit: true, children: row.map((v, n) => new TableCell({ width: { size: widths[n], type: WidthType.DXA }, margins: { top: 90, bottom: 90, left: 100, right: 100 }, shading: i === 0 ? { type: ShadingType.CLEAR, fill: "EDF2E8" } : void 0, children: v.split("\n").map((line) => new Paragraph({ children: [new TextRun({ text: line, font, size: 20, bold: i === 0 })], spacing: { after: 70, line: 280 } })) })) })) });
  const l = d2.lesson, blocks = groundedBlocks(d2.knowledge), knowledgeName = (ids) => ids.map((id) => d2.knowledge.find((k2) => k2.id === id)?.name || "\u672A\u8BC6\u522B\u77E5\u8BC6").join("\u3001");
  const children = [];
  if (kind === "teacher") {
    children.push(title(l.title + " \u6559\u5E08\u6559\u6848"), t(["\u9879\u76EE", "\u6559\u5B66\u5B89\u6392"], [["\u7B49\u7EA7\u4E0E\u5BF9\u8C61", `${standardNames[d2.brief.standard]} ${d2.brief.level}\u7EA7\u3000${d2.brief.students}\u4EBA`], ["\u8BFE\u65F6\u4E0E\u65B9\u5F0F", `${d2.brief.minutes}\u5206\u949F\u3000${d2.brief.mode}`], ["\u5DF2\u5B66\u5185\u5BB9", d2.brief.known || "\u6559\u5E08\u5F85\u8865\u5145"], ["\u9884\u671F\u5B66\u4E60\u6210\u679C", d2.brief.outcome]], [1900, 7460]), h("\u6559\u5B66\u76EE\u6807"), ...l.goals.flatMap((g, i) => p(`${i + 1}\u3000${g.text}`)), h("\u672C\u8BFE\u77E5\u8BC6\u4E0E\u91CD\u70B9"));
    if (blocks.length) for (const b2 of blocks) children.push(sub(b2.name + " " + b2.role), ...p(b2.meaning || "\u56FE\u8C31\u672A\u63D0\u4F9B\u91CA\u4E49\uFF0C\u8BB2\u89E3\u524D\u9700\u6559\u5E08\u8865\u5145\u6838\u9A8C\u3002"), ...b2.examples.flatMap((s, i) => p(`\u4F8B\u53E5${i + 1}\u3000${s}`, false)));
    else children.push(...p("\u672C\u8BFE\u5C1A\u672A\u5F62\u6210\u5DF2\u786E\u8BA4\u7684\u56FE\u8C31\u539F\u6587\u6E05\u5355\u3002\u4EE5\u4E0B\u4EC5\u4E3A\u8BBE\u8BA1\u8349\u7A3F\uFF0C\u4E0D\u5F97\u4F5C\u4E3A\u5DF2\u6838\u9A8C\u6559\u6848\u4F7F\u7528\u3002"));
    children.push(h("\u6559\u5B66\u8FC7\u7A0B"), t(["\u73AF\u8282", "\u65F6\u95F4", "\u77E5\u8BC6\u5185\u5BB9", "\u6559\u5E08\u6D3B\u52A8", "\u5B66\u751F\u6D3B\u52A8", "\u4EA7\u51FA\u4E0E\u8BC4\u4EF7"], l.activities.map((a) => [a.title, `${a.minutes}\u5206\u949F`, knowledgeName(a.knowledgeIds), a.teacher, `${a.grouping}
${a.students}`, `${a.output}
\u8BC4\u4EF7\uFF1A${a.assessment}`]), [1050, 800, 1350, 2200, 2050, 1910]), h("\u8BFE\u5802\u68C0\u67E5\u4E0E\u53C2\u8003\u7B54\u6848"));
    for (const [i, e] of l.exercises.entries()) children.push(sub(`\u68C0\u67E5\u9898 ${i + 1}`), ...p(e.question), ...p("\u53C2\u8003\u7B54\u6848\u6216\u8BC4\u5206\u6807\u51C6\uFF1A" + e.answer));
    children.push(h("\u677F\u4E66\u8BBE\u8BA1"), ...p(l.board, false), h("\u8BFE\u540E\u4E0E\u5206\u5C42\u4EFB\u52A1"), ...p(l.homework), h("\u914D\u5957\u6750\u6599\u6E05\u5355"), ...l.materials.flatMap((m, i) => p(`${i + 1}\u3000${m.title}`, false)), h("\u6559\u5E08\u5BA1\u6838\u8BB0\u5F55"), ...p(d2.reviewed ? "\u6559\u5E08\u5DF2\u786E\u8BA4\u5BA1\u6838\uFF1B\u540E\u7EED\u4FEE\u6539\u5E94\u91CD\u65B0\u5BA1\u6838\u3002" : "\u5C1A\u672A\u7ECF\u6559\u5E08\u5BA1\u6838\u3002\u6D3B\u52A8\u3001\u7EC3\u4E60\u3001\u65B0\u7F16\u60C5\u5883\u548C\u89E3\u91CA\u987B\u6838\u5BF9\u540E\u4F7F\u7528\u3002"));
  } else if (kind === "student") {
    children.push(title(l.title + " \u5B66\u751F\u6750\u6599"), ...p(`\u73ED\u7EA7\uFF1A____________\u3000\u59D3\u540D\uFF1A____________\u3000\u65E5\u671F\uFF1A____________`, false), h("\u8BFE\u5802\u4EFB\u52A1"), ...p(d2.brief.outcome));
    for (const m of l.materials.filter((m2) => !/(教师|观察表|评分|参考答案)/.test(m2.title))) children.push(h(m.title), ...p(m.content, false));
    children.push(h("\u7EC3\u4E60\u5355"));
    for (const [i, e] of l.exercises.entries()) children.push(sub(`\u7EC3\u4E60 ${i + 1}`), ...p(e.question, false), ...p("________________________________________________________________\n________________________________________________________________", false));
    children.push(h("\u8BFE\u540E\u4EFB\u52A1"), ...p(l.homework, false));
  } else {
    children.push(title(l.title + " \u77E5\u8BC6\u4F9D\u636E\u4E0E\u5BA1\u6838\u8BB0\u5F55"), ...p("\u672C\u9644\u4EF6\u533A\u5206\u77E5\u8BC6\u56FE\u8C31\u539F\u59CB\u5185\u5BB9\u3001\u6559\u5E08\u63D0\u4F9B\u7684\u6559\u5B66\u8981\u6C42\u548C\u6A21\u578B\u8BBE\u8BA1\u5EFA\u8BAE\u3002\u67E5\u8BE2\u6210\u529F\u8BC1\u660E\u5F53\u65F6\u53D6\u5230\u4E86\u8282\u70B9\uFF0C\u4E0D\u4EE3\u8868\u6570\u636E\u5E93\u672C\u8EAB\u6216\u6240\u6709\u751F\u6210\u5185\u5BB9\u7EDD\u5BF9\u65E0\u8BEF\u3002"), h("\u5185\u5BB9\u6765\u6E90\u5206\u7C7B"), t(["\u5185\u5BB9", "\u6765\u6E90\u4E0E\u5904\u7406"], [["\u91CA\u4E49\u4E0E\u4F8B\u53E5", "\u4E0B\u65B9\u5217\u51FA\u7684\u6559\u5E08\u9009\u5B9A\u56FE\u8C31\u539F\u6587\u3002\u6A21\u578B\u4E0D\u6539\u5199\u3002"], ["\u5B66\u60C5\u4E0E\u9884\u671F\u6210\u679C", "\u6559\u5E08\u8F93\u5165\uFF0C\u672A\u7531\u56FE\u8C31\u6838\u9A8C\u3002"], ["\u6D3B\u52A8\u4E0E\u89D2\u8272\u5361\u60C5\u5883", "\u6A21\u578B\u6216\u89C4\u5219\u6A21\u677F\u8BBE\u8BA1\uFF0C\u9700\u6559\u5E08\u5BA1\u6838\u3002"], ["\u65B0\u7F16\u7EC3\u4E60\u4E0E\u53C2\u8003\u7B54\u6848", "\u751F\u6210\u5EFA\u8BAE\uFF0C\u4E0D\u5C5E\u4E8E\u56FE\u8C31\u539F\u9898\uFF0C\u9700\u6838\u9A8C\u3002"]], [2300, 7060]), h("\u5DF2\u786E\u8BA4\u77E5\u8BC6\u539F\u6587"));
    for (const b2 of blocks) {
      children.push(sub(`${b2.name} ${b2.kind}`), ...p(`\u8282\u70B9\uFF1A${b2.knowledgeId}
\u6559\u5B66\u5206\u7C7B\uFF1A${b2.role}
\u7B49\u7EA7\u4F53\u7CFB\uFF1A${standardNames[b2.standard || ""] || b2.standard || "\u672A\u77E5"}
\u8FD4\u56DE\u7B49\u7EA7\uFF1A${b2.levels.join("\u3001") || "\u672A\u8FD4\u56DE"}
\u67E5\u8BE2\u65F6\u95F4\uFF1A${b2.checkedAt}
\u6765\u6E90\uFF1A${b2.source} ${b2.url}`, false), ...p("\u672C\u8BFE\u9009\u5B9A\u91CA\u4E49\uFF1A" + (b2.meaning || "\u672A\u63D0\u4F9B")), ...b2.examples.flatMap((s, i) => p(`\u539F\u53E5${i + 1}\uFF1A${s}`, false)), ...p("\u67E5\u8BE2\u6A21\u677F\uFF1A" + (b2.query || "\u672A\u8BB0\u5F55"), false), ...p("\u67E5\u8BE2\u53C2\u6570\uFF1A" + JSON.stringify(b2.parameters || {}), false));
    }
    if (!blocks.length) children.push(...p("\u65E0\u5DF2\u786E\u8BA4\u539F\u6587\u3002\u672A\u5339\u914D\u6761\u76EE\u6216\u5BFC\u5165\u540E\u672A\u91CD\u65B0\u6838\u9A8C\u7684\u6761\u76EE\uFF0C\u4E0D\u8BA1\u5165\u56FE\u8C31\u4F9D\u636E\u3002"));
    children.push(h("\u672A\u786E\u8BA4\u77E5\u8BC6"), ...d2.knowledge.every((k2) => k2.role === "\u6392\u9664" || k2.verified && k2.scopeConfirmed) ? p("\u65E0\u3002") : [], ...d2.knowledge.filter((k2) => k2.role !== "\u6392\u9664" && (!k2.verified || !k2.scopeConfirmed)).flatMap((k2) => p(`${k2.name}\u3000${k2.verified ? "\u672A\u786E\u8BA4\u672C\u8BFE\u4E49\u9879" : "\u672A\u901A\u8FC7\u56FE\u8C31\u6838\u9A8C"}`, false)), h("\u68C0\u67E5\u7ED3\u679C"), ...checkLesson(l, d2.brief, d2.knowledge).flatMap((x) => p(x.text)), h("\u751F\u6210\u4E0E\u4FEE\u8BA2\u4FE1\u606F"), ...p(`\u65B9\u5F0F\uFF1A${d2.source === "template" ? "\u89C4\u5219\u6A21\u677F" : "AI\u8BBE\u8BA1"}
\u6A21\u578B\uFF1A${d2.model || "\u5386\u53F2\u8BB0\u5F55\u672A\u63D0\u4F9B"}
\u63D0\u793A\u8BCD\u7248\u672C\uFF1A${d2.promptVersion || "\u5386\u53F2\u7248\u672C\u672A\u8BB0\u5F55"}
\u751F\u6210\u65F6\u95F4\uFF1A${d2.createdAt}
\u5BA1\u6838\u72B6\u6001\uFF1A${d2.reviewed ? "\u6559\u5E08\u5DF2\u786E\u8BA4" : "\u5F85\u6559\u5E08\u5BA1\u6838"}`, false), ...p(l.notes));
  }
  return Packer.toBlob(new Document({ styles: { default: { document: { run: { font, size: 22, color: "202820" }, paragraph: { spacing: { line: 340 } } } }, paragraphStyles: [{ id: "Title", name: "Title", basedOn: "Normal", next: "Normal", run: { font, size: 34, bold: true, color: "000000" }, paragraph: { spacing: { after: 260 } } }, { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", run: { font, size: 27, bold: true, color: "24362F" }, paragraph: { keepNext: true } }, { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", run: { font, size: 23, bold: true, color: "354A30" }, paragraph: { keepNext: true } }] }, sections: [{ properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } }, children }] }));
}

// tests/export-qa.ts
var k = [{ id: "Word:qa-only", kind: "Word", name: "\u65B9\u4FBF", role: "\u6838\u5FC3", verified: true, scopeConfirmed: true, selectedMeaning: "\u4FBF\u5229\u3002", selectedExamples: ["\u4EA4\u901A\u5F88\u65B9\u4FBF\u3002"], detail: "\u4FBF\u5229\u3002", example: "\u4EA4\u901A\u5F88\u65B9\u4FBF\u3002", rawDetail: "\u4FBF\u5229\u3002", rawExample: "\u4EA4\u901A\u5F88\u65B9\u4FBF\u3002", levels: ["\u4E8C\u7EA7"], relations: [], checkedAt: "2026-10-19T00:00:00Z", query: "MATCH (n) RETURN n", evidence: { standard: "InternationalLevel", parameters: { terms: ["\u65B9\u4FBF"] }, queries: [] } }];
var b = { ...initialBrief, terms: "\u65B9\u4FBF" };
var d = { brief: b, knowledge: k, lesson: templateLesson(b, k), source: "template", createdAt: "2026-10-19T00:00:00Z", reviewed: false };
d.lesson.title = "\u6392\u7248\u9A8C\u8BC1\u6837\u4F8B";
await mkdir("../docx-v2-qa", { recursive: true });
for (const kind of ["teacher", "student", "evidence"]) {
  const blob = await makeWord(d, kind);
  await writeFile("../docx-v2-qa/" + kind + ".docx", new Uint8Array(await blob.arrayBuffer()));
}
console.log("Three Word layout fixtures created for QA only.");
