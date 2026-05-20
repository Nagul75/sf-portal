const express = require("express")
const sapService = require("../services/sapService")

const router = express.Router()

function sendSapResponse(res, sapResponse) {
  res.status(sapResponse.status).json(sapResponse.data)
}

router.get("/metadata", async (req, res, next) => {
  try {
    const sapResponse = await sapService.getMetadata()
    sendSapResponse(res, sapResponse)
  } catch (error) {
    next(error)
  }
})

router.post("/login", async (req, res, next) => {
  try {
    const { userid, password } = req.body

    if (!userid || !password) {
      return res.status(400).json({ message: "userid and password are required" })
    }

    const sapResponse = await sapService.login(userid, password)
    sendSapResponse(res, sapResponse)
  } catch (error) {
    next(error)
  }
})

router.get("/login", async (req, res, next) => {
  try {
    const { userid, password } = req.query

    if (!userid || !password) {
      return res.status(400).json({ message: "userid and password are required" })
    }

    const sapResponse = await sapService.login(userid, password)
    sendSapResponse(res, sapResponse)
  } catch (error) {
    next(error)
  }
})

router.get("/planned", async (req, res, next) => {
  try {
    const sapResponse = await sapService.getPlannedOrders({
      month: req.query.month,
      year: req.query.year,
    })

    sendSapResponse(res, sapResponse)
  } catch (error) {
    next(error)
  }
})

router.get("/production", async (req, res, next) => {
  try {
    const sapResponse = await sapService.getProductionOrders({
      month: req.query.month,
      year: req.query.year,
    })

    sendSapResponse(res, sapResponse)
  } catch (error) {
    next(error)
  }
})

router.get("/proxy", async (req, res, next) => {
  try {
    if (!req.query.path) {
      return res.status(400).json({ message: "path query parameter is required" })
    }

    const sapResponse = await sapService.requestSap(req.query.path)
    sendSapResponse(res, sapResponse)
  } catch (error) {
    next(error)
  }
})

module.exports = router
