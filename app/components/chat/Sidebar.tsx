import { ConversationId, ConversationDoc, UserDoc } from "./types";
import { ConversationList } from "./ConversationList";
import { UserSearchList } from "./UserSearchList";

type SidebarProps = {
    currentUser: {
        id: string;
        fullName: string | null;
        imageUrl: string;
        primaryEmailAddress?: { emailAddress: string } | null;
    } | null | undefined;
    search: string;
    onSearchChange: (value: string) => void;
    onSignOut: () => Promise<void>;
    onSelectUser: (userId: string) => Promise<void>;
    onSelectConversation: (conversationId: ConversationId) => Promise<void>;
    conversations: ConversationDoc[] | undefined;
    users: UserDoc[] | undefined;
    filteredUsers: UserDoc[] | undefined;
    activeConversation: ConversationId | null;
    isMobileChatOpen: boolean;
};

export function Sidebar({
    currentUser,
    search,
    onSearchChange,
    onSignOut,
    onSelectUser,
    onSelectConversation,
    conversations,
    users,
    filteredUsers,
    activeConversation,
    isMobileChatOpen,
}: SidebarProps) {
    return (
        <div
            className={`w-full md:w-80 border-r p-4 flex flex-col bg-white ${isMobileChatOpen ? "hidden md:flex" : "flex"
                }`}
        >
            <div className="flex items-center justify-between mb-6 border-b pb-4">
                <div className="flex items-center gap-3">
                    <img
                        src={currentUser?.imageUrl}
                        alt={currentUser?.fullName || "User"}
                        className="w-10 h-10 rounded-full"
                    />
                    <div>
                        <p className="font-semibold text-sm">{currentUser?.fullName}</p>
                        <p className="text-xs text-gray-500">{currentUser?.primaryEmailAddress?.emailAddress}</p>
                    </div>
                </div>

                <button onClick={onSignOut} className="text-xs text-red-500 hover:underline">
                    Sign Out
                </button>
            </div>

            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Search users..."
                    value={search}
                    onChange={(event) => onSearchChange(event.target.value)}
                    className="w-full border rounded px-3 py-2 text-sm"
                />
            </div>

            {!conversations && <p>Loading...</p>}

            {conversations?.length === 0 && (
                <div className="flex flex-col items-center justify-center mt-10 text-gray-500">
                    <p className="text-lg font-medium mb-2">No conversations yet</p>
                    <p className="text-sm">Start a chat by clicking a user</p>
                </div>
            )}

            <div className="space-y-2 overflow-y-auto flex-1">
                {search.trim() ? (
                    <UserSearchList filteredUsers={filteredUsers} onSelectUser={onSelectUser} />
                ) : (
                    <ConversationList
                        conversations={conversations}
                        users={users}
                        currentUserId={currentUser?.id || ""}
                        activeConversation={activeConversation}
                        onSelectConversation={onSelectConversation}
                    />
                )}
            </div>
        </div>
    );
}
