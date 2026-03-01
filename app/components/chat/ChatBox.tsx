"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import { ConversationId } from "./types";

type ChatBoxProps = {
    conversationId: ConversationId;
    currentUserId: string;
    onBack?: () => void;
};

export function ChatBox({ conversationId, currentUserId, onBack }: ChatBoxProps) {
    const [message, setMessage] = useState("");
    const [showScrollButton, setShowScrollButton] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const previousMessageCountRef = useRef(0);
    const initializedConversationRef = useRef<ConversationId | null>(null);
    const isNearBottom = (container: HTMLDivElement) =>
        container.scrollHeight - container.scrollTop - container.clientHeight < 80;


    const sendMessage = useMutation(api.users.sendMessage);
    const setTyping = useMutation(api.users.setTyping);
    const clearUnread = useMutation(api.users.clearUnread);

    const messages = useQuery(api.users.getMessages, { conversationId });
    const conversationList = useQuery(api.users.getConversations, {
        currentUserClerkId: currentUserId,
    });

    const conversation = conversationList?.find((entry) => entry._id === conversationId);

    useEffect(() => {
        previousMessageCountRef.current = 0;
        initializedConversationRef.current = null;
        setShowScrollButton(false);
    }, [conversationId]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleScroll = () => {
            const isAtBottom = isNearBottom(container);

            if (isAtBottom) {
                setShowScrollButton(false);
                if ((conversation?.unread?.[currentUserId] || 0) > 0) {
                    void clearUnread({ conversationId, clerkId: currentUserId });
                }
            }
        };

        container.addEventListener("scroll", handleScroll);
        return () => container.removeEventListener("scroll", handleScroll);
    }, [clearUnread, conversation?.unread, conversationId, currentUserId]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container || !messages) return;

        if (initializedConversationRef.current !== conversationId) {
            initializedConversationRef.current = conversationId;
            previousMessageCountRef.current = messages.length;
            setShowScrollButton(false);
            messagesEndRef.current?.scrollIntoView({ behavior: "auto" });

            if ((conversation?.unread?.[currentUserId] || 0) > 0) {
                void clearUnread({ conversationId, clerkId: currentUserId });
            }
            return;
        }

        const previousMessageCount = previousMessageCountRef.current;
        const hasNewMessage = messages.length > previousMessageCount;
        previousMessageCountRef.current = messages.length;

        const isAtBottom = isNearBottom(container);

        if (isAtBottom) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            if ((conversation?.unread?.[currentUserId] || 0) > 0) {
                void clearUnread({ conversationId, clerkId: currentUserId });
            }
            return;
        }

        if (hasNewMessage) {
            setShowScrollButton(true);
        }
    }, [clearUnread, conversation?.unread, conversationId, currentUserId, messages]);

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

        if (isToday) {
            return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        }

        if (isSameYear) {
            return date.toLocaleString([], {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            });
        }

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
            <div className="flex items-center border-b p-4">
                {onBack && (
                    <button onClick={onBack} className="md:hidden mr-3 text-blue-500 text-sm">
                        ← Back
                    </button>
                )}
                <h2 className="font-semibold text-sm">Chat</h2>
            </div>

            <div ref={containerRef} className="flex-1 overflow-y-auto space-y-2 p-4 pr-2">
                {messages?.length === 0 && (
                    <p className="text-gray-400 text-center mt-8">No messages yet. Start the conversation!</p>
                )}

                {messages?.map((entry) => (
                    <div
                        key={entry._id}
                        className={`p-2 rounded max-w-xs ${entry.senderClerkId === currentUserId ? "bg-blue-500 text-white ml-auto" : "bg-gray-200"
                            }`}
                    >
                        <p>{entry.text}</p>
                        <p className="text-[10px] opacity-70 mt-1 text-right">{formatTimestamp(entry.createdAt)}</p>
                    </div>
                ))}

                <div ref={messagesEndRef} />
            </div>

            {showScrollButton && (
                <button
                    onClick={() => {
                        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
                        setShowScrollButton(false);
                    }}
                    className="self-center mt-2 mb-2 text-xs bg-gray-200 px-3 py-1 rounded"
                >
                    ↓ New messages
                </button>
            )}

            {conversation?.typing && conversation.typing !== currentUserId && (
                <p className="text-xs text-gray-500 italic mb-2">User is typing...</p>
            )}

            <div className="flex items-end gap-2">
                <textarea
                    value={message}
                    rows={1}
                    onChange={(event) => {
                        setMessage(event.target.value);
                        event.target.style.height = "auto";
                        event.target.style.height = `${event.target.scrollHeight}px`;

                        void setTyping({
                            conversationId,
                            typingClerkId: currentUserId,
                        });

                        if (typingTimeoutRef.current) {
                            clearTimeout(typingTimeoutRef.current);
                        }

                        typingTimeoutRef.current = setTimeout(() => {
                            void setTyping({
                                conversationId,
                                typingClerkId: "",
                            });
                        }, 2000);
                    }}
                    onKeyDown={async (event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                            event.preventDefault();
                            await handleSend();
                        }
                    }}
                    placeholder="Type a message..."
                    className="flex-1 border rounded px-3 py-2 resize-none overflow-hidden max-h-40"
                />

                <button onClick={handleSend} className="px-4 py-2 bg-black text-white rounded h-10 self-end">
                    Send
                </button>
            </div>
        </div>
    );
}
