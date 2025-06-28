"use client";

import { useState } from "react";
import Image from "next/image";
import { UserDTO } from "@/lib/dto";

interface ProfileHeaderProps {
    user: UserDTO;
}

export default function ProfileHeader({ user }: ProfileHeaderProps) {
    // モーダル関連の状態
    const [showModal, setShowModal] = useState(false);
    const [modalAnimation, setModalAnimation] = useState(false);
    const [editName, setEditName] = useState(user.name || "");
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [toastType, setToastType] = useState<"success" | "error">("success");
    const [currentUser, setCurrentUser] = useState(user);

    // トースト通知を表示
    const showToastMessage = (message: string, type: "success" | "error") => {
        setToastMessage(message);
        setToastType(type);
        setShowToast(true);
        setTimeout(() => {
            setShowToast(false);
        }, 3000);
    };

    // モーダルを開く
    const openModal = () => {
        setShowModal(true);
        setTimeout(() => setModalAnimation(true), 10);
    };

    // モーダルを閉じる
    const closeModal = () => {
        setModalAnimation(false);
        setTimeout(() => {
            setShowModal(false);
            setMessage("");
        }, 300);
    };

    // プロフィール更新
    const handleSubmit = async () => {
        if (!editName.trim()) {
            setMessage("Put UserName!");
            return;
        }

        setSaving(true);
        try {
            const response = await fetch('/api/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: editName.trim(),
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setCurrentUser(data.user);
                // 即座にモーダルを閉じる
                closeModal();
                // 成功メッセージをトーストで表示
                showToastMessage("Profile updated!", "success");
            } else {
                const errorData = await response.json();
                setMessage(`Error: ${errorData.error}`);
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            setMessage("Failed to update");
        } finally {
            setSaving(false);
        }
    };

    // ユーザー名を分割（first_name, last_nameとして扱う）
    const nameParts = currentUser.name?.split(' ') || [];
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    return (
        <>
            {/* プロフィールセクション */}
            <div className="relative">
                <div className="h-48 sm:h-56 md:h-64 lg:h-72 xl:h-80 relative overflow-hidden">
                    <Image
                        src="/images/tokyonight.webp"
                        alt="Tokyo skyline with Tokyo Tower"
                        fill
                        className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-40" />
                    <div className="absolute inset-0 px-4 sm:px-6 lg:px-8 py-8 sm:py-9 lg:py-12 flex flex-col justify-center text-white">
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-2 sm:mb-3 lg:mb-4">
                            {firstName} {lastName}
                        </h1>
                        <p className="text-sm sm:text-base lg:text-lg mb-4 sm:mb-6 lg:mb-8 opacity-90">
                            {currentUser.email}
                        </p>
                        <div className="space-y-1 sm:space-y-2 text-sm sm:text-base lg:text-lg">
                            <div>Level : {currentUser.level}</div>
                            <div>Experience : {currentUser.exp}</div>
                        </div>

                        <button
                            onClick={openModal}
                            className="font-bold bg-red-500 hover:bg-red-600 text-white mt-4 sm:mt-6 lg:mt-8 w-fit px-6 sm:px-8 py-2 sm:py-3 text-sm sm:text-base rounded-md transition-colors duration-200"
                        >
                            Edit
                        </button>
                    </div>
                </div>
            </div>

            {/* プロフィール編集モーダル */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div
                        className={`absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity duration-300 ease-out ${modalAnimation ? 'opacity-100' : 'opacity-0'
                            }`}
                        onClick={closeModal}
                    />
                    <div
                        className={`relative bg-white p-6 rounded-lg max-w-md w-full mx-4 shadow-2xl transform transition-all duration-300 ease-out ${modalAnimation ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
                            }`}
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">
                                Profile Edit
                            </h2>
                            <button
                                onClick={closeModal}
                                className="text-2xl hover:opacity-80 transition-opacity duration-200"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Name
                                </label>
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    placeholder="Enter your name"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                    disabled={saving}
                                    required
                                />
                            </div>

                            <button
                                onClick={handleSubmit}
                                disabled={saving}
                                className={`w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md font-medium transition-colors duration-200 ${saving ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                            >
                                {saving ? "Updating..." : "Update Profile"}
                            </button>

                            {message && (
                                <p className={`text-sm mt-2 ${message.includes("エラー") ? "text-red-600" : "text-green-600"
                                    }`}>
                                    {message}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* トースト通知 */}
            {showToast && (
                <div className="fixed top-4 right-4 z-50">
                    <div
                        className={`px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 ease-out ${toastType === "success"
                            ? "bg-green-500 text-white"
                            : "bg-red-500 text-white"
                            }`}
                    >
                        <div className="flex items-center space-x-2">
                            <span className="text-lg">
                                {toastType === "success" ? "✓" : "✕"}
                            </span>
                            <span>{toastMessage}</span>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
} 