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
  Eye,
  Edit3,
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
    <div className="border border-[#DFE1E6] rounded-md overflow-hidden bg-white shadow-xs">
      {/* Jira Editor Toolbar */}
      <div className="bg-[#FAFBFC] border-b border-[#DFE1E6] p-1.5 flex flex-wrap items-center justify-between gap-1.5">
        <div className="flex flex-wrap items-center gap-1">
          {/* Bold, Italic, Underline, Strikethrough */}
          <div className="flex items-center bg-white rounded border border-[#DFE1E6] p-0.5">
            <button
              type="button"
              onClick={() => executeCommand('bold')}
              title="Bold"
              className="p-1 hover:bg-[#EBECF0] rounded text-[#42526E] hover:text-[#0052CC] transition font-bold"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => executeCommand('italic')}
              title="Italic"
              className="p-1 hover:bg-[#EBECF0] rounded text-[#42526E] hover:text-[#0052CC] transition"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => executeCommand('underline')}
              title="Underline"
              className="p-1 hover:bg-[#EBECF0] rounded text-[#42526E] hover:text-[#0052CC] transition"
            >
              <Underline className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => executeCommand('strikeThrough')}
              title="Strikethrough"
              className="p-1 hover:bg-[#EBECF0] rounded text-[#42526E] hover:text-[#0052CC] transition"
            >
              <Strikethrough className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Font Family Selector */}
          <div className="flex items-center bg-white rounded border border-[#DFE1E6] px-2 py-0.5 text-xs text-[#42526E] gap-1">
            <Type className="w-3 h-3 text-[#0052CC]" />
            <select
              value={currentFont}
              onChange={(e) => handleFontChange(e.target.value)}
              className="bg-transparent text-[#172B4D] outline-none cursor-pointer text-xs font-semibold"
            >
              {FONT_OPTIONS.map((font) => (
                <option key={font.value} value={font.value}>
                  {font.label}
                </option>
              ))}
            </select>
          </div>

          {/* Style Selector */}
          <div className="flex items-center bg-white rounded border border-[#DFE1E6] px-2 py-0.5 text-xs text-[#42526E] gap-1">
            <span className="font-semibold text-xs text-[#6554C0]">Style:</span>
            <select
              onChange={(e) => handleHeadingChange(e.target.value)}
              className="bg-transparent text-[#172B4D] outline-none cursor-pointer text-xs"
              defaultValue="p"
            >
              <option value="p">Paragraph (Normal)</option>
              <option value="h1">Heading 1 (Large)</option>
              <option value="h2">Heading 2 (Medium)</option>
              <option value="h3">Heading 3 (Small)</option>
              <option value="blockquote">Quote Block</option>
              <option value="pre">Code Block</option>
            </select>
          </div>

          {/* Alignment Selector */}
          <div className="flex items-center bg-white rounded border border-[#DFE1E6] p-0.5">
            <button
              type="button"
              onClick={() => handleAlignChange('left')}
              title="Align Left"
              className={`p-1 rounded transition ${currentAlign === 'left' ? 'bg-[#DEEBFF] text-[#0052CC]' : 'hover:bg-[#EBECF0] text-[#42526E]'}`}
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleAlignChange('center')}
              title="Align Center"
              className={`p-1 rounded transition ${currentAlign === 'center' ? 'bg-[#DEEBFF] text-[#0052CC]' : 'hover:bg-[#EBECF0] text-[#42526E]'}`}
            >
              <AlignCenter className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleAlignChange('right')}
              title="Align Right"
              className={`p-1 rounded transition ${currentAlign === 'right' ? 'bg-[#DEEBFF] text-[#0052CC]' : 'hover:bg-[#EBECF0] text-[#42526E]'}`}
            >
              <AlignRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleAlignChange('justify')}
              title="Justify"
              className={`p-1 rounded transition ${currentAlign === 'justify' ? 'bg-[#DEEBFF] text-[#0052CC]' : 'hover:bg-[#EBECF0] text-[#42526E]'}`}
            >
              <AlignJustify className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Lists */}
          <div className="flex items-center bg-white rounded border border-[#DFE1E6] p-0.5">
            <button
              type="button"
              onClick={() => executeCommand('insertUnorderedList')}
              title="Bullet List"
              className="p-1 hover:bg-[#EBECF0] rounded text-[#42526E] hover:text-[#0052CC] transition"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => executeCommand('insertOrderedList')}
              title="Numbered List"
              className="p-1 hover:bg-[#EBECF0] rounded text-[#42526E] hover:text-[#0052CC] transition"
            >
              <ListOrdered className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* View Mode */}
        <div className="flex items-center bg-[#EBECF0] rounded p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('editor')}
            className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${
              activeTab === 'editor' ? 'bg-white text-[#0052CC] shadow-xs' : 'text-[#5E6C84]'
            }`}
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${
              activeTab === 'preview' ? 'bg-white text-[#0052CC] shadow-xs' : 'text-[#5E6C84]'
            }`}
          >
            Preview
          </button>
        </div>
      </div>

      {/* Text Box Content */}
      <div className="p-3 bg-white min-h-[180px]">
        {activeTab === 'editor' ? (
          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            style={{
              fontFamily: currentFont,
              textAlign: currentAlign,
            }}
            className="outline-none min-h-[160px] text-[#172B4D] leading-normal text-xs focus:ring-0"
          />
        ) : (
          <div
            style={{
              fontFamily: currentFont,
              textAlign: currentAlign,
            }}
            className="text-[#172B4D] leading-normal text-xs min-h-[160px] p-2 bg-slate-50 rounded border border-slate-200"
            dangerouslySetInnerHTML={{ __html: value || '<em class="text-slate-400">No content provided.</em>' }}
          />
        )}
      </div>
    </div>
  );
};
