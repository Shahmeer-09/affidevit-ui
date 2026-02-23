import { useState, useEffect, useCallback, useRef, useMemo, useLayoutEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Save, FileEdit, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { IntakeQuestion } from '@/store/api/adminApi';
import { API_BASE_URL } from '@/lib/constants';

// helpers

/** Build display HTML: wrap {{field}} in coloured non-editable chips and preserve line breaks. */
function buildPreviewHtml(raw: string): string {
  // 1. Replace placeholders with styled chips
  let html = raw.replace(
    /\{\{(\w+)\}\}/g,
    '<mark data-ph="1" contenteditable="false" style="background:#ddd6fe;color:#5b21b6;padding:2px 6px;border-radius:4px;font-family:monospace;font-size:0.78em;font-weight:700;user-select:none;cursor:default">{{$1}}</mark>',
  );
  // 2. Convert newlines to <br> only if template is purely plain-text (no block HTML).
  //    Templates with <ol>/<li>/<p> already have their own structure.
  const hasBlockHtml = /<(p|ol|ul|li|h[1-6])(\s[^>]*)?>/.test(html);
  if (!hasBlockHtml) {
    html = html.replace(/\n/g, '<br>');
  }
  return html;
}

/** Decode HTML entities like &nbsp;, &amp;, etc. */
function decodeHtmlEntities(text: string): string {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

// Inline formatting tags that should be preserved when saving the template.
const KEEP_TAGS_RE = /^(\/?(strong|b|em|i|u|sup|sub|ol|ul|li|p|h[1-6]))$/i;

/** Strip display marks back to raw {{field}} tokens and decode HTML entities.
 *  Preserves bold/italic/list/heading/paragraph HTML tags so template formatting survives save. */
function stripMarks(html: string): string {
  // Remove mark wrappers (field chips) → restore {{field}}
  let cleaned = html.replace(/<mark[^>]*>\{\{(\w+)\}\}<\/mark>/gi, '{{$1}}');

  // Check if template uses block-level HTML — if so, preserve the structure
  const hasBlockHtml = /<(p|ol|ul|li|h[1-6])(\s[^>]*)?>/.test(cleaned);

  if (hasBlockHtml) {
    // Template has proper HTML structure — only strip non-formatting tags
    // Convert <br> to \n inside block context
    cleaned = cleaned.replace(/<br\s*\/?>/gi, '\n');
    // Strip <div> wrappers (contentEditable artifact) but keep content
    cleaned = cleaned.replace(/<\/div>/gi, '\n');
    cleaned = cleaned.replace(/<div[^>]*>/gi, '');
    // Remove span and other non-formatting tags EXCEPT the keep list
    cleaned = cleaned.replace(/<(\/?[a-zA-Z][a-zA-Z0-9]*)[^>]*>/g, (match, tag) =>
      KEEP_TAGS_RE.test(tag) ? `<${tag}>` : ''
    );
  } else {
    // Plain-text template — convert block tags to newlines
    cleaned = cleaned.replace(/<br\s*\/?>/gi, '\n');
    cleaned = cleaned.replace(/<\/p>/gi, '\n');
    cleaned = cleaned.replace(/<p[^>]*>/gi, '');
    cleaned = cleaned.replace(/<\/div>/gi, '\n');
    cleaned = cleaned.replace(/<div[^>]*>/gi, '');
    cleaned = cleaned.replace(/<\/li>/gi, '\n');
    // Remove all remaining tags
    cleaned = cleaned.replace(/<(\/?[a-zA-Z][a-zA-Z0-9]*)[^>]*>/g, (match, tag) =>
      KEEP_TAGS_RE.test(tag) ? `<${tag}>` : ''
    );
  }

  // Decode HTML entities (&nbsp;, &amp;, etc.)
  cleaned = decodeHtmlEntities(cleaned);
  // Normalize multiple newlines
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  return cleaned;
}

/** Map a visible-text char count => raw-HTML char offset (skips tags). */
function textOffsetToHtmlOffset(html: string, textOffset: number): number {
  let counted = 0;
  let i = 0;
  while (i < html.length) {
    if (html[i] === '<') {
      const close = html.indexOf('>', i);
      i = close === -1 ? html.length : close + 1;
    } else {
      if (counted >= textOffset) return i;
      counted++;
      i++;
    }
  }
  return html.length;
}

/** Move offset to after any placeholder it falls inside. */
function clampOutsidePlaceholder(html: string, offset: number): number {
  const re = /\{\{\w+\}\}/g;
  let m: RegExpExecArray | null;
  // eslint-disable-next-line no-cond-assign
  while ((m = re.exec(html)) !== null) {
    if (offset > m.index && offset < m.index + m[0].length) return m.index + m[0].length;
  }
  return offset;
}

// types

interface ContextMenu {
  visible: boolean;
  x: number;
  y: number;
  selectedText: string;
  selectionStart: number;
  selectionEnd: number;
}

export interface TemplateEditorProps {
  affidavitTypeId: string;
  initialTemplate: string;
  onSave: (template: string) => Promise<void>;
  onFieldCreated?: (question: IntakeQuestion, updatedTemplate: string) => void;
  onPreview?: () => void;
}

// component

export function TemplateEditor({
  affidavitTypeId,
  initialTemplate,
  onSave,
  onFieldCreated,
}: TemplateEditorProps) {
  const typeId = Number(affidavitTypeId);
  const token = useSelector((state: RootState) => state.auth.token);

  const [template, setTemplate] = useState(initialTemplate);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // context menu
  const [ctxMenu, setCtxMenu] = useState<ContextMenu>({
    visible: false, x: 0, y: 0, selectedText: '', selectionStart: -1, selectionEnd: -1,
  });

  // add-field modal
  const [showModal, setShowModal] = useState(false);
  const [fieldDesc, setFieldDesc] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [pendingSelection, setPendingSelection] = useState('');
  const [pendingStart, setPendingStart] = useState(-1);
  const [pendingEnd, setPendingEnd] = useState(-1);

  // refs
  const editorRef = useRef<HTMLDivElement>(null);
  const lastSelRef = useRef('');
  const isTypingRef = useRef(false);
  const selfChangeRef = useRef(false);

  // sync initialTemplate => state (parent refresh)
  useEffect(() => {
    if (!selfChangeRef.current) {
      setTemplate(initialTemplate);
      setHasChanges(false);
    }
    selfChangeRef.current = false;
  }, [initialTemplate]);

  // build preview HTML
  const previewHtml = useMemo(() => buildPreviewHtml(template), [template]);

  // sync previewHtml => editor DOM (skip while user is typing)
  useLayoutEffect(() => {
    if (isTypingRef.current) return;
    const el = editorRef.current;
    if (!el) return;
    if (el.innerHTML !== previewHtml) {
      el.innerHTML = previewHtml;
    }
  }, [previewHtml]);

  // existing placeholders list
  const existingPlaceholders = useMemo(
    () => Array.from(new Set(Array.from(template.matchAll(/\{\{(\w+)\}\}/g), (m) => m[1]))),
    [template],
  );

  // track selection inside editor
  useEffect(() => {
    const onSelChange = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) return;
      if (editorRef.current?.contains(sel.anchorNode)) {
        lastSelRef.current = sel.toString().trim();
      }
    };
    document.addEventListener('selectionchange', onSelChange);
    return () => document.removeEventListener('selectionchange', onSelChange);
  }, []);

  // close context-menu on outside mousedown
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (document.getElementById('tmpl-ctx-menu')?.contains(e.target as Node)) return;
      setCtxMenu((m) => (m.visible ? { ...m, visible: false } : m));
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  // contentEditable input handler
  const handleEditorInput = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    isTypingRef.current = true;
    const raw = stripMarks(el.innerHTML);
    selfChangeRef.current = true;
    setTemplate(raw);
    setHasChanges(raw !== initialTemplate);
    requestAnimationFrame(() => { isTypingRef.current = false; });
  }, [initialTemplate]);

  // right-click handling
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 2) {
      const s = window.getSelection()?.toString().trim();
      if (s) lastSelRef.current = s;
    }
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const sel = window.getSelection();
    const selected = sel?.toString().trim() || lastSelRef.current;
    const editorEl = editorRef.current!;

    let selStart = template.length;
    let selEnd = template.length;

    // Compute caret / selection range in raw template offsets
    if (selected && sel && !sel.isCollapsed && editorEl.contains(sel.anchorNode)) {
      // User has a selection — map both endpoints to raw template offsets
      try {
        const range = sel.getRangeAt(0);
        const preStart = document.createRange();
        preStart.setStart(editorEl, 0);
        preStart.setEnd(range.startContainer, range.startOffset);
        selStart = textOffsetToHtmlOffset(template, preStart.toString().length);

        const preEnd = document.createRange();
        preEnd.setStart(editorEl, 0);
        preEnd.setEnd(range.endContainer, range.endOffset);
        selEnd = textOffsetToHtmlOffset(template, preEnd.toString().length);
      } catch {
        // If selection mapping fails, fall back to full-text search
        const idx = template.indexOf(selected);
        if (idx !== -1) {
          selStart = idx;
          selEnd = idx + selected.length;
        }
      }
    } else {
      // No selection — just a right-click point
      const caretRange: any =
        (document as any).caretRangeFromPoint?.(e.clientX, e.clientY) ??
        (document as any).caretPositionFromPoint?.(e.clientX, e.clientY);
      if (caretRange) {
        try {
          const pre = document.createRange();
          pre.setStart(editorEl, 0);
          pre.setEnd(
            caretRange.startContainer ?? caretRange.offsetNode,
            caretRange.startOffset ?? caretRange.offset,
          );
          selStart = textOffsetToHtmlOffset(template, pre.toString().length);
          selEnd = selStart;
        } catch { /* keep fallback */ }
      }
    }

    selStart = clampOutsidePlaceholder(template, selStart);
    selEnd = clampOutsidePlaceholder(template, selEnd);
    lastSelRef.current = '';

    setCtxMenu({ visible: true, x: e.clientX, y: e.clientY, selectedText: selected, selectionStart: selStart, selectionEnd: selEnd });
  }, [template]);

  const handleAddFieldHere = () => {
    setPendingSelection(ctxMenu.selectedText);
    setPendingStart(ctxMenu.selectionStart);
    setPendingEnd(ctxMenu.selectionEnd);
    setCtxMenu((m) => ({ ...m, visible: false }));
    setFieldDesc('');
    setShowModal(true);
  };

  // generate + insert field
  const handleGenerate = async () => {
    if (!fieldDesc.trim()) { toast.error('Please describe the field'); return; }
    setIsGenerating(true);
    try {
      const hasSelection = pendingStart >= 0 && pendingEnd > pendingStart;
      const rangeStart = pendingStart >= 0 ? pendingStart : template.length;
      const rangeEnd = hasSelection ? pendingEnd : rangeStart;

      // Grab surrounding context (±600 chars around the affected range)
      const ctxStart = Math.max(0, rangeStart - 600);
      const ctxEnd = Math.min(template.length, rangeEnd + 600);
      const before = template.substring(ctxStart, rangeStart);
      const after = template.substring(rangeEnd, ctxEnd);
      const selectedSlice = hasSelection ? template.substring(rangeStart, rangeEnd) : '';

      // Safety check: if selection contains existing fields, don't replace them
      if (hasSelection && /\{\{\w+\}\}/.test(selectedSlice)) {
        toast.error('Cannot replace text that contains existing fields. Please click at a specific insertion point instead of selecting existing fields.');
        setIsGenerating(false);
        return;
      }

      // Build context: mark what is being replaced vs. just an insertion point
      const contextSnapshot = hasSelection
        ? `${before}[REPLACE_START]${selectedSlice}[REPLACE_END]${after}`
        : `${before}[INSERTION_POINT]${after}`;

      const res = await fetch(
        `${API_BASE_URL}/admin/affidavit-types/${typeId}/field-suggestions/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            description: fieldDesc,
            context_html: contextSnapshot,
            full_template: template,
            mode: hasSelection ? 'replace' : 'insert',
            selected_text: selectedSlice || undefined,
          }),
        },
      );

      const rawText = await res.text();
      let json: any = null;
      try { json = JSON.parse(rawText); } catch { /* ignore */ }

      if (!res.ok) {
        throw new Error(`Field generation failed (${res.status}): ${json?.error || json?.detail || rawText}`);
      }
      if (!json?.field_id) throw new Error('AI response missing field_id');

      const fieldId: string = json.field_id;
      const tag = `{{${fieldId}}}`;

      if (template.includes(tag)) throw new Error(`Field "${fieldId}" already exists`);

      const prefix: string = json.prefix || '';
      const suffix: string = json.suffix || '';
      const insertion = `${prefix}${tag}${suffix}`;

      let newTemplate: string;
      if (hasSelection) {
        // Replace the selected range with the field
        newTemplate = template.slice(0, rangeStart) + insertion + template.slice(rangeEnd);
      } else {
        // Insert at cursor position
        const pos = clampOutsidePlaceholder(template, rangeStart);
        newTemplate = template.slice(0, pos) + insertion + template.slice(pos);
      }

      const newQuestion: IntakeQuestion = {
        id: fieldId,
        field_name: fieldId,
        label: json.label || fieldId.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
        type: json.type || 'text',
        required: true,
        placeholder: json.placeholder || '',
        help_text: json.help_text || '',
      };

      selfChangeRef.current = true;
      setTemplate(newTemplate);
      setHasChanges(true);
      onFieldCreated?.(newQuestion, newTemplate);

      toast.success(`"${tag}" added — click Save to persist`);
      setShowModal(false);
      setFieldDesc('');
      setPendingSelection('');
      setPendingStart(-1);
      setPendingEnd(-1);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to insert field');
    } finally {
      setIsGenerating(false);
    }
  };

  // save
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(template);
      setHasChanges(false);
      toast.success('Template saved');
    } catch {
      toast.error('Failed to save template');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileEdit className="h-5 w-5" />
                Template Editor
              </CardTitle>
              <CardDescription>
                Edit the document directly. Right-click anywhere to insert a dynamic field with AI.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {hasChanges && (
                <Badge variant="outline" className="text-amber-600">Unsaved Changes</Badge>
              )}
              <Button size="sm" onClick={handleSave} disabled={!hasChanges || isSaving}>
                <Save className="h-4 w-4 mr-1" />
                {isSaving ? 'Saving\u2026' : 'Save'}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {existingPlaceholders.length > 0 && (
            <div className="flex flex-wrap gap-1 p-2 bg-muted/50 rounded-md">
              <span className="text-xs font-medium mr-1 text-muted-foreground">Fields:</span>
              {existingPlaceholders.map((ph) => (
                <Badge key={ph} variant="secondary" className="text-xs font-mono">
                  {`{{${ph}}}`}
                </Badge>
              ))}
            </div>
          )}

          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            spellCheck={false}
            onInput={handleEditorInput}
            onMouseDown={handleMouseDown}
            onContextMenu={handleContextMenu}
            className="border rounded-md p-6 min-h-150 bg-white overflow-auto prose prose-sm max-w-none focus:outline-none focus:ring-2 focus:ring-ring [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:pl-1 [&_strong]:font-bold [&_h1]:font-bold [&_h2]:font-bold [&_h3]:font-bold"
          />

          <p className="text-xs text-muted-foreground">
            <Sparkles className="inline h-3 w-3 text-purple-500 mr-1" />
            Right-click or select text to add a dynamic field with AI. Purple chips are non-editable field placeholders.
          </p>
        </CardContent>
      </Card>

      {ctxMenu.visible && (
        <div
          id="tmpl-ctx-menu"
          className="fixed z-50 bg-white border shadow-lg rounded-md py-1 min-w-48"
          style={{ top: ctxMenu.y, left: ctxMenu.x }}
        >
          <button
            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent text-left"
            onClick={handleAddFieldHere}
          >
            <Sparkles className="h-4 w-4 text-purple-600 shrink-0" />
            <span>Add Field Here</span>
            {ctxMenu.selectedText && (
              <Badge variant="secondary" className="ml-auto text-xs shrink-0">context</Badge>
            )}
          </button>
        </div>
      )}

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              Add Dynamic Field
            </DialogTitle>
            <DialogDescription>
              {pendingSelection
                ? `Selected text \u201c${pendingSelection.slice(0, 40)}${pendingSelection.length > 40 ? '\u2026' : ''}\u201d will be replaced by the field`
                : 'Field will be inserted at your click position'}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-3">
            {pendingSelection && (
              <div className="p-3 bg-muted rounded text-xs font-mono text-muted-foreground overflow-hidden">
                <div className="text-muted-foreground/70 mb-1 font-semibold">AI context:</div>
                <div className="line-clamp-4 wrap-break-word whitespace-pre-wrap">
                  &ldquo;{pendingSelection}&rdquo;
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="field-desc">What field do you want to add?</Label>
              <Textarea
                id="field-desc"
                value={fieldDesc}
                onChange={(e) => setFieldDesc(e.target.value)}
                placeholder="e.g. applicant full name or date of the incident"
                rows={3}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleGenerate();
                }}
              />
              <p className="text-xs text-muted-foreground">
                AI will generate the field using your uploaded template documents as reference.{' '}
                <kbd className="text-xs bg-muted px-1 rounded">Ctrl+Enter</kbd> to submit.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleGenerate} disabled={!fieldDesc.trim() || isGenerating}>
              {isGenerating ? (
                <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Creating\u2026</>
              ) : (
                <><Sparkles className="h-4 w-4 mr-1" />Create Field</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
