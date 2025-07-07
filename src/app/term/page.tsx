"use client";

import Image from "next/image";
import { useState } from "react";

export default function TermsPage() {
    const [activeSection, setActiveSection] = useState<string | null>(null);

    const toggleSection = (sectionId: string) => {
        setActiveSection(activeSection === sectionId ? null : sectionId);
    };

    return (
        <div className="min-h-screen bg-black py-16">
            {/* Header */}
            <div className="relative z-10 pt-8 pb-4">
                <div className="container mx-auto px-4">
                    {/* Back to Login Button */}
                    <div className="flex justify-start mb-6">
                        <a
                            href="/login"
                            className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg text-white hover:bg-white/20 transition-all duration-200 hover:scale-105"
                        >
                            <svg
                                className="w-4 h-4 mr-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                                />
                            </svg>
                            Back to Login
                        </a>
                    </div>

                    {/* Title */}
                    <div className="text-center mb-12">
                        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
                            Terms of Service
                        </h1>
                        <p className="text-xl text-white/80">
                            Last updated: 2 July 2025
                        </p>
                    </div>

                    {/* Content */}
                    <div className="max-w-4xl mx-auto">
                        {/* Introduction */}
                        <section className="mb-12">
                            <h2 className="text-3xl font-bold mb-6 text-white">1. Introduction</h2>
                            <div className="space-y-4 text-white/90 leading-relaxed">
                                <p>
                                    Welcome to Tokyo QUEST (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;). These Terms of Service (&ldquo;Terms&rdquo;) govern your use of the Tokyo QUEST mobile application and related services (collectively, the &ldquo;Service&rdquo;).
                                </p>
                                <p>
                                    By accessing or using our Service, you agree to be bound by these Terms. If you disagree with any part of these terms, then you may not access the Service.
                                </p>
                            </div>
                        </section>

                        {/* Service Description */}
                        <section className="mb-12">
                            <h2 className="text-3xl font-bold mb-6 text-white">2. Service Description</h2>
                            <div className="space-y-3 text-white/90">
                                <p>Tokyo QUEST is a quest-based travel application that enables users to:</p>
                                <ul className="space-y-2 ml-6">
                                    <li>• Complete missions and quests in Tokyo</li>
                                    <li>• Upload photos and videos as proof of completion</li>
                                    <li>• Track progress and earn rewards</li>
                                    <li>• Generate personalized travel memories</li>
                                </ul>
                            </div>
                        </section>

                        {/* Eligibility & Accounts */}
                        <section className="mb-12">
                            <h2 className="text-3xl font-bold mb-6 text-white">3. Eligibility & Accounts</h2>
                            <div className="space-y-4 text-white/90">
                                <div className="flex items-start">
                                    <span className="text-white mr-3 font-semibold">1.</span>
                                    <span>You must be at least 13 years old (or the minimum age in your jurisdiction) to use the Service.</span>
                                </div>
                                <div className="flex items-start">
                                    <span className="text-white mr-3 font-semibold">2.</span>
                                    <span>Login is available <strong>only via Google OAuth</strong>. You are responsible for maintaining the confidentiality of your Google account and any activities conducted through it.</span>
                                </div>
                            </div>
                        </section>

                        {/* User Content & License */}
                        <section className="mb-12">
                            <h2 className="text-3xl font-bold mb-6 text-white">4. User Content & License</h2>
                            <div className="space-y-4 text-white/90">
                                <div>
                                    <h4 className="font-semibold text-white mb-2">Ownership</h4>
                                    <p>You retain all copyright and proprietary rights to the photos and videos you upload (&ldquo;User Content&rdquo;).</p>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-white mb-2">Service License</h4>
                                    <p>By uploading User Content you grant Tokyo QUEST a non-exclusive, worldwide, royalty-free license to host, store, process, display, and adapt your User Content solely for the purpose of operating and improving the Service.</p>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-white mb-2">Promotional Use</h4>
                                    <p>Tokyo QUEST will obtain your explicit, prior consent before using any User Content for marketing, advertising, or redistributing any generated videos.</p>
                                </div>
                            </div>
                        </section>

                        {/* Acceptable Use */}
                        <section className="mb-12">
                            <h2 className="text-3xl font-bold mb-6 text-white">5. Acceptable Use</h2>
                            <p className="text-white/90 mb-4">You agree not to:</p>
                            <ul className="space-y-3 text-white/90">
                                <li className="flex items-start">
                                    <span className="text-white mr-3">•</span>
                                    <span>Upload content that is illegal, harmful, threatening, abusive, or defamatory</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-white mr-3">•</span>
                                    <span>Violate any applicable laws or regulations</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-white mr-3">•</span>
                                    <span>Impersonate any person or entity</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-white mr-3">•</span>
                                    <span>Interfere with or disrupt the Service</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-white mr-3">•</span>
                                    <span>Attempt to gain unauthorized access to our systems</span>
                                </li>
                            </ul>
                        </section>

                        {/* Privacy */}
                        <section className="mb-12">
                            <h2 className="text-3xl font-bold mb-6 text-white">6. Privacy</h2>
                            <p className="text-white/90 leading-relaxed">
                                Your privacy is important to us. Please review our <a href="/privacy" className="text-white hover:underline">Privacy Policy</a>, which also governs your use of the Service, to understand our practices.
                            </p>
                        </section>

                        {/* Intellectual Property */}
                        <section className="mb-12">
                            <h2 className="text-3xl font-bold mb-6 text-white">7. Intellectual Property</h2>
                            <div className="space-y-4 text-white/90">
                                <p>The Service and its original content, features, and functionality are and will remain the exclusive property of Tokyo QUEST and its licensors.</p>
                                <p>The Service is protected by copyright, trademark, and other laws. Our trademarks and trade dress may not be used in connection with any product or service without our prior written consent.</p>
                            </div>
                        </section>

                        {/* Termination */}
                        <section className="mb-12">
                            <h2 className="text-3xl font-bold mb-6 text-white">8. Termination</h2>
                            <p className="text-white/90 leading-relaxed">
                                We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.
                            </p>
                        </section>

                        {/* Limitation of Liability */}
                        <section className="mb-12">
                            <h2 className="text-3xl font-bold mb-6 text-white">9. Limitation of Liability</h2>
                            <p className="text-white/90 leading-relaxed">
                                In no event shall Tokyo QUEST, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your use of the Service.
                            </p>
                        </section>

                        {/* Changes to Terms */}
                        <section className="mb-12">
                            <h2 className="text-3xl font-bold mb-6 text-white">10. Changes to Terms</h2>
                            <p className="text-white/90 leading-relaxed">
                                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will try to provide at least 30 days notice prior to any new terms taking effect.
                            </p>
                        </section>

                        {/* Contact Information */}
                        <section className="mb-12">
                            <h2 className="text-3xl font-bold mb-6 text-white">11. Contact Information</h2>
                            <p className="text-white/90 leading-relaxed">
                                If you have any questions about these Terms, please contact us at [contact email].
                            </p>
                        </section>

                        {/* Footer */}
                        <div className="text-center text-white/60 text-sm border-t border-white/10 pt-6">
                            <p>Last updated: 2 July 2025</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
