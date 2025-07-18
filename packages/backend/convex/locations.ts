/* eslint-disable */
// biome-ignore file
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Save or update the user's latest location.
 */
export const saveLocation = mutation({
  args: {
    latitude: v.float64(),
    longitude: v.float64(),
    timestamp: v.int64(),
  },
  handler: async (ctx, args) => {
    const userId = (await ctx.auth.getUserIdentity())?.subject;
    if (!userId) throw new Error("User not authenticated");
    // Upsert: remove previous location for this user
    const existing = await ctx.db
      .query("locations")
      .filter((q) => q.eq(q.field("userId"), userId))
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
    }
    await ctx.db.insert("locations", {
      userId,
      latitude: args.latitude,
      longitude: args.longitude,
      timestamp: args.timestamp,
    });
    return { success: true };
  },
});

/**
 * Fetch the latest location for a user.
 */
export const getLocation = query({
  args: {},
  handler: async (ctx) => {
    const userId = (await ctx.auth.getUserIdentity())?.subject;
    if (!userId) return null;
    const location = await ctx.db
      .query("locations")
      .filter((q) => q.eq(q.field("userId"), userId))
      .unique();
    return location;
  },
}); 