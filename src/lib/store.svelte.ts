/**
 * Global editor state using Svelte 5 runes.
 *
 * The contract for the panels (selection, template settings, prop setters with undo merging,
 * placeholder insertion, the modal slot) is documented in docs/editor-store-api.md.
 */

import {
  type Block,
  type BlockType,
  createBlock,
  defaultBlocks,
  TYPE_NAME,
} from "./blocks";
import { blocksToMjml, themeFromBlocks } from "./mjml";
import {
  cleanSettings,
  cornerPx,
  CORNER_PX,
  legacySettings,
  newTemplateSettings,
  type Corners,
  type TemplateSettings,
} from "./template-settings";
import { mailerData } from "./mailer-data.svelte";
import { replaceState } from "$app/navigation";

export type SelectedKind = "block" | "container" | null;
export type ModalKind = "" | "save" | "send" | "delete" | "insert" | "links";
export type InsertMode = "field" | "link";
export interface InsertTarget {
  id: string;
  path: string;
  mode: InsertMode;
}

// ---------- data ----------
let blocks = $state<Block[]>(defaultBlocks());
let settings = $state<TemplateSettings>(newTemplateSettings());
let selectedId = $state<string | null>(null);
let selectedKind = $state<SelectedKind>(null);
let previewHtml = $state("");
let compiling = $state(false);
let compileError = $state("");
let templateId = $state("");
let templateName = $state("Untitled Template");
let templateCategory = $state("general");
let templateIsPublic = $state(false);
// Linked Mailer template (empty until saved to Mailer) and its name as last saved there.
let mailerTemplateId = $state("");
let mailerTemplateName = $state("");
// What the linked Mailer copy was last saved from (blocks, name, settings), to tell if it is out of date.
let mailerSyncedJson = $state("");
const snapshot = () => JSON.stringify([blocks, templateName, settings]);
let dirty = $state(false);
// Bumped on every change. A save records the revision it sent, so edits made while it was in
// flight stay dirty (and get saved next) instead of being marked saved by its reply.
let rev = 0;
function touch() {
  rev++;
  dirty = true;
}
let saveState = $state<"idle" | "saving" | "saved" | "error">("idle");
let saveError = $state("");

// ---------- history ----------
// Each entry is the JSON of { blocks, settings }. A change with a merge key that repeats the
// previous change's key within MERGE_MS joins its undo step (typing, dragging a handle).
// Structural changes pass no key and are always their own step.
let undoStack = $state<string[]>([]);
let redoStack = $state<string[]>([]);
const MAX_HISTORY = 80;
const MERGE_MS = 900;
let lastKey: string | null = null;
let lastT = 0;

const histSnap = () => JSON.stringify({ blocks, settings });

/** Records an undo step (unless merged), applies the change, marks dirty and recompiles. */
function commit(apply: () => void, mergeKey?: string | null) {
  const now = Date.now();
  const merge = !!mergeKey && mergeKey === lastKey && now - lastT < MERGE_MS;
  lastKey = mergeKey ?? null;
  lastT = now;
  if (!merge) {
    undoStack = [...undoStack, histSnap()].slice(-MAX_HISTORY);
    redoStack = [];
  }
  apply();
  touch();
  scheduleCompile();
}

function restore(json: string) {
  const prev = JSON.parse(json) as { blocks: Block[]; settings: TemplateSettings };
  blocks = prev.blocks;
  settings = prev.settings;
  if (selectedKind === "block" && !blocks.some((b) => b.id === selectedId)) {
    selectedId = null;
    selectedKind = null;
  }
  lastKey = null;
  touch();
  scheduleCompile();
}

function undo() {
  if (!undoStack.length) return;
  const prev = undoStack[undoStack.length - 1];
  redoStack = [...redoStack, histSnap()];
  undoStack = undoStack.slice(0, -1);
  restore(prev);
}

