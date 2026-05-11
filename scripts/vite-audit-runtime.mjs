import {
  createServer,
  createServerModuleRunnerTransport,
} from 'vite';
import {
  ESModulesEvaluator,
  ModuleRunner,
  createNodeImportMeta,
} from 'vite/module-runner';

const AUDIT_MODULE_TIMEOUT_MS = 300000;

export async function withViteAuditRuntime(callback) {
  const viteServer = await createServer({
    logLevel: 'silent',
    server: { middlewareMode: true },
    appType: 'custom',
  });
  let runner = null;

  try {
    const transport = createServerModuleRunnerTransport({
      channel: viteServer.environments.ssr.hot,
    });
    transport.timeout = AUDIT_MODULE_TIMEOUT_MS;

    runner = new ModuleRunner(
      {
        transport,
        hmr: false,
        createImportMeta: createNodeImportMeta,
        sourcemapInterceptor: false,
      },
      new ESModulesEvaluator(),
    );

    return await callback({
      importModule: (moduleId) => runner.import(moduleId),
    });
  } finally {
    await runner?.close();
    await viteServer.close();
  }
}
