"use client";
import { SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { useMemo, useState } from "react";

import { api } from "@/convex/_generated/api";
import { ConversationId } from "@/app/components/chat/types";
import { ChatBox } from "@/app/components/chat/ChatBox";
import { Sidebar } from "@/app/components/chat/Sidebar";
import { useUserPresence } from "@/app/hooks/useUserPresence";
export default function Home() {
 const { user, handleSignOut } = useUserPresence();

  const [activeConversation, setActiveConversation] = useState<ConversationId | null>(null);

  const [search, setSearch] = useState("");
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);

    const createOrGetConversation = useMutation(api.users.createOrGetConversation);
     const clearUnread = useMutation(api.users.clearUnread);


    const users = useQuery(api.users.getUsers, user ? { currentUserClerkId: user.id } : "skip");
    const conversations = useQuery(
    api.users.getConversations,  
    user ? { currentUserClerkId: user.id } : "skip",
        );
          const filteredUsers = useMemo(
    () => users?.filter((entry) => entry.name.toLowerCase().includes(search.toLowerCase())),
    [search, users],
  );
    const handleUserClick = async (otherUserId: string) => {
    if (!user) return;
     const conversationId = (await createOrGetConversation({
      currentUserClerkId: user.id,
      otherUserClerkId: otherUserId,
    })) as ConversationId;
     await clearUnread({
      conversationId,
      clerkId: user.id,
    });

    setActiveConversation(conversationId);
    setIsMobileChatOpen(true);
  };

    const handleConversationClick = async (conversationId: ConversationId) => {
    if (!user) return;
      await clearUnread({
      conversationId,
      clerkId: user.id,
    });

       setActiveConversation(conversationId);
    setIsMobileChatOpen(true);
  };

    return (
    <div className="h-screen flex">
      <SignedOut>
        <div className="m-auto">
          <SignInButton mode="modal">
            <button className="px-4 py-2 bg-black text-white rounded">Sign In</button>
          </SignInButton>
        </div>
      </SignedOut>

      <SignedIn>
         <Sidebar
          currentUser={user}
          search={search}
          onSearchChange={setSearch}
          onSignOut={handleSignOut}
          onSelectUser={handleUserClick}
          onSelectConversation={handleConversationClick}
          conversations={conversations}
          users={users}
          filteredUsers={filteredUsers}
          activeConversation={activeConversation}
          isMobileChatOpen={isMobileChatOpen}
        />

        <div className={`flex-1 flex flex-col ${!isMobileChatOpen ? "hidden md:flex" : "flex"}`}>
          {activeConversation && user ? (
            <ChatBox
              conversationId={activeConversation}
              currentUserId={user.id}
              onBack={() => setIsMobileChatOpen(false)}
            />

             ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              Select a conversation to start chatting
            </div>
          )}
        </div>
            </SignedIn>
    </div>
  );
}