function redo() {
  if (!redoStack.length) return;
  const next = redoStack[redoStack.length - 1];
  undoStack = [...undoStack, histSnap()];
  redoStack = redoStack.slice(0, -1);
  restore(next);
}

const canUndo = $derived(undoStack.length > 0);
const canRedo = $derived(redoStack.length > 0);

// ---------- derived ----------
const selected = $derived(
  selectedKind === "block" ? (blocks.find((b) => b.id === selectedId) ?? null) : null,
);
const mjmlSource = $derived(blocksToMjml(blocks, settings));
const themeColor = $derived(settings.color);

// ---------- paths ----------
export function getPath(o: unknown, path: string): unknown {
  return path.split(".").reduce<any>((a, k) => (a == null ? a : a[k]), o);
}
function setPath<T>(o: T, path: string, v: unknown): T {
  const ks = path.split(".");
  const go = (cur: any, i: number): any => {
    const k = ks[i];
    const copy = Array.isArray(cur) ? cur.slice() : { ...(cur ?? {}) };
    copy[k] = i === ks.length - 1 ? v : go(cur?.[k], i + 1);
    return copy;
  };
  return go(o, 0);
}

// ---------- selection ----------
function selectBlock(id: string | null) {
  selectedId = id;
  selectedKind = id ? "block" : null;
}
function selectContainer() {
  selectedId = null;
  selectedKind = "container";
}
function deselect() {
  selectBlock(null);
}

// ---------- focus after structural changes ----------
// Moving a keyed row moves its DOM node, which drops focus to <body>; deleting the focused
// block removes it. Either way the editor's shortcuts (on its root) would stop working, so
// focus goes back to the same control or to the nearest block.
type Area = "canvas" | "layer";
function areaOf(el: Element | null | undefined): Area {
  return el?.closest("[data-layer]") ? "layer" : "canvas";
}
function focusBlockEl(id: string | null | undefined, area: Area) {
  setTimeout(() => {
    if (typeof document === "undefined") return;
    const a = document.activeElement;
    if (a && a !== document.body && a.isConnected) return;
    const el = id ? document.querySelector<HTMLElement>(`[data-${area}="${CSS.escape(id)}"]`) : null;
    (el ?? document.querySelector<HTMLElement>('[aria-label="Select the email container"]'))?.focus({ preventScroll: true });
  }, 0);
}
function keepFocus(fn: () => void) {
  const el = typeof document !== "undefined" ? (document.activeElement as HTMLElement | null) : null;
  fn();
  if (!el || el === document.body) return;
  setTimeout(() => {
    if (el.isConnected && document.activeElement !== el && (document.activeElement === document.body || !document.activeElement)) el.focus({ preventScroll: true });
  }, 0);
}

// ---------- structure ----------
function has(type: BlockType) {
  return blocks.some((b) => b.type === type);
}
/** Insert bounds: never before the header, never after the footer. */
function bounds(arr: Block[] = blocks): [number, number] {
  const lo = arr.length && arr[0].type === "header" ? 1 : 0;
  const hi = arr.length && arr[arr.length - 1].type === "footer" ? arr.length - 1 : arr.length;
  return [lo, Math.max(lo, hi)];
}
function clampIdx(idx: number, type?: BlockType) {
  if (type === "header") return 0;
  if (type === "footer") return blocks.length;
  const [lo, hi] = bounds();
  return Math.min(hi, Math.max(lo, idx));
}

function newBlock(type: BlockType, over?: Record<string, any>): Block {
  const r = cornerPx(settings);
  const radius = type === "image" || type === "button" ? { borderRadius: r } : null;
  const b = createBlock(type, { ...(radius ?? {}), ...(over ?? {}) });
  if (type === "header") b.props.accentColor = settings.color;
  return b;
}

