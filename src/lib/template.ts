// Template engine for use-cases.json. No app code should need to change when a use case is added.
//
// Syntax (all inside {{ }}):
//   {{field}}                    value, or [missing] when a required field is empty
//   {{field.filter.filter:arg}}  chained filters, see FILTERS below
//   {{#if condition}} … {{else}} … {{/if}}   conditional text, nestable
//
// Conditions: `field` (filled in / checked), `!field`, `field=A|B`, `field!=A`,
// `field~text` (contains, case-insensitive), `field>3` (>=, <, <=). Join with && and ||.
// Lines that contain only a block tag disappear entirely, and numbered lines ("1. ")
// are renumbered after conditionals run.

import { normalizeState } from './states';
import { formatValue } from './format';
import { currentSchoolYear, isUpcoming } from './schoolTerm';

export type Field = {
  id: string;
  label: string;
  type: 'select' | 'checkbox' | 'text' | 'textarea' | 'number';
  options?: string[];
  placeholder?: string;
  hint?: string;
  optional?: boolean;
  /** Clean up typed text: trim, and fix capitalization ("seattle" → "Seattle", "wa" → "WA"). */
  format?: 'city' | 'state';
  min?: number;
  max?: number;
  /** Prefilled value. May reference other fields, e.g. "{{role.abbr}} - Schools". */
  defaultValue?: string;
  /**
   * Prefill from a table. `key` is a template that picks a table (e.g. "{{role.abbr}}"), `state`
   * names the field holding a US state, and each table maps a state name to a value, with "*"
   * as the fallback for every other state. The user can still type over the result.
   */
  lookup?: { state: string; key: string; table: Record<string, Record<string, string>> };
  /** Prose used by the `.phrase` filter, keyed by option value. */
  phrases?: Record<string, string>;
  /** Hidden (and treated as empty) when any rule matches. */
  hiddenWhen?: HideRule | HideRule[];
  /** Replaces the label while another field has a given value. */
  labelWhen?: HideRule & { label: string };
};

type HideRule = { fieldId: string; equals: string };

export type UseCase = {
  id: string;
  category: string;
  title: string;
  description: string;
  fields: Field[];
  /** One string, or one string per line. */
  template: string | string[];
  /** Warnings shown when a combination of inputs looks wrong. */
  checks?: { when: string; message: string }[];
  /** Short line shown under the title. */
  note?: string;
  /** Fixed text shown below the prompt with its own copy button. Not part of the prompt. */
  afterPrompt?: { heading: string; text: string };
};

export type Values = Record<string, string>;

export const MISSING = '[missing]';

type Node =
  | { kind: 'text'; value: string }
  | { kind: 'var'; path: string }
  | { kind: 'if'; cond: string; then: Node[]; otherwise: Node[] };

export function fieldLabel(field: Field, values: Values): string {
  const rule = field.labelWhen;
  return rule && values[rule.fieldId] === rule.equals ? rule.label : field.label;
}

export function isHidden(field: Field, values: Values): boolean {
  if (!field.hiddenWhen) return false;
  const rules = Array.isArray(field.hiddenWhen) ? field.hiddenWhen : [field.hiddenWhen];
  return rules.some((rule) => values[rule.fieldId] === rule.equals);
}

/** What the form shows and the prompt uses for a field: hidden → empty, untouched → default. */
export function resolveValue(field: Field, fields: Field[], values: Values, depth = 0): string {
  if (isHidden(field, values)) return '';
  if (field.type === 'checkbox') return values[field.id] ?? 'No';
  if (values[field.id] !== undefined) {
    const typed = values[field.id].trim();
    return field.format ? formatValue(field.format, typed) : typed;
  }
  const fromTable = lookupTable(field, fields, values, depth);
  if (fromTable) return fromTable;
  if (!field.defaultValue || depth > 3) return '';
  let complete = true;
  const text = renderNodes(parse(field.defaultValue), (path) => {
    const value = lookup(path, fields, values, depth + 1);
    if (value === null) complete = false;
    return value ?? '';
  }, (cond) => evalCondition(cond, fields, values));
  return complete ? text : '';
}

