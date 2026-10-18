import { defineCloudflareConfig } from "@opennextjs/cloudflare";

/*
 * The Showcase has no ISR, data cache or revalidation queue: every route is
 * request-rendered because locale comes from middleware and `next/headers`.
 * The adapter's default in-memory/dummy cache is therefore sufficient, and the
 * deployment needs no R2 bucket, D1 database or other paid resource.
 */
export default defineCloudflareConfig({});