function addBlock(type: BlockType, index?: number) {
  // Max 1 header and 1 footer
  if ((type === "header" || type === "footer") && has(type)) return;
  const block = newBlock(type);
  commit(() => {
    const arr = blocks.slice();
    const idx =
      type === "header" ? 0 : type === "footer" ? arr.length : typeof index === "number" ? clampIdx(index) : bounds(arr)[1];
    arr.splice(idx, 0, block);
    blocks = arr;
  });
  selectBlock(block.id);
  lastTile = type;
}

/** Inserts a preset group of [type, prop overrides] before the footer and selects the first. */
function addGroup(list: [BlockType, Record<string, any>?][]): number {
  const items = list
    .filter(([t]) => !((t === "header" || t === "footer") && has(t)))
    .map(([t, over]) => newBlock(t, over));
  if (!items.length) return 0;
  commit(() => {
    const arr = blocks.slice();
    arr.splice(bounds(arr)[1], 0, ...items);
    blocks = arr;
  });
  selectBlock(items[0].id);
  return items.length;
}

function removeBlock(id: string) {
  commit(() => {
    blocks = blocks.filter((b) => b.id !== id);
  });
  if (selectedId === id) selectBlock(null);
}

function canMove(id: string, direction: "up" | "down"): boolean {
  const idx = blocks.findIndex((b) => b.id === id);
  if (idx === -1) return false;
  const block = blocks[idx];
  // Header and footer can never move
  if (block.type === "header" || block.type === "footer") return false;
  const target = direction === "up" ? idx - 1 : idx + 1;
  if (target < 0 || target >= blocks.length) return false;
  // Can't swap with header or footer
  if (blocks[target].type === "header" || blocks[target].type === "footer") return false;
  return true;
}

function canDelete(_id: string): boolean {
  // Header and footer can be deleted (user might want to remove them)
  return true;
}

function canDuplicate(id: string): boolean {
  const block = blocks.find((b) => b.id === id);
  if (!block) return false;
  // Can't duplicate header or footer (max 1 each)
  return block.type !== "header" && block.type !== "footer";
}

function moveBlock(id: string, direction: "up" | "down") {
  if (!canMove(id, direction)) return;
  keepFocus(() => commit(() => {
    const arr = blocks.slice();
    const i = arr.findIndex((b) => b.id === id);
    const j = direction === "up" ? i - 1 : i + 1;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    blocks = arr;
  }));
}

/** Moves a block so it lands before the block now at `idx` (idx = length moves it last). */
function moveTo(id: string, idx: number) {
  const from = blocks.findIndex((b) => b.id === id);
  if (from < 0 || idx === from || idx === from + 1) return;
  commit(() => {
    const arr = blocks.slice();
    const item = arr.splice(from, 1)[0];
    arr.splice(idx > from ? idx - 1 : idx, 0, item);
    blocks = arr;
  });
  selectBlock(id);
}

function duplicateBlock(id: string) {
  const idx = blocks.findIndex((b) => b.id === id);
  if (idx === -1 || !canDuplicate(id)) return;
  const copy = createBlock(blocks[idx].type);
  copy.props = JSON.parse(JSON.stringify(blocks[idx].props));
  commit(() => {
    const arr = blocks.slice();
    arr.splice(idx + 1, 0, copy);
    blocks = arr;
  });
  selectBlock(copy.id);
}

// ---------- props ----------
/**
 * Sets one prop (a dotted path such as "items.2" or "rows.0.col1") on a block. Calls with the
 * same mergeKey within 900 ms share one undo step; the key is scoped to the block.
 */
function setProp(id: string, path: string, value: unknown, mergeKey?: string | null) {
  const i = blocks.findIndex((b) => b.id === id);
  if (i === -1) return;
  commit(() => {
    const b = blocks[i];
    const next = { ...b, props: setPath(b.props, path, value) };
    blocks = blocks.map((x, j) => (j === i ? next : x));
    // The header's accent is the theme colour: keep the template setting in step.
    if (b.type === "header" && path === "accentColor" && typeof value === "string" && /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(value)) {
      settings = { ...settings, color: value };
    }
  }, mergeKey ? `${id}:${mergeKey}` : null);
}

