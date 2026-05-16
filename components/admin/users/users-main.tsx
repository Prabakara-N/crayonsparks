"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Search, Users as UsersIcon } from "lucide-react";
import { useAdmin } from "@/lib/hooks/use-admin";
import { PageHeader } from "@/components/account/page-header";
import { UserRow, type AdminUserSummary } from "./user-row";

export function UsersMain() {
  const { listUsers } = useAdmin();
  const [users, setUsers] = useState<AdminUserSummary[] | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(
    async (q: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await listUsers({ search: q || undefined, limit: 50 });
        setUsers(res.items);
      } catch {
        setError("Couldn't load users.");
      } finally {
        setLoading(false);
      }
    },
    [listUsers],
  );

  useEffect(() => {
    void fetchUsers("");
  }, [fetchUsers]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void fetchUsers(search);
    }, 250);
    return () => window.clearTimeout(id);
  }, [search, fetchUsers]);

  return (
    <div>
      <PageHeader
        title="Users"
        description="Search, inspect, and manage every signed-up user."
      />

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by email, name, or uid…"
          className="w-full pl-9 pr-3 py-2 rounded-full bg-zinc-900/60 border border-white/10 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-amber-500/50"
        />
      </div>

      {error && <p className="text-sm text-red-300 mb-4">{error}</p>}

      {loading && users === null ? (
        <div className="flex items-center gap-2 text-sm text-neutral-400">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading users…
        </div>
      ) : users && users.length === 0 ? (
        <div className="rounded-2xl bg-zinc-900/60 backdrop-blur-xl border border-white/10 p-8 text-center">
          <UsersIcon className="w-8 h-8 text-neutral-500 mx-auto mb-2" />
          <p className="text-sm text-neutral-400">
            {search ? "No users match this search." : "No users yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {users?.map((u) => <UserRow key={u.uid} user={u} />)}
        </div>
      )}
    </div>
  );
}
