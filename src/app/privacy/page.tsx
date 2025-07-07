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

                    {/* Title */}
                    <div className="text-center mb-12">
                        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
                            Privacy Policy
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
                                    Tokyo QUEST (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) operates the Tokyo QUEST mobile application and related services (collectively, the &ldquo;Service&rdquo;). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Service.
                                </p>
                                <p>
                                    By using our Service, you agree to the collection and use of information in accordance with this policy. If you do not agree with our policies and practices, please do not use our Service.
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
                                            <th className="p-4 text-left font-semibold text-white">Data Type</th>
                                            <th className="p-4 text-left font-semibold text-white">Description</th>
                                            <th className="p-4 text-left font-semibold text-white">Legal Basis</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr className="border-b border-white/10">
                                            <td className="p-4 font-medium text-white">Google Account Info</td>
                                            <td className="p-4 text-white/90">Email address, name, profile picture (via Google OAuth)</td>
                                            <td className="p-4 text-white/90">Art. 6 (1) (b) Contract performance</td>
                                        </tr>
                                        <tr className="border-b border-white/10">
                                            <td className="p-4 font-medium text-white">Quest Media</td>
                                            <td className="p-4 text-white/90">Photos and videos you upload when completing quests</td>
                                            <td className="p-4 text-white/90">Art. 6 (1) (b) Contract performance</td>
                                        </tr>
                                        <tr className="border-b border-white/10">
                                            <td className="p-4 font-medium text-white">Usage Data</td>
                                            <td className="p-4 text-white/90">Quest completions, app interactions, and performance metrics</td>
                                            <td className="p-4 text-white/90">Art. 6 (1) (f) Legitimate interest (analytics)</td>
                                        </tr>
                                        <tr>
                                            <td className="p-4 font-medium text-white">Cookies / Local Storage</td>
                                            <td className="p-4 text-white/90">Authentication tokens (NextAuth JWT), user preferences, and session state.</td>
                                            <td className="p-4 text-white/90">Art. 6 (1) (f) Legitimate interest (UX)</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <p className="mt-4 text-white/90 text-sm">
                                We do not knowingly collect data from children under 13. If you believe a child has provided us information, contact us to delete it.
                            </p>
                        </section>

                        {/* How We Use Your Information */}
                        <section className="mb-12">
                            <h2 className="text-3xl font-bold mb-6 text-white">3. How We Use Your Information</h2>
                            <ul className="space-y-3 text-white/90">
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
                        </section>

                        {/* Information Sharing */}
                        <section className="mb-12">
                            <h2 className="text-3xl font-bold mb-6 text-white">4. Information Sharing & Disclosure</h2>
                            <div className="space-y-4 text-white/90">
                                <p><strong>We do not sell, trade, or rent your personal information to third parties.</strong></p>
                                <p>We may share your information in the following circumstances:</p>
                                <ul className="space-y-2 ml-6">
                                    <li>• <strong>Service providers</strong> – with trusted third-party services that help us operate our Service (e.g., cloud storage, analytics)</li>
                                    <li>• <strong>Legal requirements</strong> – when required by law, court order, or government request</li>
                                    <li>• <strong>Safety & security</strong> – to protect our rights, property, or safety, or that of our users</li>
                                    <li>• <strong>Business transfers</strong> – in connection with a merger, acquisition, or sale of assets</li>
                                </ul>
                            </div>
                        </section>

                        {/* Data Security */}
                        <section className="mb-12">
                            <h2 className="text-3xl font-bold mb-6 text-white">5. Data Security</h2>
                            <p className="text-white/90 mb-4">
                                We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
                            </p>
                            <p className="text-white/90">
                                Your data is stored on secure servers and protected by industry-standard encryption. We regularly review and update our security practices to maintain the highest level of protection in accordance with applicable law.
                            </p>
                        </section>

                        {/* Data Retention */}
                        <section className="mb-12">
                            <h2 className="text-3xl font-bold mb-6 text-white">6. Data Retention</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse bg-white/5 rounded-lg overflow-hidden">
                                    <thead>
                                        <tr className="bg-gray-600/30">
                                            <th className="p-4 text-left font-semibold text-white">Data Type</th>
                                            <th className="p-4 text-left font-semibold text-white">Retention Period</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr className="border-b border-white/10">
                                            <td className="p-4 font-medium text-white">Quest media (photos/videos)</td>
                                            <td className="p-4 text-white/90">Deleted 7 days after the final memory video is delivered to you (unless you request earlier deletion).</td>
                                        </tr>
                                        <tr className="border-b border-white/10">
                                            <td className="p-4 font-medium text-white">Account data</td>
                                            <td className="p-4 text-white/90">Retained until you delete your account or remain inactive for 24 months, after which it is erased or anonymized.</td>
                                        </tr>
                                        <tr>
                                            <td className="p-4 font-medium text-white">Usage & log data</td>
                                            <td className="p-4 text-white/90">Up to 12 months for security and analytics, then aggregated or deleted.</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        {/* Your Rights */}
                        <section className="mb-12">
                            <h2 className="text-3xl font-bold mb-6 text-white">7. Your Rights</h2>
                            <p className="text-white/90 mb-4">
                                Depending on your jurisdiction, you may have rights to:
                            </p>
                            <ul className="space-y-2 text-white/90 mb-4">
                                <li>• <strong>Access</strong> – request a copy of your personal information</li>
                                <li>• <strong>Rectification</strong> – correct inaccurate or incomplete information</li>
                                <li>• <strong>Erasure</strong> – request deletion of your personal information</li>
                                <li>• <strong>Portability</strong> – receive your data in a structured, machine-readable format</li>
                                <li>• <strong>Objection</strong> – object to processing based on legitimate interests</li>
                                <li>• <strong>Restriction</strong> – limit how we process your information</li>
                            </ul>
                            <p className="text-white/90">
                                To exercise these rights, contact us at [contact email]. We will respond within 30 days and may request additional information to verify your identity.
                            </p>
                        </section>

                        {/* International Transfers */}
                        <section className="mb-12">
                            <h2 className="text-3xl font-bold mb-6 text-white">8. International Data Transfers</h2>
                            <p className="text-white/90 leading-relaxed">
                                Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place for such transfers, including standard contractual clauses and adequacy decisions, to protect your data in accordance with this Privacy Policy and applicable law.
                            </p>
                        </section>

                        {/* Third-Party Links */}
                        <section className="mb-12">
                            <h2 className="text-3xl font-bold mb-6 text-white">9. Third‑Party Links</h2>
                            <p className="text-white/90 leading-relaxed">
                                The Service may contain links to external sites we do not operate. We are not responsible for the privacy practices of those sites. Please review their policies.
                            </p>
                        </section>

                        {/* Changes to This Policy */}
                        <section className="mb-12">
                            <h2 className="text-3xl font-bold mb-6 text-white">10. Changes to This Policy</h2>
                            <p className="text-white/90 leading-relaxed">
                                We may update this Policy from time to time. Changes are effective when posted. Material changes will be announced via the Service or email.
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
