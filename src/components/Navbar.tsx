"use client";
import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { signOut } from "next-auth/react";

const Navbar = () => {
    const [open, setOpen] = useState(false);

    const handleSignOut = () => {
        signOut({ callbackUrl: "/login" });
    };

    return (
        <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-slate-200/50 shadow-sm">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                <div className="flex items-center">
                    <Link href="/">
                        <Image
                            src="/images/tokyoquest_logo.png"
                            alt="TokyoQuest Logo"
                            width={40}
                            height={40}
                            className="rounded-lg"
                        />
                    </Link>
                </div>

                {/* Hamburger Menu Button */}
                <button
                    onClick={() => setOpen(true)}
                    className="text-2xl text-slate-600 hover:text-slate-900 transition-colors duration-200"
                    aria-label="Open menu"
                >
                    ☰
                </button>

                {/* Mobile Menu Modal */}
                <div className={`fixed inset-0 z-50 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black bg-opacity-30 backdrop-blur-sm"
                        onClick={() => setOpen(false)}
                    />

                    {/* Menu Content */}
                    <div className={`absolute right-0 top-0 h-full w-64 bg-white/95 backdrop-blur-md border-l border-slate-200/50 text-slate-900 p-6 shadow-2xl transition-transform duration-300 ease-out ${open ? 'translate-x-0' : 'translate-x-full'}`}>
                        {/* Close Button */}
                        <button
                            onClick={() => setOpen(false)}
                            className="absolute top-4 right-4 text-2xl text-slate-600 hover:text-slate-900 transition-colors duration-200"
                            aria-label="Close menu"
                        >
                            ✕
                        </button>

                        {/* Menu Items */}
                        <nav className="mt-12">
                            <ul className="space-y-6">
                                <li>
                                    <Link
                                        href="/"
                                        onClick={() => setOpen(false)}
                                        className="text-xl font-medium text-slate-900 hover:text-primary-600 transition-colors duration-200 block"
                                    >
                                        Home
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="/profile"
                                        onClick={() => setOpen(false)}
                                        className="text-xl font-medium text-slate-900 hover:text-primary-600 transition-colors duration-200 block"
                                    >
                                        Profile
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="/saved_quests"
                                        onClick={() => setOpen(false)}
                                        className="text-xl font-medium text-slate-900 hover:text-primary-600 transition-colors duration-200 block"
                                    >
                                        Saved Quests
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="/blog"
                                        onClick={() => setOpen(false)}
                                        className="text-xl font-medium text-slate-900 hover:text-primary-600 transition-colors duration-200 block"
                                    >
                                        Blog
                                    </Link>
                                </li>
                                <li className="pt-4 border-t border-slate-200">
                                    <button
                                        onClick={handleSignOut}
                                        className="text-xl font-medium text-slate-900 hover:text-primary-600 transition-colors duration-200"
                                    >
                                        Sign Out
                                    </button>
                                </li>
                            </ul>
                        </nav>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Navbar;