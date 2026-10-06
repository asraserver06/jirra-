"use client";

import React, { useRef, useState, useEffect } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Type,
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (htmlContent: string) => void;
  fontFamily?: string;
  onFontFamilyChange?: (font: string) => void;
  alignment?: 'left' | 'center' | 'right' | 'justify';
  onAlignmentChange?: (align: 'left' | 'center' | 'right' | 'justify') => void;
}

const FONT_OPTIONS = [
  { label: 'Sans-Serif (Inter)', value: 'Inter, sans-serif' },
  { label: 'Serif (Merriweather)', value: 'Merriweather, serif' },
  { label: 'Monospace (JetBrains)', value: 'JetBrains Mono, monospace' },
  { label: 'Display (Jakarta)', value: 'Plus Jakarta Sans, sans-serif' },
];

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  fontFamily = 'Inter, sans-serif',
  onFontFamilyChange,
  alignment = 'left',
  onAlignmentChange,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [currentFont, setCurrentFont] = useState(fontFamily);
  const [currentAlign, setCurrentAlign] = useState(alignment);

  useEffect(() => {
    if (editorRef.current && activeTab === 'editor') {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || '<p>Write issue details here...</p>';
      }
    }
  }, [value, activeTab]);

  const executeCommand = (command: string, arg: string | undefined = undefined) => {
    document.execCommand(command, false, arg);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleFontChange = (newFont: string) => {
    setCurrentFont(newFont);
    if (onFontFamilyChange) onFontFamilyChange(newFont);
    executeCommand('fontName', newFont);
  };

  const handleAlignChange = (align: 'left' | 'center' | 'right' | 'justify') => {
    setCurrentAlign(align);
    if (onAlignmentChange) onAlignmentChange(align);

    if (align === 'left') executeCommand('justifyLeft');
    if (align === 'center') executeCommand('justifyCenter');
    if (align === 'right') executeCommand('justifyRight');
    if (align === 'justify') executeCommand('justifyFull');
  };

  const handleHeadingChange = (tag: string) => {
    if (tag === 'p') executeCommand('formatBlock', '<p>');
    else if (tag === 'h1') executeCommand('formatBlock', '<h1>');
    else if (tag === 'h2') executeCommand('formatBlock', '<h2>');
    else if (tag === 'h3') executeCommand('formatBlock', '<h3>');
    else if (tag === 'blockquote') executeCommand('formatBlock', '<blockquote>');
    else if (tag === 'pre') executeCommand('formatBlock', '<pre>');
  };

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card shadow-2xs">
      {/* Editor Toolbar */}
      <div className="bg-muted/40 border-b border-border p-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Formatting */}
          <div className="flex items-center bg-background rounded-lg border border-border p-0.5">
            <button
              type="button"
              onClick={() => executeCommand('bold')}
              title="Bold"
              className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors font-bold"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => executeCommand('italic')}
              title="Italic"
              className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => executeCommand('underline')}
              title="Underline"
              className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
            >
              <Underline className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => executeCommand('strikeThrough')}
              title="Strikethrough"
              className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
            >
              <Strikethrough className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Font Family */}
          <div className="flex items-center bg-background rounded-lg border border-border px-2 py-1 text-xs text-muted-foreground gap-1.5">
            <Type className="w-3 h-3 text-primary" />
            <select
              value={currentFont}
              onChange={(e) => handleFontChange(e.target.value)}
              className="bg-transparent text-foreground outline-none cursor-pointer text-xs font-semibold"
            >
              {FONT_OPTIONS.map((font) => (
                <option key={font.value} value={font.value} className="bg-card text-card-foreground">
                  {font.label}
                </option>
              ))}
            </select>
          </div>

          {/* Style Selector */}
          <div className="flex items-center bg-background rounded-lg border border-border px-2 py-1 text-xs text-muted-foreground gap-1.5">
            <span className="font-semibold text-xs text-primary">Style:</span>
            <select
              onChange={(e) => handleHeadingChange(e.target.value)}
              className="bg-transparent text-foreground outline-none cursor-pointer text-xs font-medium"
              defaultValue="p"
            >
              <option value="p" className="bg-card text-card-foreground">Paragraph</option>
              <option value="h1" className="bg-card text-card-foreground">Heading 1</option>
              <option value="h2" className="bg-card text-card-foreground">Heading 2</option>
              <option value="h3" className="bg-card text-card-foreground">Heading 3</option>
              <option value="blockquote" className="bg-card text-card-foreground">Quote</option>
              <option value="pre" className="bg-card text-card-foreground">Code</option>
            </select>
          </div>

          {/* Alignment */}
          <div className="flex items-center bg-background rounded-lg border border-border p-0.5">
            <button
              type="button"
              onClick={() => handleAlignChange('left')}
              title="Align Left"
              className={`p-1 rounded transition-colors ${currentAlign === 'left' ? 'bg-secondary text-primary' : 'hover:bg-muted text-muted-foreground'}`}
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleAlignChange('center')}
              title="Align Center"
              className={`p-1 rounded transition-colors ${currentAlign === 'center' ? 'bg-secondary text-primary' : 'hover:bg-muted text-muted-foreground'}`}
            >
              <AlignCenter className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleAlignChange('right')}
              title="Align Right"
              className={`p-1 rounded transition-colors ${currentAlign === 'right' ? 'bg-secondary text-primary' : 'hover:bg-muted text-muted-foreground'}`}
            >
              <AlignRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleAlignChange('justify')}
              title="Justify"
              className={`p-1 rounded transition-colors ${currentAlign === 'justify' ? 'bg-secondary text-primary' : 'hover:bg-muted text-muted-foreground'}`}
            >
              <AlignJustify className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Lists */}
          <div className="flex items-center bg-background rounded-lg border border-border p-0.5">
            <button
              type="button"
              onClick={() => executeCommand('insertUnorderedList')}
              title="Bullet List"
              className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => executeCommand('insertOrderedList')}
              title="Numbered List"
              className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
            >
              <ListOrdered className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* View Mode */}
        <div className="flex items-center bg-muted/60 rounded-lg p-0.5 text-xs border border-border">
          <button
            type="button"
            onClick={() => setActiveTab('editor')}
            className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold transition-all ${
              activeTab === 'editor' ? 'bg-background text-foreground shadow-2xs' : 'text-muted-foreground'
            }`}
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold transition-all ${
              activeTab === 'preview' ? 'bg-background text-foreground shadow-2xs' : 'text-muted-foreground'
            }`}
          >
            Preview
          </button>
        </div>
      </div>

      {/* Editor Content Area */}
      <div className="p-3 bg-card min-h-[180px]">
        {activeTab === 'editor' ? (
          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            style={{
              fontFamily: currentFont,
              textAlign: currentAlign,
            }}
            className="outline-none min-h-[160px] text-card-foreground leading-normal text-xs focus:ring-0"
          />
        ) : (
          <div
            style={{
              fontFamily: currentFont,
              textAlign: currentAlign,
            }}
            className="text-card-foreground leading-normal text-xs min-h-[160px] p-3 bg-muted/30 rounded-lg border border-border"
            dangerouslySetInnerHTML={{ __html: value || '<em class="text-muted-foreground">No content provided.</em>' }}
          />
        )}
      </div>
    </div>
  );
};
