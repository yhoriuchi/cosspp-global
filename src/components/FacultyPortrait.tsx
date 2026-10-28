import { useState } from 'react';
import type { Faculty } from '../types/faculty';

export function FacultyPortrait({ person, large = false }: { person: Faculty; large?: boolean }) {
  const [failedUrl, setFailedUrl] = useState<string>();
  const url = person.photo?.url;
  const initials = person.full_name
    .split(/\s+/)
    .filter(Boolean)
    .filter((_, i, names) => i === 0 || i === names.length - 1)
    .map((name) => name[0])
    .join('');
  return (
    <span className={`avatar${large ? ' avatar-large' : ''}`}>
      {url && url !== failedUrl ? (
        <img
          src={url}
          alt={`Portrait of ${person.preferred_display_name || person.full_name}`}
          width={large ? 112 : 56}
          height={large ? 112 : 56}
          loading={large ? 'eager' : 'lazy'}
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailedUrl(url)}
        />
      ) : (
        <span aria-hidden="true">{initials}</span>
      )}
    </span>
  );
}
