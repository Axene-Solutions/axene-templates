import { test } from 'node:test';
import assert from 'node:assert/strict';
import mjml2html from 'mjml';
import { sanitizeBlocks, compiledHtmlProblem } from '../src/lib/server/sanitize-blocks.ts';
import { blocksToMjml } from '../src/lib/mjml.ts';
import { blockDefs, createBlock, defaultBlocks, BLOCK_ORDER } from '../src/lib/blocks.ts';
import { cleanSettings, legacySettings, newTemplateSettings, textOn, inkFor, FONTS, cornerPx } from '../src/lib/template-settings.ts';
import { buildEnvelope, readEnvelope } from '../src/lib/mailer-templates.ts';
import { renderTemplateForMailer, renderTemplateForSend } from '../src/lib/server/render.ts';

const compile = (mjml: string) => mjml2html(mjml, { keepComments: false, minify: false, validationLevel: 'soft' }).html;

test('cleanSettings keeps valid values and replaces bad ones with the fallback', () => {
	const fb = legacySettings('#123456');
	const s = cleanSettings(
		{ color: '#ABCDEF', font: 'Lora', width: 9999, corners: 'round', bg: 'red', pageBg: '', bStyle: 'dashed', bWidth: 0, bColor: '#000', shadow: 'strong', pad: 12, textColor: '#111', extra: 'x' },
		fb,
	);
	assert.equal(s.color, '#abcdef');
	assert.equal(s.font, 'Lora');
	assert.equal(s.width, 800);
	assert.equal(s.corners, 'round');
	assert.equal(s.radius, 16, 'a preset corner sets its radius');
	assert.equal(s.bg, fb.bg, 'a colour word is refused');
	assert.equal(s.pageBg, '');
	assert.equal(s.bStyle, 'dashed');
	assert.equal(s.bWidth, 1);
	assert.equal(s.shadow, 'strong');
	assert.equal(s.pad, 12);
	assert.ok(!('extra' in s));
	assert.deepEqual(cleanSettings('nope', fb), fb);
	assert.equal(cleanSettings({ font: '</style><script>' }, fb).font, fb.font);
	assert.equal(cleanSettings({ color: 'theme' }, fb).color, '#123456');
});

test('cornerPx follows the radius, presets map to 0, 8 and 16', () => {
	assert.equal(cornerPx({ corners: 'soft', radius: 8 }), 8);
	assert.equal(cleanSettings({ corners: 'custom', radius: 5 }).radius, 5);
	assert.equal(cleanSettings({ radius: 99 }).radius, 32);
});

test('ink: never light text on a light or yellow fill', () => {
	assert.equal(inkFor('#ffd100'), '#101010');
	assert.equal(inkFor('#111827'), '#ffffff');
	assert.equal(textOn('#ffd100', '#ffffff'), '#101010');
	assert.equal(textOn('#1daa82', 'auto'), '#ffffff');
	assert.equal(textOn('#ffffff', '#374151'), '#374151');
});

test('without settings the MJML is the same shape as before (600 px, #f5f5f5, no wrapper)', () => {
	const mjml = blocksToMjml(sanitizeBlocks(defaultBlocks()));
	assert.match(mjml, /<mj-body background-color="#f5f5f5" width="600px">/);
	assert.doesNotMatch(mjml, /mj-wrapper/);
	assert.match(mjml, /font-family="'Inter', Arial, sans-serif"/);
});

