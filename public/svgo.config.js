/** @type {import('svgo').Config} */
export default {
  multipass: true,
  js2svg: { pretty: true, indent: 2 },
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          cleanupIds: {
            preserve: ['segments'],
            preservePrefixes: ['aria', 'data'],
          },
          convertPathData: { floatPrecision: 1 },
          convertTransform: { transformPrecision: 1 },
        },
      },
    },
  ],
};
