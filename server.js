const express = require("express");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 3000;

// تشغيل ملفات HTML و CSS و JavaScript والصور
app.use(express.static(path.join(__dirname, "public")));

// الصفحة الرئيسية
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "home.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});