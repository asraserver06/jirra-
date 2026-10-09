"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Layers } from 'lucide-react';
import { JiraTicket, TicketPriority, TicketStatus, TicketType, User } from '../types/jira';

import { RichTextEditor } from './RichTextEditor';
import { Button } from './ui/button';
import { useAppSelector } from '@/store';

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
  const { user } = useAppSelector((state) => state.auth);
  const defaultAssignee: User = { id: user?.id || '', name: user?.name || 'Unassigned', email: user?.email || '', avatar: user?.avatar || '', role: 'member' };
  const [assignee, setAssignee] = useState<User>(defaultAssignee);
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
      setDescription('');
      setStatus(initialStatus);
      setPriority('high');
      setType('story');
      setAssignee(defaultAssignee);
      setStoryPoints(3);
    }
  }, [ticketToEdit, initialStatus, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      id: ticketToEdit ? ticketToEdit.id : undefined,
      key: ticketToEdit?.key,
      title,
      description,
      status,
      priority,
      type,
      assignee,
      reporter: ticketToEdit?.reporter,
      storyPoints,
      fontFamily,
      alignment,
    });

    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="bg-card border border-border rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-card-foreground"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-border/70 flex items-center justify-between bg-muted/30">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <span className="text-foreground font-bold flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-primary" /> TaskFlow
              </span>
              <span>/</span>
              <span>{ticketToEdit ? ticketToEdit.key : 'New Issue'}</span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Modal Body */}
          <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 flex flex-col md:flex-row">
            {/* Left 70%: Title & Description */}
            <div className="flex-1 p-6 space-y-5 border-b md:border-b-0 md:border-r border-border/70">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Issue Summary <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Summarize the task..."
                  className="w-full bg-background border border-border rounded-xl px-4 py-2 text-sm font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Description & Formatted Notes
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

            {/* Right 30%: Attributes */}
            <div className="w-full md:w-72 bg-muted/20 p-5 space-y-4 shrink-0">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider border-b border-border/70 pb-2">
                Issue Attributes
              </h4>

              {/* Status Select */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TicketStatus)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-semibold text-foreground outline-none focus:border-ring transition-colors"
                >
                  <option value="todo">TO DO</option>
                  <option value="in_progress">IN PROGRESS</option>
                  <option value="in_review">IN REVIEW</option>
                  <option value="done">DONE</option>
                </select>
              </div>

              {/* Priority Select */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TicketPriority)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-semibold text-foreground outline-none focus:border-ring transition-colors"
                >
                  <option value="urgent">🟣 Urgent (Critical)</option>
                  <option value="high">🔴 High Priority</option>
                  <option value="medium">🟡 Medium Priority</option>
                  <option value="low">🟢 Low Priority</option>
                </select>
              </div>

              {/* Assignee Selection */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Assignee</label>
                <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                  {assignee?.name ? (
                    <div className="flex items-center gap-2 p-1.5 rounded-xl bg-primary/10 border border-primary/30">
                      {assignee.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={assignee.avatar} alt="" className="w-5 h-5 rounded-full object-cover" />
                      ) : (
                        <span aria-hidden="true" className="w-5 h-5 rounded-full bg-muted flex items-center justify-center">
                          {assignee.name.slice(0, 1).toUpperCase()}
                        </span>
                      )}
                      <span className="text-xs font-semibold text-primary truncate">{assignee.name}</span>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No assignee — assigned to you on save.</p>
                  )}
                </div>
              </div>

              {/* Issue Type */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Issue Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as TicketType)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-semibold text-foreground outline-none focus:border-ring transition-colors"
                >
                  <option value="story">🟢 User Story</option>
                  <option value="bug">🔴 Bug Fix</option>
                  <option value="task">🔵 Task</option>
                  <option value="epic">🟣 Epic</option>
                </select>
              </div>

              {/* Story Points */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Story Points</label>
                <input
                  type="number"
                  min="1"
                  max="40"
                  value={storyPoints}
                  onChange={(e) => setStoryPoints(parseInt(e.target.value) || 1)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-semibold text-foreground outline-none focus:border-ring transition-colors"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-border/70 space-y-2">
                <Button type="submit" className="w-full py-2 text-xs font-semibold rounded-xl">
                  {ticketToEdit ? 'Save Changes' : 'Create Issue'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="w-full py-2 text-xs font-medium rounded-xl"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
