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
        <header className="bg-red-500 text-white flex justify-between items-center p-2 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center">
                <Link href="/home">
                    <Image src="/images/tokyoquest_logo.png" alt="Tokyo QUEST Logo" width={100} height={100} />
                </Link>
            </div>

            {/* Hamburger Menu Button */}
            <button
                onClick={() => setOpen(true)}
                className="text-5xl hover:opacity-80 transition-opacity duration-200"
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
                <div className={`absolute right-0 top-0 h-full w-64 bg-red-500 text-white p-6 shadow-2xl transition-transform duration-300 ease-out ${open ? 'translate-x-0' : 'translate-x-full'}`}>
                    {/* Close Button */}
                    <button
                        onClick={() => setOpen(false)}
                        className="absolute top-4 right-4 text-2xl hover:opacity-80 transition-opacity duration-200"
                        aria-label="Close menu"
                    >
                        ✕
                    </button>

                    {/* Menu Items */}
                    <nav className="mt-12">
                        <ul className="space-y-8">
                            <li>
                                <Link
                                    href="/"
                                    onClick={() => setOpen(false)}
                                    className="text-2xl hover:opacity-80 transition-opacity duration-200 block"
                                >
                                    Home
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/profile"
                                    onClick={() => setOpen(false)}
                                    className="text-2xl hover:opacity-80 transition-opacity duration-200 block"
                                >
                                    Profile
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/saved_quests"
                                    onClick={() => setOpen(false)}
                                    className="text-2xl hover:opacity-80 transition-opacity duration-200 block"
                                >
                                    Saved Quests
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/blog"
                                    onClick={() => setOpen(false)}
                                    className="text-2xl hover:opacity-80 transition-opacity duration-200 block"
                                >
                                    Blog
                                </Link>
                            </li>
                            <li>
                                <button
                                    onClick={handleSignOut}
                                    className="text-2xl hover:opacity-80 transition-opacity duration-200"
                                >
                                    Sign Out
                                </button>
                            </li>
                        </ul>
                    </nav>
                </div>
            </div>
        </header>
    );
};

export default Navbar;