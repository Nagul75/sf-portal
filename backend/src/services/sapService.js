const sapConfig = require("../config/sapConfig")
const { parseODataError, parseODataXml } = require("../utils/odataXmlParser")

function trimSlashes(value) {
  return String(value || "").replace(/^\/+|\/+$/g, "")
}

function joinUrl(baseUrl, path) {
  const requestedPath = String(path || "")

  if (/^https?:\/\//i.test(requestedPath)) {
    return requestedPath
  }

  const base = new URL(baseUrl)

  if (requestedPath.startsWith("/")) {
    return `${base.origin}/${trimSlashes(requestedPath)}`
  }

  return `${String(baseUrl).replace(/\/+$/g, "")}/${trimSlashes(requestedPath)}`
}

function createODataFilter(filters = {}) {
  return Object.entries(filters)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([key, value]) => `${key} eq '${String(value).replace(/'/g, "''")}'`)
    .join(" and ")
}

function appendQuery(path, params = {}) {
  const queryParts = []

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      const encodedKey = encodeURIComponent(key).replace(/^%24/, "$")
      const encodedValue = encodeURIComponent(value).replace(/%27/g, "'")
      queryParts.push(`${encodedKey}=${encodedValue}`)
    }
  })

  const queryString = queryParts.join("&")

  return queryString ? `${path}?${queryString}` : path
}

function redactSapUrl(url) {
  return url.replace(/(Password%20eq%20')([^']*)(')/i, "$1***$3")
}

function getAuthHeader() {
  if (!sapConfig.username || !sapConfig.password) {
    return undefined
  }

  const token = Buffer.from(`${sapConfig.username}:${sapConfig.password}`).toString("base64")
  return `Basic ${token}`
}

async function requestSap(path, options = {}) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), sapConfig.timeoutMs)

  try {
    const authHeader = getAuthHeader()
    const sapUrl = joinUrl(sapConfig.baseUrl, path)
    const response = await fetch(sapUrl, {
      method: options.method || "GET",
      headers: {
        Accept: options.accept || "application/xml",
        ...(authHeader ? { Authorization: authHeader } : {}),
        ...(options.headers || {}),
      },
      body: options.body,
      signal: controller.signal,
    })

    const xml = await response.text()

    if (!response.ok) {
      const error = new Error("SAP service request failed")
      error.statusCode = response.status
      error.details = {
        sapUrl: redactSapUrl(sapUrl),
        sapError: parseODataError(xml),
      }
      throw error
    }

    return {
      status: response.status,
      data: parseODataXml(xml),
    }
  } catch (error) {
    if (error.name === "AbortError") {
      const timeoutError = new Error("SAP service request timed out")
      timeoutError.statusCode = 504
      throw timeoutError
    }

    throw error
  } finally {
    clearTimeout(timeout)
  }
}

function getMetadata() {
  return requestSap("$metadata")
}

function login(userid, password) {
  const filter = createODataFilter({ Userid: userid, Password: password })

  return requestSap(appendQuery("LoginSet", { $filter: filter }))
}

function getPlannedOrders(filters = {}) {
  const filter = createODataFilter({
    MonthFilter: filters.month,
    YearFilter: filters.year,
  })
  const params = filter ? { $filter: filter } : {}

  return requestSap(appendQuery("PlannedSet", params))
}

function getProductionOrders(filters = {}) {
  const filter = createODataFilter({
    MonthFilter: filters.month,
    YearFilter: filters.year,
  })
  const params = filter ? { $filter: filter } : {}

  return requestSap(appendQuery("ProductionSet", params))
}

module.exports = {
  requestSap,
  getMetadata,
  login,
  getPlannedOrders,
  getProductionOrders,
}