function lookupTable(field: Field, fields: Field[], values: Values, depth: number): string {
  const spec = field.lookup;
  if (!spec || depth > 3) return '';
  const stateText = lookup(spec.state, fields, values, depth + 1);
  if (!stateText) return '';
  let complete = true;
  const key = renderNodes(parse(spec.key), (path) => {
    const value = lookup(path, fields, values, depth + 1);
    if (value === null) complete = false;
    return value ?? '';
  }, (cond) => evalCondition(cond, fields, values)).trim();
  const rows = complete ? spec.table[key] : undefined;
  if (!rows) return '';
  const state = (normalizeState(stateText) ?? stateText).toLowerCase();
  const match = Object.keys(rows).find((name) => name.toLowerCase() === state);
  return rows[match ?? '*'] ?? '';
}

/** What an input box should show: the raw text while typing, or the prefilled value. */
export function inputValue(field: Field, fields: Field[], values: Values): string {
  if (isHidden(field, values)) return '';
  if (field.type !== 'checkbox' && values[field.id] !== undefined) return values[field.id];
  return resolveValue(field, fields, values);
}

// ---------- filters ----------

function article(word: string): 'a' | 'an' {
  const first = word.replace(/^[^A-Za-z]+/, '');
  if (!first) return 'a';
  if (/^[A-Z]{2,}\b/.test(first)) return /^[AEFHILMNORSX]/.test(first) ? 'an' : 'a';
  if (/^(uni|use|usa|eu|one)/i.test(first)) return 'a';
  return /^[aeiou]/i.test(first) ? 'an' : 'a';
}

function joinList(items: string[], conjunction: string): string {
  if (items.length <= 1) return items.join('');
  if (items.length === 2) return `${items[0]} ${conjunction} ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, ${conjunction} ${items[items.length - 1]}`;
}

type FilterContext = { field?: Field };

const FILTERS: Record<string, (value: string, arg: string, ctx: FilterContext) => string> = {
  /** "Occupational Therapist (OT)" → "Occupational Therapist" */
  name: (v) => v.replace(/\s*\([^)]*\)\s*$/, ''),
  /** "Occupational Therapist (OT)" → "OT" (unchanged when there is no abbreviation) */
  abbr: (v) => v.match(/\(([^)]+)\)\s*$/)?.[1] ?? v,
  lower: (v) => v.toLowerCase(),
  upper: (v) => v.toUpperCase(),
  /** Prefix with the right article: "an Occupational Therapist", "a Physical Therapist". */
  a: (v) => `${article(v)} ${v}`,
  /** "A, B, C" → "A, B, and C". `list:or` joins with "or". */
  list: (v, arg) => joinList(v.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean), arg || 'and'),
  /** "1" → "1 year", "4" → "4 years" (`count:year`). Non-numbers pass through. */
  count: (v, arg) => {
    const n = Number(v);
    return Number.isFinite(n) && v !== '' && arg ? `${v} ${arg}${n === 1 ? '' : 's'}` : v;
  },
  /** Adds "upcoming" when a typed term (2027-2028, ESY 2027) starts more than 5 months from now. */
  upcoming: (v) => (isUpcoming(v) ? `upcoming ${v}` : v),
  /** Swap an option value for its prose version from the field's `phrases`. */
  phrase: (v, _arg, ctx) => ctx.field?.phrases?.[v] ?? v,
};

function applyFilters(value: string, filters: string[], field?: Field): string {
  return filters.reduce((current, spec) => {
    const [name, ...rest] = spec.split(':');
    const filter = FILTERS[name];
    if (!filter) throw new Error(`Unknown filter "${name}"`);
    return filter(current, rest.join(':'), { field });
  }, value);
}

/** Resolve "field.filter:arg" to text. null means the field is empty and required. */
function lookup(path: string, fields: Field[], values: Values, depth = 0): string | null {
  const [fieldId, ...filters] = path.split('.');
  if (fieldId === '@schoolYear') return applyFilters(currentSchoolYear(), filters);
  const field = fields.find((f) => f.id === fieldId);
  if (!field) throw new Error(`Unknown field "${fieldId}"`);
  const value = resolveValue(field, fields, values, depth);
  if (!value) return field.optional || isHidden(field, values) ? '' : null;
  return applyFilters(value, filters, field);
}

// ---------- conditions ----------

