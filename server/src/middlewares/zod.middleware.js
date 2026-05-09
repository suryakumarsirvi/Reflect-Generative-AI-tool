
const validate = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = result.error.issues.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return next({
        statusCode: 400,
        message: "Validation Failed",
        errors,
      });
    }

    req.data = result.data;
    next();
  };
};

export default validate;
