import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import path from "path";
import { errorHandler } from "./middleware/errorHandler.js";
import userRoutes from "./routes/userRoutes.js";


dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());
connectDB();

// Make uploads folder publicly accessible
const __dirname = path.resolve();
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(errorHandler);

app.use("/api/user", userRoutes);


app.get("/", (req, res) => {
  res.send("API is running...");
});

// Start Server
const PORT = process.env.PORT || 5003;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
