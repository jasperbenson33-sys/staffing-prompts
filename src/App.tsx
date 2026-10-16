import { useEffect, useRef, useState } from 'react';
import useCases from './data/use-cases.json';
import { MISSING, activeChecks, fieldLabel, inputValue, isHidden, renderPrompt } from './lib/template';
import type { Field, UseCase } from './lib/template';
import { CHAT_TARGETS, copyText, openInChat } from './lib/chatLinks';
import type { ChatTarget } from './lib/chatLinks';
import { formatValue } from './lib/format';
import { THEMES, setFavicon } from './lib/themes';
import type { ThemeId } from './lib/themes';
import { ChatGPTIcon, ClaudeIcon, GearIcon, Ribbon } from './components/Icons';

const cases = useCases as UseCase[];
const categories = [...new Set(cases.map((useCase) => useCase.category))];

function App() {
  const [activeId, setActiveId] = useState(cases[0].id);
  const [values, setValues] = useState<Record<string, Record<string, string>>>({});
  const [copied, setCopied] = useState(false);
  const [copiedExtra, setCopiedExtra] = useState(false);
  const [chatStatus, setChatStatus] = useState('');
  // Theme is not saved anywhere, so each visit starts on Dark.
  const [theme, setTheme] = useState<ThemeId>('dark');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const activeCase = cases.find((useCase) => useCase.id === activeId) ?? cases[0];
  const activeValues = values[activeCase.id] ?? {};
  const visibleFields = activeCase.fields.filter((field) => !isHidden(field, activeValues));

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    setFavicon(theme);
  }, [theme]);

  useEffect(() => {
    if (!settingsOpen) return;
    const close = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent ? event.key === 'Escape' : !settingsRef.current?.contains(event.target as Node)) {
        setSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [settingsOpen]);

  function updateValue(field: Field, value: string) {
    setValues((current) => ({
      ...current,
      [activeCase.id]: { ...current[activeCase.id], [field.id]: value },
    }));
    setCopied(false);
    setChatStatus('');
  }

  function clearFields() {
    setValues((current) => ({ ...current, [activeCase.id]: {} }));
    setCopied(false);
    setChatStatus('');
  }

  let prompt: string;
  try {
    prompt = renderPrompt(activeCase, activeValues);
  } catch (error) {
    prompt = `This workflow's template has an error: ${error instanceof Error ? error.message : 'unknown'}`;
  }
  const missingCount = prompt.split(MISSING).length - 1;
  const warnings = activeChecks(activeCase, activeValues);

  async function copyExtra(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedExtra(true);
      window.setTimeout(() => setCopiedExtra(false), 1800);
    } catch {
      setCopiedExtra(false);
    }
  }

  async function openChat(target: ChatTarget) {
    const name = CHAT_TARGETS[target].label.replace('Open in ', '');
    const { prefilled, copied: copyResult } = openInChat(target, prompt);
    setChatStatus(prefilled
      ? `Opened ${name} with your prompt filled in. It is also copied.`
      : `This prompt is too long to prefill. It is copied, so press Ctrl+V (Cmd+V on Mac) in ${name}.`);
    if (!(await copyResult)) {
      setChatStatus(`Could not copy automatically. Use Copy prompt, then paste it into ${name}.`);
    }
  }

  async function copyPrompt() {
    setCopied(await copyText(prompt));
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <main className="studio-shell">
      {theme === 'spooky' && (
        <div className="decor" aria-hidden="true">
          <span className="bat">🦇</span><span className="bat b2">🦇</span><span className="bat b3">🦇</span>
          <span className="web">🕸️</span><span className="ghost">👻</span><span className="pumpkin">🎃</span><span className="witch">🧙‍♀️</span>
        </div>
      )}
      <aside className="rail" aria-label="Prompt categories">
        <div className="brand">
          {theme === 'spooky' ? <span className="brand-mark emoji" aria-hidden="true">👻</span>
            : theme === 'awareness' ? <span className="brand-mark ribbon"><Ribbon size={24} /></span>
            : <span className="brand-mark">S</span>}
          <span className="brand-name">Prompt Studio</span>
          <span className="beta-pill">Beta</span>
        </div>
        <nav>
          {categories.map((category) => (
            <div className="nav-group" key={category}>
              <div className="nav-category">{category}</div>
              {cases.filter((useCase) => useCase.category === category).map((useCase) => (
                <button
                  className={`nav-item ${activeCase.id === useCase.id ? 'active' : ''}`}
                  key={useCase.id}
                  onClick={() => { setActiveId(useCase.id); setCopied(false); setCopiedExtra(false); setChatStatus(''); }}
                  aria-current={activeCase.id === useCase.id ? 'page' : undefined}
                >
                  {useCase.title}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="rail-footer">
          <div className="spooky-row" aria-hidden="true">🧟🧙‍♀️🎃</div>
          <p className="privacy-note">Private by design. Nothing you type is saved or sent.</p>
        </div>
      </aside>

      <section className="workspace">
        <div className="settings" ref={settingsRef}>
          <button type="button" className="settings-button" aria-haspopup="true" aria-expanded={settingsOpen}
            onClick={() => setSettingsOpen(!settingsOpen)}>
            <GearIcon /> Settings
          </button>
          {settingsOpen && (
            <div className="settings-panel" role="dialog" aria-label="Settings">
              <fieldset>
                <legend>Theme</legend>
                {THEMES.map((option) => (
                  <label className="theme-option" key={option.id}>
                    <input type="radio" name="theme" checked={theme === option.id} onChange={() => setTheme(option.id)} />
                    <span>
                      {option.label}
                      {'emoji' in option && ` ${option.emoji}`}
                      {'ribbon' in option && <span className="ribbon-inline"><Ribbon size={14} /></span>}
                    </span>
                  </label>
                ))}
              </fieldset>
            </div>
          )}
        </div>
        <div className="content">
          <header className="page-heading">
            <p className="eyebrow">{activeCase.category} <span className="beta-pill">Beta</span></p>
            <h1>{activeCase.title}</h1>
            {activeCase.note && <p className="title-note">{activeCase.note}</p>}
            <p className="description">{activeCase.description}</p>
          </header>

          <div className={`workbench ${activeCase.fields.length === 0 ? 'single' : ''}`}>
            {activeCase.fields.length > 0 && (
            <section className="card form-panel" aria-labelledby="details-heading">
              <div className="panel-heading">
                <h2 id="details-heading">Details</h2>
                <button className="link-button" type="button" onClick={clearFields}>Clear</button>
              </div>
              <div className="fields">
                {visibleFields.map((field) => {
                  const value = inputValue(field, activeCase.fields, activeValues);
                  const empty = field.optional ? 'Not specified' : 'Choose an option';
                  const wide = field.type === 'textarea';
                  return (
                    <label className={`field ${field.type === 'checkbox' ? 'field-toggle' : ''} ${wide ? 'field-wide' : ''}`} key={field.id}>
                      <span className="field-label">
                        {fieldLabel(field, activeValues)}{field.optional && <span className="optional-tag"> optional</span>}
                      </span>
                      {field.type === 'select' ? (
                        <select value={value} onChange={(event) => updateValue(field, event.target.value)}>
                          <option value="">{empty}</option>
                          {field.options?.map((option) => <option key={option} value={option}>{option}</option>)}
                        </select>
                      ) : field.type === 'checkbox' ? (
                        <span className="toggle-row">
                          <input
                            type="checkbox"
                            checked={value === 'Yes'}
                            onChange={(event) => updateValue(field, event.target.checked ? 'Yes' : 'No')}
                          />
                          <span className="toggle-track" aria-hidden="true"><span /></span>
                          <span className="toggle-value">{value === 'Yes' ? 'Yes' : 'No'}</span>
                        </span>
                      ) : field.type === 'textarea' ? (
                        <textarea
                          rows={5}
                          value={value}
                          placeholder={field.placeholder}
                          onChange={(event) => updateValue(field, event.target.value)}
                        />
                      ) : (
                        <input
                          type={field.type === 'number' ? 'number' : 'text'}
                          inputMode={field.type === 'number' ? 'numeric' : undefined}
                          min={field.min}
                          max={field.max}
                          value={value}
                          placeholder={field.placeholder}
                          onChange={(event) => updateValue(field, event.target.value)}
                          onBlur={field.format ? (event) => updateValue(field, formatValue(field.format!, event.target.value)) : undefined}
                        />
                      )}
                      {field.hint && <span className="field-hint">{field.hint}</span>}
                    </label>
                  );
                })}
              </div>
              {warnings.length > 0 && (
                <ul className="warnings" role="status">
                  {warnings.map((message) => <li key={message}>{message}</li>)}
                </ul>
              )}
            </section>
            )}

            <div className={`preview-column ${activeCase.afterPrompt ? 'has-extra' : ''}`}>
            <section className="card preview-panel" aria-labelledby="preview-heading">
              <div className="panel-heading">
                <h2 id="preview-heading">Prompt</h2>
                <span className="live-label"><i /> Live preview</span>
              </div>
              <pre className="prompt-preview">
                {prompt.split(MISSING).map((part, index) => (
                  <span key={index}>{index > 0 && <mark>{MISSING}</mark>}{part}</span>
                ))}
              </pre>
              <div className="preview-footer">
                <span className={`preview-hint ${missingCount > 0 ? 'attention' : ''}`}>
                  {missingCount > 0
                    ? `${missingCount} ${missingCount === 1 ? 'detail is' : 'details are'} still marked [missing].`
                    : 'Review before copying into your approved tool.'}
                </span>
                <div className="preview-actions">
                  {(Object.keys(CHAT_TARGETS) as ChatTarget[]).map((target) => (
                    <button key={target} type="button" className={`open-button ${target === 'claude' ? 'open-claude' : 'open-gpt'}`} onClick={() => openChat(target)}>
                      {target === 'claude' ? <ClaudeIcon /> : <ChatGPTIcon />}
                      {CHAT_TARGETS[target].label}
                    </button>
                  ))}
                  <button className="copy-button" onClick={copyPrompt}>
                    {copied ? '✓ Copied' : 'Copy prompt'}
                  </button>
                </div>
              </div>
              <p className="open-note" role="status">
                {chatStatus || 'Opening a chat also copies your prompt. If the chat opens empty, paste it in.'}
              </p>
            </section>
            {activeCase.afterPrompt && (
              <section className="card extra-card" aria-label="Follow-up text">
                <h3>{activeCase.afterPrompt.heading}</h3>
                <p>{activeCase.afterPrompt.text}</p>
                <button className="secondary-button" type="button" onClick={() => copyExtra(activeCase.afterPrompt!.text)}>
                  {copiedExtra ? '✓ Copied' : 'Copy text'}
                </button>
              </section>
            )}
            </div>
          </div>
          <footer className="content-footer">
            <span>Prompt Studio is in beta. Do not enter real candidate or client information.</span>
          </footer>
        </div>
      </section>
    </main>
  );
}

export default App;
