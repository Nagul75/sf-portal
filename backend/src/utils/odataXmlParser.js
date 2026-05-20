const { XMLParser } = require("fast-xml-parser")

const parser = new XMLParser({
  attributeNamePrefix: "",
  ignoreAttributes: false,
  removeNSPrefix: true,
  parseAttributeValue: false,
  parseTagValue: false,
  textNodeName: "value",
  trimValues: true,
})

function asArray(value) {
  if (value === undefined || value === null) {
    return []
  }

  return Array.isArray(value) ? value : [value]
}

function getText(value) {
  if (value === undefined || value === null) {
    return null
  }

  if (typeof value === "object" && Object.prototype.hasOwnProperty.call(value, "value")) {
    return value.value
  }

  return value
}

function normalizeProperties(properties = {}) {
  return Object.entries(properties).reduce((result, [key, value]) => {
    result[key] = getText(value) ?? ""
    return result
  }, {})
}

function parseEntry(entry = {}) {
  return {
    id: getText(entry.id),
    title: getText(entry.title),
    updated: getText(entry.updated),
    category: entry.category || null,
    links: asArray(entry.link),
    properties: normalizeProperties(entry.content?.properties),
  }
}

function parseODataError(xml) {
  try {
    const parsed = parser.parse(xml)
    const error = parsed.error || {}

    return {
      code: getText(error.code),
      message: getText(error.message),
      timestamp: getText(error.timestamp),
    }
  } catch (error) {
    return xml
  }
}

function parseMetadata(xml) {
  const parsed = parser.parse(xml)
  const schemas = asArray(parsed.Edmx?.DataServices?.Schema)
  const entitySets = schemas.flatMap((schema) => asArray(schema.EntityContainer?.EntitySet))

  return {
    entitySets,
    raw: parsed,
  }
}

function parseODataXml(xml) {
  const parsed = parser.parse(xml)

  if (parsed.Edmx) {
    return parseMetadata(xml)
  }

  const feed = parsed.feed || {}
  const entries = asArray(feed.entry).map(parseEntry)

  return {
    id: getText(feed.id),
    title: getText(feed.title),
    updated: getText(feed.updated),
    count: entries.length,
    results: entries.map((entry) => entry.properties),
  }
}

module.exports = {
  parseODataError,
  parseODataXml,
}
