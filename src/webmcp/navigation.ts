/**
 * `open_page` needs React Router's `navigate`, but tool definitions are module
 * level. The bridge component publishes the current navigate function here and
 * clears it on unmount, so a tool call degrades to a normal page load instead of
 * doing nothing.
 */
type NavigateFn = (path: string) => void;

let navigate: NavigateFn | null = null;

export function setWebMcpNavigator(next: NavigateFn | null): void {
  navigate = next;
}

export function webMcpNavigate(path: string): void {
  if (navigate) {
    navigate(path);
    return;
  }
  if (typeof window !== "undefined") window.location.assign(path);
}
