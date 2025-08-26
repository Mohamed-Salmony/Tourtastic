const argon2 = require('argon2');

(async () => {
  try {
    const pwd = 'P@ssw0rd123!';
    const hash = await argon2.hash(pwd, { type: argon2.argon2id });
    console.log('HASH_OK', hash);
    const ok = await argon2.verify(hash, pwd);
    console.log('VERIFY_OK', ok);
  } catch (err) {
    console.error('ERROR', err);
    process.exit(1);
  }
})();
