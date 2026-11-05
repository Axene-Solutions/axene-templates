// Review 2, finding 9 (latent, no block prop reaches these today): placeholders inside a style
// attribute or a <style>/<script> body, later srcset candidates, ping and meta refresh content.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { prepareGrammar, fillSlots } from '../src/lib/placeholders.ts';

function fill(src: string, values: Record<string, string>) {
	const p = prepareGrammar(src, values, new Map(), 'N');
	return { out: p.refused ? 'REFUSED' : fillSlots(p.template, p.slots, 'N'), badUrls: p.badUrls };
}

test('F9: a placeholder anywhere in a style attribute emits nothing', () => {
	assert.equal(fill('<div style="color:{{u}}">x</div>', { u: 'red;background:url(https://evil/t)' }).out, '<div style="color:">x</div>');
	assert.equal(fill("<div style='{{u}}'>x</div>", { u: 'position:fixed' }).out, "<div style=''>x</div>");
	assert.equal(fill('<div style="background:url({{u}})">x</div>', { u: 'https://e/t' }).out, '<div style="background:url()">x</div>');
	assert.equal(fill('<div style="color:{{u|red}}">x</div>', {}).out, '<div style="color:">x</div>');
});

test('F9: a placeholder inside a <style> or <script> body emits nothing', () => {
	assert.equal(fill('<style>a{color:{{u}}}</style><p>{{u}}</p>', { u: 'red' }).out, '<style>a{color:}</style><p>red</p>');
	assert.equal(fill('<STYLE type="text/css">a{background:url({{u}})}</STYLE>', { u: 'x);}</style><b>' }).out, '<STYLE type="text/css">a{background:url()}</STYLE>');
	assert.equal(fill('<script>var a="{{u}}"</script><p>{{u}}</p>', { u: 'v' }).out, '<script>var a=""</script><p>v</p>');
});

test('F9: every srcset candidate is checked, and a value cannot add a candidate', () => {
	const a = fill('<img srcset="https://a/x 1x, {{u}} 2x">', { u: 'data:image/svg+xml,AAA' });
	assert.deepEqual(a.badUrls, ['u']);
	const b = fill('<img srcset="https://a/x 1x,{{u}} 2x">', { u: 'javascript:alert(1)' });
	assert.deepEqual(b.badUrls, ['u']);
	const c = fill('<img srcset="https://a/x 1x, {{u}} 2x">', { u: 'https://b/y' });
	assert.deepEqual(c.badUrls, []);
	assert.equal(c.out, '<img srcset="https://a/x 1x, https://b/y 2x">');
	const d = fill('<img srcset="{{u}} 1x">', { u: 'https://a/x 1x, data:image/png,AAA 2x' });
	assert.ok(!/,\s*data:/.test(d.out), d.out);
});

test('F9: ping is a URL attribute with the source policy', () => {
	assert.deepEqual(fill('<a href="https://a/" ping="{{u}}">x</a>', { u: 'javascript:alert(1)' }).badUrls, ['u']);
	assert.deepEqual(fill('<a href="https://a/" ping="{{u}}">x</a>', { u: 'data:x' }).badUrls, ['u']);
	const ok = fill('<a href="https://a/" ping="{{u}}">x</a>', { u: 'https://t/p q' });
	assert.equal(ok.out, '<a href="https://a/" ping="https://t/p%20q">x</a>');
});

test('F9: a placeholder in a meta content attribute emits nothing, whatever the attribute order', () => {
	assert.equal(fill('<meta http-equiv="refresh" content="0;url={{u}}">', { u: 'javascript:alert(1)' }).out, '<meta http-equiv="refresh" content="0;url=">');
	assert.equal(fill('<meta content="0;url={{u}}" http-equiv="refresh">', { u: 'https://evil/' }).out, '<meta content="0;url=" http-equiv="refresh">');
	// Other content attributes elsewhere are ordinary attributes.
	assert.equal(fill('<p title="{{u}}" data-content="{{u}}">x</p>', { u: 'v' }).out, '<p title="v" data-content="v">x</p>');
});