/** Several props of one block in one step. */
function setProps(id: string, patch: Record<string, unknown>, mergeKey?: string | null) {
  const i = blocks.findIndex((b) => b.id === id);
  if (i === -1) return;
  commit(() => {
    blocks = blocks.map((x, j) => (j === i ? { ...x, props: { ...x.props, ...patch } } : x));
  }, mergeKey ? `${id}:${mergeKey}` : null);
}

/** Old name, kept for the existing right panel: one prop, merged per block and key. */
function updateProp(id: string, key: string, value: any) {
  setProp(id, key, value, key);
}

// ---------- template settings ----------
function applySettings(patch: Partial<TemplateSettings>) {
  settings = cleanSettings({ ...settings, ...patch }, settings);
  if (patch.color) {
    blocks = blocks.map((b) => (b.type === "header" ? { ...b, props: { ...b.props, accentColor: settings.color } } : b));
  }
}

/** Patch the template settings (one undo step, merged by mergeKey). Values are bounded. */
function setTemplateSettings(patch: Partial<TemplateSettings>, mergeKey?: string | null) {
  commit(() => applySettings(patch), mergeKey ? `tpl:${mergeKey}` : null);
}

/** A corner preset: the container and every button, image and section take its radius. */
function setCorners(preset: Exclude<Corners, "custom">) {
  const px = CORNER_PX[preset];
  commit(() => {
    applySettings({ corners: preset, radius: px });
    blocks = blocks.map((b) =>
      b.type === "button" || b.type === "image" || b.type === "section" ? { ...b, props: { ...b.props, borderRadius: px } } : b,
    );
  });
}

/** Container radius typed in: also picks the matching preset name, or custom. */
function setContainerRadius(px: number, mergeKey?: string | null) {
  setTemplateSettings({ radius: px, corners: px === 0 ? "square" : px === 8 ? "soft" : px === 16 ? "round" : "custom" }, mergeKey);
}

const TEXTUAL: BlockType[] = ["heading", "subheading", "content", "list", "section"];
/** Base text colour: the setting plus every text block's colour (and table cells). */
function setBaseTextColor(color: string, mergeKey?: string | null) {
  commit(() => {
    applySettings({ textColor: color });
    blocks = blocks.map((b) =>
      TEXTUAL.includes(b.type)
        ? { ...b, props: { ...b.props, color } }
        : b.type === "table"
          ? { ...b, props: { ...b.props, cellColor: color } }
          : b,
    );
  }, mergeKey ? `tpl:${mergeKey}` : null);
}

// ---------- placeholders: caret memory and insertion ----------
const carets = new Map<string, number>();
const fieldEls = new Map<string, HTMLInputElement | HTMLTextAreaElement>();
const fk = (id: string, path: string) => `${id}:${path}`;

/** Remember where the caret is in a block field (call on input, keyup, click, select). */
function rememberCaret(id: string, path: string, pos: number | null) {
  if (typeof pos === "number") carets.set(fk(id, path), pos);
}
/** Register a field element so focus can return to it after an insert. Returns an unregister. */
function registerField(id: string, path: string, el: HTMLInputElement | HTMLTextAreaElement) {
  fieldEls.set(fk(id, path), el);
  return () => {
    if (fieldEls.get(fk(id, path)) === el) fieldEls.delete(fk(id, path));
  };
}
function focusField(id: string, path: string, caret?: number) {
  setTimeout(() => {
    const el = fieldEls.get(fk(id, path));
    if (!el) return;
    el.focus();
    if (typeof caret === "number") {
      try {
        el.setSelectionRange(caret, caret);
      } catch {
        /* not a text field */
      }
    }
  }, 0);
}

/**
 * Inserts `token` (for example "{{name|friend}}") into a block field at the remembered caret,
 * or at the end. One undo step. Moves the caret after the token and focuses the field.
 */
