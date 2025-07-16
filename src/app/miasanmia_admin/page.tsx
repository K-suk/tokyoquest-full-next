'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';

interface Completion {
    id: number;
    completion_date: string;
    media: string | null;
    user: {
        name: string | null;
        email: string;
    };
    quest: {
        id: number;
        title: string;
        description: string;
    };
}

interface Quest {
    id: number;
    title: string;
    description: string;
    tips: string | null;
    imgUrl: string | null;
    location: string;
    badget: string | null;
    date_created: string;
    tags: Tag[];
}

interface Tag {
    id: number;
    name: string;
    description: string | null;
    created_at: string;
    questCount: number;
}

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

type TabType = 'completions' | 'quests' | 'tags' | 'blogs';

export default function AdminPage() {
    const [activeTab, setActiveTab] = useState<TabType>('completions');

    // Completions state
    const [completions, setCompletions] = useState<Completion[]>([]);
    const [completionFilters, setCompletionFilters] = useState({
        page: 1,
        limit: 20,
        questId: '',
        userId: ''
    });

    // Quests state
    const [quests, setQuests] = useState<Quest[]>([]);
    const [questFilters, setQuestFilters] = useState({
        page: 1,
        limit: 20,
        search: '',
        questId: '',
        tagId: '',
        sortBy: 'date_created',
        sortOrder: 'desc'
    });

    // Tags state
    const [tags, setTags] = useState<Tag[]>([]);
    const [newTag, setNewTag] = useState({ name: '', description: '' });
    const [showNewTagForm, setShowNewTagForm] = useState(false);

    // Blogs state
    const [blogs, setBlogs] = useState<Blog[]>([]);
    const [showNewBlogForm, setShowNewBlogForm] = useState(false);
    const [editingBlog, setEditingBlog] = useState<Blog | null>(null);

    // Tag editing state
    const [editingQuest, setEditingQuest] = useState<Quest | null>(null);
    const [showTagModal, setShowTagModal] = useState(false);
    const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);

    // Shared state
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [showImageModal, setShowImageModal] = useState(false);

    // データ取得関数
    const fetchCompletions = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const params = new URLSearchParams({
                page: completionFilters.page.toString(),
                limit: completionFilters.limit.toString(),
                ...(completionFilters.questId && { questId: completionFilters.questId }),
                ...(completionFilters.userId && { userId: completionFilters.userId })
            });

            const response = await fetch(`/api/miasanmia_admin/completions?${params}`);

            if (!response.ok) {
                if (response.status === 403) {
                    setError('Access denied. Staff privileges required.');
                } else {
                    setError('Failed to fetch completions');
                }
                return;
            }

            const data = await response.json();
            setCompletions(data.completions);
        } catch (error) {
            console.error('Error fetching completions:', error);
            setError('An error occurred while fetching data');
        } finally {
            setLoading(false);
        }
    }, [completionFilters]);

    const fetchQuests = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const params = new URLSearchParams({
                page: questFilters.page.toString(),
                limit: questFilters.limit.toString(),
                ...(questFilters.search && { search: questFilters.search }),
                ...(questFilters.questId && { questId: questFilters.questId }),
                ...(questFilters.tagId && { tagId: questFilters.tagId }),
                sortBy: questFilters.sortBy,
                sortOrder: questFilters.sortOrder
            });

            const response = await fetch(`/api/miasanmia_admin/quests?${params}`);

            if (!response.ok) {
                if (response.status === 403) {
                    setError('Access denied. Staff privileges required.');
                } else {
                    setError('Failed to fetch quests');
                }
                return;
            }

            const data = await response.json();
            setQuests(data.quests);
        } catch (error) {
            console.error('Error fetching quests:', error);
            setError('An error occurred while fetching data');
        } finally {
            setLoading(false);
        }
    }, [questFilters]);

    const fetchTags = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch('/api/miasanmia_admin/tags');

            if (!response.ok) {
                if (response.status === 403) {
                    setError('Access denied. Staff privileges required.');
                } else {
                    setError('Failed to fetch tags');
                }
                return;
            }

            const data = await response.json();
            setTags(data.tags);
        } catch (error) {
            console.error('Error fetching tags:', error);
            setError('An error occurred while fetching data');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchBlogs = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch('/api/miasanmia_admin/blogs');

            if (!response.ok) {
                if (response.status === 403) {
                    setError('Access denied. Staff privileges required.');
                } else {
                    setError('Failed to fetch blogs');
                }
                return;
            }

            const data = await response.json();
            setBlogs(data);
        } catch (error) {
            console.error('Error fetching blogs:', error);
            setError('An error occurred while fetching data');
        } finally {
            setLoading(false);
        }
    }, []);

    // タブ切り替え時のデータ取得
    useEffect(() => {
        if (activeTab === 'completions') {
            fetchCompletions();
        } else if (activeTab === 'quests') {
            fetchQuests();
        } else if (activeTab === 'tags') {
            fetchTags();
        } else if (activeTab === 'blogs') {
            fetchBlogs();
        }
    }, [activeTab, completionFilters, questFilters, fetchCompletions, fetchQuests, fetchTags, fetchBlogs]);

    // 画像ダウンロード
    const downloadImage = (imageData: string, filename: string) => {
        const link = document.createElement('a');
        link.href = imageData;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // 画像モーダル表示
    const openImageModal = (imageData: string) => {
        setSelectedImage(imageData);
        setShowImageModal(true);
    };

    // フィルタ更新
    const updateCompletionFilters = (newFilters: Partial<typeof completionFilters>) => {
        setCompletionFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
    };

    const updateQuestFilters = (newFilters: Partial<typeof questFilters>) => {
        setQuestFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
    };

    // Tag管理
    const createTag = async () => {
        if (!newTag.name.trim()) return;

        try {
            const response = await fetch('/api/admin/tags', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newTag),
            });

            if (response.ok) {
                const data = await response.json();
                setTags(prev => [...prev, data.tag]);
                setNewTag({ name: '', description: '' });
                setShowNewTagForm(false);
            } else {
                const errorData = await response.json();
                alert(`Failed to create tag: ${errorData.error}`);
            }
        } catch (error) {
            console.error('Error creating tag:', error);
            alert('Failed to create tag. Please try again.');
        }
    };

    // Quest-Tag紐付け更新
    const updateQuestTags = async (questId: number, tagIds: number[]) => {
        try {
            const response = await fetch(`/api/miasanmia_admin/quests/${questId}/tags`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ tagIds }),
            });

            if (response.ok) {
                // quest一覧を更新
                await fetchQuests();
            } else {
                const errorData = await response.json();
                alert(`Failed to update quest tags: ${errorData.error}`);
            }
        } catch (error) {
            console.error('Error updating quest tags:', error);
            alert('Failed to update quest tags. Please try again.');
        }
    };

    // Tag編集モーダルを開く
    const openTagModal = (quest: Quest) => {
        setEditingQuest(quest);
        setSelectedTagIds(quest.tags.map(t => t.id));
        setShowTagModal(true);
    };

    // Tag選択を更新
    const toggleTagSelection = (tagId: number) => {
        setSelectedTagIds(prev =>
            prev.includes(tagId)
                ? prev.filter(id => id !== tagId)
                : [...prev, tagId]
        );
    };

    // Tag編集を保存
    const saveTagSelection = async () => {
        if (!editingQuest) return;

        try {
            await updateQuestTags(editingQuest.id, selectedTagIds);
            setShowTagModal(false);
            setEditingQuest(null);
            setSelectedTagIds([]);
        } catch (error) {
            console.error('Error saving tag selection:', error);
        }
    };

    // Blog management functions
    const createBlog = async (blogData: Omit<Blog, 'id' | 'created_at' | 'updated_at'>) => {
        try {
            const response = await fetch('/api/miasanmia_admin/blogs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(blogData),
            });

            if (!response.ok) {
                setError('Failed to create blog');
                return;
            }

            setShowNewBlogForm(false);
            fetchBlogs();
        } catch (error) {
            console.error('Error creating blog:', error);
            setError('An error occurred while creating blog');
        }
    };

    const updateBlog = async (blogId: number, blogData: Partial<Blog>) => {
        try {
            const response = await fetch(`/api/miasanmia_admin/blogs/${blogId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(blogData),
            });

            if (!response.ok) {
                setError('Failed to update blog');
                return;
            }

            setEditingBlog(null);
            fetchBlogs();
        } catch (error) {
            console.error('Error updating blog:', error);
            setError('An error occurred while updating blog');
        }
    };

    const deleteBlog = async (blogId: number) => {
        if (!confirm('Are you sure you want to delete this blog?')) return;

        try {
            const response = await fetch(`/api/miasanmia_admin/blogs/${blogId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                setError('Failed to delete blog');
                return;
            }

            fetchBlogs();
        } catch (error) {
            console.error('Error deleting blog:', error);
            setError('An error occurred while deleting blog');
        }
    };

    // Quest画像アップロード
    const uploadQuestImage = async (questId: number, file: File) => {
        try {
            const formData = new FormData();
            formData.append('image', file);

            const response = await fetch(`/api/miasanmia_admin/quests/${questId}/image`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to upload image');
            }

            const data = await response.json();
            alert('Image uploaded successfully!');

            // Quest一覧を更新
            await fetchQuests();

            return data.imageUrl;
        } catch (error) {
            console.error('Error uploading image:', error);
            alert(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    };

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <h2 className="text-red-800 font-semibold">Error</h2>
                        <p className="text-red-600">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* ヘッダー */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <h1 className="text-2xl font-bold text-gray-900">
                            Admin Panel
                        </h1>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* タブ */}
                <div className="bg-white rounded-lg shadow mb-6">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8 px-6">
                            <button
                                onClick={() => setActiveTab('completions')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'completions'
                                    ? 'border-red-500 text-red-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                Quest Completions
                            </button>
                            <button
                                onClick={() => setActiveTab('quests')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'quests'
                                    ? 'border-red-500 text-red-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                Quest Management
                            </button>
                            <button
                                onClick={() => setActiveTab('tags')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'tags'
                                    ? 'border-red-500 text-red-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                Tag Management
                            </button>
                            <button
                                onClick={() => setActiveTab('blogs')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'blogs'
                                    ? 'border-red-500 text-red-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                Blog Management
                            </button>
                        </nav>
                    </div>
                </div>

                {/* ローディング */}
                {loading && (
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
                    </div>
                )}

                {/* タブコンテンツ */}
                {!loading && (
                    <>
                        {/* Completions Tab */}
                        {activeTab === 'completions' && (
                            <CompletionsTab
                                completions={completions}
                                filters={completionFilters}
                                onUpdateFilters={updateCompletionFilters}
                                onDownloadImage={downloadImage}
                                onOpenImageModal={openImageModal}
                            />
                        )}

                        {/* Quests Tab */}
                        {activeTab === 'quests' && (
                            <QuestsTab
                                quests={quests}
                                filters={questFilters}
                                onUpdateFilters={updateQuestFilters}
                                onOpenTagModal={openTagModal}
                                onUploadImage={uploadQuestImage}
                                tags={tags}
                            />
                        )}

                        {/* Tags Tab */}
                        {activeTab === 'tags' && (
                            <TagsTab
                                tags={tags}
                                newTag={newTag}
                                showNewTagForm={showNewTagForm}
                                onSetNewTag={setNewTag}
                                onSetShowNewTagForm={setShowNewTagForm}
                                onCreateTag={createTag}
                            />
                        )}

                        {/* Blogs Tab */}
                        {activeTab === 'blogs' && (
                            <BlogsTab
                                blogs={blogs}
                                showNewBlogForm={showNewBlogForm}
                                editingBlog={editingBlog}
                                onSetShowNewBlogForm={setShowNewBlogForm}
                                onSetEditingBlog={setEditingBlog}
                                onCreateBlog={createBlog}
                                onUpdateBlog={updateBlog}
                                onDeleteBlog={deleteBlog}
                            />
                        )}
                    </>
                )}
            </div>

            {/* 画像モーダル */}
            {showImageModal && selectedImage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowImageModal(false)} />
                    <div className="relative bg-white p-4 rounded-lg max-w-4xl max-h-[90vh] overflow-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Quest Completion Image</h3>
                            <button
                                onClick={() => setShowImageModal(false)}
                                className="text-gray-500 hover:text-gray-700 text-2xl"
                            >
                                ×
                            </button>
                        </div>
                        <div className="relative w-full h-96">
                            <Image
                                src={selectedImage}
                                alt="Quest completion proof"
                                fill
                                className="object-contain"
                            />
                        </div>
                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={() => {
                                    downloadImage(selectedImage, `quest_completion_${Date.now()}.jpg`);
                                    setShowImageModal(false);
                                }}
                                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                            >
                                Download Image
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Tag編集モーダル */}
            {showTagModal && editingQuest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowTagModal(false)} />
                    <div className="relative bg-white p-6 rounded-lg max-w-2xl w-full mx-4 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-semibold">
                                Edit Tags for: {editingQuest.title}
                            </h3>
                            <button
                                onClick={() => setShowTagModal(false)}
                                className="text-gray-500 hover:text-gray-700 text-2xl"
                            >
                                ×
                            </button>
                        </div>

                        <div className="mb-6">
                            <p className="text-sm text-gray-600 mb-4">
                                Select the tags you want to assign to this quest:
                            </p>
                            <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-4">
                                {tags.map((tag) => (
                                    <label key={tag.id} className="flex items-center space-x-3 py-2 hover:bg-gray-50 rounded px-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={selectedTagIds.includes(tag.id)}
                                            onChange={() => toggleTagSelection(tag.id)}
                                            className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                                        />
                                        <div className="flex-1">
                                            <span className="text-sm font-medium text-gray-900">
                                                {tag.name}
                                            </span>
                                            {tag.description && (
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {tag.description}
                                                </p>
                                            )}
                                        </div>
                                        <span className="text-xs text-gray-400">
                                            {tag.questCount} quests
                                        </span>
                                    </label>
                                ))}
                                {tags.length === 0 && (
                                    <p className="text-gray-500 text-sm">No tags available. Create some tags first.</p>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowTagModal(false)}
                                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveTagSelection}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Completions Tab Component
function CompletionsTab({ completions, filters, onUpdateFilters, onDownloadImage, onOpenImageModal }: {
    completions: Completion[];
    filters: { page: number; limit: number; questId: string; userId: string };
    onUpdateFilters: (filters: Partial<{ page: number; limit: number; questId: string; userId: string }>) => void;
    onDownloadImage: (imageData: string, filename: string) => void;
    onOpenImageModal: (imageData: string) => void;
}) {
    return (
        <div>
            {/* フィルター */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-lg font-semibold mb-4">Filters</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Quest ID
                        </label>
                        <input
                            type="number"
                            value={filters.questId}
                            onChange={(e) => onUpdateFilters({ questId: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                            placeholder="Filter by Quest ID"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            User ID
                        </label>
                        <input
                            type="text"
                            value={filters.userId}
                            onChange={(e) => onUpdateFilters({ userId: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                            placeholder="Filter by User ID"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Items per page
                        </label>
                        <select
                            value={filters.limit}
                            onChange={(e) => onUpdateFilters({ limit: parseInt(e.target.value) })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* 完了データ一覧 */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    ID
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Quest
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    User
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Completion Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Image
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {completions.map((completion: Completion) => (
                                <tr key={completion.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {completion.id}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">
                                                {completion.quest.title}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                ID: {completion.quest.id}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">
                                                {completion.user.name || 'No name'}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {completion.user.email}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {new Date(completion.completion_date).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {completion.media ? (
                                            <div className="w-16 h-16 relative">
                                                <Image
                                                    src={completion.media}
                                                    alt="Completion proof"
                                                    fill
                                                    className="object-cover rounded cursor-pointer"
                                                    onClick={() => onOpenImageModal(completion.media!)}
                                                />
                                            </div>
                                        ) : (
                                            <span className="text-gray-400">No image</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        {completion.media && (
                                            <button
                                                onClick={() => onDownloadImage(
                                                    completion.media!,
                                                    `completion_${completion.id}_${completion.user.name || 'user'}.jpg`
                                                )}
                                                className="text-red-600 hover:text-red-900 mr-3"
                                            >
                                                Download
                                            </button>
                                        )}
                                        <button
                                            onClick={() => onOpenImageModal(completion.media!)}
                                            disabled={!completion.media}
                                            className={`${completion.media ? 'text-blue-600 hover:text-blue-900' : 'text-gray-400 cursor-not-allowed'}`}
                                        >
                                            View
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// Quests Tab Component
function QuestsTab({ quests, filters, onUpdateFilters, onOpenTagModal, onUploadImage, tags }: {
    quests: Quest[];
    filters: { page: number; limit: number; search: string; questId: string; tagId: string; sortBy: string; sortOrder: string };
    onUpdateFilters: (filters: Partial<{ page: number; limit: number; search: string; questId: string; tagId: string; sortBy: string; sortOrder: string }>) => void;
    onOpenTagModal: (quest: Quest) => void;
    onUploadImage: (questId: number, file: File) => Promise<string>;
    tags: Tag[];
}) {
    return (
        <div>
            {/* フィルター */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-lg font-semibold mb-4">Quest Filters</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Search
                        </label>
                        <input
                            type="text"
                            value={filters.search}
                            onChange={(e) => onUpdateFilters({ search: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                            placeholder="Search by title or description"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Quest ID
                        </label>
                        <input
                            type="number"
                            value={filters.questId}
                            onChange={(e) => onUpdateFilters({ questId: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                            placeholder="Enter quest ID"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tag
                        </label>
                        <select
                            value={filters.tagId}
                            onChange={(e) => onUpdateFilters({ tagId: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                            <option value="">All Tags</option>
                            {tags.map((tag) => (
                                <option key={tag.id} value={tag.id}>
                                    {tag.name} (ID: {tag.id})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Sort By
                        </label>
                        <select
                            value={filters.sortBy}
                            onChange={(e) => onUpdateFilters({ sortBy: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                            <option value="date_created">Date Created</option>
                            <option value="id">ID</option>
                            <option value="title">Title</option>
                            <option value="location">Location</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Sort Order
                        </label>
                        <select
                            value={filters.sortOrder}
                            onChange={(e) => onUpdateFilters({ sortOrder: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                            <option value="desc">Descending</option>
                            <option value="asc">Ascending</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Items per page
                        </label>
                        <select
                            value={filters.limit}
                            onChange={(e) => onUpdateFilters({ limit: parseInt(e.target.value) })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                    </div>
                </div>
                <div className="mt-4 flex gap-2">
                    <button
                        onClick={() => onUpdateFilters({
                            search: '',
                            questId: '',
                            tagId: '',
                            sortBy: 'date_created',
                            sortOrder: 'desc'
                        })}
                        className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                        Clear Filters
                    </button>
                </div>
            </div>

            {/* Quest一覧 */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    ID
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Title
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Location
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tags
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Image
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {quests.map((quest: Quest) => (
                                <tr key={quest.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {quest.id}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">
                                                {quest.title}
                                            </div>
                                            <div className="text-sm text-gray-500 truncate max-w-xs">
                                                {quest.description}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {quest.location}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1">
                                            {quest.tags.map((tag) => (
                                                <span
                                                    key={tag.id}
                                                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800"
                                                >
                                                    {tag.name}
                                                </span>
                                            ))}
                                            {quest.tags.length === 0 && (
                                                <span className="text-gray-400 text-sm">No tags</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {quest.imgUrl ? (
                                            <div className="w-16 h-16 relative bg-gray-200 rounded overflow-hidden">
                                                <Image
                                                    src={quest.imgUrl}
                                                    alt={quest.title}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                        ) : (
                                            <div
                                                className="w-16 h-16 border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-gray-400 text-xs text-center"
                                                onDrop={(e) => {
                                                    e.preventDefault();
                                                    const file = e.dataTransfer.files[0];
                                                    if (file && file.type.startsWith('image/')) {
                                                        onUploadImage(quest.id, file);
                                                    }
                                                }}
                                                onDragOver={(e) => e.preventDefault()}
                                                onDragEnter={(e) => e.preventDefault()}
                                            >
                                                Drop image here
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex flex-col space-y-2">
                                            <button
                                                onClick={() => onOpenTagModal(quest)}
                                                className="text-blue-600 hover:text-blue-900"
                                            >
                                                Edit Tags
                                            </button>
                                            <div className="flex items-center space-x-2">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            onUploadImage(quest.id, file);
                                                            e.target.value = ''; // リセット
                                                        }
                                                    }}
                                                    className="hidden"
                                                    id={`image-upload-${quest.id}`}
                                                />
                                                <label
                                                    htmlFor={`image-upload-${quest.id}`}
                                                    className="cursor-pointer text-green-600 hover:text-green-900 text-sm border-2 border-dashed border-green-300 px-2 py-1 rounded hover:border-green-500 transition-colors"
                                                >
                                                    📷 Upload Image
                                                </label>
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                Drag & drop or click to upload
                                            </div>
                                            {quest.imgUrl && (
                                                <div className="text-xs text-gray-500">
                                                    Has image: {quest.imgUrl.split('/').pop()}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// Tags Tab Component
function TagsTab({ tags, newTag, showNewTagForm, onSetNewTag, onSetShowNewTagForm, onCreateTag }: {
    tags: Tag[];
    newTag: { name: string; description: string };
    showNewTagForm: boolean;
    onSetNewTag: (tag: { name: string; description: string }) => void;
    onSetShowNewTagForm: (show: boolean) => void;
    onCreateTag: () => void;
}) {
    return (
        <div>
            {/* 新しいTag作成 */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">Tag Management</h2>
                    <button
                        onClick={() => onSetShowNewTagForm(!showNewTagForm)}
                        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                    >
                        {showNewTagForm ? 'Cancel' : 'Add New Tag'}
                    </button>
                </div>

                {showNewTagForm && (
                    <div className="border-t pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tag Name
                                </label>
                                <input
                                    type="text"
                                    value={newTag.name}
                                    onChange={(e) => onSetNewTag({ ...newTag, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                                    placeholder="Enter tag name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <input
                                    type="text"
                                    value={newTag.description}
                                    onChange={(e) => onSetNewTag({ ...newTag, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                                    placeholder="Enter description (optional)"
                                />
                            </div>
                        </div>
                        <div className="mt-4">
                            <button
                                onClick={onCreateTag}
                                disabled={!newTag.name.trim()}
                                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Create Tag
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Tag一覧 */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    ID
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Description
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Quest Count
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Created
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {tags.map((tag: Tag) => (
                                <tr key={tag.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {tag.id}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                            {tag.name}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900">
                                        {tag.description || 'No description'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {tag.questCount} quests
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {new Date(tag.created_at).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// Blogs Tab Component
function BlogsTab({
    blogs,
    showNewBlogForm,
    editingBlog,
    onSetShowNewBlogForm,
    onSetEditingBlog,
    onCreateBlog,
    onUpdateBlog,
    onDeleteBlog
}: {
    blogs: Blog[];
    showNewBlogForm: boolean;
    editingBlog: Blog | null;
    onSetShowNewBlogForm: (show: boolean) => void;
    onSetEditingBlog: (blog: Blog | null) => void;
    onCreateBlog: (blogData: any) => void;
    onUpdateBlog: (blogId: number, blogData: Partial<Blog>) => void;
    onDeleteBlog: (blogId: number) => void;
}) {
    const [newBlog, setNewBlog] = React.useState({
        title: '',
        thumbnail: '',
        is_published: false,
        contents: [] as Array<{
            subtitle?: string;
            content?: string;
            image?: string;
            order: number;
        }>
    });

    const [editingBlogData, setEditingBlogData] = React.useState<Blog | null>(null);

    // 編集用のコンテンツ型（id, blog_id, created_atは不要）
    type EditContent = {
        subtitle?: string;
        content?: string;
        image?: string;
        order: number;
    };

    const addContent = () => {
        const newContent = {
            subtitle: '',
            content: '',
            image: '',
            order: newBlog.contents.length
        };
        setNewBlog(prev => ({
            ...prev,
            contents: [...prev.contents, newContent]
        }));
    };

    const updateContent = (index: number, field: string, value: string) => {
        setNewBlog(prev => ({
            ...prev,
            contents: prev.contents.map((content, i) =>
                i === index ? { ...content, [field]: value } : content
            )
        }));
    };

    const removeContent = (index: number) => {
        setNewBlog(prev => ({
            ...prev,
            contents: prev.contents.filter((_, i) => i !== index)
        }));
    };

    const handleCreateBlog = () => {
        onCreateBlog(newBlog);
        setNewBlog({
            title: '',
            thumbnail: '',
            is_published: false,
            contents: []
        });
    };

    const handleEditBlog = (blog: Blog) => {
        setEditingBlogData(blog);
        onSetEditingBlog(blog);
    };

    const addEditContent = () => {
        if (!editingBlogData) return;
        const newContent = {
            subtitle: '',
            content: '',
            image: '',
            order: editingBlogData.contents.length
        };
        setEditingBlogData(prev => prev ? {
            ...prev,
            contents: [...prev.contents, newContent as any]
        } : null);
    };

    const updateEditContent = (index: number, field: string, value: string) => {
        if (!editingBlogData) return;
        setEditingBlogData(prev => prev ? {
            ...prev,
            contents: prev.contents.map((content, i) =>
                i === index ? { ...content, [field]: value } : content
            )
        } : null);
    };

    const removeEditContent = (index: number) => {
        if (!editingBlogData) return;
        setEditingBlogData(prev => prev ? {
            ...prev,
            contents: prev.contents.filter((_, i) => i !== index)
        } : null);
    };

    const handleUpdateBlog = () => {
        if (!editingBlogData) return;
        onUpdateBlog(editingBlogData.id, editingBlogData);
        setEditingBlogData(null);
    };

    const handleCancelEdit = () => {
        setEditingBlogData(null);
        onSetEditingBlog(null);
    };

    return (
        <div>
            {/* Blog Management Header */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">Blog Management</h2>
                    <button
                        onClick={() => onSetShowNewBlogForm(!showNewBlogForm)}
                        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                    >
                        {showNewBlogForm ? 'Cancel' : 'Add New Blog'}
                    </button>
                </div>

                {/* New Blog Form */}
                {showNewBlogForm && (
                    <div className="border-t pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Title
                                </label>
                                <input
                                    type="text"
                                    value={newBlog.title}
                                    onChange={(e) => setNewBlog(prev => ({ ...prev, title: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                                    placeholder="Enter blog title"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Thumbnail URL
                                </label>
                                <input
                                    type="text"
                                    value={newBlog.thumbnail}
                                    onChange={(e) => setNewBlog(prev => ({ ...prev, thumbnail: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                                    placeholder="Enter thumbnail URL (optional)"
                                />
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={newBlog.is_published}
                                    onChange={(e) => setNewBlog(prev => ({ ...prev, is_published: e.target.checked }))}
                                    className="mr-2"
                                />
                                <span className="text-sm font-medium text-gray-700">Published</span>
                            </label>
                        </div>

                        {/* Content Sections */}
                        <div className="mb-4">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-md font-medium">Content Sections</h3>
                                <button
                                    onClick={addContent}
                                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                                >
                                    Add Section
                                </button>
                            </div>

                            {newBlog.contents.map((content, index) => (
                                <div key={index} className="border border-gray-200 rounded p-4 mb-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className="text-sm font-medium">Section {index + 1}</h4>
                                        <button
                                            onClick={() => removeContent(index)}
                                            className="text-red-600 hover:text-red-800 text-sm"
                                        >
                                            Remove
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Subtitle
                                            </label>
                                            <input
                                                type="text"
                                                value={content.subtitle || ''}
                                                onChange={(e) => updateContent(index, 'subtitle', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                                                placeholder="Enter subtitle"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Content
                                            </label>
                                            <textarea
                                                value={content.content || ''}
                                                onChange={(e) => updateContent(index, 'content', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                                                placeholder="Enter content"
                                                rows={3}
                                            />
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Image URL
                                            </label>
                                            <input
                                                type="text"
                                                value={content.image || ''}
                                                onChange={(e) => updateContent(index, 'image', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                                                placeholder="Enter image URL (optional)"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-4">
                            <button
                                onClick={handleCreateBlog}
                                disabled={!newBlog.title.trim()}
                                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Create Blog
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Blog List */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    ID
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Title
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Content Sections
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Created
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {blogs.map((blog) => (
                                <tr key={blog.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {blog.id}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">
                                                {blog.title}
                                            </div>
                                            {blog.thumbnail && (
                                                <div className="text-sm text-gray-500">
                                                    Has thumbnail
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${blog.is_published
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {blog.is_published ? 'Published' : 'Draft'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {blog.contents.length} sections
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {new Date(blog.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => handleEditBlog(blog)}
                                                className="text-blue-600 hover:text-blue-900"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => onDeleteBlog(blog.id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Blog Modal */}
            {editingBlog && editingBlogData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black bg-opacity-50" onClick={handleCancelEdit} />
                    <div className="relative bg-white p-6 rounded-lg max-w-6xl max-h-[90vh] overflow-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Edit Blog: {editingBlogData.title}</h3>
                            <button
                                onClick={handleCancelEdit}
                                className="text-gray-500 hover:text-gray-700 text-2xl"
                            >
                                ×
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Title
                                </label>
                                <input
                                    type="text"
                                    value={editingBlogData.title}
                                    onChange={(e) => setEditingBlogData(prev => prev ? { ...prev, title: e.target.value } : null)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Thumbnail URL
                                </label>
                                <input
                                    type="text"
                                    value={editingBlogData.thumbnail || ''}
                                    onChange={(e) => setEditingBlogData(prev => prev ? { ...prev, thumbnail: e.target.value } : null)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                                />
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={editingBlogData.is_published}
                                    onChange={(e) => setEditingBlogData(prev => prev ? { ...prev, is_published: e.target.checked } : null)}
                                    className="mr-2"
                                />
                                <span className="text-sm font-medium text-gray-700">Published</span>
                            </label>
                        </div>

                        {/* Content Sections */}
                        <div className="mb-6">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="text-md font-medium">Content Sections</h4>
                                <button
                                    onClick={addEditContent}
                                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                                >
                                    Add Section
                                </button>
                            </div>

                            {editingBlogData.contents.map((content, index) => (
                                <div key={index} className="border border-gray-200 rounded p-4 mb-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <h5 className="text-sm font-medium">Section {index + 1}</h5>
                                        <button
                                            onClick={() => removeEditContent(index)}
                                            className="text-red-600 hover:text-red-800 text-sm"
                                        >
                                            Remove
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Subtitle
                                            </label>
                                            <input
                                                type="text"
                                                value={content.subtitle || ''}
                                                onChange={(e) => updateEditContent(index, 'subtitle', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                                                placeholder="Enter subtitle"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Content
                                            </label>
                                            <textarea
                                                value={content.content || ''}
                                                onChange={(e) => updateEditContent(index, 'content', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                                                placeholder="Enter content"
                                                rows={3}
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Image URL
                                            </label>
                                            <input
                                                type="text"
                                                value={content.image || ''}
                                                onChange={(e) => updateEditContent(index, 'image', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                                                placeholder="Enter image URL (optional)"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end space-x-2">
                            <button
                                onClick={handleCancelEdit}
                                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdateBlog}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                Update Blog
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
} 