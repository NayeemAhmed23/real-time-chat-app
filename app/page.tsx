"use client";

import { useEffect, useState, useRef } from "react";
import { Id } from "../convex/_generated/dataModel";
import { useUser, useAuth } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";


import {
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";

export default function Home() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const [activeConversation, setActiveConversation] = useState<Id<"conversations"> | null>(null);
  const [search, setSearch] = useState("");
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);

  // Mutations
  const createUser = useMutation(api.users.createUser);
  const createOrGetConversation = useMutation(api.users.createOrGetConversation);
  const updateUserStatus = useMutation(api.users.updateUserStatus);
  const clearUnread = useMutation(api.users.clearUnread);

  // Queries
  const users = useQuery(
    api.users.getUsers,
    user ? { currentUserClerkId: user.id } : "skip"
  );

  const filteredUsers = users?.filter((u) =>
  u.name.toLowerCase().includes(search.toLowerCase())
);
  const conversations = useQuery(
    api.users.getConversations,
    user ? { currentUserClerkId: user.id } : "skip"
  );

  // 1️⃣ Create user and set online
  useEffect(() => {
    if (user) {
      createUser({
        clerkId: user.id,
        name: user.fullName || "No Name",
        email: user.primaryEmailAddress?.emailAddress || "",
        image: user.imageUrl,
      }).then(() => {
        updateUserStatus({ clerkId: user.id, isOnline: true });
      });
    }
  }, [user, createUser, updateUserStatus]);

  // 2️⃣ Set offline on window close/unload
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (user) {
        await updateUserStatus({ clerkId: user.id, isOnline: false });
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [user, updateUserStatus]);

  // 3️⃣ Optional: set offline on Sign Out
  const handleSignOut = async () => {
    if (user) {
      await updateUserStatus({ clerkId: user.id, isOnline: false });
    }
    await signOut();
  };

  // Click user → create/get conversation
