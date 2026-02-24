import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const createUser = mutation({
  args: {
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
    image: v.optional(v.string()),
  },
  async handler(ctx, args) {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (existingUser) return;

    await ctx.db.insert("users", {
      clerkId: args.clerkId,
      name: args.name,
      email: args.email,
      image: args.image,
      isOnline: true,
      lastSeen: Date.now(),
    });
  },
});

import { query } from "./_generated/server";

export const getUsers = query({
  args: {
    currentUserClerkId: v.string(),
  },
  async handler(ctx, args) {
    const users = await ctx.db.query("users").collect();

    return users.filter(
      (user) => user.clerkId !== args.currentUserClerkId
    );
  },
});

export const createOrGetConversation = mutation({
  args: {
    currentUserClerkId: v.string(),
    otherUserClerkId: v.string(),
  },
  async handler(ctx, args) {
    const participants = [
      args.currentUserClerkId,
      args.otherUserClerkId,
    ].sort();

    // Check if conversation already exists
    const existing = await ctx.db
      .query("conversations")
      .filter((q) =>
        q.eq(q.field("participants"), participants)
      )
      .first();

    if (existing) return existing._id;

    // Create new conversation
    const conversationId = await ctx.db.insert("conversations", {
      participants,
      lastMessage: "",
      lastMessageAt: Date.now(),
    });

    return conversationId;
  },
});

export const sendMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    senderClerkId: v.string(),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderClerkId: args.senderClerkId,
      text: args.text,
      createdAt: Date.now(),
    });

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) return;

    const unread = conversation.unread || {};

    conversation.participants.forEach((participant) => {
      if (participant !== args.senderClerkId) {
        unread[participant] =
          (unread[participant] || 0) + 1;
      }
    });

    await ctx.db.patch(args.conversationId, {
      lastMessage: args.text,
      lastMessageAt: Date.now(),
      unread,
    });
  },
});

export const getMessages = query({
  args: {
    conversationId: v.id("conversations"),
  },
  async handler(ctx, args) {
    return await ctx.db
      .query("messages")
      .filter((q) =>
        q.eq(q.field("conversationId"), args.conversationId)
      )
      .order("asc")
      .collect();
  },
});

export const getConversations = query({
  args: {
    currentUserClerkId: v.string(),
  },
  async handler(ctx, args) {
    const conversations = await ctx.db
      .query("conversations")
      .order("desc")
      .collect();

    return conversations.filter((c) =>
      c.participants.includes(args.currentUserClerkId)
    );
  },
});
export const updateUserStatus = mutation({
  args: {
    clerkId: v.string(),
    isOnline: v.boolean(),
  },
  async handler(ctx, args) {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (user) {
      await ctx.db.patch(user._id, {
        isOnline: args.isOnline,
        lastSeen: Date.now(),
      });
    }
  },
});

export const setTyping = mutation({
  args: {
    conversationId: v.id("conversations"),
    typingClerkId: v.string(),
  },
  async handler(ctx, args) {
    await ctx.db.patch(args.conversationId, {
      typing: args.typingClerkId,
    });
  },
});

export const incrementUnread = mutation({
  args: {
    conversationId: v.id("conversations"),
    receiverClerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) return;

    const unread = conversation.unread || {};

    unread[args.receiverClerkId] =
      (unread[args.receiverClerkId] || 0) + 1;

    await ctx.db.patch(args.conversationId, {
      unread,
    });
  },
});

export const clearUnread = mutation({
  args: {
    conversationId: v.id("conversations"),
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) return;

    const unread = conversation.unread || {};
    unread[args.clerkId] = 0;

    await ctx.db.patch(args.conversationId, {
      unread,
    });
  },
});