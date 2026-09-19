const http = require("http");

module.exports = () => {
  return new Promise((resolve) => {
    const options = {
      host: "api.ipify.org",
      port: 80,
      path: "/?format=json",
    };

    // Create a new http.ClientRequest object
    const req = http.request(options, (res) => {
      // Set the response encoding to utf8
      res.setEncoding("utf8");

      // When a chunk of data is received, append it to the body
      let body = "";
      res.on("data", (chunk) => {
        body += chunk;
      });

      // When the response completes, parse the JSON and log the IP address
      res.on("end", () => {
        const data = JSON.parse(body);
        resolve(data.ip ? data.ip : "");
      });
    });

    // Send the request
    req.end();
  });
};
