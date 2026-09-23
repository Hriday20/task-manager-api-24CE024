const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const Task = require("./models/Task");
const authRoutes = require("./routes/auth");
const authMiddleware = require("./middleware/auth");
const validateTask = require("./middleware/validateTask");
const cache = require("./cache");

const app = express();
const PORT = process.env.PORT || 5003;

// Middleware
app.use(express.json());
app.use(cors());

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");
  })
  .catch((err) => {
    console.error("MongoDB Connection Error:", err);
  });

// Logging Middleware
app.use((req, res, next) => {
  console.log(
    `${req.method} ${req.url} - ${new Date().toISOString()}`
  );
  next();
});

// Public Authentication Routes
app.use("/auth", authRoutes);

// Home Route
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Task Manager API is running!",
  });
});

// =========================
// PROTECTED TASK ROUTES
// =========================

// GET All Tasks
app.get("/tasks", authMiddleware, async (req, res, next) => {
  try {
    const cachedTasks = cache.get("all_tasks");

    if (cachedTasks !== undefined) {
      console.log("Cache HIT: all_tasks");
      return res.status(200).json(cachedTasks);
    }

    console.log("Cache MISS: all_tasks");

    const tasks = await Task.find();

    cache.set("all_tasks", tasks);

    res.status(200).json(tasks);
  } catch (err) {
    next(err);
  }
});

// GET Task By ID
app.get("/tasks/:id", authMiddleware, async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    res.status(200).json(task);
  } catch (err) {
    next(err);
  }
});

// POST Task
// Authentication → Validation → Database
app.post(
  "/tasks",
  authMiddleware,
  validateTask,
  async (req, res, next) => {
    try {
      const newTask = await Task.create(req.body);

      // Invalidate cached task list after successful write
      cache.del("all_tasks");

      res.status(201).json(newTask);
    } catch (err) {
      next(err);
    }
  }
);

// PUT Task
app.put("/tasks/:id", authMiddleware, async (req, res, next) => {
  try {
    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedTask) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    // Invalidate cached task list after successful write
    cache.del("all_tasks");

    res.status(200).json(updatedTask);
  } catch (err) {
    next(err);
  }
});

// DELETE Task
app.delete(
  "/tasks/:id",
  authMiddleware,
  async (req, res, next) => {
    try {
      const deletedTask = await Task.findByIdAndDelete(
        req.params.id
      );

      if (!deletedTask) {
        return res.status(404).json({
          message: "Task not found",
        });
      }

      // Invalidate cached task list after successful write
      cache.del("all_tasks");

      res.status(200).json({
        message: "Task deleted successfully",
      });
    } catch (err) {
      next(err);
    }
  }
);

// =========================
// 404 HANDLER
// =========================

app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
  });
});

// =========================
// GLOBAL ERROR HANDLER
// =========================

app.use((err, req, res, next) => {
  console.error(err);

  // Mongoose validation error
  if (err.name === "ValidationError") {
    return res.status(400).json({
      error: "Validation failed",
      details: Object.values(err.errors).map(
        (error) => error.message
      ),
    });
  }

  // MongoDB duplicate key error
  if (err.code === 11000) {
    return res.status(409).json({
      error: "Duplicate value",
      message: "A user with this email already exists",
    });
  }

  // Invalid MongoDB ObjectId
  if (err.name === "CastError") {
    return res.status(400).json({
      error: "Invalid task ID",
    });
  }

  // Unexpected server error
  res.status(500).json({
    error: "Something went wrong",
  });
});

// =========================
// START SERVER
// =========================

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});