# Editor store API (for the right panel)

Everything lives in `src/lib/store.svelte.ts`. Three exports:

- `editor`: the template (blocks, template settings, name, category), selection, undo history, prop setters, placeholder insertion, save and compile.
- `view`: editor view state that is never saved: device, preview, tabs, open or closed panel sections, the single modal slot, the toast.
- `dnd`: drag and drop shared by the layers list and the canvas (the panel does not need it).

All getters are reactive (Svelte 5 runes), so read them directly in markup or `$derived`.

## Design names to real names

The design's `renderVals` reads `selB`, `P`, `tpl`, `theme`, `open/shut/tg`. Map them like this:

| Design | Real |
|---|---|
| `selB` | `editor.selected` (a `Block` or null; null when the container is selected) |
| `P` | `editor.selected?.props` |
| `t` (type) | `editor.selected?.type` |
| `s.sel === '__email'` (`emailSel`) | `editor.selectedKind === 'container'` |
| `tpl` and `T` | `editor.settings` (a complete `TemplateSettings`, never partial) |
| `theme` | `editor.themeColor` (same as `editor.settings.color`) |
| `cpx` / `cornerPx()` | `editor.cornerPx` |
| `open[k]`, `shut[k]`, `tg[k]` | `view.isOpen(k)`, `!view.isOpen(k)`, `view.toggleSection(k)` |
| `s.rightTab` | `view.rightTab` (`'customize' \| 'styles'`, settable) |
| `s.links` | `editor.namedLinks` (the real Mailer links, `{ id, key, label, url, token }`); call `mailerData.loadLinks()` once to load them |
| `deselect` | `editor.deselect()` |
| `askDelete` | `view.requestDelete(id)` |

### Block prop names

Stored names are kept for compatibility with saved templates and the Mailer envelope:

| Design prop | Stored prop |
|---|---|
| `padT`, `padR`, `padB`, `padL` | `paddingTop`, `paddingRight`, `paddingBottom`, `paddingLeft` |
| `radius` (button, image, section) | `borderRadius` |
| `imgH` | `imageHeight` (0 means natural height) |
| `blockRadius`, `borderStyle`, `borderColor`, `backgroundColor` | same names (on every type; for the table, `borderColor` stays the cell line colour) |
| `fontWeight` 400/600/700 | same name; numbers are accepted and stored as strings (`'700'`), so compare with `Number(P.fontWeight)` |
| `color: 'auto'`, `headerColor: 'auto'` | same: readable ink on the fill |
| `lineHeight`, `align` (list, table, section, image) | same names |
| section `text`, `color`, `fontSize` | same names; an empty section text renders the old spacer |

New props have bounds in `src/lib/server/sanitize-blocks.ts` (`BLOCK_SCHEMA`); the save endpoint refuses values outside them with a 422, so use the design's number field bounds.

### Template settings (`editor.settings`)

Keys follow the design's `tpl`: `color`, `font` (a label from `FONTS` in `src/lib/template-settings.ts`), `width` (320 to 800), `corners` (`square | soft | round | custom`), `radius` (0 to 32), `bg`, `pageBg` (empty means the default), `bStyle` (`none | solid | dashed | dotted`), `bWidth` (1 to 8), `bColor`, `shadow` (`none | soft | medium | strong`), `pad` (0 to 48), `textColor`. Colours are `#rgb` or `#rrggbb`.

`FONTS`, `SHADOWS`, `fontCss(label)`, `inkFor(hex)` and `textOn(fill, chosen)` are exported from `src/lib/template-settings.ts` for the font picker and the colour rows.

## Selection

- `editor.selectedKind`: `'block' | 'container' | null`
- `editor.selectedId`: the block id or null
- `editor.selected`: the selected block or null
- `editor.selectBlock(id | null)`, `editor.selectContainer()`, `editor.deselect()`

## Setters and undo

Every setter records an undo step. Pass a `mergeKey` for continuous edits (typing, scrubbing a number label, typing a hex): calls with the same key within 900 ms join one step. Structural changes (add, move, delete, duplicate) are always their own step.

