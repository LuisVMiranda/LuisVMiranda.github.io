const preview = process.argv.includes('--preview');
const { buildSite } = await import('./static-build.ts');
await buildSite({ preview });

export {};
