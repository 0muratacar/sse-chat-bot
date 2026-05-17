export default function HomePage() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-neutral-700">Welcome to AI Chat</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Select a chat from the sidebar or create a new one
        </p>
      </div>
    </div>
  );
}
