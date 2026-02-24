import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
    image: v.optional(v.string()),
    isOnline: v.boolean(),
    lastSeen: v.number(),
  }).index("by_clerkId", ["clerkId"]),

  conversations: defineTable({
    participants: v.array(v.string()), // clerkIds
    lastMessage: v.optional(v.string()),
    lastMessageAt: v.optional(v.number()),
    typing: v.optional(v.string()), // clerkId of the user currently typing
    unread: v.optional(
  v.record(v.string(), v.number())
),

  }),

  messages: defineTable({
  conversationId: v.id("conversations"),
  senderClerkId: v.string(),
  text: v.string(),
  createdAt: v.number(),
}),

});
