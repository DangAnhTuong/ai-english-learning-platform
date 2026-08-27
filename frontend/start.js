process.env.PORT = '3005';
process.env.BROWSER = 'none';
process.env.WDS_SOCKET_PORT = '3005';
process.env.FAST_REFRESH = 'true';
process.env.DISABLE_ESLINT_PLUGIN = 'true';

// Prevent process from exiting when stdin closes in non-interactive background task
process.stdin.resume();
const origOn = process.stdin.on.bind(process.stdin);
process.stdin.on = function(event, listener) {
  if (event === 'end') {
    // Ignore end event from react-scripts to keep server running
    return process.stdin;
  }
  return origOn(event, listener);
};

require('react-scripts/scripts/start');
