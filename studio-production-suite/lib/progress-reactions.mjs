// The quick reactions family can tap under an update. Order is the order shown.
export const REACTIONS = ['❤️', '🙏', '😊', '💪', '🎉', '👍'];
export function validReaction(value) {
  return REACTIONS.includes(value);
}