function evalClause(raw: string, fields: Field[], values: Values): boolean {
  let clause = raw.trim();
  const negate = clause.startsWith('!');
  if (negate) clause = clause.slice(1).trim();

  const match = clause.match(/^([\w.:]+)\s*(!=|>=|<=|=|>|<|~)\s*(.*)$/);
  let result: boolean;
  if (!match) {
    const value = lookup(clause, fields, values) ?? '';
    result = value !== '' && value !== 'No';
  } else {
    const [, path, op, expected] = match;
    const actual = (lookup(path, fields, values) ?? '').toLowerCase();
    const wanted = expected.split('|').map((s) => s.trim().toLowerCase());
    if (op === '=') result = wanted.includes(actual);
    else if (op === '!=') result = !wanted.includes(actual);
    else if (op === '~') result = actual !== '' && wanted.some((w) => actual.includes(w));
    else {
      const a = parseFloat(actual);
      const b = parseFloat(expected);
      result = actual !== '' && !Number.isNaN(a) && !Number.isNaN(b)
        && (op === '>' ? a > b : op === '>=' ? a >= b : op === '<' ? a < b : a <= b);
    }
  }
  return negate ? !result : result;
}

export function evalCondition(expr: string, fields: Field[], values: Values): boolean {
  return expr.split('||').some((group) =>
    group.split('&&').every((clause) => evalClause(clause, fields, values)),
  );
}

// ---------- parse + render ----------

function parse(source: string): Node[] {
  // A line holding only a block tag is removed along with its newline.
  const cleaned = source.replace(/^[ \t]*(\{\{\s*(?:#if[^}]*|else|\/if)\s*\}\})[ \t]*(?:\n|$)/gm, '$1');
  const root: Node[] = [];
  const stack: { nodes: Node[]; node?: Extract<Node, { kind: 'if' }> }[] = [{ nodes: root }];
  const current = () => stack[stack.length - 1];
  let last = 0;

  for (const match of cleaned.matchAll(/\{\{\s*([^{}]+?)\s*\}\}/g)) {
    if (match.index > last) current().nodes.push({ kind: 'text', value: cleaned.slice(last, match.index) });
    last = match.index + match[0].length;
    const tag = match[1];
    if (tag.startsWith('#if ')) {
      const node: Extract<Node, { kind: 'if' }> = { kind: 'if', cond: tag.slice(4), then: [], otherwise: [] };
      current().nodes.push(node);
      stack.push({ nodes: node.then, node });
    } else if (tag === 'else') {
      const top = current();
      if (!top.node) throw new Error('{{else}} without {{#if}}');
      top.nodes = top.node.otherwise;
    } else if (tag === '/if') {
      if (stack.length === 1) throw new Error('{{/if}} without {{#if}}');
      stack.pop();
    } else {
      current().nodes.push({ kind: 'var', path: tag });
    }
  }
  if (stack.length > 1) throw new Error('{{#if}} is missing its {{/if}}');
  if (last < cleaned.length) root.push({ kind: 'text', value: cleaned.slice(last) });
  return root;
}

function renderNodes(nodes: Node[], resolve: (path: string) => string, test?: (cond: string) => boolean): string {
  return nodes.map((node) => {
    if (node.kind === 'text') return node.value;
    if (node.kind === 'var') return resolve(node.path);
    const branch = test?.(node.cond) ? node.then : node.otherwise;
    return renderNodes(branch, resolve, test);
  }).join('');
}

function tidy(text: string): string {
  let n = 0;
  return text
    .split('\n')
    .map((line) => {
      const item = line.match(/^(\d+)\.\s/);
      n = item ? n + 1 : 0;
      return (item ? line.replace(/^\d+/, String(n)) : line)
        .replace(/(\S) {2,}/g, '$1 ')
        .replace(/[ \t]+$/, '');
    })
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function renderPrompt(useCase: UseCase, values: Values): string {
  const { fields } = useCase;
  const source = Array.isArray(useCase.template) ? useCase.template.join('\n') : useCase.template;
  const text = renderNodes(
    parse(source),
    (path) => lookup(path, fields, values) ?? MISSING,
    (cond) => evalCondition(cond, fields, values),
  );
  return tidy(text);
}

export function activeChecks(useCase: UseCase, values: Values): string[] {
  return (useCase.checks ?? [])
    .filter((check) => evalCondition(check.when, useCase.fields, values))
    .map((check) => check.message);
}
