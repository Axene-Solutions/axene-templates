# Right panel components

Reusable pieces of the redesigned editor right panel (Editor board, aside "Properties").
Every component is props and callbacks driven: none of them imports the editor store, so the
wiring phase connects them to `editor` in `RightPanel.svelte`. `Demo.svelte` renders all of
them together with fake data and is the reference for that wiring.

Pure logic lives in `src/lib/panel/*.ts` and `src/lib/fonts.ts` (unit tested in
`tests/panel-suggest.test.ts` and `tests/panel-widgets.test.ts`).

Conventions

- `mergeKey`: a string passed back with live changes (typing, keys, scrubbing) so the store
  can merge them into one undo step, like the design's `commit(next, key)`. A label scrub
  sends `${mergeKey}:scrub` on every step and then calls `oncommit` once.
- Colors are hex strings. A value that is not a hex (`transparent`, `theme`) shows no swatch
  selected.
- Only render one modal at a time: `InsertFieldModal` holds the Manage links step inside it.
- Tokens: the components use the app tokens (`--color-surface-2`, ...). The Editor board's own
  danger and warn colors are scoped in `SuggestField` (`--p-bad`) and `WarningsCard`
  (`--p-warn`, `--p-warn-soft`), light and dark.

## Layout of the panel (design order)

Customize tab, block selected: `PanelHeader`, then `CollapsibleSection`s Layout
(`LayoutPicker` for headers, `AlignmentControl`), Content (`ContentField`s, `CheckboxRow`,
`AddButton`, a `.cap` sub caption), Typography (2 column grid of `NumberField` Size and Line,
`SegmentedControl` Weight with `variant="invert"`), Colors (`ColorGrid` rows), Spacing
(`dense`, `SpacingFields`), Shape (2 column grid of `NumberField` Radius / Height, Button width
`SegmentedControl` and its Width `NumberField`).

Customize tab, email container selected: `PanelHeader title="Email" chip="Container"`, then
Layout (`WidthControl` with `device`), Appearance (`ColorGrid` Background and Page background),
Shape (`NumberField` Radius 0 to 32 and `PresetChips` Corner presets), Border
(`BorderControls` with `width`), Shadow (`ShadowPresets`), Spacing (`NumberField` Padding 0 to
48 and its help line), Typography (`FontSelect`, `ColorGrid` Text color).

Nothing selected: `EmptySelection`.

Styles tab: Theme color (`ColorGrid`), Font family (`FontSelect`), Email width
(`WidthControl`), Corner style (`SegmentedControl` of `CORNERS` and the help line), Block border
(`BorderControls` without width, then a Radius `NumberField`), Template details
(`TemplateDetails`). `WarningsCard` sits at the bottom of both tabs.

Tabs: `<SegmentedControl role="tablist" stretch options={[Customize, Styles]} />`.

## Components

### NumberField
The 36px tinted number field: label (drag sideways to scrub), mono value, unit.

| Prop | Type | Notes |
|---|---|---|
| `label` | string | Visible label and default aria-label |
| `value` | number | |
| `min`, `max` | number | Clamped on input, keys and scrub |
| `step` | number = 1 | Decimal steps switch inputmode to decimal |
| `unit` | string = '' | `px`, `x` |
| `ariaLabel` | string? | For example "Top padding" |
| `mergeKey` | string? | Defaults to the label |
| `onchange` | (value, mergeKey) => void | Live; `:scrub` suffix while dragging |
| `oncommit` | (value) => void ? | End of a drag, after a key step, on change/blur |
| `disabled` | boolean = false | |

Keys: ArrowUp / ArrowDown step once, with Shift ten steps. Scrub: 1 step per 3px, Shift times 10.

### SpacingFields
2 by 2 grid Top, Right, Bottom, Left, the link toggle and the All sides chips 0/8/16/24/32.
Renders two sibling rows; put it in `<CollapsibleSection dense>`.

| Prop | Type | Notes |
|---|---|---|
| `value` | `Sides` {top,right,bottom,left} | from `$lib/panel/constants` |
| `linked` | boolean | aria-pressed of "Link all four sides" |
| `onlink` | (linked) => void | |
| `onchange` | (next: Sides, mergeKey?) => void | Linked edits set all four. mergeKey padT / padR / padB / padL (+ `:scrub`); undefined for a preset chip |
| `oncommit` | (next: Sides) => void ? | |
| `min`, `max` | number = 0, 80 | |
| `presets` | number[] = PAD_PRESETS | |

### PresetChips
Mono chips row; the chip equal to `value` is pressed.

