var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/handlers/cors.ts
var cors_exports = {};
__export(cors_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(cors_exports);
var handler = async (event) => {
  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": process.env.STAGE === "prod" ? "https://app.emotio-x.com" : "http://localhost:4700",
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Api-Key",
      "Access-Control-Expose-Headers": "Content-Type,Authorization,X-Api-Key",
      "Access-Control-Max-Age": "600"
    },
    body: ""
  };
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
