import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

// キャッシュ設定を最適化
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function CategoryPage() {
    // 1) サーバーセッションをチェック
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        redirect("/login");
    }

    // 2) ユーザーIDを取得
    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true },
    });

    if (!user) {
        redirect("/login");
    }

    // 3) すべてのタグを取得（クエスト数でソート）
    const tags = await prisma.tag.findMany({
        include: {
            _count: {
                select: { quests: true },
            },
        },
        orderBy: {
            quests: {
                _count: "desc",
            },
        },
    });

    return (
        <main className="pb-6">
            {/* Header */}
            <section className="px-4 py-6">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-3xl font-bold">All Categories</h1>
                    <Link
                        href="/"
                        className="text-blue-600 hover:text-blue-800 underline"
                    >
                        ← Back to Home
                    </Link>
                </div>

                <p className="text-gray-600 mb-6">
                    Explore all available categories and find quests that match your interests.
                </p>
            </section>

            {/* All Categories Grid */}
            <section className="px-4">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {tags.map((tag) => (
                        <Link
                            key={tag.id}
                            href={`/category/${tag.id}`}
                            className="flex flex-col items-center p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
                        >
                            <div className="w-20 h-20 relative mb-3">
                                {tag.imageUrl ? (
                                    <Image
                                        src={tag.imageUrl}
                                        alt={tag.name}
                                        fill
                                        className="object-cover rounded-lg"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                                        <span className="text-gray-500 text-xs text-center">No image</span>
                                    </div>
                                )}
                            </div>
                            <h3 className="text-sm font-semibold text-center mb-1">{tag.name}</h3>
                            <span className="text-xs text-gray-500">{tag._count.quests} quests</span>
                            {tag.description && (
                                <p className="text-xs text-gray-600 text-center mt-2 line-clamp-2">
                                    {tag.description}
                                </p>
                            )}
                        </Link>
                    ))}
                </div>

                {tags.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-500">No categories found.</p>
                    </div>
                )}
            </section>
        </main>
    );
}
