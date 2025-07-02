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

                    <div className="text-center text-white mb-8">
                        <h1 className="text-4xl md:text-5xl font-bold mb-4">
                            Terms of Service
                        </h1>
                        <p className="text-xl text-gray-300">
                            Effective Date: 2 July 2025
                        </p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 pb-16">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-white">

                        {/* Acceptance of These Terms */}
                        <section className="mb-12">
                            <h2 className="text-3xl font-bold mb-6 text-white">1. Acceptance of These Terms</h2>
                            <div className="space-y-4 text-gray-200 leading-relaxed">
                                <p>
                                    By accessing or using the TokyoQuest website, mobile site, or any related services (collectively, the &ldquo;Service&rdquo;), you (&ldquo;you&rdquo; or &ldquo;User&rdquo;) agree to be bound by these Terms of Service (&ldquo;Terms&rdquo;). If you do not agree to these Terms, do not use the Service.
                                </p>
                            </div>
                        </section>

                        {/* Definitions */}
                        <section className="mb-12">
                            <h2 className="text-3xl font-bold mb-6 text-white">2. Definitions</h2>
                            <div className="space-y-3 text-gray-200">
                                <div className="flex items-start">
                                    <span className="text-white mr-3 font-semibold">•</span>
                                    <span><strong>&ldquo;TokyoQuest,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;</strong> – TokyoQuest Inc., operator of the Service.</span>
                                </div>
                                <div className="flex items-start">
                                    <span className="text-white mr-3 font-semibold">•</span>
                                    <span><strong>&ldquo;User Content&rdquo;</strong> – Photos, videos, text, or other materials you upload, transmit, or otherwise make available via the Service.</span>
                                </div>
                                <div className="flex items-start">
                                    <span className="text-white mr-3 font-semibold">•</span>
                                    <span><strong>&ldquo;Generated Video&rdquo;</strong> – The edited video TokyoQuest may produce from your User Content when you purchase the optional video‑creation feature.</span>
                                </div>
                                <div className="flex items-start">
                                    <span className="text-white mr-3 font-semibold">•</span>
                                    <span><strong>&ldquo;Paid Features&rdquo;</strong> – Any functionality or digital goods that require payment, including the Generated Video.</span>
                                </div>
                            </div>
                        </section>

                        {/* Eligibility & Accounts */}
                        <section className="mb-12">
                            <h2 className="text-3xl font-bold mb-6 text-white">3. Eligibility & Accounts</h2>
                            <div className="space-y-4 text-gray-200">
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
                            <div className="space-y-4 text-gray-200">
                                <div className="flex items-start">
                                    <span className="text-white mr-3 font-semibold">1.</span>
                                    <div>
                                        <span className="font-semibold text-white">Ownership</span> – You retain all copyright and proprietary rights to your User Content.
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <span className="text-white mr-3 font-semibold">2.</span>
                                    <div>
                                        <span className="font-semibold text-white">Service License</span> – You grant TokyoQuest a non‑exclusive, worldwide, royalty‑free license to host, store, process, adapt, display, and reproduce your User Content <strong>solely for the purpose of operating and improving the Service</strong>.
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <span className="text-white mr-3 font-semibold">3.</span>
                                    <div>
                                        <span className="font-semibold text-white">Promotional Use</span> – TokyoQuest will obtain your <strong>explicit, prior consent</strong> before using any User Content or Generated Video for advertising, marketing, or redistribution.
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <span className="text-white mr-3 font-semibold">4.</span>
                                    <div>
                                        <span className="font-semibold text-white">Generated Video</span> – By purchasing the video‑creation Paid Feature, you grant TokyoQuest the right to edit and combine your User Content. The resulting Generated Video is considered a <strong>joint work</strong>; TokyoQuest grants you a perpetual, royalty‑free license for personal, non‑commercial use. Commercial exploitation requires a separate agreement.
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Paid Features & Payments */}
                        <section className="mb-12">
                            <h2 className="text-3xl font-bold mb-6 text-white">5. Paid Features & Payments</h2>
                            <div className="space-y-4 text-gray-200">
                                <div className="flex items-start">
                                    <span className="text-white mr-3 font-semibold">1.</span>
                                    <span>Pricing, payment methods, and applicable taxes will be displayed in the Service before you complete a purchase.</span>
                                </div>
                                <div className="flex items-start">
                                    <span className="text-white mr-3 font-semibold">2.</span>
                                    <span>Except as required by law, <strong>all sales are final</strong> once the Generated Video or other digital good is delivered.</span>
                                </div>
                                <div className="flex items-start">
                                    <span className="text-white mr-3 font-semibold">3.</span>
                                    <span>TokyoQuest may change pricing or introduce new Paid Features; new prices take effect upon posting and will not affect prior purchases.</span>
                                </div>
                            </div>
                        </section>

                        {/* Prohibited Conduct */}
                        <section className="mb-12">
                            <h2 className="text-3xl font-bold mb-6 text-white">6. Prohibited Conduct</h2>
                            <p className="text-gray-200 mb-4">You agree not to:</p>
                            <ul className="space-y-3 text-gray-200">
                                <li className="flex items-start">
                                    <span className="text-white mr-3">•</span>
                                    <span>Violate any applicable law or regulation.</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-white mr-3">•</span>
                                    <span>Upload content that is unlawful, defamatory, obscene, hateful, or infringes intellectual‑property rights.</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-white mr-3">•</span>
                                    <span>Interfere with the Service&rsquo;s security or functionality.</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-white mr-3">•</span>
                                    <span>Reverse‑engineer, decompile, or attempt to extract the Service&rsquo;s source code (except to the extent such restriction is prohibited by law).</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-white mr-3">•</span>
                                    <span>Use automated means (bots, scrapers) to access the Service without written consent.</span>
                                </li>
                            </ul>
                        </section>

                        {/* Intellectual Property of TokyoQuest */}
                        <section className="mb-12">
                            <h2 className="text-3xl font-bold mb-6 text-white">7. Intellectual Property of TokyoQuest</h2>
                            <p className="text-gray-200 leading-relaxed">
                                All trademarks, logos, software, and other intellectual‑property rights of the Service (excluding User Content) are owned by TokyoQuest or its licensors. You receive no rights except those expressly granted in these Terms.
                            </p>
                        </section>

                        {/* Termination */}
                        <section className="mb-12">
                            <h2 className="text-3xl font-bold mb-6 text-white">8. Termination</h2>
                            <div className="space-y-4 text-gray-200">
                                <div className="flex items-start">
                                    <span className="text-white mr-3 font-semibold">1.</span>
                                    <span>You may stop using the Service at any time. To delete your account and User Content, follow the instructions in the Privacy Policy.</span>
                                </div>
                                <div className="flex items-start">
                                    <span className="text-white mr-3 font-semibold">2.</span>
                                    <span>TokyoQuest may suspend or terminate your access if you violate these Terms, create legal exposure for us, or discontinue the Service. We will make reasonable efforts to notify you via the email associated with your Google account.</span>
                                </div>
                            </div>
                        </section>

                        {/* Disclaimers */}
                        <section className="mb-12">
                            <h2 className="text-3xl font-bold mb-6 text-white">9. Disclaimers</h2>
                            <div className="space-y-4 text-gray-200">
                                <div className="flex items-start">
                                    <span className="text-white mr-3 font-semibold">1.</span>
                                    <span>The Service is provided <strong>&ldquo;as is&rdquo; and &ldquo;as available&rdquo;</strong> without warranties of any kind, express or implied.</span>
                                </div>
                                <div className="flex items-start">
                                    <span className="text-white mr-3 font-semibold">2.</span>
                                    <span>TokyoQuest does not guarantee that the Service will be uninterrupted, error‑free, or secure.</span>
                                </div>
                            </div>
                        </section>

                        {/* Limitation of Liability */}
                        <section className="mb-12">
                            <h2 className="text-3xl font-bold mb-6 text-white">10. Limitation of Liability</h2>
                            <p className="text-gray-200 leading-relaxed">
                                To the maximum extent permitted by law, TokyoQuest will not be liable for indirect, incidental, special, consequential, or punitive damages, or any loss of profits or data, arising from your use of the Service.
                            </p>
                        </section>

                        {/* Indemnification */}
                        <section className="mb-12">
                            <h2 className="text-3xl font-bold mb-6 text-white">11. Indemnification</h2>
                            <p className="text-gray-200 leading-relaxed">
                                You agree to indemnify and hold harmless TokyoQuest and its affiliates from any claims, damages, or expenses arising out of your violation of these Terms or your misuse of the Service.
                            </p>
                        </section>

                        {/* Governing Law & Dispute Resolution */}
                        <section className="mb-12">
                            <h2 className="text-3xl font-bold mb-6 text-white">12. Governing Law & Dispute Resolution</h2>
                            <p className="text-gray-200 leading-relaxed">
                                These Terms are governed by the laws of Japan, without regard to its conflict‑of‑laws principles. Any dispute arising out of or related to these Terms or the Service shall be submitted to the exclusive jurisdiction of the Tokyo District Court, Japan, unless otherwise required by mandatory laws.
                            </p>
                        </section>

                        {/* Changes to These Terms */}
                        <section className="mb-12">
                            <h2 className="text-3xl font-bold mb-6 text-white">13. Changes to These Terms</h2>
                            <p className="text-gray-200 leading-relaxed">
                                We may modify these Terms from time to time. Material changes will be notified via email or in‑app notice at least 14 days before they become effective. Continued use of the Service after changes become effective constitutes acceptance of the revised Terms.
                            </p>
                        </section>

                        {/* Footer */}
                        <div className="text-center text-gray-400 text-sm border-t border-white/10 pt-6">
                            <p>Last updated: 2 July 2025</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
