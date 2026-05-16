"use client";

import type { ReactNode } from "react";
import { Mail, KeyRound, Palette, Bell } from "lucide-react";
import { useUser } from "@/lib/hooks/use-user";
import { PageHeader } from "../page-header";
import { ComingSoonTag } from "../coming-soon-tag";

export function SettingsMain() {
  const { user } = useUser();

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Manage your account, security, and preferences."
        actions={<ComingSoonTag />}
      />

      <div className="space-y-4">
        <SettingRow
          icon={Mail}
          title="Email"
          description="Used for sign-in, notifications, and KDP receipt copies."
        >
          <input
            type="email"
            value={user?.email ?? ""}
            readOnly
            className="w-full max-w-md mt-2 h-10 px-3 rounded-lg bg-black/40 border border-white/10 text-sm text-neutral-300"
          />
        </SettingRow>

        <SettingRow
          icon={KeyRound}
          title="Password"
          description="Change your password — minimum 6 characters."
        >
          <button
            type="button"
            disabled
            className="mt-2 px-4 py-2 rounded-full text-sm font-semibold text-white bg-white/10 border border-white/15 disabled:opacity-60"
          >
            Change password
          </button>
        </SettingRow>

        <SettingRow
          icon={Palette}
          title="Theme"
          description="Choose light, dark, or follow the system."
        >
          <div className="mt-2 inline-flex p-1 rounded-full bg-black/40 border border-white/10">
            {["System", "Dark", "Light"].map((t, i) => (
              <button
                key={t}
                type="button"
                disabled
                className={`px-3 py-1.5 rounded-full text-xs font-semibold disabled:cursor-not-allowed ${
                  i === 1
                    ? "bg-linear-to-r from-violet-500 to-cyan-400 text-white"
                    : "text-neutral-400"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </SettingRow>

        <SettingRow
          icon={Bell}
          title="Email notifications"
          description="Generation finished, low credit balance, product updates."
        >
          <div className="mt-2 space-y-2 text-sm text-neutral-300">
            {[
              "Generation completed",
              "Low credit warning",
              "Monthly product updates",
            ].map((label) => (
              <label key={label} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  defaultChecked
                  disabled
                  className="rounded border-white/15 bg-black/40"
                />
                {label}
              </label>
            ))}
          </div>
        </SettingRow>
      </div>
    </div>
  );
}

function SettingRow({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof Mail;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-zinc-900/60 backdrop-blur-xl border border-white/10 p-5">
      <div className="flex items-start gap-3">
        <span className="w-9 h-9 rounded-xl bg-violet-500/15 border border-violet-500/30 inline-flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-violet-200" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-white text-sm">{title}</h3>
          <p className="text-xs text-neutral-400 mt-0.5">{description}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
