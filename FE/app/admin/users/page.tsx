"use client";

import { Users, UserPlus, ShieldCheck, Activity } from "lucide-react";

const MOCK_USERS = [
  { id: 1, name: "Dr. Andi Prasetyo", email: "andi@biowatch.id", role: "Admin", status: "Active", lastLogin: "2026-04-15" },
  { id: 2, name: "Siti Nurhaliza", email: "siti@biowatch.id", role: "Researcher", status: "Active", lastLogin: "2026-04-14" },
  { id: 3, name: "Budi Santoso", email: "budi@biowatch.id", role: "Field Officer", status: "Active", lastLogin: "2026-04-13" },
  { id: 4, name: "Maya Putri", email: "maya@biowatch.id", role: "Researcher", status: "Inactive", lastLogin: "2026-03-28" },
  { id: 5, name: "Rudi Hermawan", email: "rudi@biowatch.id", role: "Field Officer", status: "Active", lastLogin: "2026-04-12" },
];

const stats = [
  { label: "Total Users", value: "24", icon: Users, color: "text-blue-600 bg-blue-50" },
  { label: "Active Users", value: "18", icon: Activity, color: "text-green-600 bg-green-50" },
  { label: "Admins", value: "3", icon: ShieldCheck, color: "text-purple-600 bg-purple-50" },
  { label: "New This Month", value: "5", icon: UserPlus, color: "text-amber-600 bg-amber-50" },
];

export default function UserManagement() {
  return (
    <div className="p-6 space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card flex items-center gap-4">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${stat.color}`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-bold">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold">Users</h2>
          <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
            <UserPlus className="h-4 w-4" />
            Add User
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Name</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Email</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Role</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Last Login</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_USERS.map((user) => (
                <tr key={user.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 font-medium">{user.name}</td>
                  <td className="px-6 py-4 text-muted-foreground">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      user.role === "Admin" ? "bg-purple-100 text-purple-700" :
                      user.role === "Researcher" ? "bg-blue-100 text-blue-700" :
                      "bg-green-100 text-green-700"
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      user.status === "Active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${user.status === "Active" ? "bg-green-500" : "bg-gray-400"}`} />
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{user.lastLogin}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
