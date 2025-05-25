import { defineConfig } from 'rollup';
import cjsPlugin from '@rollup/plugin-commonjs';
import reslovePlugin from '@rollup/plugin-node-resolve';
import replacePlugin from '@rollup/plugin-replace';
import tsPlugin from '@rollup/plugin-typescript';
import esbuildPlugin from 'rollup-plugin-esbuild';
import livereloadPlugin from 'rollup-plugin-livereload';
import servePlugin from 'rollup-plugin-serve';
import css from 'rollup-plugin-import-css';

const input = {
  index: './src/features/index.ts',
};
const outputFormat = 'module';

// Parse CLI arguments to get port (--port=XXXX)
function parsePortArg() {
  const args = process.argv.slice(2);
  const portArg = args.find((arg) => arg.startsWith('--port='));
  const port = portArg ? parseInt(portArg.split('=')[1], 10) : 3002;
  return { port: Number.isNaN(port) ? 3002 : port };
}

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
};

const { port } = parsePortArg();
const isDev = process.env.ROLLUP_WATCH === 'true' || process.argv.includes('--watch');

// Custom plugin to log URLs after build in dev mode
const urlLoggerPlugin = (input) => {
  return {
    name: 'url-logger',
    generateBundle() {
      if (isDev) {
        const serverUrl = `http://localhost:${port}`;
        console.log(
          `\n${colors.bright}${colors.green}✨ Development server started:${colors.reset}\n`
        );
        console.log(`${colors.cyan}🔗 Server URL: ${colors.bright}${serverUrl}${colors.reset}`);

        // Dynamically log URLs for each entry point
        console.log(`\n${colors.bright}📄 Entry points:${colors.reset}`);
        const entryPoints = typeof input === 'object' ? Object.keys(input) : ['index'];

        // Calculate column widths for proper alignment
        const urlWidth =
          Math.max(
            ...entryPoints.map((entry) => `${serverUrl}/${entry}.js`.length),
            'Direct URL'.length
          ) + 2;
        const tagWidth =
          Math.max(
            ...entryPoints.map(
              (entry) => `<script type="module" src="${serverUrl}/${entry}.js"></script>`.length
            ),
            'Import Suggestion'.length
          ) + 2;

        // Header with padding for alignment
        const header = `${colors.bright}${colors.yellow}${'Direct URL'.padEnd(urlWidth)}${
          colors.reset
        }│${colors.bright}${colors.yellow}${'Import Suggestion'.padEnd(tagWidth)}${colors.reset}`;
        const separator = `${'─'.repeat(urlWidth)}┼${'─'.repeat(tagWidth)}`;

        console.log(`\n┌${'─'.repeat(urlWidth)}┬${'─'.repeat(tagWidth)}┐`);
        console.log(`│${header}│`);
        console.log(`├${separator}┤`);

        // Add each entry point as a table row with proper padding
        entryPoints.forEach((entry, index) => {
          const directUrl = `${serverUrl}/${entry}.js`;
          const scriptTag = `<script type="module" src="${serverUrl}/${entry}.js"></script>`;

          console.log(
            `│${colors.blue}${directUrl.padEnd(urlWidth)}${colors.reset}│${
              colors.magenta
            }${scriptTag.padEnd(tagWidth)}${colors.reset}│`
          );

          // Add a separator between entries (but not after the last one)
          if (index < entryPoints.length - 1) {
            console.log(`├${'─'.repeat(urlWidth)}┼${'─'.repeat(tagWidth)}┤`);
          }
        });

        console.log(`└${'─'.repeat(urlWidth)}┴${'─'.repeat(tagWidth)}┘`);
        console.log(
          `\n${colors.bright}Copy and paste the script tag(s) to include in your HTML.${colors.reset}`
        );
      }
    },
  };
};

export default defineConfig({
  input,
  output: {
    format: outputFormat,
    dir: 'dist',
    manualChunks: {},
    chunkFileNames(chunkInfo) {
      return `chunks/${chunkInfo.name}.js`;
    },
  },
  plugins: [
    css({ minify: !isDev }),
    replacePlugin({
      preventAssignment: true,
      'process.env.NODE_ENV': JSON.stringify(isDev ? 'development' : 'production'),
    }),
    cjsPlugin(),
    tsPlugin(),
    reslovePlugin(),
    esbuildPlugin({
      minify: !isDev,
      target: 'es2020',
      platform: 'browser',
      sourceMap: isDev,
    }),
    // Only serve and enable livereload in dev mode
    ...(isDev
      ? [
          servePlugin({
            contentBase: 'dist',
            port: port,
            headers: {
              'Access-Control-Allow-Origin': '*',
            },
          }),
          livereloadPlugin({ watch: 'dist', inject: false, verbose: true }),
          urlLoggerPlugin(input),
        ]
      : []),
  ],
});
