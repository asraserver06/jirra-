import React, { useState, useEffect } from 'react';
import {
  X,
  Flame,
  AlertCircle,
  Zap,
  CheckCircle2,
  Bookmark,
  Bug,
  CheckSquare,
  User as UserIcon,
  Tag,
  Hash,
  Share2,
  MoreHorizontal,
} from 'lucide-react';
import { JiraTicket, TicketPriority, TicketStatus, TicketType, User } from '../types/jira';
import { MOCK_USERS } from '../data/mockData';
import { RichTextEditor } from './RichTextEditor';

interface TicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (ticketData: Partial<JiraTicket>) => void;
  ticketToEdit?: JiraTicket | null;
  initialStatus?: TicketStatus;
}

export const TicketModal: React.FC<TicketModalProps> = ({
  isOpen,
  onClose,
  onSave,
  ticketToEdit,
  initialStatus = 'todo',
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TicketStatus>(initialStatus);
  const [priority, setPriority] = useState<TicketPriority>('high');
  const [type, setType] = useState<TicketType>('story');
  const [assignee, setAssignee] = useState<User>(MOCK_USERS[0]);
  const [storyPoints, setStoryPoints] = useState<number>(3);
  const [fontFamily, setFontFamily] = useState<string>('Inter, sans-serif');
  const [alignment, setAlignment] = useState<'left' | 'center' | 'right' | 'justify'>('left');

  useEffect(() => {
    if (ticketToEdit) {
      setTitle(ticketToEdit.title);
      setDescription(ticketToEdit.description);
      setStatus(ticketToEdit.status);
      setPriority(ticketToEdit.priority);
      setType(ticketToEdit.type);
      setAssignee(ticketToEdit.assignee);
      setStoryPoints(ticketToEdit.storyPoints);
      if (ticketToEdit.fontFamily) setFontFamily(ticketToEdit.fontFamily);
      if (ticketToEdit.alignment) setAlignment(ticketToEdit.alignment);
    } else {
      setTitle('');
      setDescription('<p>Write details about this issue...</p>');
      setStatus(initialStatus);
      setPriority('high');
      setType('story');
      setAssignee(MOCK_USERS[0]);
      setStoryPoints(3);
    }
  }, [ticketToEdit, initialStatus, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      id: ticketToEdit ? ticketToEdit.id : undefined,
      key: ticketToEdit ? ticketToEdit.key : `PROJ-${Math.floor(100 + Math.random() * 900)}`,
      title,
      description,
      status,
      priority,
      type,
      assignee,
      reporter: ticketToEdit ? ticketToEdit.reporter : MOCK_USERS[1],
      storyPoints,
      fontFamily,
      alignment,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border border-[#DFE1E6] rounded-xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-jira-modal overflow-hidden text-[#172B4D]">
        {/* Jira Modal Header */}
        <div className="px-6 py-3 border-b border-[#DFE1E6] flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#5E6C84]">
            <span className="text-[#0052CC] font-bold">Acme Software</span>
            <span>/</span>
            <span>{ticketToEdit ? ticketToEdit.key : 'New Issue'}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-slate-200 text-[#5E6C84] transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content Form Grid */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 flex flex-col md:flex-row">
          {/* Main Area (Left 70%): Summary Title & Rich Text Box */}
          <div className="flex-1 p-6 space-y-5 border-b md:border-b-0 md:border-r border-[#DFE1E6]">
            {/* Issue Title Summary Input */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#5E6C84] mb-1">
                Summary Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Add issue summary..."
                className="w-full bg-white border border-[#DFE1E6] rounded-md px-3.5 py-2 text-base font-bold text-[#172B4D] placeholder-slate-400 focus:outline-none focus:border-[#4C9AFF] focus:ring-2 focus:ring-blue-100 transition"
              />
            </div>

            {/* Rich Text Ticket Box */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#5E6C84] mb-1.5">
                Description & Formatted Text Box (Bold, Font Family & Styles Alignment)
              </label>
              <RichTextEditor
                value={description}
                onChange={setDescription}
                fontFamily={fontFamily}
                onFontFamilyChange={setFontFamily}
                alignment={alignment}
                onAlignmentChange={setAlignment}
              />
            </div>
          </div>

          {/* Details Sidebar (Right 30%): Status, Assignee, Priority, Points, Type */}
          <div className="w-full md:w-72 bg-[#FAFBFC] p-5 space-y-4 shrink-0">
            <h4 className="text-xs font-bold text-[#172B4D] uppercase tracking-wider border-b border-[#DFE1E6] pb-2">
              Issue Attributes
            </h4>

            {/* Status Dropdown */}
            <div>
              <label className="block text-xs font-bold text-[#5E6C84] mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TicketStatus)}
                className="w-full bg-white border border-[#DFE1E6] rounded px-3 py-1.5 text-xs font-bold text-[#172B4D] outline-none focus:border-[#4C9AFF]"
              >
                <option value="todo">TO DO</option>
                <option value="in_progress">IN PROGRESS</option>
                <option value="in_review">IN REVIEW</option>
                <option value="done">DONE</option>
              </select>
            </div>

            {/* Priority Selector */}
            <div>
              <label className="block text-xs font-bold text-[#5E6C84] mb-1">Priority Level</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TicketPriority)}
                className={`w-full bg-white border rounded px-3 py-1.5 text-xs font-bold outline-none ${
                  priority === 'urgent'
                    ? 'border-purple-500 text-purple-700'
                    : priority === 'high'
                    ? 'border-red-500 text-[#DE350B]'
                    : priority === 'medium'
                    ? 'border-amber-500 text-[#FF9900]'
                    : 'border-emerald-500 text-[#36B37E]'
                }`}
              >
                <option value="urgent" className="text-purple-700 font-bold">🟣 Urgent (Critical)</option>
                <option value="high" className="text-[#DE350B] font-bold">🔥 High Priority</option>
                <option value="medium" className="text-[#FF9900] font-bold">🟡 Medium Priority</option>
                <option value="low" className="text-[#36B37E] font-bold">🟢 Low Priority</option>
              </select>
            </div>

            {/* Assignee Selector */}
            <div>
              <label className="block text-xs font-bold text-[#5E6C84] mb-1">Assignee</label>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {MOCK_USERS.map((usr) => {
                  const isSelected = assignee.id === usr.id;
                  return (
                    <button
                      key={usr.id}
                      type="button"
                      onClick={() => setAssignee(usr)}
                      className={`w-full flex items-center gap-2 p-1.5 rounded text-left transition ${
                        isSelected ? 'bg-blue-50 border border-[#0052CC] font-bold' : 'hover:bg-slate-100'
                      }`}
                    >
                      <img src={usr.avatar} alt={usr.name} className="w-5 h-5 rounded-full object-cover" />
                      <span className="text-xs text-[#172B4D] truncate">{usr.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Issue Type */}
            <div>
              <label className="block text-xs font-bold text-[#5E6C84] mb-1">Issue Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as TicketType)}
                className="w-full bg-white border border-[#DFE1E6] rounded px-3 py-1.5 text-xs font-semibold text-[#172B4D] outline-none"
              >
                <option value="story">🟢 User Story</option>
                <option value="bug">🔴 Bug Fix</option>
                <option value="task">🔵 Task</option>
                <option value="epic">🟣 Epic</option>
              </select>
            </div>

            {/* Story Points */}
            <div>
              <label className="block text-xs font-bold text-[#5E6C84] mb-1">Story Points</label>
              <input
                type="number"
                min="1"
                max="40"
                value={storyPoints}
                onChange={(e) => setStoryPoints(parseInt(e.target.value) || 1)}
                className="w-full bg-white border border-[#DFE1E6] rounded px-3 py-1.5 text-xs font-bold text-[#172B4D] outline-none focus:border-[#4C9AFF]"
              />
            </div>

            {/* Submit Actions */}
            <div className="pt-4 border-t border-[#DFE1E6] space-y-2">
              <button
                type="submit"
                className="w-full py-2 rounded bg-[#0052CC] hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition"
              >
                {ticketToEdit ? 'Save Changes' : 'Create Issue'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-1.5 rounded border border-[#DFE1E6] text-[#42526E] hover:bg-slate-100 text-xs font-semibold transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