- `editor.setProp(id, path, value, mergeKey?)`: `path` is dotted, for example `'text'`, `'items.2'`, `'rows.0.col1'`, `'links.1.url'`. The key is scoped to the block. Use the field path as the key when typing (`setProp(id, 'text', v, 'text')`), a separate key for scrubbing (`'fontSize:scrub'`) and for hex typing (`'hexcolor'`). Lists: set the whole array (`setProp(id, 'items', [...P.items, 'New item'])`).
- `editor.setProps(id, patch, mergeKey?)`: several props in one step (the linked padding control: `{ paddingTop: v, paddingRight: v, paddingBottom: v, paddingLeft: v }`).
- `editor.setTemplateSettings(patch, mergeKey?)`: values are clamped to the bounds above. Setting `color` also updates the header's `accentColor`.
- `editor.setCorners('square' | 'soft' | 'round')`: the design's corner chips (container plus every button, image and section radius, one step).
- `editor.setContainerRadius(px, mergeKey?)`: the Email container radius field (also sets `corners`).
- `editor.setBaseTextColor(hex, mergeKey?)`: the Email "Text color (all text blocks)" row.
- `editor.updateProp(id, key, value)`: the old setter, kept for the current panel.
- `editor.undo()`, `editor.redo()`, `editor.canUndo`, `editor.canRedo`.

## Placeholders: insert at the caret

1. On every block field, register the element and remember its caret:
   - `onMount`/`$effect`: `return editor.registerField(id, path, el)` (returns the unregister function)
   - `oninput`, `onkeyup`, `onclick`, `onselect`: `editor.rememberCaret(id, path, el.selectionStart)`
2. The `{ }` button: `view.openInsert(id, path, 'field')`; the link button: `view.openInsert(id, path, 'link')`.
3. The Insert modal renders while `view.modal === 'insert'`, for `view.insertTarget` (`{ id, path, mode }`). Wrap it in `ModalFrame` from `src/lib/components/editor/ModalFrame.svelte` (scrim, top aligned card, Escape, focus trap) with the design's card style and `scrimCloses`.
4. Insert a field: `editor.insertAt(id, path, '{{name|friend}}')` then `view.closeModal()`. The token goes in at the remembered caret (or the end), the caret moves after it and focus returns to the field.
5. Choose a link: `editor.replaceField(id, path, '{{link:key}}')` then `view.closeModal()`.
6. "Manage links" inside the Insert modal: `view.openLinks(true)`. The links modal is rendered by the editor (`LinksModal`) in the same slot with a Back chevron; Back and Done call `view.linksToInsert()`, which returns to the Insert modal for the same target.
7. `view.closeModal()` from the Insert modal returns focus to the field at its caret.

Field and link data: `mailerData.contactFields`, `mailerData.builtins`, `mailerData.links` (from `src/lib/mailer-data.svelte.ts`).

## The modal slot

`view.modal` is `'' | 'save' | 'send' | 'delete' | 'insert' | 'links'`. Only one is ever open:

- `view.openModal(kind)` opens it only when nothing else is open (returns false otherwise).
- `view.switchModal(kind)` changes the open step (Save to Send, Insert to links).
- `view.closeModal()` closes it.

The editor renders save, send, delete and links. The panel renders only the Insert modal. The old `editorUi.sendOpen = true` and `editorUi.saveMailerOpen = true` still work (they open the slot); reading them always returns false, so a component that renders its own copy from those flags never shows a second dialog.

## Other

- `view.say(message)`: the bottom toast.
- `view.preview`, `view.device`: the panel is hidden in preview, so it does not need these.
- `editor.has(type)`, `editor.typeName(type)` (`TYPE_NAME` in `src/lib/blocks.ts`).
- The panel is the 300 px wide Properties aside (`RightPanel.svelte`, mounted by `EditorShell.svelte`). The design classes (`.nf`, `.chip`, `.sw`, `.segs`, `.seg`, `.lay`, `.sec`, `.field`, `.lbl`, `.cap`, `.opt`, `.mini`, `.icon-btn`) and the design variables (`--bg`, `--s2`, `--s3`, `--text`, `--muted`, `--bar`, `--bar2`, `--ok`, `--bad`, `--warn`, `--warn-soft`) are defined for everything inside `.ed-root` in `src/lib/components/editor/editor.css`, so the design's inline styles port verbatim.
- `.segs .seg[aria-pressed="true"]` is global inside the editor (the design scoped it to the alignment group by accident: it is a document level style tag there).