function insertAt(id: string, path: string, token: string) {
  const b = blocks.find((x) => x.id === id);
  if (!b) return;
  const cur = getPath(b.props, path);
  const v = String(cur == null ? "" : cur);
  const c = carets.get(fk(id, path));
  const at = typeof c === "number" && c <= v.length ? c : v.length;
  carets.set(fk(id, path), at + token.length);
  setProp(id, path, v.slice(0, at) + token + v.slice(at));
  focusField(id, path, at + token.length);
}

/** Replaces a whole field with `value` (Choose a link sets the URL to {{link:key}}). */
function replaceField(id: string, path: string, value: string) {
  carets.set(fk(id, path), value.length);
  setProp(id, path, value);
  focusField(id, path, value.length);
}

// ---------- view state (not part of the template) ----------
let device = $state<"desktop" | "mobile">("desktop");
let preview = $state(false);
let leftTab = $state<"layers" | "blocks">("blocks");
let rightTab = $state<"customize" | "styles">("customize");
let closed = $state<Record<string, boolean>>({});
let lastTile = $state("");
let modal = $state<ModalKind>("");
let deleteId = $state<string | null>(null);
let deleteFrom: Area = "canvas";
let insertTarget = $state<InsertTarget | null>(null);
let linksBack = $state(false);
let toast = $state("");
let toastTimer: ReturnType<typeof setTimeout> | undefined;

function say(message: string) {
  toast = message;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toast = ""), 2400);
}

/** Opens a modal only when none is open: modals never stack. Returns whether it opened. */
function openModal(kind: Exclude<ModalKind, "">): boolean {
  if (modal && modal !== kind) return false;
  modal = kind;
  return true;
}
/** Switches the one open modal to another step (Save done to Send, Insert to Manage links). */
function switchModal(kind: Exclude<ModalKind, "">) {
  modal = kind;
}
function closeModal() {
  const target = insertTarget;
  const wasInsert = modal === "insert" || (modal === "links" && linksBack);
  modal = "";
  deleteId = null;
  linksBack = false;
  insertTarget = null;
  if (wasInsert && target) focusField(target.id, target.path, carets.get(fk(target.id, target.path)));
}

function requestDelete(id: string) {
  if (modal || preview) return;
  deleteId = id;
  deleteFrom = typeof document !== "undefined" ? areaOf(document.activeElement) : "canvas";
  modal = "delete";
}
function confirmDelete() {
  const id = deleteId;
  modal = "";
  deleteId = null;
  if (id) {
    const i = blocks.findIndex((b) => b.id === id);
    removeBlock(id);
    say("Block deleted");
    focusBlockEl((blocks[i] ?? blocks[i - 1])?.id, deleteFrom);
  }
}

/** Opens the Insert field or Choose a link modal for one block field. */
function openInsert(id: string, path: string, mode: InsertMode) {
  if (modal) return;
  insertTarget = { id, path, mode };
  modal = "insert";
}
/** Manage named links; `back` shows a Back chevron to the Insert modal. */
function openLinks(back = false) {
  if (modal && !(back && modal === "insert")) return;
  linksBack = back && modal === "insert";
  modal = "links";
}
function linksToInsert() {
  linksBack = false;
  modal = insertTarget ? "insert" : "";
}

function setPreview(on: boolean) {
  preview = on;
  dnd.end();
  if (on) compile();
}

// ---------- drag and drop (layers and canvas share it) ----------
let dragging = $state("");
let dropIdx = $state<number | null>(null);
let drag: { id?: string; type?: BlockType } | null = null;

