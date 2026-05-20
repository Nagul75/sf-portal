const express = require("express")
const path = require("path")
const sapRoutes = require("./routes/sapRoutes")

const app = express()
const port = process.env.PORT || 3000

app.use(express.json())
app.use("/portal", express.static(path.join(__dirname, "../../frontend/webapp")))

app.get("/", (req, res) => {
  res.json({
    message: "SF portal backend is running",
    endpoints: {
      health: "/health",
      sap: "/api/sap",
    },
  })
})

app.get("/health", (req, res) => {
  res.json({ status: "ok" })
})

app.use("/api/sap", sapRoutes)

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500

  res.status(statusCode).json({
    message: err.message || "Internal server error",
    details: err.details,
  })
})

app.listen(port, () => {
  console.log(`SF portal backend is running on port ${port}`)
})
