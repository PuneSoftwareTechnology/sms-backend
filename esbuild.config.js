import { build } from 'esbuild';

const shared = {
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  minify: true,
  sourcemap: true,
  external: [
    // AWS SDK v3 is included in Lambda runtime — no need to bundle
    '@aws-sdk/*',
  ],
  alias: {
    // Use standalone build which embeds font data inline instead of reading .afm
    // files from disk via __dirname (which breaks in bundled ESM on Lambda)
    pdfkit: 'pdfkit/js/pdfkit.standalone.js',
  },
  banner: {
    // Fix for __dirname / __filename in ESM bundles
    js: `import { createRequire } from 'module'; import { fileURLToPath as __esm_fileURLToPath } from 'url'; import { dirname as __esm_dirname } from 'path'; const require = createRequire(import.meta.url); const __filename = __esm_fileURLToPath(import.meta.url); const __dirname = __esm_dirname(__filename);`,
  },
};

// API Lambda (Express app)
await build({
  ...shared,
  entryPoints: ['src/lambda.js'],
  outfile: 'dist/lambda.mjs',
});

// Cron Lambda (EventBridge handler)
await build({
  ...shared,
  entryPoints: ['src/cron/handler.js'],
  outfile: 'dist/cron.mjs',
});

console.log('Build complete: dist/lambda.mjs + dist/cron.mjs');
