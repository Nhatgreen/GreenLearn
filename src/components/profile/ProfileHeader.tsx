'use client';

import React, { useState, useRef } from 'react';
import { UserProfile, useAuth } from '@/hooks/useAuth';
import { getSupabase } from '@/lib/supabase';
import { Camera, Loader2, Coins } from 'lucide-react';

interface ProfileHeaderProps {
  profile: UserProfile | null;
  email: string;
}

export function ProfileHeader({ profile, email }: ProfileHeaderProps) {
  const { refreshProfile } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayName = profile?.display_name || email.split('@')[0] || 'Học viên GreenLearn';
  const initial = displayName.charAt(0).toUpperCase();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile?.id) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Vui lòng chọn file hình ảnh hợp lệ.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('Kích thước ảnh tối đa là 2MB.');
      return;
    }

    setIsUploading(true);
    setErrorMsg(null);

    const supabase = getSupabase();
    if (!supabase) {
      setErrorMsg('Chưa kết nối Supabase Cloud.');
      setIsUploading(false);
      return;
    }

    try {
      const fileExt = file.name.split('.').pop() || 'png';
      const filePath = `${profile.id}/avatar-${Date.now()}.${fileExt}`;

      // 1. Upload to Supabase Storage bucket 'avatars'
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // 3. Update public.profiles
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id);

      if (updateError) {
        throw updateError;
      }

      await refreshProfile();
    } catch (err: any) {
      setErrorMsg(err.message || 'Không thể tải ảnh đại diện lên.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-5">
      {/* Avatar Container */}
      <div className="relative group">
        <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-tr from-[#F0FDF4] to-green-100 border-2 border-green-200 flex items-center justify-center text-2xl font-black text-[#16A34A] shadow-sm">
          {profile?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img 
              src={profile.avatar_url} 
              alt={displayName} 
              className="w-full h-full object-cover" 
            />
          ) : (
            <span>{initial}</span>
          )}
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          aria-label="Thay đổi ảnh đại diện"
          className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg bg-slate-900 hover:bg-[#16A34A] text-white flex items-center justify-center shadow-md transition-colors disabled:opacity-50"
        >
          {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleAvatarChange}
          className="hidden"
        />
      </div>

      {/* User Information */}
      <div className="flex-1 text-center sm:text-left">
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">{displayName}</h2>
        <p className="text-xs text-slate-500 font-medium mt-0.5">{email}</p>

        {/* ViToken Badge */}
        <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-[#F0FDF4] border border-green-200/80 rounded-xl">
          <div className="w-5 h-5 rounded-full bg-[#16A34A] text-white flex items-center justify-center font-black text-[11px]">
            V
          </div>
          <span className="text-xs text-slate-600">Số dư khả dụng:</span>
          <span className="text-xs font-black font-mono text-[#166534]">
            {profile?.vitoken_balance ?? 0} ViToken
          </span>
        </div>

        {errorMsg && (
          <p className="text-xs text-red-600 font-medium mt-2">{errorMsg}</p>
        )}
      </div>
    </div>
  );
}
