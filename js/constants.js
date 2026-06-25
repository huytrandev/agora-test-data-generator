// Shared sentinels used across modules.

// Marks a field whose value is rich HTML (rendered as a preview, not escaped text).
export const HTML_KIND = 'html'

// Marks a field whose value is a name seed rendered as a downloadable avatar image.
export const AVATAR_KIND = 'avatar'

// Marks a field whose value is a chat transcript: rendered as bubbles, each copyable.
export const CHAT_KIND = 'chat'
