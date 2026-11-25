import { renderToString } from 'vue/server-renderer'
import { createTableRequest, type TableSsrRequest } from './table-ssr'

export async function renderTable(request: TableSsrRequest) {
  if (typeof document !== 'undefined')
    throw new Error('SSR requires a real server environment.')
  const session = await createTableRequest(request)
  try {
    const context: { teleports?: Record<string, string> } = {}
    const html = await renderToString(session.app, context)
    return {
      html,
      teleports: context.teleports ?? {},
      errors: session.errors,
      state: session.snapshot(),
    }
  } finally {
    session.dispose()
  }
}
