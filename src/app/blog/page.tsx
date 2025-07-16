'use client';

import React, { useState, useEffect } from 'react';
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

export default function BlogPage() {
    const [blogs, setBlogs] = useState<Blog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
    });

    useEffect(() => {
        fetchBlogs();
    }, [pagination.page]);

    const fetchBlogs = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/blogs?page=${pagination.page}&limit=${pagination.limit}`);

            if (!response.ok) {
                throw new Error('Failed to fetch blogs');
            }

            const data = await response.json();
            setBlogs(data.blogs);
            setPagination(data.pagination);
        } catch (error) {
            console.error('Error fetching blogs:', error);
            setError('Failed to load blogs');
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

    const truncateText = (text: string, maxLength: number = 100) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Error</h2>
                    <p className="text-gray-600">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="py-8">
                        <h1 className="text-3xl font-bold text-gray-900">Blog</h1>
                        <p className="mt-2 text-gray-600">Discover stories, tips, and insights about Tokyo</p>
                    </div>
                </div>
            </div>

            {/* Blog List */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {blogs.length === 0 ? (
                    <div className="text-center py-12">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No blogs yet</h3>
                        <p className="text-gray-600">Check back soon for new content!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {blogs.map((blog) => (
                            <Link
                                key={blog.id}
                                href={`/blog/${blog.id}`}
                                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
                            >
                                <div className="relative h-48 bg-gray-200">
                                    {blog.thumbnail ? (
                                        <Image
                                            src={blog.thumbnail}
                                            alt={blog.title}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full">
                                            <span className="text-gray-400 text-sm">No image</span>
                                        </div>
                                    )}
                                </div>
                                <div className="p-6">
                                    <h2 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
                                        {blog.title}
                                    </h2>
                                    {blog.contents.length > 0 && blog.contents[0].content && (
                                        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                                            {truncateText(blog.contents[0].content, 120)}
                                        </p>
                                    )}
                                    <div className="flex items-center justify-between text-sm text-gray-500">
                                        <span>{formatDate(blog.created_at)}</span>
                                        <span>{blog.contents.length} sections</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="mt-8 flex justify-center">
                        <nav className="flex items-center space-x-2">
                            {pagination.page > 1 && (
                                <button
                                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                                >
                                    Previous
                                </button>
                            )}

                            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pageNum) => (
                                <button
                                    key={pageNum}
                                    onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                                    className={`px-3 py-2 text-sm font-medium rounded-md ${pageNum === pagination.page
                                            ? 'bg-red-600 text-white'
                                            : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                                        }`}
                                >
                                    {pageNum}
                                </button>
                            ))}

                            {pagination.page < pagination.totalPages && (
                                <button
                                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                                >
                                    Next
                                </button>
                            )}
                        </nav>
                    </div>
                )}
            </div>
        </div>
    );
}