const handleUserClick = async (otherUserId: string) => {
  if (!user) return;

  const conversationId = (await createOrGetConversation({
    currentUserClerkId: user.id,
    otherUserClerkId: otherUserId,
  })) as Id<"conversations">;

  // ✅ Clear unread for current user
  await clearUnread({
    conversationId,
    clerkId: user.id,
  });

  setActiveConversation(conversationId);
};
  return (
    <div className="h-screen flex">
      <SignedOut>
        <div className="m-auto">
          <SignInButton mode="modal">
            <button className="px-4 py-2 bg-black text-white rounded">
              Sign In
            </button>
          </SignInButton>
        </div>
      </SignedOut>

      <SignedIn>
        {/* Sidebar */}
        <div className={`
  w-full md:w-80 border-r p-4 flex flex-col bg-white
  ${isMobileChatOpen ? "hidden md:flex" : "flex"}
`}>
  <div className="flex items-center justify-between mb-6 border-b pb-4">

  {/* Logged In User Info */}
  <div className="flex items-center gap-3">
    <img
      src={user?.imageUrl}
      alt={user?.fullName || "User"}
      className="w-10 h-10 rounded-full"
    />
    <div>
      <p className="font-semibold text-sm">
        {user?.fullName}
      </p>
      <p className="text-xs text-gray-500">
        {user?.primaryEmailAddress?.emailAddress}
      </p>
    </div>
  </div>

  <button
    onClick={handleSignOut}
    className="text-xs text-red-500 hover:underline"
  >
    Sign Out
  </button>

</div>

{/* Search Bar */}
<div className="mb-4">
  <input
    type="text"
    placeholder="Search users..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    className="w-full border rounded px-3 py-2 text-sm"
  />
</div>

          {!conversations && <p>Loading...</p>}

          {/* Empty state for no conversations */}
          {conversations?.length === 0 && (
            <div className="flex flex-col items-center justify-center mt-10 text-gray-500">
              <p className="text-lg font-medium mb-2">No conversations yet</p>
              <p className="text-sm">Start a chat by clicking a user</p>
            </div>
          )}

          <div className="space-y-2 overflow-y-auto flex-1">

  {search.trim() !== "" ? (
    <>
      {filteredUsers?.length === 0 && (
        <p className="text-gray-500 text-center mt-6">
          No users found
        </p>
      )}

      {filteredUsers?.map((u) => (
        <div
          key={u._id}
          onClick={() => handleUserClick(u.clerkId)}
          className="p-3 rounded flex items-center gap-3 cursor-pointer hover:bg-gray-100"
        >
          <div className="relative">
            <img
              src={u.image || ""}
              alt={u.name}
              className="w-8 h-8 rounded-full"
            />
            {u.isOnline && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
            )}
          </div>
          <div>
            <p className="font-medium text-sm">{u.name}</p>
            <p className="text-xs text-gray-500 truncate">
              {u.email}
            </p>
          </div>
        </div>
      ))}
    </>
  ) : (
    <>
      {conversations?.length === 0 && (
        <p className="text-gray-500 text-center mt-6">
          No conversations yet
        </p>
      )}

     {conversations?.map((conv) => {
 const unreadCount = user ? conv.unread?.[user.id] || 0 : 0;

  // 🔥 Get other participant
  const otherUserId = conv.participants.find(
    (p) => p !== user!.id
  );

  const otherUser = users?.find(
    (u) => u.clerkId === otherUserId
  );

  return (
    <div
      key={conv._id}
      onClick={async () => {
        await clearUnread({
          conversationId: conv._id,
          clerkId: user!.id,
        });
        setActiveConversation(conv._id);
        setIsMobileChatOpen(true);
      }}
      className={`p-3 rounded cursor-pointer flex justify-between items-center ${
        activeConversation === conv._id
          ? "bg-gray-200"
          : "hover:bg-gray-100"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <img
            src={otherUser?.image || ""}
            alt={otherUser?.name}
            className="w-8 h-8 rounded-full"
          />
          {otherUser?.isOnline && (
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
          )}
        </div>

        <div>
          <p className="text-sm font-medium">
            {otherUser?.name || "User"}
          </p>
          <p className="text-xs text-gray-500 truncate">
            {conv.lastMessage || "No messages yet"}
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
  )}

</div>
        </div>

        {/* Chat Area */}
        <div className={`
  flex-1 flex flex-col
  ${!isMobileChatOpen ? "hidden md:flex" : "flex"}
`}>
  {activeConversation && user ? (
    <ChatBox conversationId={activeConversation} currentUserId={user.id} onBack={() => setIsMobileChatOpen(false)}/>
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

// ChatBox Component
// ChatBox Component
function ChatBox({
conversationId,
  currentUserId,
  onBack,
}: {
  conversationId: Id<"conversations">;
  currentUserId: string;
  onBack?: () => void;
}) {
  if (!conversationId || !currentUserId) return null;

  const [message, setMessage] = useState("");
  const [showScrollButton, setShowScrollButton] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Mutations
  const sendMessage = useMutation(api.users.sendMessage);
  const setTyping = useMutation(api.users.setTyping);

  // Queries
  const messages = useQuery(api.users.getMessages, { conversationId });

  const conversationList = useQuery(
    api.users.getConversations,
    { currentUserClerkId: currentUserId }
  );

  const conversation = conversationList?.find(
    (c) => c._id === conversationId
  );

  // 🔥 Detect Scroll Position
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const threshold = 80;

      const isAtBottom =
        container.scrollHeight -
          container.scrollTop -
          container.clientHeight <
        threshold;

      setShowScrollButton(!isAtBottom);
    };

    container.addEventListener("scroll", handleScroll);
    return () =>
      container.removeEventListener("scroll", handleScroll);
  }, []);

  // 🔥 Auto Scroll On New Message
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !messages) return;

    const threshold = 80;

    const isAtBottom =
      container.scrollHeight -
        container.scrollTop -
        container.clientHeight <
      threshold;

    if (isAtBottom) {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
      });
    } else {
      setShowScrollButton(true);
    }
  }, [messages]);

  useEffect(() => {
  return () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };
}, []);

  const handleSend = async () => {
    if (!message.trim()) return;

    await sendMessage({
      conversationId,
      senderClerkId: currentUserId,
      text: message,
    });

    setMessage("");

    await setTyping({
      conversationId,
      typingClerkId: "",
    });
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isSameYear = date.getFullYear() === now.getFullYear();

    if (isToday)
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

    if (isSameYear)
      return date.toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

    return date.toLocaleString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex flex-col h-full border rounded md:mt-6">

      {/* 🔥 Chat Header */}
<div className="flex items-center border-b p-4">

  {onBack && (
    <button
      onClick={onBack}
      className="md:hidden mr-3 text-blue-500 text-sm"
    >
      ← Back
    </button>
  )}

  <h2 className="font-semibold text-sm">
    Chat
  </h2>

</div>

      {/* Messages Container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto space-y-2 p-4 pr-2"
      >
        {/* Empty State */}
        {messages?.length === 0 && (
          <p className="text-gray-400 text-center mt-8">
            No messages yet. Start the conversation!
          </p>
        )}

        {/* Messages */}
        {messages?.map((msg) => (
          <div
            key={msg._id}
            className={`p-2 rounded max-w-xs ${
              msg.senderClerkId === currentUserId
                ? "bg-blue-500 text-white ml-auto"
                : "bg-gray-200"
            }`}
          >
            <p>{msg.text}</p>
            <p className="text-[10px] opacity-70 mt-1 text-right">
              {formatTimestamp(msg.createdAt)}
            </p>
          </div>
        ))}

        {/* Scroll Anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* ↓ New Messages Button (OUTSIDE scroll container) */}
      {showScrollButton && (
        <button
          onClick={() => {
            messagesEndRef.current?.scrollIntoView({
              behavior: "smooth",
            });
            setShowScrollButton(false);
          }}
          className="self-center mt-2 mb-2 text-xs bg-gray-200 px-3 py-1 rounded"
        >
          ↓ New messages
        </button>
      )}

      {/* Typing Indicator */}
      {conversation?.typing &&
        conversation.typing !== currentUserId && (
          <p className="text-xs text-gray-500 italic mb-2">
            User is typing...
          </p>
        )}

      {/* Input */}
      <div className="flex items-end gap-2">
  <textarea
    value={message}
    rows={1}
    onChange={(e) => {
  setMessage(e.target.value);

  // auto expand
  e.target.style.height = "auto";
  e.target.style.height = e.target.scrollHeight + "px";

  // Send typing event
  setTyping({
    conversationId,
    typingClerkId: currentUserId,
  });

  // Clear previous timeout
  if (typingTimeoutRef.current) {
    clearTimeout(typingTimeoutRef.current);
  }

  // Set new timeout (2 seconds)
  typingTimeoutRef.current = setTimeout(() => {
    setTyping({
      conversationId,
      typingClerkId: "",
    });
  }, 2000);
}}
    onKeyDown={async (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        await handleSend();
      }
    }}
    placeholder="Type a message..."
    className="flex-1 border rounded px-3 py-2 resize-none overflow-hidden max-h-40"
  />

  <button
    onClick={handleSend}
    className="px-4 py-2 bg-black text-white rounded h-10 self-end"
  >
    Send
  </button>
      </div>
    </div>
  );
}

