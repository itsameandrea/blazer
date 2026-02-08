function rootPath() {
  return document.querySelector('meta[name="blazer-root-path"]').content
}

export function runQueriesPath() {
  return rootPath() + "queries/run"
}

export function cancelQueriesPath() {
  return rootPath() + "queries/cancel"
}

export function schemaQueriesPath(params) {
  return rootPath() + "queries/schema?" + new URLSearchParams(params).toString()
}

export function docsQueriesPath(params) {
  return rootPath() + "queries/docs?" + new URLSearchParams(params).toString()
}

export function tablesQueriesPath(params) {
  return rootPath() + "queries/tables?" + new URLSearchParams(params).toString()
}

export function queriesPath() {
  return rootPath() + "queries"
}

export function queryPath(id) {
  return rootPath() + "queries/" + id
}

export function dashboardPath(id) {
  return rootPath() + "dashboards/" + id
}
