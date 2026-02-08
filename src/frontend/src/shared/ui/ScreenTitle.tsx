import { type ReactNode } from 'react';

interface ScreenTitleProps {
  children: ReactNode;
}

export function ScreenTitle({ children }: ScreenTitleProps) {
  return (
    <h2 className="text-2xl font-bold tracking-tight text-primary">
      {children}
    </h2>
  );
}
