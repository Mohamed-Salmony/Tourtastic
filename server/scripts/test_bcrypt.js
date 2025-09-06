const bcrypt = require('bcryptjs');

(async () => {
  try {
    const pwd = 'P@ssw0rd123!';
    const saltRounds = 12;
    const hash = await bcrypt.hash(pwd, saltRounds);
    console.log('HASH_OK', hash);
    const ok = await bcrypt.compare(pwd, hash);
    console.log('VERIFY_OK', ok);
  } catch (err) {
    console.error('ERROR', err);
    process.exit(1);
  }
})();
