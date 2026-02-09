import { runQueriesPath, cancelQueriesPath } from "blazer/utilities/routes"

let pendingQueries = []
let runningQueries = []
const maxQueries = 3

function uuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0
    const v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

function csrfProtect(payload) {
  const paramNode = document.querySelector("meta[name=csrf-param]")
  const tokenNode = document.querySelector("meta[name=csrf-token]")
  const param = paramNode && paramNode.getAttribute("content")
  const token = tokenNode && tokenNode.getAttribute("content")
  if (param && token) payload[param] = token
  return payload
}

function appendToFormData(formData, key, value) {
  if (value !== null && typeof value === "object" && !(value instanceof File)) {
    Object.keys(value).forEach(function (subKey) {
      appendToFormData(formData, key + "[" + subKey + "]", value[subKey])
    })
  } else {
    formData.append(key, value)
  }
}

function runNext() {
  if (runningQueries.length < maxQueries) {
    const query = pendingQueries.shift()
    if (query) {
      runningQueries.push(query)
      runQueryHelper(query)
      runNext()
    }
  }
}

function queryComplete(query) {
  const index = runningQueries.indexOf(query)
  if (index > -1) runningQueries.splice(index, 1)
  runNext()
}

function cancelServerQuery(query) {
  const path = cancelQueriesPath()
  const data = { run_id: query.run_id, data_source: query.data_source }
  if (navigator.sendBeacon) {
    const formdata = new FormData()
    const params = csrfProtect(data)
    for (const key in params) {
      if (Object.prototype.hasOwnProperty.call(params, key)) {
        formdata.append(key, params[key])
      }
    }
    navigator.sendBeacon(path, formdata)
  } else {
    fetch(path, {
      method: "POST",
      body: new URLSearchParams(csrfProtect(data)),
      credentials: "same-origin",
      keepalive: true,
    })
  }
}

function runQueryHelper(query) {
  const controller = new AbortController()
  const formData = new FormData()

  Object.keys(query.data).forEach(function (key) {
    appendToFormData(formData, key, query.data[key])
  })

  const csrf = csrfProtect({})
  Object.keys(csrf).forEach(function (key) {
    formData.append(key, csrf[key])
  })

  query.controller = controller

  fetch(runQueriesPath(), {
    method: "POST",
    body: formData,
    credentials: "same-origin",
    signal: controller.signal,
  })
    .then(function (response) {
      if (!response.ok) throw new Error("Request failed")
      return response.text()
    })
    .then(function (d) {
      if (d[0] === "{") {
        const parsed = JSON.parse(d)
        query.data.blazer = parsed
        setTimeout(function () {
          if (!query.canceled) runQueryHelper(query)
        }, 1000)
      } else {
        if (!query.canceled) query.success(d)
        queryComplete(query)
      }
    })
    .catch(function (err) {
      if (query.canceled || err.name === "AbortError") {
        cancelServerQuery(query)
      } else {
        query.error(err.message || "An error occurred")
      }
      queryComplete(query)
    })
}

export function runQuery(data, success, error) {
  if (!data.data_source) {
    throw new Error("Data source is required to cancel queries")
  }
  data.run_id = uuid()
  const query = {
    data: data,
    success: success,
    error: error,
    run_id: data.run_id,
    data_source: data.data_source,
    canceled: false,
  }
  pendingQueries.push(query)
  runNext()
  return query
}

export function cancelQuery(query) {
  query.canceled = true
  if (query.controller) query.controller.abort()
}

export function cancelAllQueries() {
  pendingQueries = []
  for (let i = 0; i < runningQueries.length; i++) {
    cancelQuery(runningQueries[i])
  }
}

window.addEventListener("unload", cancelAllQueries)
