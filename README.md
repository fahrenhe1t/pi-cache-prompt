# pi-cache-prompt

Injects `"cache_prompt": true` into every outgoing `/v1/chat/completions` request body sent to a llama-server endpoint. This enables KV-cache reuse so llama-server reprocesses only the new suffix instead of the full conversation history each turn.

## How it works

Uses pi's `before_provider_request` extension event — fired after the provider payload is built but before the HTTP request is sent. The handler scopes to a specific provider name (`local-qwen` by default) and adds `cache_prompt: true` at the top level of the serialized request body.

## Installation

### Option A — Global (all projects)

```bash
cp cache-prompt.ts ~/.pi/agent/extensions/cache-prompt.ts
```

### Option B — Project-local

```bash
mkdir -p .pi/extensions
cp cache-prompt.ts .pi/extensions/cache-prompt.ts
```

### Option C — From GitHub

```bash
# Global (all projects)
pi install git:github.com/fahrenhe1t/pi-cache-prompt

# Project-local
pi install -l git:github.com/fahrenhe1t/pi-cache-prompt
```

### Option D — One-off via CLI flag

```bash
pi -e /path/to/pi-cache-prompt/cache-prompt.ts
```

## Configuring your provider

You need a `local-qwen` provider registered in pi. If you don't have one yet, add it to `~/.pi/agent/models.json`:

```json
{
  "providers": {
    "local-qwen": {
      "baseUrl": "http://192.168.1.100:8080/v1",
      "apiKey": "",
      "api": "openai-completions",
      "models": [
        {
          "id": "qwen3-30b-a3b",
          "name": "Qwen3 30B A3B",
          "reasoning": true,
          "input": ["text"],
          "cost": { "input": 0, "output": 0, "cacheRead": 0, "cacheWrite": 0 },
          "contextWindow": 131072,
          "maxTokens": 8192
        }
      ]
    }
  }
}
```

> **Note:** Adjust `id`, `name`, `contextWindow`, and `maxTokens` to match your actual model. If your Qwen model supports thinking, set `"reasoning": true`. You can also use the extension-based provider registration pattern (see [pi docs](https://github.com/earendil-works/pi-mono/tree/main/packages/coding-agent/examples/extensions/custom-provider-anthropic)) if you prefer dynamic model discovery from `GET /v1/models`.

## Configuring the target provider

Set the `PI_CACHE_PROMPT_PROVIDER` environment variable to match your provider name. The default is `local-qwen`.

**Per-invocation:**

```bash
PI_CACHE_PROMPT_PROVIDER=my-provider pi
```

**Persistent (add to your shell profile, e.g., `~/.bashrc` or `~/.zshrc`):**

```bash
export PI_CACHE_PROMPT_PROVIDER="my-provider"
```

## Verifying it works

1. After sending messages, check the **CH** indicator in pi's footer. It reflects the number of tokens served from the KV cache — if the plugin is working, CH should increase on subsequent turns as llama-server reuses cached prefixes.
2. Check llama-server logs — you should see cache hit information (e.g., `n_past`, `progress`) indicating KV-cache reuse on subsequent turns.

You can also use pi's built-in [provider-payload](https://github.com/earendil-works/pi-mono/tree/main/packages/coding-agent/examples/extensions/provider-payload.ts) example extension alongside this one to log the actual request body and confirm `cache_prompt: true` is present.

## Requirements

- pi installed globally (`npm install -g @earendil-works/pi-coding-agent`)
- llama-server running with prompt caching enabled (default behavior; do **not** pass `--no-cache-prompt`)
