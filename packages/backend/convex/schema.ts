// eslint-disable-next-line
// biome-ignore file
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Convex database schema for notes and locations.
 */
export default defineSchema({
  notes: defineTable({
    userId: v.string(),
    title: v.string(),
    content: v.string(),
    summary: v.optional(v.string()),
  }),
  locations: defineTable({
    userId: v.string(),
    latitude: v.float64(),
    longitude: v.float64(),
    timestamp: v.int64(),
  }),
});
