import type { ComponentProps } from 'react';
import { navigate } from '../utils/navigation';
export function Link({ href = '', onClick, ...props }: ComponentProps<'a'>) {
  return (
    <a
      {...props}
      href={href}
      onClick={(e) => {
        onClick?.(e);
        if (
          !e.defaultPrevented &&
          href.startsWith('?') &&
          !e.metaKey &&
          !e.ctrlKey &&
          !e.shiftKey &&
          !e.altKey &&
          e.button === 0
        ) {
          e.preventDefault();
          navigate(href);
        }
      }}
    />
  );
}
