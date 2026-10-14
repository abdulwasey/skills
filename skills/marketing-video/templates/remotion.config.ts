// Remotion config for rendering an app's real components. Copy into the video project's root and
// edit APP and the alias table. See stubbing.md for Tauri, Electron, fetch and API-client patterns.
import path from 'node:path';
import { Config } from '@remotion/cli/config';

const here = (p: string) => path.resolve(process.cwd(), p);
const nm = (p: string) => here(`node_modules/${p}`);
const APP = here('../my-app'); // the app repo, checked out next to this one (only its source is read)

Config.setVideoImageFormat('png'); // lossless frames: UI text and flat colours stay crisp
Config.setConcurrency(4);

Config.overrideWebpackConfig((config) => {
  // `import css from '.../styles.css?raw'` yields the stylesheet as a string for <LiveApp css>.
  const rules = (config.module?.rules ?? []).map((rule) =>
    rule && typeof rule === 'object' && rule.test instanceof RegExp && rule.test.test('x.css')
      ? { ...rule, resourceQuery: { not: [/raw/] } }
      : rule,
  );
  return {
    ...config,
    module: { ...config.module, rules: [{ resourceQuery: /raw/, type: 'asset/source' }, ...rules] },
    resolve: {
      ...config.resolve,
      alias: {
        ...(config.resolve?.alias ?? {}),
        // One copy of React (and of the UI kit) for the app and the video, or hooks break.
        react: nm('react'),
        'react-dom': nm('react-dom'),
        // Platform/API modules the app imports -> stubs that answer from scripted data.
        '@tauri-apps/api/core': here('src/stubs/tauri-core.ts'),
        // '@tauri-apps/api/event': here('src/stubs/tauri-event.ts'),
        // electron: here('src/stubs/electron.ts'),
        // [path.join(APP, 'src/api/client')]: here('src/stubs/api-client.ts'),
        '@app': path.join(APP, 'src'),
      },
    },
  };
});
