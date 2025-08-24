"use client";

import Link from "next/link";
import React, { useState } from "react";
import Image from "next/image";
import SafeJsonLd from "@/components/SafeJsonLd";
import { createTokyoQuestWebSiteJsonLd, createTokyoQuestOrganizationJsonLd } from "@/lib/json-ld";

// Simple inline icons (no external deps)
const IconMapPin = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
        <path d="M12 22s7-6.13 7-12a7 7 0 1 0-14 0c0 5.87 7 12 7 12Z" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.5" />
    </svg>
);
const IconCamera = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
        <path d="M7 7h2l1.5-2h3L15 7h2a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-7a3 3 0 0 1 3-3Z" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="12" cy="13" r="3.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
);
const IconSparkles = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
        <path d="M12 3l1.7 3.9L18 8.5l-3.2 3 0.9 4.4L12 14.6 8.3 16l0.9-4.4L6 8.5l4.3-0.6L12 3Z" stroke="currentColor" strokeWidth="1.5" />
        <path d="M5 4l.8 1.8L7.5 6l-1.3 1.2.4 1.9L5 8l-1.6.9.4-1.9L2.5 6l1.7-.2L5 4Z" stroke="currentColor" strokeWidth="1.5" />
        <path d="M20 4l.8 1.8L22.5 6l-1.3 1.2.4 1.9L20 8l-1.6.9.4-1.9L17.5 6l1.7-.2L20 4Z" stroke="currentColor" strokeWidth="1.5" />
    </svg>
);

