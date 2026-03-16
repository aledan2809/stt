"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Mic,
  Home,
  Settings,
  FileText,
  Clock,
  Activity
} from "lucide-react"

const navigation = [
  { name: "Acasa", href: "/", icon: Home },
  { name: "Dictare", href: "/record", icon: Mic },
  { name: "Rapoarte", href: "/reports", icon: FileText },
  { name: "Istoric", href: "/history", icon: Clock },
  { name: "Setari", href: "/settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-200">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-600">
          <Activity className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-gray-900">STT Module</h1>
          <p className="text-xs text-gray-500">Dictare Medicala</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5",
                isActive ? "text-blue-600" : "text-gray-400"
              )} />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-gray-200">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <span className="text-xs text-gray-600">Provider activ</span>
        </div>
      </div>
    </aside>
  )
}
