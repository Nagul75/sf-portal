const path = require("path")
const dotenv = require("dotenv")

dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
  quiet: true,
})

const sapConfig = {
  baseUrl:
    process.env.SAP_BASE_URL ||
    "http://AZKTLDS5CP.kcloud.com:8000/sap/opu/odata/SAP/ZGW_SF_PORTAL_902109_SRV/",
  username: process.env.SAP_USERNAME,
  password: process.env.SAP_PASSWORD,
  timeoutMs: Number(process.env.SAP_TIMEOUT_MS || 30000),
}

module.exports = sapConfig