const dnd = {
  get dragging() { return dragging; },
  get dropIdx() { return dropIdx; },
  /** True while a tile (a new block) is being dragged. */
  get draggingNew() { return dragging.startsWith("new:"); },
  start(e: DragEvent, d: { id?: string; type?: BlockType }) {
    drag = d;
    try {
      e.dataTransfer?.setData("text/plain", d.id || d.type || "");
      if (e.dataTransfer) e.dataTransfer.effectAllowed = d.id ? "move" : "copy";
    } catch {
      /* ignore */
    }
    dragging = d.id || `new:${d.type}`;
    dropIdx = null;
  },
  /** Over the row or block at index i: the line goes before or after it by pointer height. */
  over(e: DragEvent, i: number) {
    if (!drag) return;
    e.preventDefault();
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    let idx: number | null = e.clientY < r.top + r.height / 2 ? i : i + 1;
    idx = clampIdx(idx, blocks.find((b) => b.id === drag?.id)?.type ?? drag.type);
    if (drag.id) {
      const from = blocks.findIndex((b) => b.id === drag!.id);
      if (idx === from || idx === from + 1) idx = null;
    }
    if (idx !== dropIdx) dropIdx = idx;
  },
  drop(e: DragEvent) {
    e.preventDefault();
    const d = drag;
    const idx = dropIdx;
    drag = null;
    dragging = "";
    dropIdx = null;
    if (!d || idx === null) return;
    const area = areaOf(e.currentTarget as Element | null);
    if (d.id) moveTo(d.id, idx);
    else if (d.type) addBlock(d.type, idx);
    focusBlockEl(selectedId, area);
  },
  end() {
    drag = null;
    if (dragging || dropIdx !== null) {
      dragging = "";
      dropIdx = null;
    }
  },
};

// ---------- template lifecycle ----------
function setBlocks(newBlocks: Block[]) {
  blocks = newBlocks;
  selectBlock(null);
  undoStack = [];
  redoStack = [];
  lastKey = null;
  dirty = false;
  saveAgain = false;
  saveState = "idle";
  saveError = "";
  scheduleCompile();
}

function setTemplate(
  id: string,
  name: string,
  newBlocks: Block[],
  isPublic = false,
  category = "general",
  mailerId = "",
  storedSettings: unknown = null,
) {
  templateId = id;
  mailerTemplateId = mailerId;
  mailerTemplateName = "";
  mailerSyncedJson = "";
  templateName = name;
  templateCategory = category;
  const fallback = legacySettings(themeFromBlocks(newBlocks));
  settings = storedSettings ? cleanSettings(storedSettings, fallback) : fallback;
  setBlocks(newBlocks);
  templateIsPublic = isPublic;
}

function newTemplate() {
  templateId = "untitled-" + Date.now().toString(36);
  mailerTemplateId = "";
  mailerTemplateName = "";
  mailerSyncedJson = "";
  templateName = "Untitled";
  templateCategory = "general";
  templateIsPublic = false;
  settings = newTemplateSettings();
  setBlocks(defaultBlocks());
}

// Compile MJML to HTML via server
let compileTimer: ReturnType<typeof setTimeout> | null = null;
let compileRun: Promise<void> | null = null;

function scheduleCompile() {
  if (compileTimer) clearTimeout(compileTimer);
  compileTimer = setTimeout(compile, 300);
  scheduleAutosave();
}

// Autosave (debounced, 2 seconds after last change)
let autosaveTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleAutosave() {
  if (autosaveTimer) clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(async () => {
    if (dirty && templateId) {
      // Quiet: a half-typed placeholder is refused by validation, which is not worth an error bar.
      await saveTemplate({ quiet: true });
    }
  }, 2000);
}

function compile(): Promise<void> {
  if (compileTimer) {
    clearTimeout(compileTimer);
    compileTimer = null;
  }
  const run = (async () => {
    compiling = true;
    try {
      const res = await fetch("/api/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mjml: mjmlSource }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.html) {
        previewHtml = data.html;
        compileError = "";
      } else {
        compileError = data.error || "Preview failed to render (error " + res.status + ")";
      }
    } catch {
      compileError = "Preview failed to render, check your connection";
    } finally {
      compiling = false;
    }
  })();
  compileRun = run;
  return run;
}

