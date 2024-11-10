import { z } from 'zod';

const ProfileSchema = z.object({
    name: z.string(),
    url: z.string().url(),
    long_name: z.string(),
    img: z.string().url(),
});

const MetaUrlSchema = z.object({
    scheme: z.string(),
    netloc: z.string(),
    hostname: z.string(),
    favicon: z.string().url(),
    path: z.string().optional(), // `path` may be optional
});

const ThumbnailSchema = z.object({
    src: z.string().url(),
    original: z.string().url(),
    logo: z.boolean(),
});

const ClusterSchema = z.object({
    title: z.string(),
    url: z.string().url(),
    is_source_local: z.boolean(),
    is_source_both: z.boolean(),
    description: z.string(),
    family_friendly: z.boolean(),
});

const SearchResultSchema = z.object({
    title: z.string(),
    url: z.string().url(),
    is_source_local: z.boolean(),
    is_source_both: z.boolean(),
    description: z.string(),
    page_age: z.string().optional(), // Assuming ISO date format, make optional if not always present
    profile: ProfileSchema,
    language: z.string(),
    family_friendly: z.boolean(),
    type: z.literal("search_result"),
    subtype: z.string(),
    meta_url: MetaUrlSchema,
    thumbnail: ThumbnailSchema.optional(), // Not all results may have a thumbnail
    age: z.string().optional(), // Optional for results without explicit age
    cluster_type: z.string().optional(), // Optional for entries without clustering
    cluster: z.array(ClusterSchema).optional(), // Optional if there are no clustered results
});

const WebSchema = z.object({
    type: z.literal("search"),
    results: z.array(SearchResultSchema),
    family_friendly: z.boolean(),
});

export const WebSearchResultSchema = z.object({
    query: z.object({}).optional(),
    mixed: z.object({}).optional(),
    type: z.string(),
    videos: z.object({}).optional(),
    web: WebSchema,
});

export type WebSearchResults = z.infer<typeof WebSearchResultSchema>;
