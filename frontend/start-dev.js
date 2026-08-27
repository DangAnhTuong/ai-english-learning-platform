process.env.PORT = process.env.PORT || '3005';
process.env.BROWSER = 'none';
process.env.CI = 'false';

// Prevent stdin from closing immediately in non-interactive shell
if (process.stdin.isPaused()) {
  process.stdin.resume();
}
process.stdin.removeAllListeners('end');
process.stdin.on('end', () => {});

require('react-scripts/scripts/start');
