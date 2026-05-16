"use client";

import type { User } from "firebase/auth";
import { UserAvatar } from "@/components/auth/user-avatar";

interface AccountUserBlockProps {
  user: User;
}

export function AccountUserBlock({ user }: AccountUserBlockProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10">
      <UserAvatar user={user} size={40} />
      <div className="min-w-0 flex-1">
        {user.displayName && (
          <p className="text-sm font-semibold text-white truncate">
            {user.displayName}
          </p>
        )}
        <p className="text-xs text-neutral-400 truncate">{user.email}</p>
      </div>
    </div>
  );
}
