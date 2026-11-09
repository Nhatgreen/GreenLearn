/**
 * Phát hiện môi trường Discord Embedded App Activity
 * Dựa trên sự hiện diện của tham số query `frame_id` được Discord client truyền vào iframe
 */
export function isDiscordActivity(search?: string): boolean {
  if (typeof search === 'string') {
    return new URLSearchParams(search).has('frame_id');
  }
  if (typeof window !== 'undefined' && window.location) {
    return new URLSearchParams(window.location.search).has('frame_id');
  }
  return false;
}
