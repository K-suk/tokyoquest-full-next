'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface Blog {
    id: number;
    title: string;
    thumbnail: string | null;
    created_at: string;
    updated_at: string;
    is_published: boolean;
    contents: BlogContent[];
}

interface BlogContent {
    id: number;
    blog_id: number;
    subtitle: string | null;
    content: string | null;
    image: string | null;
    order: number;
    created_at: string;
}

export default function BlogDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [blog, setBlog] = useState<Blog | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (params.id) {
            fetchBlog();
        }
    }, [params.id]);

    const fetchBlog = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/blogs/${params.id}`);

            if (!response.ok) {
                if (response.status === 404) {
                    setError('Blog not found');
                } else {
                    throw new Error('Failed to fetch blog');
                }
                return;
            }

            const data = await response.json();
            setBlog(data);
        } catch (error) {
            console.error('Error fetching blog:', error);
            setError('Failed to load blog');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
            </div>
        );
    }

    if (error || !blog) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Error</h2>
                    <p className="text-gray-600 mb-4">{error || 'Blog not found'}</p>
                    <Link
                        href="/blog"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                    >
                        Back to Blog List
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="py-6">
                        <Link
                            href="/blog"
                            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
                        >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Back to Blog List
                        </Link>
                        <h1 className="text-3xl font-bold text-gray-900">{blog.title}</h1>
                        <div className="mt-2 flex items-center text-sm text-gray-500">
                            <span>{formatDate(blog.created_at)}</span>
                            <span className="mx-2">•</span>
                            <span>{blog.contents.length} sections</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Blog Content */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Thumbnail */}
                {blog.thumbnail && (
                    <div className="mb-8">
                        <div className="relative h-64 md:h-96 bg-gray-200 rounded-lg overflow-hidden">
                            <Image
                                src={blog.thumbnail}
                                alt={blog.title}
                                fill
                                className="object-cover"
                            />
                        </div>
                    </div>
                )}

                {/* Content Sections */}
                <div className="space-y-8">
                    {blog.contents.map((content, index) => (
                        <div key={content.id} className="bg-white rounded-lg shadow-sm p-6">
                            {content.subtitle && (
                                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                                    {content.subtitle}
                                </h2>
                            )}

                            {content.content && (
                                <div className="prose max-w-none mb-6">
                                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                                        {content.content}
                                    </p>
                                </div>
                            )}

                            {content.image && (
                                <div className="mt-6">
                                    <div className="relative h-64 bg-gray-200 rounded-lg overflow-hidden">
                                        <Image
                                            src={content.image}
                                            alt={content.subtitle || `Section ${index + 1}`}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="mt-12 pt-8 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                        <Link
                            href="/blog"
                            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Back to Blog List
                        </Link>

                        <div className="text-sm text-gray-500">
                            Last updated: {formatDate(blog.updated_at)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
