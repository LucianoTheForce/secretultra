import {
  pgTable,
  text,
  timestamp,
  boolean,
  index,
  integer,
  jsonb,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified"),
  image: text("image"),
  credits: integer("credits").notNull().default(30),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

export const generatedImages = pgTable(
  "generated_image",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    prompt: text("prompt").notNull(),
    description: text("description"),
    imagePath: text("image_path").notNull(),
    videoUrl: text("video_url"),
    model: text("model").notNull(),
    aspectRatio: text("aspect_ratio"),
    seed: text("seed"),
    imageKitFileId: text("image_kit_file_id"),
    shareUrl: text("share_url"),
    backgroundRemovedUrl: text("background_removed_url"),
    previewUrl: text("preview_url"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("generated_image_user_idx").on(table.userId),
    createdAtIdx: index("generated_image_created_at_idx").on(table.createdAt),
  }),
);

export const promptHistory = pgTable(
  "prompt_history",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    prompt: text("prompt").notNull(),
    source: text("source").notNull().default("shared"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    lastUsedAt: timestamp("last_used_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("prompt_history_user_idx").on(table.userId),
    lastUsedIdx: index("prompt_history_last_used_idx").on(table.lastUsedAt),
    uniquePrompt: uniqueIndex("prompt_history_user_prompt_idx").on(
      table.userId,
      table.prompt,
    ),
  }),
);

export const storyRuns = pgTable(
  "story_run",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    basePrompt: text("base_prompt").notNull(),
    enhancedPrompt: text("enhanced_prompt"),
    title: text("title"),
    summary: text("summary"),
    enhancerModel: text("enhancer_model"),
    sceneCount: integer("scene_count").notNull(),
    status: text("status").notNull().default("pending"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("story_run_user_idx").on(table.userId),
    createdIdx: index("story_run_created_idx").on(table.createdAt),
  }),
);

export const storyFrames = pgTable(
  "story_frame",
  {
    id: text("id").primaryKey(),
    storyRunId: text("story_run_id")
      .notNull()
      .references(() => storyRuns.id, { onDelete: "cascade" }),
    sceneIndex: integer("scene_index").notNull(),
    title: text("title"),
    copy: text("copy"),
    visualPrompt: text("visual_prompt").notNull(),
    summary: text("summary"),
    generatedImageId: text("generated_image_id").references(
      () => generatedImages.id,
      { onDelete: "set null" },
    ),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    storyIdx: index("story_frame_story_idx").on(table.storyRunId),
    sceneIdx: index("story_frame_story_scene_idx").on(
      table.storyRunId,
      table.sceneIndex,
    ),
  }),
);

export const storyFlows = pgTable(
  "story_flow",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    ownerEmail: text("owner_email").notNull(),
    blueprint: jsonb("blueprint").notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    ownerIdx: index("story_flow_owner_idx").on(table.ownerEmail),
  }),
);
