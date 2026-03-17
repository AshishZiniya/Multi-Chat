"use client"

import { useSession } from "next-auth/react"
import Link from "next/link"
import Image from "next/image"
import MaterialIcon from "@/components/MaterialIcon"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("personal")

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="animate-pulse flex flex-col items-center gap-4"
        >
          <div className="w-16 h-16 bg-white/5 rounded-full" />
          <div className="h-4 w-32 bg-white/5 rounded" />
        </motion.div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    router.push("/auth/login")
    return null
  }

  const tabs = [
    { id: "personal", label: "Personal Information", icon: "person" },
    { id: "security", label: "Security & Privacy", icon: "shield" },
    { id: "preferences", label: "Preferences", icon: "settings" },
    { id: "billing", label: "Billing & Plans", icon: "payments" },
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-barlow selection:bg-primary/30 text-[16px]">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto px-4 py-8 relative"
      >
        {/* Header/Nav */}
        <header className="flex items-center justify-between mb-12">
          <Link 
            href="/"
            className="group flex items-center gap-2 text-sm text-white/40 hover:text-white transition-all underline-offset-4 hover:underline"
          >
            <div className="size-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
              <MaterialIcon name="arrow_back" className="text-lg group-hover:-translate-x-0.5 transition-transform" />
            </div>
            Back to Canvas
          </Link>
          <div className="text-right">
            <h1 className="text-xl font-bold tracking-tight">Account Settings</h1>
            <p className="text-[10px] text-white/30 uppercase tracking-[0.2em]">Manage your digital workspace</p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
          {/* Sidebar */}
          <aside className="space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden ${
                  activeTab === tab.id 
                    ? "bg-white/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.05)]" 
                    : "text-white/40 hover:bg-white/5 hover:text-white/70"
                }`}
              >
                {activeTab === tab.id && (
                  <motion.div 
                    layoutId="activeTabBg"
                    className="absolute inset-0 bg-white/5 -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <MaterialIcon 
                  name={tab.icon} 
                  className={`text-xl transition-colors duration-300 ${activeTab === tab.id ? "text-primary" : "text-inherit"}`} 
                />
                <span className="text-sm font-medium">{tab.label}</span>
                {activeTab === tab.id && (
                  <motion.div 
                    layoutId="activeTabIndicator"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" 
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </button>
            ))}
            
            <div className="pt-8 mt-8 border-t border-white/5">
              <button 
                onClick={() => router.push("/auth/logout")} // Or your logout logic
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400/60 hover:text-red-400 hover:bg-red-400/5 transition-all group"
              >
                <MaterialIcon name="logout" className="text-xl" />
                <span className="text-sm font-medium">System Sign Out</span>
              </button>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="space-y-6">
            {/* Banner & Profile Summary */}
            <section className="relative overflow-hidden rounded-3xl bg-white/5 border border-white/10">
              <div className="h-32 bg-linear-to-r from-primary/20 via-primary/5 to-transparent relative">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
              </div>
              
              <div className="px-8 pb-8 -mt-12 relative">
                <div className="flex flex-col md:flex-row items-end gap-6 mb-8">
                  <div className="relative group">
                    <motion.div 
                      whileHover={{ scale: 1.05 }}
                      className="absolute -inset-1 bg-linear-to-r from-primary to-primary rounded-full blur opacity-20 group-hover:opacity-40 transition-opacity"
                    ></motion.div>
                    <div className="size-32 rounded-full border-4 border-[#0a0a0a] overflow-hidden bg-[#111] relative">
                      {session?.user?.image ? (
                        <Image 
                          src={session.user.image} 
                          alt={session.user.name || "Profile"} 
                          width={128}
                          height={128}
                          unoptimized
                          className="object-cover"
                        />
                      ) : (
                        <div className="size-full flex items-center justify-center text-white/10">
                          <MaterialIcon name="account_circle" className="text-7xl" />
                        </div>
                      )}
                      <button className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <MaterialIcon name="photo_camera" className="text-2xl" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex-1 pb-2">
                    <motion.h2 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-3xl font-bold tracking-tight mb-1"
                    >
                      {session?.user?.name}
                    </motion.h2>
                    <motion.p 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                      className="text-white/40 text-sm flex items-center gap-2"
                    >
                      <MaterialIcon name="mail" className="text-base" />
                      {session?.user?.email}
                    </motion.p>
                  </div>

                  <button className="bg-white text-black px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-white/90 active:scale-95 transition-all">
                    Edit Profile
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-white/5">
                  {[
                    { label: "Status", value: "Active Entity", icon: "verified" },
                    { label: "Level", value: "Xen-Pro", icon: "workspace_premium" },
                    { label: "Established", value: "March 2024", icon: "calendar_today" }
                  ].map((stat, i) => (
                    <motion.div 
                      key={i} 
                      whileHover={{ y: -2, backgroundColor: "rgba(255,255,255,0.04)" }}
                      className="flex items-center gap-3 p-3 rounded-2xl bg-white/2 transition-colors"
                    >
                      <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <MaterialIcon name={stat.icon} className="text-xl" />
                      </div>
                      <div>
                        <p className="text-[10px] text-white/30 uppercase tracking-widest">{stat.label}</p>
                        <p className="text-sm font-medium">{stat.value}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>

            {/* Tab-specific Content Card */}
            <AnimatePresence mode="wait">
              <motion.section 
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm min-h-[400px]"
              >
                <div className="max-w-2xl">
                  <h3 className="text-xl font-semibold mb-2">
                    {tabs.find(t => t.id === activeTab)?.label}
                  </h3>
                  <p className="text-sm text-white/40 mb-8">
                    Update your {activeTab} information and manage how your data is displayed.
                  </p>

                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs text-white/30 uppercase tracking-widest ml-1">Full Identity</label>
                        <input 
                          type="text" 
                          defaultValue={session?.user?.name || ""}
                          className="w-full bg-white/3 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary/50 focus:bg-white/5 outline-none transition-all placeholder:text-white/10"
                          placeholder="Your identity name"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs text-white/30 uppercase tracking-widest ml-1">Communication Channel</label>
                        <input 
                          type="email" 
                          defaultValue={session?.user?.email || ""}
                          readOnly
                          className="w-full bg-white/1 border border-white/5 rounded-xl px-4 py-3 text-sm text-white/30 cursor-not-allowed outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs text-white/30 uppercase tracking-widest ml-1">Account Bio</label>
                      <textarea 
                        rows={4}
                        placeholder="Share a bit about yourself..."
                        className="w-full bg-white/3 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary/50 focus:bg-white/5 outline-none transition-all resize-none placeholder:text-white/10"
                      />
                    </div>

                    <div className="pt-4 flex justify-end gap-4">
                      <button className="px-6 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:bg-white/5 transition-colors">
                        Discard Changes
                      </button>
                      <motion.button 
                        whileTap={{ scale: 0.98 }}
                        className="px-8 py-2.5 rounded-xl text-sm font-semibold bg-primary text-white hover:opacity-90 transition-all shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]"
                      >
                        Save Evolution
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.section>
            </AnimatePresence>
          </main>
        </div>

        <footer className="mt-20 pt-8 border-t border-white/5 text-center">
          <p className="text-[10px] text-white/10 uppercase tracking-[0.4em] font-light">
            XenCoder Systems • Intelligence Matrix v4.2.0
          </p>
        </footer>
      </motion.div>
    </div>
  )
}
