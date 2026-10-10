# Team · Live

Private, passphrase-locked board of the agent team (who owns which lane, current tasks, handoffs,
recent activity, and what's waiting on Dom). This folder holds only the page code and
`data.enc.json` (AES-GCM-256 ciphertext; key derived in the browser with PBKDF2-SHA256, 600k iterations).
No plaintext is stored here. `noindex,nofollow`.

The decrypt/unlock code is shared verbatim with `/dom-times-live/`, so the same envelope
(`v, kdf, hash, iterations, cipher, keyLength, salt, iv, ciphertext`) and the same `encrypt.mjs`
pipeline work. Nothing about the team is hardcoded in the page; it all renders from the decrypted JSON:

    { updated, title?, agents[] {id, name, role, lane, boundary, task, accent, center?},
      links[] {from, to, label}, log[] {time, agent, text}, flags[] {text, owner} }