| Prop | Type | Notes |
|---|---|---|
| `options` | {value, label, aria?}[] | |
| `value` | T | |
| `onpick` | (value) => void | |
| `ariaLabel` | string? | role=group label ("Width presets", "Corner presets") |
| `lead` | string? | Muted label in front ("All sides") |
| `mono` | boolean = true | |

### ColorGrid
Label with hint, 14 swatches (`PALETTE`), hex input with color dot.

| Prop | Type | Notes |
|---|---|---|
| `label` | string | Also builds the hex aria-label "<label> hex value" |
| `hint` | string = '' | Quiet text after the label, "(buttons and theme)" |
| `value` | string | Current color |
| `onchange` | (hex, mergeKey?) => void | mergeKey undefined for a swatch, 'hex' while typing |
| `onclear` | () => void ? | Shows a Clear chip |
| `clearLabel` | string = 'Clear' | |
| `swatches` | Swatch[] = PALETTE | |

The hex input keeps a draft until it is a valid 3 or 6 digit hex (`readHexDraft`); an outside
change of `value` drops the draft.

### FontSelect (+ `src/lib/fonts.ts`)
Combobox button plus popup with search and the grouped listbox; help line under it.

| Prop | Type | Notes |
|---|---|---|
| `value` | string | Font name, unknown names show Figtree |
| `onchange` | (name) => void | |
| `fonts` | FontDef[] = FONTS | |
| `help` | boolean = true | The "Web fonts show here in the editor..." line |
| `loadFonts` | boolean = true | Adds the Google Fonts `<link>` to `<svelte:head>` |
| `ariaLabel` | string = 'Font family' | |

Keyboard: ArrowDown / ArrowUp on the button open; in the search box ArrowUp / ArrowDown (wrap),
Home, End, Enter picks, Esc closes and refocuses the button, Tab closes.

`fonts.ts` exports `FONTS` (name, css stack with Arial or Georgia fallback, group, weights),
`FONT_GROUPS`, `fontByName`, `fontCss`, `fontTag`, `isWebFont` and `googleFontsUrl(fonts?)`
(css2 URL for the web fonts only; pass `[fontByName(tpl.font)]` to load just one).

### SuggestField (+ `src/lib/panel/suggest.ts`)
Input or textarea with the `{{` autocomplete and the fallback helper line.

| Prop | Type | Notes |
|---|---|---|
| `value` | string | |
| `onchange` | (value) => void | Every edit and accepted suggestion |
| `label` | string | aria-label |
| `fields` | {key, label}[] | Contact fields; label is the row text ("Full name", "Custom field, 412 contacts") |
| `links` | {key, label, url?}[] | Named links |
| `multiline` | boolean = false | textarea |
| `rows` | number = 2 | |
| `placeholder` | string = '' | |
| `mono` | boolean = false | URL style |
| `oncaret` | (caret) => void ? | Remember the caret for the Insert field modal |
| `suggest` | boolean = true | |

Method: `focusAt(pos?)` (use `bind:this`).
Pure helpers: `detectTrigger`, `suggestOptions`, `applySuggestion`, `hasEmptyFallback`,
`insertAt`, `wrapIndex`, `groupRows`, `needsFallback`, `NO_FALLBACK_KEYS` (email,
unsubscribe_url).

### ContentField
Content field row: label, Insert field mini button, Named links button (URL fields), "Use Axene
logo" chip, remove button, then a SuggestField.

| Prop | Type | Notes |
|---|---|---|
| `label`, `value`, `onchange`, `fields`, `links`, `multiline`, `rows`, `placeholder`, `oncaret` | | As SuggestField |
| `url` | boolean = false | Mono input; enables the link button |
| `oninsert` | () => void | Open InsertFieldModal mode field for this field |
| `insertOpen` | boolean = false | aria-expanded and tinted button |
| `onlink` | () => void ? | Open InsertFieldModal mode link |
| `linkOpen` | boolean = false | |
| `onreset` | () => void ? | Shows the "Use Axene logo" chip |
| `resetLabel` | string = 'Use Axene logo' | |
| `onremove` | () => void ? | Shows the remove button |
| `removeLabel` | string = 'Remove' | "Remove item 2" |

Method: `focusAt(pos?)`.

### InsertFieldModal (+ `src/lib/panel/insert.ts`)
The single modal for Insert field and Choose a link, with the Manage links step inside.

