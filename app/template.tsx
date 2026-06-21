/** Route shell — page-level components own their entrance motion (no template fade; avoids flash on navigation). */
export default function Template({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}