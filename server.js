const express = require("express");

const app = express();
const PORT = 5003;

// Middleware to parse JSON
app.use(express.json());

// Logging Middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
  next();
});

// In-memory task storage
let tasks = [
  {
    id: 1,
    title: "Learn Express",
    completed: false,
  },
  {
    id: 2,
    title: "Complete Practical 4",
    completed: false,
  },
];

// Home Route
app.get("/", (req, res) => {
  res.send("Task Manager API is running!");
});

// GET - Fetch all tasks
app.get("/tasks", (req, res) => {
  res.status(200).json(tasks);
});

// POST - Create a new task
app.post("/tasks", (req, res) => {
  const newTask = {
    id: tasks.length + 1,
    title: req.body.title,
    completed: false,
  };

  tasks.push(newTask);

  res.status(201).json(newTask);
});

// PUT - Update an existing task
app.put("/tasks/:id", (req, res) => {
  const id = parseInt(req.params.id);

  const task = tasks.find((task) => task.id === id);

  if (!task) {
    return res.status(404).json({
      message: "Task not found",
    });
  }

  task.title = req.body.title || task.title;

  if (req.body.completed !== undefined) {
    task.completed = req.body.completed;
  }

  res.status(200).json(task);
});

// DELETE - Remove a task
app.delete("/tasks/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const taskIndex = tasks.findIndex((task) => task.id === id);

  if (taskIndex === -1) {
    return res.status(404).json({
      message: "Task not found",
    });
  }

  const deletedTask = tasks.splice(taskIndex, 1);
  res.status(200).json({
    message: "Task deleted successfully",
    task: deletedTask[0],
  });
});

// Global Error Handling Middleware

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Something went wrong",
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});