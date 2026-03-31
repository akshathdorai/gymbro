export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-full flex items-center justify-center p-4 pt-safe pb-safe">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gradient">GymBro</h1>
          <p className="text-sm text-[var(--color-muted)] mt-1">Your AI Personal Trainer</p>
        </div>
        {children}
      </div>
    </div>
  );
}
