// UI5: the tab icon files in public/ (answers 2, 4 and 6). favicon.svg is 字 in white on an N3
// indigo tile, drawn as a path so it looks the same without a Japanese font, with no colour mode
// rules. favicon.ico holds the same icon at 16px and 32px, as PNGs, for browsers and tools that
// ask for /favicon.ico. The built site serving them (with no 404) is checked in
// test/e2e/app-name-and-favicon.test.ts.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';
import { JLPT_COLORS } from '@kanji/core';

const PUBLIC = resolve(__dirname, '../../public');
const SVG_TEXT = readFileSync(resolve(PUBLIC, 'favicon.svg'), 'utf8');
const svg = new DOMParser().parseFromString(SVG_TEXT, 'image/svg+xml').documentElement;
const ICO = readFileSync(resolve(PUBLIC, 'favicon.ico'));

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

describe('favicon.svg (UI5, answer 2)', () => {
  test('is a 32-unit square SVG with no fixed size, so the browser draws it at any size', () => {
    expect(svg.tagName).toBe('svg');
    expect(svg.namespaceURI).toBe('http://www.w3.org/2000/svg');
    expect(svg.getAttribute('viewBox')).toBe('0 0 32 32');
    expect(svg.hasAttribute('width')).toBe(false);
    expect(svg.hasAttribute('height')).toBe(false);
  });

  test('has the tile first: the whole 32×32 square with rounded corners (rx 7) in the N3 colour, the same as JLPT_COLORS.N3', () => {
    const tile = svg.children[0];
    expect(tile.tagName).toBe('rect');
    expect(tile.getAttribute('width')).toBe('32');
    expect(tile.getAttribute('height')).toBe('32');
    expect(tile.getAttribute('rx')).toBe('7');
    expect(tile.getAttribute('fill')).toBe('#6366f1');
    expect(tile.getAttribute('fill')).toBe(JLPT_COLORS.N3);
  });

  test('draws 字 as one white path on top of the tile, with no <text> and no font', () => {
    expect([...svg.children].map((child) => child.tagName)).toEqual(['rect', 'path']);
    const glyph = svg.children[1];
    expect(glyph.getAttribute('fill')).toBe('#fff');
    // An outline of moves, lines and curves, with every point inside the tile.
    const outline = glyph.getAttribute('d') ?? '';
    expect(outline).toMatch(/^M[\d.\sMLCZ]+Z$/);
    const numbers = outline.match(/[\d.]+/g)!.map(Number);
    expect(numbers.length).toBeGreaterThan(0);
    expect(numbers.every((n) => n > 0 && n < 32)).toBe(true);
    expect(svg.querySelectorAll('text, tspan, font, font-face')).toHaveLength(0);
    expect(SVG_TEXT).not.toMatch(/font-family|@font-face|<text/i);
  });

  test('is the same in every colour mode: no <style>, no media query and no prefers-color-scheme (answer 6)', () => {
    expect(svg.querySelectorAll('style')).toHaveLength(0);
    expect(SVG_TEXT).not.toMatch(/@media|prefers-color-scheme|<style|<script/i);
  });
});

describe('favicon.ico (UI5, answer 4)', () => {
  /** The ICONDIRENTRY rows after the 6-byte header: one per image. */
  const entries = () =>
    Array.from({ length: ICO.readUInt16LE(4) }, (_, i) => {
      const at = 6 + i * 16;
      return {
        width: ICO[at] || 256,
        height: ICO[at + 1] || 256,
        planes: ICO.readUInt16LE(at + 4),
        bitsPerPixel: ICO.readUInt16LE(at + 6),
        size: ICO.readUInt32LE(at + 8),
        offset: ICO.readUInt32LE(at + 12),
      };
    });

  test('is an icon file (it starts with 00 00 01 00)', () => {
    expect([...ICO.subarray(0, 4)]).toEqual([0, 0, 1, 0]);
  });

  test('holds exactly two images, 16×16 and 32×32, in 32-bit colour', () => {
    expect(entries().map(({ width, height }) => `${width}x${height}`)).toEqual(['16x16', '32x32']);
    for (const entry of entries()) {
      expect(entry.planes).toBe(1);
      expect(entry.bitsPerPixel).toBe(32);
    }
  });

  test('each image is a whole PNG of the size its row says, and the images fill the rest of the file', () => {
    let end = 6 + entries().length * 16;
    for (const entry of entries()) {
      expect(entry.offset).toBe(end);
      const png = ICO.subarray(entry.offset, entry.offset + entry.size);
      expect([...png.subarray(0, 8)]).toEqual(PNG_SIGNATURE);
      // The PNG's own width and height (in its IHDR chunk) match the row.
      expect(png.readUInt32BE(16)).toBe(entry.width);
      expect(png.readUInt32BE(20)).toBe(entry.height);
      end += entry.size;
    }
    expect(end).toBe(ICO.length);
  });
});

describe('the icon files in public/ (UI5, answers 3, 4 and 5)', () => {
  const INDEX_HTML = readFileSync(resolve(PUBLIC, '../index.html'), 'utf8');
  const head = new DOMParser().parseFromString(INDEX_HTML, 'text/html').head;

  // The dev server serves public/ at the site root as it is (the build copies it, checked in the
  // e2e test), so a link to a file that isn't in public/ would be a missing icon in dev.
  test('each icon link in index.html points at a file in public/, so the dev server has it too', () => {
    const hrefs = [...head.querySelectorAll('link[rel~="icon"]')].map((link) => link.getAttribute('href'));
    expect(hrefs).toEqual(['/favicon.svg', '/favicon.ico']);
    const files = readdirSync(PUBLIC);
    for (const href of hrefs) expect(files).toContain(href!.slice(1));
  });

  test('public/ has no web app manifest, home-screen icon or PNG icons, only the two tab icons', () => {
    const files = readdirSync(PUBLIC).filter((name) => statSync(resolve(PUBLIC, name)).isFile());
    expect(files.sort()).toEqual(['favicon.ico', 'favicon.svg']);
  });
});
