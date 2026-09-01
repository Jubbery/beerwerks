/**
 * Generate the OWNER_PASSWORD_HASH value.
 *
 *   npm run hash-password -- 'the password'
 *
 * The password itself is never stored anywhere — only the hash.
 *
 * Two forms are printed because they go to different places. Vercel's
 * environment-variable UI stores values literally, so the raw hash is correct
 * there. A .env file does NOT: dotenv treats `$name` as a variable reference
 * and expands it away, even inside quotes — and an argon2 hash is full of
 * dollar signs. Unescaped, the hash silently arrives as fragments and every
 * sign-in fails with "that password does not match" while the password is
 * perfectly correct.
 */
import { hash } from '@node-rs/argon2';

const password = process.argv[2];

if (!password) {
  console.error("Usage: npm run hash-password -- 'the password'");
  process.exit(1);
}

if (password.length < 12) {
  console.error(
    `Refusing: that password is ${password.length} characters. Use at least 12 — ` +
      'this is the only credential guarding the dashboard.',
  );
  process.exit(1);
}

// argon2id, the OWASP-recommended variant. Defaults from @node-rs/argon2.
const digest = await hash(password, { algorithm: 2 });

console.log('\nFor Vercel (paste the value as-is):\n');
console.log(digest);
console.log('\nFor a local .env file (dollar signs escaped — paste the whole line):\n');
console.log(`OWNER_PASSWORD_HASH=${digest.replaceAll('$', '\\$')}`);
console.log();
