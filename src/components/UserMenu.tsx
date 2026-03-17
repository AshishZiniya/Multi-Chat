import { signOut, useSession } from "next-auth/react"
import Image from "next/image"
import MaterialIcon from "./MaterialIcon"
import * as Popover from "@radix-ui/react-popover"
import Link from "next/link"

export default function UserMenu() {
  const { data: session } = useSession()

  if (!session) return null

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          className="aspect-square size-10 flex items-center justify-center rounded-lg border border-black/10 dark:border-white/20 bg-white dark:bg-black shadow-sm text-black dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          title={session.user?.email || "User profile"}
        >
          {session.user?.image ? (
            <Image 
              src={session.user.image} 
              alt={session.user.name || ""} 
              width={24}
              height={24}
              className="rounded-full" 
            />
          ) : (
            <MaterialIcon name="account_circle" />
          )}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="bottom"
          sideOffset={8}
          align="end"
          className="z-9999 w-64 p-2 rounded-xl bg-white dark:bg-black shadow-xl border border-black/10 dark:border-white/20 font-barlow"
        >
          <Link 
            href="/profile"
            className="block px-3 py-2 border-b border-black/10 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/10 rounded-t-lg transition-colors group"
          >
            <p className="text-sm font-semibold text-black dark:text-white truncate group-hover:text-primary transition-colors">
              {session.user?.name || "User"}
            </p>
            <p className="text-xs text-black/50 dark:text-white/40 truncate">
              {session.user?.email}
            </p>
          </Link>
          <div className="mt-2">
            <button
              onClick={() => signOut()}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-500 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors"
            >
              <MaterialIcon name="logout" className="text-lg" />
              Sign Out
            </button>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
