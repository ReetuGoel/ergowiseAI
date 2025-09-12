import React from 'react';
import { useAuth } from './auth-context';

const DEFAULT_AVATARS = [
  '/logo192.png',
  '/logo512.png',
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="24" height="24" fill="%23fb923c"/></svg>',
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="24" height="24" fill="%23ea580c"/></svg>'
];

export function AvatarPicker({ size = 36 }: { size?: number }) {
  const { user, updateUser } = useAuth();

  const setAvatar = (url: string) => {
    updateUser({ avatar: url });
  };

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      {DEFAULT_AVATARS.map((a, i) => (
        <button key={i} onClick={() => setAvatar(a)} style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer' }}>
          <img src={a} alt={`avatar-${i}`} width={size} height={size} style={{ borderRadius: '50%', border: user?.avatar === a ? '2px solid var(--color-primary)' : '2px solid transparent' }} />
        </button>
      ))}
    </div>
  );
}
