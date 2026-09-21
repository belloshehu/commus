'use client';

import React, { useState } from 'react';
import { UserSession } from '@/lib/auth';
import { GUIDANCE_CATEGORIES, GuidanceCategory, UrgencyLevel, GuidanceMedia, EmergencyContact } from '@/lib/guidance/types';
import { Shield, Plus, Trash2, X, AlertCircle } from 'lucide-react';

interface CreateGuidanceModalProps {
  userSession: UserSession | null;
  isOpen: boolean;
  onClose: () => void;
  onGuideCreated: () => void;
}

export const CreateGuidanceModal: React.FC<CreateGuidanceModalProps> = ({
  userSession,
  isOpen,
  onClose,
  onGuideCreated,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<GuidanceCategory>('fire');
  const [urgencyLevel, setUrgencyLevel] = useState<UrgencyLevel>('HIGH');
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');

  // Dynamic Lists
  const [doList, setDoList] = useState<string[]>(['']);
  const [dontList, setDontList] = useState<string[]>(['']);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([
    { name: '', phone: '', roleOrAgency: '' },
  ]);

  // Media attachments
  const [mediaItems, setMediaItems] = useState<GuidanceMedia[]>([]);
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'audio'>('image');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaTitle, setMediaTitle] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddDo = () => setDoList([...doList, '']);
  const handleRemoveDo = (index: number) => setDoList(doList.filter((_, i) => i !== index));
  const handleDoChange = (index: number, val: string) => {
    const copy = [...doList];
    copy[index] = val;
    setDoList(copy);
  };

  const handleAddDont = () => setDontList([...dontList, '']);
  const handleRemoveDont = (index: number) => setDontList(dontList.filter((_, i) => i !== index));
  const handleDontChange = (index: number, val: string) => {
    const copy = [...dontList];
    copy[index] = val;
    setDontList(copy);
  };

  const handleAddContact = () => setEmergencyContacts([...emergencyContacts, { name: '', phone: '', roleOrAgency: '' }]);
  const handleRemoveContact = (index: number) => setEmergencyContacts(emergencyContacts.filter((_, i) => i !== index));
  const handleContactChange = (index: number, field: keyof EmergencyContact, val: string) => {
    const copy = [...emergencyContacts];
    copy[index] = { ...copy[index], [field]: val };
    setEmergencyContacts(copy);
  };

  const handleAddMedia = () => {
    if (!mediaUrl.trim() || !mediaTitle.trim()) return;
    const newItem: GuidanceMedia = {
      id: `m_${Date.now()}`,
      type: mediaType,
      url: mediaUrl.trim(),
      title: mediaTitle.trim(),
    };
    setMediaItems([...mediaItems, newItem]);
    setMediaUrl('');
    setMediaTitle('');
  };

  const handleRemoveMedia = (id: string) => {
    setMediaItems(mediaItems.filter((m) => m.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !summary.trim() || !description.trim()) {
      setError('Please fill in the title, summary, and detailed description.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/guidance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session: userSession,
          title,
          category,
          urgencyLevel,
          summary,
          description,
          doList: doList.filter((d) => d.trim().length > 0),
          dontList: dontList.filter((d) => d.trim().length > 0),
          emergencyContacts: emergencyContacts.filter((c) => c.name.trim().length > 0 && c.phone.trim().length > 0),
          media: mediaItems,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create Safety Guidance entry.');
      }

      onGuideCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred during submission.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-cyan-500/30 bg-slate-900 p-6 shadow-2xl text-slate-100 my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4 text-cyan-400">
          <Shield className="w-6 h-6" />
          <h3 className="text-lg font-bold text-white">Publish Official Safety Guidance</h3>
        </div>

        <p className="text-xs text-slate-400 mb-6 border-b border-slate-800 pb-3">
          Authorized dispatchers and emergency responders can publish actionable community safety protocols with media.
        </p>

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/50 bg-red-950/40 p-3 text-xs text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Title & Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Guidance Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Gas Leak Evacuation & Fire Safety"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as GuidanceCategory)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
              >
                {GUIDANCE_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Urgency Level & Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Urgency Priority</label>
              <select
                value={urgencyLevel}
                onChange={(e) => setUrgencyLevel(e.target.value as UrgencyLevel)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
              >
                <option value="LOW">LOW Priority</option>
                <option value="MEDIUM">MEDIUM Priority</option>
                <option value="HIGH">HIGH Priority</option>
                <option value="CRITICAL">CRITICAL Priority</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-slate-300 font-semibold mb-1">Brief Summary *</label>
              <input
                type="text"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="1-2 sentences summarizing the protocol..."
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Full Description */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Detailed Description *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Provide context, key safety warnings, and background..."
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
              required
            />
          </div>

          {/* DO's List */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-emerald-400 font-semibold">Immediate Action Steps (DO List)</label>
              <button
                type="button"
                onClick={handleAddDo}
                className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add Step
              </button>
            </div>
            {doList.map((item, idx) => (
              <div key={idx} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={item}
                  onChange={(e) => handleDoChange(idx, e.target.value)}
                  placeholder={`Step ${idx + 1}: e.g. Turn off gas regulator`}
                  className="flex-1 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-white"
                />
                {doList.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveDo(idx)}
                    className="text-slate-500 hover:text-red-400 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* DON'T's List */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-rose-400 font-semibold">Prohibited Actions (DON&apos;T List)</label>
              <button
                type="button"
                onClick={handleAddDont}
                className="text-[11px] text-rose-400 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add Hazard
              </button>
            </div>
            {dontList.map((item, idx) => (
              <div key={idx} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={item}
                  onChange={(e) => handleDontChange(idx, e.target.value)}
                  placeholder={`Hazard ${idx + 1}: e.g. Do NOT flip light switches`}
                  className="flex-1 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-white"
                />
                {dontList.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveDont(idx)}
                    className="text-slate-500 hover:text-red-400 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Emergency Contacts */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-cyan-400 font-semibold">Emergency Contacts & Hotlines</label>
              <button
                type="button"
                onClick={handleAddContact}
                className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add Contact
              </button>
            </div>
            {emergencyContacts.map((contact, idx) => (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2 bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                <input
                  type="text"
                  value={contact.name}
                  onChange={(e) => handleContactChange(idx, 'name', e.target.value)}
                  placeholder="Agency / Contact Name"
                  className="rounded-md border border-slate-800 bg-slate-900 px-2 py-1 text-white"
                />
                <input
                  type="text"
                  value={contact.phone}
                  onChange={(e) => handleContactChange(idx, 'phone', e.target.value)}
                  placeholder="Phone Number (e.g. 112)"
                  className="rounded-md border border-slate-800 bg-slate-900 px-2 py-1 text-white"
                />
                <div className="flex gap-1 items-center">
                  <input
                    type="text"
                    value={contact.roleOrAgency || ''}
                    onChange={(e) => handleContactChange(idx, 'roleOrAgency', e.target.value)}
                    placeholder="Role (e.g. Dispatch Command)"
                    className="flex-1 rounded-md border border-slate-800 bg-slate-900 px-2 py-1 text-white"
                  />
                  {emergencyContacts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveContact(idx)}
                      className="text-slate-500 hover:text-red-400 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Attach Media */}
          <div className="border-t border-slate-800 pt-3">
            <label className="block text-purple-400 font-semibold mb-2">Attach Guidance Media (Photo / Video / Audio)</label>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2">
              <select
                value={mediaType}
                onChange={(e) => setMediaType(e.target.value as any)}
                className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-white"
              >
                <option value="image">Photo / Image</option>
                <option value="video">MP4 Video</option>
                <option value="audio">Audio Broadcast</option>
              </select>

              <input
                type="text"
                value={mediaTitle}
                onChange={(e) => setMediaTitle(e.target.value)}
                placeholder="Media Title (e.g. Evacuation Map)"
                className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-white md:col-span-1"
              />

              <input
                type="url"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                placeholder="Media URL (https://...)"
                className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-white md:col-span-2"
              />
            </div>

            <button
              type="button"
              onClick={handleAddMedia}
              className="text-xs bg-purple-600/80 hover:bg-purple-600 text-white px-3 py-1 rounded-lg flex items-center gap-1 mb-3 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Attach Media
            </button>

            {mediaItems.length > 0 && (
              <div className="space-y-1 mb-2">
                {mediaItems.map((m) => (
                  <div key={m.id} className="flex items-center justify-between text-[11px] bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <span className="text-slate-300 truncate">
                      <strong className="uppercase text-purple-400">{m.type}:</strong> {m.title} ({m.url})
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveMedia(m.id)}
                      className="text-slate-500 hover:text-red-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {loading ? (
                <>Publishing...</>
              ) : (
                <>
                  <Shield className="w-4 h-4" /> Publish Safety Guide
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