/** The compiled email HTML for exactly what is in the editor now (compiles if a change is pending). */
async function compiledHtml(): Promise<string> {
  if (compileTimer || !previewHtml) await compile();
  else if (compiling && compileRun) await compileRun;
  return compileError && !previewHtml ? "" : previewHtml;
}

function fileSlug() {
  const slug = templateName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return (slug || "template") + ".html";
}

// Download the compiled email HTML as a file
async function downloadHtml(): Promise<boolean> {
  const html = await compiledHtml();
  if (!html) return false;
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileSlug();
  a.click();
  URL.revokeObjectURL(url);
  return true;
}

/** Copies the compiled email HTML to the clipboard. */
async function copyHtml(): Promise<boolean> {
  const html = await compiledHtml();
  if (!html) return false;
  try {
    await navigator.clipboard.writeText(html);
    return true;
  } catch {
    return false;
  }
}

// Save template
async function saveTemplate(opts: { quiet?: boolean } = {}) {
  if (saveState === "saving") {
    // One save at a time: this one runs again when the current one is done.
    saveAgain = true;
    return false;
  }
  saveState = "saving";
  saveError = "";
  const sentRev = rev;
  const sentId = templateId;
  try {
    const res = await fetch("/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: templateId,
        name: templateName,
        category: templateCategory,
        isPublic: templateIsPublic,
        blocks,
        settings,
      }),
    });
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      dirty = rev !== sentRev;
      saveState = "saved";
      // Saving a starter or someone else's public template forks it: continue on the new copy.
      if (data.forked && typeof data.id === "string" && templateId === sentId) {
        templateId = data.id;
        mailerTemplateId = "";
        mailerTemplateName = "";
        mailerSyncedJson = "";
      }
      // Point the address bar at the saved row (a new template, or the fork) so a reload opens
      // it. A shallow replace: navigating would reload the template and drop undo history.
      if (typeof location !== "undefined" && templateId === (data.forked ? data.id : sentId)) {
        const path = location.pathname;
        if (path === "/editor" || (path.startsWith("/editor/") && path !== `/editor/${templateId}`)) {
          try {
            replaceState(`/editor/${encodeURIComponent(templateId)}`, {});
          } catch {
            /* router not ready: the address bar keeps the old path */
          }
        }
      }
      afterSave();
      return true;
    }
    if (opts.quiet && res.status === 422) {
      // The edit stays unsaved (dirty) and the next change schedules another autosave.
      saveState = "idle";
      // Retry only if something changed while this save was in flight.
      if (rev !== sentRev) afterSave();
      else saveAgain = false;
      return false;
    }
    saveError =
      res.status === 401
        ? "Sign in again to save"
        : "Could not save (error " + res.status + ")";
  } catch {
    saveError = "Could not save, check your connection";
  }
  saveState = "error";
  saveAgain = false;
  return false;
}

/**
 * The page is being closed or reloaded with unsaved edits: send them with a keepalive request,
 * which the browser finishes after the page is gone. Returns false when that is not possible
 * (keepalive bodies are capped near 64 KB), so the caller can ask the browser to confirm.
 */
