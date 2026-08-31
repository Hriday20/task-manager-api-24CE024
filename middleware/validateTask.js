const validateTask = (req, res, next) => {
  const { title, description, priority } = req.body;

  const errors = [];

  // Rule 1: Title is required
  if (!title || typeof title !== "string" || title.trim() === "") {
    errors.push("Title is required");
  }

  // Rule 2: Title length
  if (title && typeof title === "string" && title.trim().length > 100) {
    errors.push("Title must not exceed 100 characters");
  }

  // Rule 3: Description must be a string if provided
  if (
    description !== undefined &&
    typeof description !== "string"
  ) {
    errors.push("Description must be a string");
  }

  // Rule 4: Priority must be valid
  if (
    priority !== undefined &&
    !["low", "medium", "high"].includes(priority)
  ) {
    errors.push("Priority must be low, medium, or high");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: "Validation failed",
      details: errors,
    });
  }

  // Sanitize title and description
  req.body.title = title.trim();

  if (description !== undefined) {
    req.body.description = description.trim();
  }

  next();
};

module.exports = validateTask;