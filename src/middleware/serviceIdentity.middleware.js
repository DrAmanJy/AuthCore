export const extractServiceIdentity = (req, res, next) => {
  const targetAudience = req.headers["x-target-audience"];

  req.service = {
    name: targetAudience,
  };

  next();
};