| Prop | Type | Notes |
|---|---|---|
| `mode` | 'field' \| 'link' | |
| `builtins` | {key,label}[] | "Built in" group |
| `contactFields` | {key,label}[] | "Your contact fields"; label is the sub text |
| `links` | {key,label,url?}[] | |
| `onpick` | (token) => void | Finished token. Field mode: insert at the caret (`insertAt`). Link mode: replace the value |
| `onclose` | () => void | Esc, Cancel, close button, click outside. Unmount it and call `ContentField.focusAt(caret)` |
| `manageLinks` | Snippet<[{ back }]> ? | Body of the Manage links step; call `back()` from its Done button. Without it the Manage links chip is hidden |
| `linkExample` | string ? | Token in the Named links description |
| `fallbackError` | (fb) => string \| null ? | Pass `fallbackError` from `$lib/placeholders` for the real rules |
| `startOnLinks` | boolean = false | Open straight on Manage links (no Back) |

Keyboard: ArrowUp / ArrowDown (wrap), Enter in the search or Fallback input inserts, Esc closes
(or goes back from Manage links). A click selects a row, a double click inserts it.

### CollapsibleSection
| Prop | Type | Notes |
|---|---|---|
| `title` | string | |
| `open` | boolean = true, bindable | |
| `ontoggle` | (open) => void ? | |
| `dense` | boolean = false | Spacing section body (gap 8, padding-bottom 4) |
| children | Snippet | |

### SegmentedControl
| Prop | Type | Notes |
|---|---|---|
| `options` | {value, label, icon?}[] | `icon` renders a 15px icon and uses label as aria-label |
| `value` | T | |
| `onchange` | (value) => void | |
| `ariaLabel` | string? | Defaults to `label` |
| `label` | string? | Wraps in the row with the muted label on the left |
| `variant` | 'soft' \| 'invert' = 'soft' | invert = Alignment and Weight |
| `role` | 'group' \| 'tablist' = 'group' | aria-pressed vs role=tab aria-selected |
| `stretch` | boolean = false | Full width, equal segments (tabs) |
| `style` | string? | Override the track style |

### LayoutPicker
`value` (HeaderLayout), `onchange(value)`. Five illustrated buttons plus the layout name.

### AlignmentControl
`value` ('left' \| 'center' \| 'right'), `onchange(value)`, `label = 'Alignment'`.

### WidthControl
| Prop | Type | Notes |
|---|---|---|
| `value` | number | |
| `onchange` | (value, mergeKey?) => void | mergeKey 'tplwidth' from the field, undefined from a chip |
| `oncommit` | (value) => void ? | |
| `min`, `max`, `step` | 320, 800, 10 | |
| `presets` | number[] = [480, 600, 720] | |
| `device` | 'desktop' \| 'mobile' ? | With `ondevice` shows the Desktop / Mobile switch |
| `ondevice` | (device) => void ? | |

### ShadowPresets
`value` ('none' \| 'soft' \| 'medium' \| 'strong'), `onchange(value)`. CSS values: `SHADOWS`.

### BorderControls
| Prop | Type | Notes |
|---|---|---|
| `borderStyle` | 'none' \| 'solid' \| 'dashed' \| 'dotted' | |
| `onstyle` | (value) => void | |
| `color` | string | |
| `oncolor` | (hex, mergeKey?) => void | |
| `width` | number ? | Email container only; hides the Width field when omitted |
| `onwidth` | (value, mergeKey) => void ? | |
| `widthMin`, `widthMax`, `widthAria` | 1, 8, 'Email border width' | |

Width and color only show when the style is not None.

### PanelHeader
`title`, `chip?` ("Container"), `ondelete?` (Delete block button), `deleteLabel = 'Delete block'`,
`ondeselect`.

### EmptySelection
`title = 'Nothing selected'`, `text = 'Click a block on the canvas or in Layers to edit it.'`.

### WarningsCard
`warnings: {text, reason}[]`, `title?` (default "N placeholder(s) to check"). Renders nothing
for an empty list.

### CheckboxRow
`label`, `checked`, `onchange(checked)`.

### AddButton
`label`, `onclick`.

### TemplateDetails
`name`, `onname(value)`, `category`, `categories: {value,label}[]`, `oncategory(value)`,
`isPublic`, `onpublic(on)`, `showPublic = true`.

## Constants (`src/lib/panel/constants.ts`)

`HEADER_LAYOUTS`, `ALIGNS`, `BORDER_STYLES`, `SHADOW_OPTIONS`, `SHADOWS`, `WEIGHTS`, `CORNERS`
(label, value, px), `BUTTON_WIDTHS` and `buttonWidthMode(width)`, `WIDTH_PRESETS`,
`PAD_PRESETS`, `TYPE_NAME`, type `Sides`.
