// Plesk startup launcher. The actual Express application lives in server/src/index.js.
import('./server/src/index.js').catch((error) => {
  console.error('Winning EA failed to start:', error);
  process.exit(1);
});
