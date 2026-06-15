import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

/**
 * Injects `cache_prompt: true` into every outgoing provider request body
 * for a specific provider name (default: "local-qwen").
 *
 * This enables llama-server KV cache reuse so repeated prefixes are not
 * re-tokenized on every turn.
 */
export default function (pi: ExtensionAPI) {
  // Change this to match your provider name in models.json or registerProvider().
  const TARGET_PROVIDER = "local-qwen";

  pi.on("before_provider_request", (event, ctx) => {
    // Only touch requests from the target provider.
    if (ctx.model?.provider !== TARGET_PROVIDER) return;

    const payload = event.payload as Record<string, unknown>;

    // `cache_prompt` is a llama-server-specific top-level field on the
    // /v1/chat/completions request body.  Setting it to true tells the
    // server to reuse KV-cache slots for matching prefixes.
    if (payload.cache_prompt !== true) {
      return { ...payload, cache_prompt: true };
    }
  });
}