// Tokyo-inspired inline icons
const IconTorii = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
        <path d="M4 5h16M3 7h18M6 7v3h12V7M9 10v8M15 10v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
);
const IconFuji = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
        <path d="M3 19h18L14 6l-2 2-2-2-7 13Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M10 8l2-2 2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
);
const IconSakura = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
        <path d="M12 8c0-2 1.5-3.5 3.5-3.5 0 2-.5 3.5-2.5 4.5M12 8c0-2-1.5-3.5-3.5-3.5 0 2 .5 3.5 2.5 4.5M12 16c0 2 1.5 3.5 3.5 3.5 0-2-.5-3.5-2.5-4.5M12 16c0 2-1.5 3.5-3.5 3.5 0-2 .5-3.5 2.5-4.5M12 9.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export default function LandingPage() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // 安全なJSON-LDデータ生成
    const webSiteJsonLd = createTokyoQuestWebSiteJsonLd();
    const organizationJsonLd = createTokyoQuestOrganizationJsonLd();

    return (
        <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-slate-100 text-slate-900 antialiased">
            {/* 安全なJSON-LD for SEO */}
            <SafeJsonLd data={webSiteJsonLd} id="website-jsonld" />
            <SafeJsonLd data={organizationJsonLd} id="organization-jsonld" />

            {/* Header */}
            <header className="sticky top-0 z-50 backdrop-blur-md bg-[#e84b4b] border-b border-slate-200/50 shadow-sm">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3 font-bold text-xl">
                        <Image
                            src="/images/tokyoquest_logo.png"
                            alt="TokyoQuest Logo"
                            width={40}
                            height={40}
                            className="rounded-lg"
                        />
                        <span className="text-white">TokyoQuest</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden sm:flex items-center gap-8 text-sm font-medium text-white">
                        <a href="#features" className="hover:text-slate-200 transition-colors duration-200">Features</a>
                        <a href="#how" className="hover:text-slate-200 transition-colors duration-200">How it works</a>
                        <a href="#faq" className="hover:text-slate-200 transition-colors duration-200">FAQ</a>
                        <Link href="/login" className="rounded-xl px-6 py-2.5 bg-white text-[#ff5757] hover:bg-slate-100 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 font-semibold">Log in</Link>
                    </nav>

                    {/* Mobile menu button */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="sm:hidden text-white hover:text-slate-200 transition-colors duration-200"
                        aria-label="Toggle mobile menu"
                    >
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            {mobileMenuOpen ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            )}
                        </svg>
                    </button>
                </div>

                {/* Mobile Navigation */}
                <div className={`sm:hidden transition-all duration-300 ease-in-out ${mobileMenuOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                    <nav className="px-4 pb-4 space-y-4">
                        <a href="#features" className="block text-white hover:text-slate-200 transition-colors duration-200 py-2" onClick={() => setMobileMenuOpen(false)}>Features</a>
                        <a href="#how" className="block text-white hover:text-slate-200 transition-colors duration-200 py-2" onClick={() => setMobileMenuOpen(false)}>How it works</a>
                        <a href="#faq" className="block text-white hover:text-slate-200 transition-colors duration-200 py-2" onClick={() => setMobileMenuOpen(false)}>FAQ</a>
                        <Link href="/login" className="block rounded-xl px-6 py-3 bg-white text-[#ff5757] hover:bg-slate-100 transition-all duration-200 font-semibold text-center" onClick={() => setMobileMenuOpen(false)}>Log in</Link>
                    </nav>
                </div>
            </header>

            {/* Hero */}
            <section className="relative overflow-hidden">
                <div className="absolute inset-0 -z-10">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 via-transparent to-slate-50/50" />
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-200/20 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-slate-200/20 rounded-full blur-3xl" />
                </div>

                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-20 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                    {/* Left column: copy */}
                    <div className="space-y-8">
                        <div className="space-y-4">
                            <p className="inline-flex items-center gap-2 text-sm font-semibold tracking-widest uppercase text-primary-600 bg-primary-50 px-4 py-2 rounded-full">
                                <IconSparkles className="h-4 w-4" />
                                Explore Tokyo like a local
                            </p>
                            <h1 className="text-5xl lg:text-6xl xl:text-7xl font-extrabold leading-tight bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
                                100 Quests.<br />
                                <span className="text-primary-600">One Unforgettable Tokyo.</span>
                            </h1>
                            <p className="text-xl text-slate-600 leading-relaxed max-w-2xl">
                                TokyoQuest turns your trip into a game: complete bite-sized missions, capture photos & videos, and get a cinematic memory film afterward.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link href="/login" className="inline-flex items-center justify-center gap-2 rounded-xl px-8 py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-slate-700 font-semibold hover:from-primary-600 hover:to-primary-700 shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:-translate-y-1">
                                Get Started
                                <span aria-hidden>→</span>
                            </Link>
                            <Link href="https://www.instagram.com/tokyoquest_jp/" target="_blank" className="inline-flex items-center justify-center gap-2 rounded-xl px-8 py-4 border-2 border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 hover:border-slate-400 transition-all duration-200">
                                Check our Social Media
                            </Link>
                        </div>

                        <div className="flex flex-wrap gap-6 text-sm text-slate-500">
                            <div className="flex items-center gap-2">
                                <IconSakura className="h-5 w-5 text-primary-500" />
                                <span>Sakura vibes</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <IconTorii className="h-5 w-5 text-primary-500" />
                                <span>Hidden shrines</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <IconCamera className="h-5 w-5 text-primary-500" />
                                <span>Capture Memories</span>
                            </div>
                        </div>
                    </div>

                    {/* Right column: mock screenshot grid */}
                    <div className="relative">
                        <div className="relative aspect-[4/3] rounded-3xl border border-slate-200/50 shadow-2xl overflow-hidden bg-white/80 backdrop-blur-sm">
                            <div className="absolute inset-0 grid grid-cols-2 gap-3 p-4">
                                <div className="rounded-2xl bg-gradient-to-br from-indigo-100 to-white border border-slate-200/50 shadow-sm" />
                                <div className="rounded-2xl bg-gradient-to-br from-pink-100 to-white border border-slate-200/50 shadow-sm" />
                                <div className="rounded-2xl bg-gradient-to-br from-emerald-100 to-white border border-slate-200/50 shadow-sm" />
                                <div className="rounded-2xl bg-gradient-to-br from-amber-100 to-white border border-slate-200/50 shadow-sm" />
                            </div>
                            <div className="absolute bottom-4 left-4 right-4 rounded-2xl bg-white/90 backdrop-blur border border-slate-200/50 p-4 flex items-center gap-3 shadow-lg">
                                <IconMapPin className="h-6 w-6 text-primary-500 flex-shrink-0" />
                                <p className="text-sm text-slate-700 font-medium">
                                    Hidden gems, local bites, and iconic spots—guided by playful quests.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section id="features" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24">
                <div className="text-center space-y-4 mb-16">
                    <h2 className="text-4xl lg:text-5xl font-bold text-slate-900">Why TokyoQuest</h2>
                    <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                        A travel game that rewards curiosity—and delivers a film you&apos;ll rewatch forever.
                    </p>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[
                        {
                            title: "100+ curated quests",
                            desc: "Micro-missions designed by locals to unlock Tokyo's neighborhoods.",
                            icon: "🎯"
                        },
                        {
                            title: "Capture & submit",
                            desc: "Snap photos and short clips as you go—everything lives in one place.",
                            icon: "📸"
                        },
                        {
                            title: "Cinematic recap",
                            desc: "We edit your footage into a share-ready highlight film with extra paid.",
                            icon: "🎬"
                        },
                        {
                            title: "Lightweight & offline-friendly",
                            desc: "Quests are tiny, so you won't burn data.",
                            icon: "📱"
                        },
                        {
                            title: "Clear progress",
                            desc: "Track what's done and what's next with a simple checklist.",
                            icon: "✅"
                        },
                        {
                            title: "Privacy-first",
                            desc: "Your media is private; nothing posts without your say-so.",
                            icon: "🔒"
                        },
                    ].map((f, index) => (
                        <div key={f.title} className="group rounded-2xl border border-slate-200 p-8 bg-white shadow-sm hover:shadow-xl hover:border-primary-200 transition-all duration-300 transform hover:-translate-y-1">
                            <div className="text-4xl mb-4">{f.icon}</div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">{f.title}</h3>
                            <p className="text-slate-600 leading-relaxed">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* How it works */}
            <section id="how" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 bg-gradient-to-br from-slate-50 to-white">
                <div className="text-center space-y-4 mb-16">
                    <h2 className="text-4xl lg:text-5xl font-bold text-slate-900">How it works</h2>
                    <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                        Three simple steps to transform your Tokyo adventure
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {[
                        {
                            step: "1",
                            title: "Pick your quests",
                            desc: "Choose from neighborhoods and themes you love.",
                            icon: "🎯"
                        },
                        {
                            step: "2",
                            title: "Explore & capture",
                            desc: "Follow prompts, mark progress, and upload as you go.",
                            icon: "📱"
                        },
                        {
                            step: "3",
                            title: "Get your film",
                            desc: "We craft your memories into a short movie post-trip with extra paid.",
                            icon: "🎬"
                        },
                    ].map((item) => (
                        <div key={item.step} className="relative">
                            <div className="rounded-2xl border border-slate-200 p-8 bg-white shadow-sm hover:shadow-lg transition-all duration-300">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary-100 text-primary-600 font-bold text-lg">
                                        {item.step}
                                    </div>
                                    <div className="text-3xl">{item.icon}</div>
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                                <p className="text-slate-600 leading-relaxed">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="text-center mt-12">
                    <Link href="/login" className="inline-flex items-center gap-2 rounded-xl px-8 py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-slate-700 font-semibold hover:from-primary-600 hover:to-primary-700 shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:-translate-y-1">
                        Start your first quest
                        <span aria-hidden>→</span>
                    </Link>
                </div>
            </section>

            {/* FAQ */}
            <section id="faq" className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-24">
                <div className="text-center space-y-4 mb-16">
                    <h2 className="text-4xl lg:text-5xl font-bold text-slate-900">FAQ</h2>
                    <p className="text-xl text-slate-600">
                        Everything you need to know about TokyoQuest
                    </p>
                </div>

                <div className="space-y-6">
                    {[
                        {
                            q: "Do I need an account?",
                            a: "Yes. You'll log in to track quests and upload media. The landing page is public; the app stays private.",
                        },
                        {
                            q: "Is my footage public?",
                            a: "No. Only you can access it unless you choose to share the final film.",
                        },
                    ].map((item) => (
                        <details key={item.q} className="group rounded-2xl border border-slate-200 bg-white p-6 hover:shadow-lg transition-all duration-200">
                            <summary className="cursor-pointer list-none font-semibold text-lg flex items-center justify-between text-slate-900 hover:text-primary-600 transition-colors duration-200">
                                {item.q}
                                <span className="ml-4 text-slate-400 group-open:rotate-90 transition-transform duration-200 text-2xl">›</span>
                            </summary>
                            <p className="mt-4 text-slate-600 leading-relaxed">{item.a}</p>
                        </details>
                    ))}
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-slate-200 bg-gradient-to-br from-slate-50 to-white">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500 text-white font-bold">TQ</span>
                                <span className="font-bold text-xl text-slate-900">TokyoQuest</span>
                            </div>
                            <div className="text-slate-600">© {new Date().getFullYear()} TokyoQuest. All rights reserved.</div>
                        </div>
                        <nav className="flex items-center gap-6 text-sm font-medium">
                            <Link href="/privacy" className="text-slate-600 hover:text-slate-900 transition-colors duration-200">Privacy</Link>
                            <Link href="/term" className="text-slate-600 hover:text-slate-900 transition-colors duration-200">Terms</Link>
                            <Link href="/login" className="text-slate-600 hover:text-slate-900 transition-colors duration-200">Log in</Link>
                        </nav>
                    </div>
                </div>
            </footer>
        </div>
    );
}
