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
  banner: {
    // Fix for __dirname / __filename in ESM bundles
    js: `import { createRequire } from 'module'; const require = createRequire(import.meta.url);`,
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
