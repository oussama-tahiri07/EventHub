require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 EventHub API Server running on http://localhost:${PORT}`);
  console.log(`📑 Swagger Documentation available on http://localhost:${PORT}/api/docs`);
});
