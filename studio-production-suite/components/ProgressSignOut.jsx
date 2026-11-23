'use client';

import styles from '../app/progress/progress.module.css';

export default function ProgressSignOut({ name }) {
  async function signOut() {
    await fetch('/api/progress/auth/signout', { method: 'POST' }).catch(() => {});
    window.location.replace('/progress');
  }
  return (
    <p className={styles.who}>Signed in as <strong>{name}</strong> · <button type="button" className={styles.linkButton} onClick={signOut}>Sign out</button></p>
  );
}
