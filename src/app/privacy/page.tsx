"use client";

import Image from "next/image";
import { useState } from "react";

export default function PrivacyPage() {
    const [activeSection, setActiveSection] = useState<string | null>(null);

    const toggleSection = (sectionId: string) => {
        setActiveSection(activeSection === sectionId ? null : sectionId);
    };

    return (
        <div className="min-h-screen bg-black">
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
                            Privacy Policy
                        </h1>
                        <p className="text-xl text-white">
                            Effective Date: 2 July 2025
                        </p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 pb-16 pt-16">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-white">

                        {/* Introduction */}
                        <section className="mb-12">
                            <h2 className="text-3xl font-bold mb-6 text-white">1. Introduction</h2>
                            <div className="space-y-4 text-gray-200 leading-relaxed">
                                <p>
                                    TokyoQuest (&ldquo;we&rdquo;, &ldquo;our&rdquo;, &ldquo;us&rdquo;) provides a quest‑based travel application that enables users to complete missions in Tokyo by uploading photos and videos. We respect your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, disclose and safeguard your information when you use the TokyoQuest website or mobile services (collectively, the &ldquo;Service&rdquo;).
                                </p>
                                <p>
                                    By accessing or using the Service, you agree to the practices described in this Policy. If you do not agree, please do not use the Service.
                                </p>
                            </div>
                        </section>

                        {/* Information We Collect */}
                        <section className="mb-12">
                            <h2 className="text-3xl font-bold mb-6 text-white">2. Information We Collect</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse bg-white/5 rounded-lg overflow-hidden">
                                    <thead>
                                        <tr className="bg-gray-600/30">
                                            <th className="p-4 text-left font-semibold">Category</th>
                                            <th className="p-4 text-left font-semibold">Details</th>
                                            <th className="p-4 text-left font-semibold">Legal Basis (GDPR)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr className="border-b border-white/10">
                                            <td className="p-4 font-medium">Account Data</td>
                                            <td className="p-4">When you sign in with Google OAuth, we receive your Google‑verified name, email address, profile photo and Google ID.</td>
                                            <td className="p-4">Art. 6 (1) (b) Contract performance</td>
                                        </tr>
                                        <tr className="border-b border-white/10">
                                            <td className="p-4 font-medium">Quest Media</td>
                                            <td className="p-4">Photos and videos you voluntarily upload to complete quests.</td>
                                            <td className="p-4">Art. 6 (1) (b) Contract performance</td>
                                        </tr>
                                        <tr className="border-b border-white/10">
                                            <td className="p-4 font-medium">Usage Data</td>
                                            <td className="p-4">IP address, browser type, device identifiers, time stamps, pages visited, clicks, and basic error logs collected automatically via cookies or similar technologies.</td>
                                            <td className="p-4">Art. 6 (1) (f) Legitimate interest (Service security & analytics)</td>
                                        </tr>
                                        <tr>
                                            <td className="p-4 font-medium">Cookies / Local Storage</td>
                                            <td className="p-4">Authentication tokens (NextAuth JWT), user preferences, and session state.</td>
                                            <td className="p-4">Art. 6 (1) (f) Legitimate interest (UX)</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <p className="mt-4 text-white text-sm">
                                We do not knowingly collect data from children under 13. If you believe a child has provided us information, contact us to delete it.
                            </p>
                        </section>

                        {/* How We Use Your Information */}
                        <section className="mb-12">
                            <h2 className="text-3xl font-bold mb-6 text-white">3. How We Use Your Information</h2>
                            <ul className="space-y-3 text-gray-200">
                                <li className="flex items-start">
                                    <span className="text-white mr-3">•</span>
                                    <span><strong>Account management</strong> – authenticate you via Google and maintain your profile.</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-white mr-3">•</span>
                                    <span><strong>Quest processing</strong> – store and display your uploaded media, mark quests as completed and generate your personalized travel video.</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-white mr-3">•</span>
                                    <span><strong>Delivery of services</strong> – send you confirmations, support messages and download links.</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-white mr-3">•</span>
                                    <span><strong>Analytics & improvements</strong> – monitor usage trends, diagnose errors and optimize performance.</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-white mr-3">•</span>
                                    <span><strong>Security</strong> – detect, prevent and respond to fraud, abuse or technical issues.</span>
                                </li>
                            </ul>
                            <p className="mt-4 text-white">
                                We will seek your consent before using your information for any purpose not covered above.
                            </p>
                        </section>

                        {/* User Content & License */}
                        <section className="mb-12">
                            <h2 className="text-3xl font-bold mb-6 text-white">3A. User Content & License</h2>
                            <div className="space-y-4 text-gray-200">
                                <div>
                                    <h4 className="font-semibold text-white mb-2">Ownership</h4>
                                    <p>You retain all copyright and proprietary rights to the photos and videos you upload (&ldquo;User Content&rdquo;).</p>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-white mb-2">Service License</h4>
                                    <p>By uploading User Content you grant TokyoQuest a non‑exclusive, worldwide, royalty‑free license to host, store, process, display, and adapt your User Content solely for the purpose of operating and improving the Service.</p>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-white mb-2">Promotional Use</h4>
                                    <p>TokyoQuest will obtain your explicit, prior consent before using any User Content for marketing, advertising, or redistributing any generated videos.</p>
                                </div>
                            </div>
                        </section>

                        {/* Sharing & Disclosure */}
                        <section className="mb-12">
                            <h2 className="text-3xl font-bold mb-6 text-white">4. Sharing & Disclosure</h2>
                            <p className="text-gray-200 mb-4">
                                We never sell your personal information. We share it only:
                            </p>
                            <ul className="space-y-3 text-gray-200">
                                <li className="flex items-start">
                                    <span className="text-white mr-3">•</span>
                                    <span><strong>Service providers</strong> – cloud hosting (Vercel), database & storage (Supabase), email delivery, analytics – bound by confidentiality and data‑processing agreements.</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-white mr-3">•</span>
                                    <span><strong>Legal compliance</strong> – when required by law or to respond to valid legal requests.</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-white mr-3">•</span>
                                    <span><strong>Business transfers</strong> – in connection with any merger, acquisition or asset sale; you will be notified of any change in ownership or uses of your personal data.</span>
                                </li>
                            </ul>
                        </section>

                        {/* International Transfers */}
                        <section className="mb-12">
                            <h2 className="text-3xl font-bold mb-6 text-white">5. International Transfers</h2>
                            <p className="text-gray-200 leading-relaxed">
                                Our servers may be located outside your country. Where required, we rely on Standard Contractual Clauses or equivalent safeguards to ensure your data receives an adequate level of protection in accordance with applicable law.
                            </p>
                        </section>

                        {/* Data Retention */}
                        <section className="mb-12">
                            <h2 className="text-3xl font-bold mb-6 text-white">6. Data Retention</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse bg-white/5 rounded-lg overflow-hidden">
                                    <thead>
                                        <tr className="bg-gray-600/30">
                                            <th className="p-4 text-left font-semibold">Data Type</th>
                                            <th className="p-4 text-left font-semibold">Retention Period</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr className="border-b border-white/10">
                                            <td className="p-4 font-medium">Quest media (photos/videos)</td>
                                            <td className="p-4">Deleted 7 days after the final memory video is delivered to you (unless you request earlier deletion).</td>
                                        </tr>
                                        <tr className="border-b border-white/10">
                                            <td className="p-4 font-medium">Account data</td>
                                            <td className="p-4">Retained until you delete your account or remain inactive for 24 months, after which it is erased or anonymized.</td>
                                        </tr>
                                        <tr>
                                            <td className="p-4 font-medium">Usage & log data</td>
                                            <td className="p-4">Up to 12 months for security and analytics, then aggregated or deleted.</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        {/* Your Rights */}
                        <section className="mb-12">
                            <h2 className="text-3xl font-bold mb-6 text-white">7. Your Rights</h2>
                            <p className="text-gray-200 mb-4">
                                Depending on your jurisdiction, you may have rights to:
                            </p>
                            <ul className="space-y-2 text-gray-200 mb-4">
                                <li className="flex items-start">
                                    <span className="text-white mr-3">•</span>
                                    <span>Access, correct or delete your personal data</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-white mr-3">•</span>
                                    <span>Port your data to another service</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-white mr-3">•</span>
                                    <span>Restrict or object to certain processing</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-white mr-3">•</span>
                                    <span>Withdraw consent at any time (without affecting prior lawful processing)</span>
                                </li>
                            </ul>
                            <p className="text-gray-200">
                                Submit requests at <a href="mailto:privacy@tokyoquest.com" className="text-white hover:underline">privacy@tokyoquest.com</a>. We will respond within 30 days.
                            </p>
                        </section>

                        {/* Security */}
                        <section className="mb-12">
                            <h2 className="text-3xl font-bold mb-6 text-white">8. Security</h2>
                            <p className="text-gray-200 leading-relaxed">
                                We use TLS encryption, access‑controlled storage buckets, least‑privilege rules and routine audits to protect data. No method is 100% secure, but we strive to use commercially reasonable safeguards.
                            </p>
                        </section>

                        {/* Third-Party Links */}
                        <section className="mb-12">
                            <h2 className="text-3xl font-bold mb-6 text-white">9. Third‑Party Links</h2>
                            <p className="text-gray-200 leading-relaxed">
                                The Service may contain links to external sites we do not operate. We are not responsible for the privacy practices of those sites. Please review their policies.
                            </p>
                        </section>

                        {/* Changes to This Policy */}
                        <section className="mb-12">
                            <h2 className="text-3xl font-bold mb-6 text-white">10. Changes to This Policy</h2>
                            <p className="text-gray-200 leading-relaxed">
                                We may update this Policy from time to time. Changes are effective when posted. Material changes will be announced via the Service or email.
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
