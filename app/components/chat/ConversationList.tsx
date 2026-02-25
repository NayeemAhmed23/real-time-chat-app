import { ConversationDoc, ConversationId, UserDoc } from "./types";

type ConversationListProps = {
    conversations: ConversationDoc[] | undefined;
    users: UserDoc[] | undefined;
    currentUserId: string;
    activeConversation: ConversationId | null;
    onSelectConversation: (conversationId: ConversationId) => Promise<void>;
};

export function ConversationList({
    conversations,
    users,
    currentUserId,
    activeConversation,
    onSelectConversation,
}: ConversationListProps) {
    if (conversations?.length === 0) {
        return <p className="text-gray-500 text-center mt-6">No conversations yet</p>;
    }

    return (
        <>
            {conversations?.map((conversation) => {
                const unreadCount = conversation.unread?.[currentUserId] || 0;
                const otherUserId = conversation.participants.find((p) => p !== currentUserId);
                const otherUser = users?.find((u) => u.clerkId === otherUserId);

                return (
                    <div
                        key={conversation._id}
                        onClick={() => onSelectConversation(conversation._id)}
                        className={`p-3 rounded cursor-pointer flex justify-between items-center ${activeConversation === conversation._id ? "bg-gray-200" : "hover:bg-gray-100"
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <img
                                    src={otherUser?.image || ""}
                                    alt={otherUser?.name || "User"}
                                    className="w-8 h-8 rounded-full"
                                />
                                {otherUser?.isOnline && (
                                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                                )}
                            </div>

                            <div>
                                <p className="text-sm font-medium">{otherUser?.name || "User"}</p>
                                <p className="text-xs text-gray-500 truncate">
                                    {conversation.lastMessage || "No messages yet"}
                                </p>
                            </div>
                        </div>

                        {unreadCount > 0 && (
                            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                                {unreadCount}
                            </span>
                        )}
                    </div>
                );
            })}
        </>
    );
}