function flushOnExit(): boolean {
  if (!dirty || !templateId) return true;
  const body = JSON.stringify({ id: templateId, name: templateName, category: templateCategory, isPublic: templateIsPublic, blocks, settings });
  if (body.length > 60_000) return false;
  try {
    void fetch("/api/templates", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
    return true;
  } catch {
    return false;
  }
}

let saveAgain = false;
/** A save was asked for while one was in flight, or edits arrived meanwhile: save those too. */
function afterSave() {
  const again = saveAgain;
  saveAgain = false;
  if (!dirty || !templateId) return;
  if (again) void saveTemplate({ quiet: true });
  else scheduleAutosave();
}

export const editor = {
  // ----- template data -----
  get blocks() { return blocks; },
  get selected() { return selected; },
  get selectedId() { return selectedKind === "block" ? selectedId : null; },
  get selectedKind() { return selectedKind; },
  get settings() { return settings; },
  get previewHtml() { return previewHtml; },
  get compiling() { return compiling; },
  get compileError() { return compileError; },
  get templateName() { return templateName; },
  set templateName(v: string) {
    templateName = v;
    touch();
    scheduleAutosave();
  },
  get templateCategory() { return templateCategory; },
  set templateCategory(v: string) {
    templateCategory = v;
    touch();
    scheduleAutosave();
  },
  get templateIsPublic() { return templateIsPublic; },
  set templateIsPublic(v: boolean) {
    templateIsPublic = v;
    touch();
    scheduleAutosave();
  },
  get templateId() { return templateId; },
  get dirty() { return dirty; },
  get mailerTemplateId() { return mailerTemplateId; },
  get mailerTemplateName() { return mailerTemplateName; },
  setMailerLink(id: string, name: string) {
    mailerTemplateId = id;
    mailerTemplateName = name;
    mailerSyncedJson = snapshot();
  },
  /** The server says the loaded row equals the Mailer copy as of the last open or save. */
  markMailerSynced() {
    if (mailerTemplateId) mailerSyncedJson = snapshot();
  },
  /** True when the linked Mailer copy was saved from exactly what is in the editor now. */
  mailerInSync(): boolean {
    return !!mailerTemplateId && mailerSyncedJson !== "" && mailerSyncedJson === snapshot();
  },
  get saveState() { return saveState; },
  get saveError() { return saveError; },
  get mjmlSource() { return mjmlSource; },
  get themeColor() { return themeColor; },
  /** The real named links from Mailer (empty until loaded with mailerData.loadLinks()). */
  get namedLinks() { return mailerData.links; },
  /** The container radius in px. */
  get cornerPx() { return cornerPx(settings); },
  get canUndo() { return canUndo; },
  get canRedo() { return canRedo; },
  get lastTile() { return lastTile; },
  typeName: (t: BlockType) => TYPE_NAME[t],
  has,
  undo,
  redo,
  selectBlock,
  selectContainer,
  deselect,
  addBlock,
  addGroup,
  removeBlock,
  moveBlock,
  moveTo,
  duplicateBlock,
  setProp,
  setProps,
  updateProp,
  setTemplateSettings,
  setCorners,
  setContainerRadius,
  setBaseTextColor,
  getProp: (id: string, path: string) => getPath(blocks.find((b) => b.id === id)?.props, path),
  rememberCaret,
  registerField,
  focusField,
  insertAt,
  replaceField,
  canMove,
  canDelete,
  canDuplicate,
  setBlocks,
  setTemplate,
  newTemplate,
  compile,
  compiledHtml,
  downloadHtml,
  copyHtml,
  fileName: fileSlug,
  saveTemplate,
  flushOnExit,
};

/** Editor view state: layout, tabs, the single modal slot, the toast. Never saved. */
export const view = {
  get device() { return device; },
  set device(v: "desktop" | "mobile") { device = v; },
  get preview() { return preview; },
  setPreview,
  get leftTab() { return leftTab; },
  set leftTab(v: "layers" | "blocks") { leftTab = v; },
  get rightTab() { return rightTab; },
  set rightTab(v: "customize" | "styles") { rightTab = v; },
  /** Collapsed right panel sections by key (the design's `closed`). */
  isOpen: (key: string) => !closed[key],
  toggleSection(key: string) { closed = { ...closed, [key]: !closed[key] }; },
  get modal() { return modal; },
  get deleteId() { return deleteId; },
  get deleteBlock() { return blocks.find((b) => b.id === deleteId) ?? null; },
  get insertTarget() { return insertTarget; },
  get linksBack() { return linksBack; },
  get toast() { return toast; },
  say,
  openModal,
  switchModal,
  closeModal,
  requestDelete,
  confirmDelete,
  openInsert,
  openLinks,
  linksToInsert,
};

export { dnd };
