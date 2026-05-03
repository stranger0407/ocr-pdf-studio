const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("ocrStudio", {
  platform: process.platform,
});