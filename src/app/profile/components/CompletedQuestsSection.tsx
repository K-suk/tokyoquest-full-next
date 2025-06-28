import QuestCard from "@/components/QuestCard";
import { QuestDTO } from "@/lib/dto";

interface CompletedQuestsSectionProps {
    completedQuests: QuestDTO[];
    savedQuestIds: Set<number>;
}

export default function CompletedQuestsSection({
    completedQuests,
    savedQuestIds
}: CompletedQuestsSectionProps) {
    return (
        <div className="px-4 sm:px-6 lg:px-8 py-2 sm:py-4 lg:py-8 bg-gray-50 min-h-screen">
            <div className="mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
                    Completed Quests
                </h2>
                <p className="text-gray-600">
                    Your completed adventures in Tokyo
                </p>
            </div>

            {completedQuests.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                    {completedQuests.map((quest) => (
                        <QuestCard
                            key={quest.id}
                            quest={{
                                id: quest.id,
                                title: quest.title,
                                description: quest.description,
                                imgUrl: quest.imgUrl ?? "",
                                is_saved: savedQuestIds.has(quest.id)
                            }}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12">
                    <div className="text-gray-400 text-6xl mb-4">🏃‍♂️</div>
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">
                        No Completed Quests Yet
                    </h3>
                    <p className="text-gray-500">
                        Start your Tokyo adventure by completing your first quest!
                    </p>
                </div>
            )}
        </div>
    );
} 