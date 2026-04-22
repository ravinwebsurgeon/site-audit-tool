'use client';

import { useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Skeleton } from '@/components/Skeleton';
import { useToast } from '@/components/Toast';

const TIER_INFO = {
  FREE: { label: 'Free', color: 'text-slate-600', bg: 'bg-slate-100' },
  PRO: { label: 'Pro', color: 'text-blue-700', bg: 'bg-blue-100' },
  ENTERPRISE: { label: 'Enterprise', color: 'text-violet-700', bg: 'bg-violet-100' },
};

type SessionUser = NonNullable<ReturnType<typeof useSession>['data']>['user'];

function ProfileForm({ sessionUser, updateSession }: {
  sessionUser: SessionUser;
  updateSession: ReturnType<typeof useSession>['update'];
}) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(sessionUser?.name ?? '');
  const [image, setImage] = useState<string | null>(sessionUser?.image ?? null);
  const [preview, setPreview] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const session = { user: sessionUser };

  async function handleSave(e: { preventDefault(): void }) {
    e.preventDefault();
    setSaving(true);

    try {
      let finalImageUrl = image;

      if (pendingFile) {
        const form = new FormData();
        form.append('avatar', pendingFile);
        const res = await fetch('/api/user/avatar', { method: 'POST', body: form });
        const data = await res.json();
        if (!res.ok || !data.success) {
          toast.error(data.message ?? 'Failed to upload image');
          setSaving(false);
          return;
        }
        finalImageUrl = data.data.url;
        setImage(finalImageUrl);
        setPreview(null);
        setPendingFile(null);
      }

      if (removeAvatar) {
        const res = await fetch('/api/user/avatar', { method: 'DELETE' });
        if (res.ok) {
          finalImageUrl = null;
          setImage(null);
          setRemoveAvatar(false);
        }
      }

      const res = await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, ...(finalImageUrl !== image ? { image: finalImageUrl } : {}) }),
      });
      const data = await res.json();
      if (data.success) {
        await updateSession({ name, image: finalImageUrl });
        toast.success('Profile updated successfully!');
      } else {
        toast.error(data.message ?? 'Failed to update profile');
      }
    } catch {
      toast.error('Network error — please try again.');
    } finally {
      setSaving(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error('Image must be less than 2 MB'); return; }

    setRemoveAvatar(false);
    setPendingFile(file);

    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  function handleRemove() {
    setPendingFile(null);
    setPreview(null);
    setRemoveAvatar(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  const tier = TIER_INFO[(sessionUser?.subscriptionTier ?? 'FREE') as keyof typeof TIER_INFO];
  const displayImage = preview ?? (removeAvatar ? null : image);

  // suppress unused warning for handleRemove / displayImage until avatar upload is re-enabled
  void handleRemove;
  void displayImage;

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage your account settings</p>
        </div>
        <Link href="/dashboard" className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Dashboard
        </Link>
      </div>

      <>
        {/* Subscription tier */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-700">Subscription</p>
            <p className="text-xs text-slate-400 mt-0.5">Your current plan</p>
          </div>
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${tier.bg} ${tier.color}`}>
            {tier.label}
          </span>
        </div>

        {/* Profile form */}
        <form onSubmit={handleSave} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <h2 className="text-base font-semibold text-slate-800">Profile Information</h2>

          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">Display Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Your name"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Email (read-only) */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">Email</label>
            <input
              id="email"
              type="email"
              value={session?.user?.email ?? ''}
              disabled
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-400 cursor-not-allowed"
            />
            <p className="text-xs text-slate-400 mt-1">Email cannot be changed</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              {saving ? (pendingFile ? 'Uploading…' : 'Saving…') : 'Save Changes'}
            </button>
            <Link
              href="/dashboard"
              className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </>
    </div>
  );
}

export default function ProfilePage() {
  const { data: session, status: sessionStatus, update: updateSession } = useSession();

  if (sessionStatus === 'unauthenticated') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 mb-4">Sign in to view your profile.</p>
          <Link href="/auth/signin" className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  if (sessionStatus === 'loading' || !session?.user) {
    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10">
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-20 w-20 rounded-full" />
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return <ProfileForm sessionUser={session.user} updateSession={updateSession} />;
}
