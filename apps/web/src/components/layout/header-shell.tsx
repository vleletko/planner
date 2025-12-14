import type { ReactNode } from "react";

type HeaderShellProps = {
  children: ReactNode;
};

export function HeaderShell({ children }: HeaderShellProps) {
  return (
    <header className="fixed top-0 right-0 left-0 z-50 border-b bg-background">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-6 px-6">
        {children}
      </div>
    </header>
  );
}
