module.exports = {
  successResponse: ({ res, data = {} }) => {
    return res.status(200).json(data);
  },
  error400Response: ({ res, message = "Bad request found" }) => {
    res.status(400).json({ message: message });
  },
  error404Response: ({ res, message = "Not found" }) => {
    res.status(404).json({ message: message });
  },
  error401Response: ({ res, message = "Unauthorized!" }) => {
    res.status(401).json({ message: message });
  },
  error403Response: ({ res, message = "Unauthorized!" }) => {
    res.status(403).json({ message: message });
  },
  error500Response: ({ res, message = "" }) => {
    res.status(500).json({ message: message });
  },
};