test('settings reach the compiled HTML: width, page and container colours, border, font, radius', () => {
	const settings = { ...newTemplateSettings(), width: 640, font: 'Lora', bg: '#fefefe', pageBg: '#202020', bStyle: 'solid' as const, bWidth: 2, bColor: '#ff0000', pad: 10 };
	const mjml = blocksToMjml(sanitizeBlocks(defaultBlocks()), settings);
	assert.match(mjml, /width="640px"/);
	assert.match(mjml, /<mj-body background-color="#202020"/);
	assert.match(mjml, /<mj-wrapper css-class="axn-email" padding="10px" background-color="#fefefe" border="2px solid #ff0000" border-radius="8px">/);
	assert.match(mjml, /<mj-font name="Lora" href="https:\/\/fonts\.googleapis\.com\/css2\?family=Lora/);
	assert.match(mjml, /box-shadow:0 10px 36px/);
	const html = compile(mjml);
	assert.match(html, /Lora/);
	assert.match(html, /#202020/);
	assert.match(html, /2px solid #ff0000/);
	assert.equal(compiledHtmlProblem(html), null);
});

test('the theme colour in settings drives theme tokens', () => {
	const blocks = sanitizeBlocks([createBlock('button')]);
	const mjml = blocksToMjml(blocks, { ...newTemplateSettings(), color: '#ffd100' });
	assert.match(mjml, /background-color="#ffd100"/);
	assert.match(mjml, /<mj-button[^>]* color="#101010"/, 'auto text on a yellow button is dark ink');
});

test('every new block (design defaults) survives the strict sanitiser and compiles', () => {
	const blocks = BLOCK_ORDER.map((t) => createBlock(t));
	const clean = sanitizeBlocks(blocks, { strict: true });
	assert.equal(clean.length, BLOCK_ORDER.length);
	for (const b of clean) for (const k of Object.keys(blocks.find((x) => x.id === b.id)!.props)) assert.ok(k in b.props, `${b.type}.${k} dropped`);
	const html = compile(blocksToMjml(clean, newTemplateSettings()));
	assert.match(html, /A highlighted note for your readers\./);
	assert.match(html, /https:\/\/mail\.axene\.io\/email-assets\/logo\.png/, 'an empty logo URL renders the Axene logo');
	assert.equal(compiledHtmlProblem(html), null);
});

test('new block props have bounds in the schema', () => {
	const bad = (type: string, props: Record<string, unknown>) =>
		assert.throws(() => sanitizeBlocks([{ id: "a", type, props }], { strict: true }), Error, JSON.stringify(props));
	bad('heading', { blockRadius: 99 });
	bad('heading', { borderStyle: 'groove' });
	bad('image', { imageHeight: 5000 });
	bad('heading', { fontWeight: 450 });
	bad('section', { lineHeight: 'x' });
	const ok = sanitizeBlocks([{ id: 'a', type: 'heading', props: { fontWeight: 700, color: 'auto', lineHeight: 1.25 } }], { strict: true })[0];
	assert.equal(ok.props.fontWeight, '700', 'numeric weights are stored as strings');
	assert.equal(ok.props.color, 'auto');
});

test('a stored section without text still renders the old spacer', () => {
	const clean = sanitizeBlocks([{ id: 's', type: 'section', props: { backgroundColor: '#eeeeee', paddingTop: 10 } }]);
	assert.equal(clean[0].props.text, '');
	assert.match(blocksToMjml(clean), /&#8203;/);
});

test('every block def default is accepted by its own schema', () => {
	for (const d of blockDefs) assert.doesNotThrow(() => sanitizeBlocks([{ id: 'x', type: d.type, props: d.defaultProps }], { strict: true }), d.type);
});

test('the Mailer envelope carries settings and reads them back cleaned', () => {
	const blocks = sanitizeBlocks(defaultBlocks());
	const settings = { ...newTemplateSettings(), width: 700, font: FONTS[0][0] };
	const env = buildEnvelope(blocks, undefined, settings);
	assert.equal(env.version, 1, 'the envelope version is unchanged, the key is additive');
	assert.deepEqual(env.settings, settings);
	assert.equal(env.themeColor, settings.color);
	const back = readEnvelope(JSON.parse(JSON.stringify(env)), (b) => sanitizeBlocks(b));
	assert.ok(back.ok);
	if (back.ok) assert.deepEqual(back.settings, settings);
	const old = readEnvelope({ format: 'axene-blocks', version: 1, blocks, themeColor: '#1daa82' }, (b) => sanitizeBlocks(b));
	assert.ok(old.ok && old.settings === null);
	assert.equal(buildEnvelope(blocks).settings, undefined);
});

test('Save to Mailer and Send render with the stored settings', () => {
	const blocks = sanitizeBlocks(defaultBlocks());
	const settings = { ...newTemplateSettings(), width: 720, pageBg: '#123123' };
	assert.match(renderTemplateForMailer(blocks, settings).html, /#123123/);
	const sent = renderTemplateForSend(blocks, { unsubscribe_url: 'https://x.test/u' }, new Map(), settings);
	assert.ok(sent.ok);
	if (sent.ok) assert.match(sent.html, /720px|max-width:720/);
});
