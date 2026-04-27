const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("profeApi", {
  getAppState: () => ipcRenderer.invoke("app:get-state"),
  getSettings: () => ipcRenderer.invoke("settings:get"),
  saveSettings: (settings) => ipcRenderer.invoke("settings:save", settings),
  saveInstruction: (payload) => ipcRenderer.invoke("instructions:save", payload),
  resetDefaultInstruction: () => ipcRenderer.invoke("instructions:reset-default"),
  setDefaultInstruction: (fileName) => ipcRenderer.invoke("instructions:set-default", fileName),
  pickTemplateFile: () => ipcRenderer.invoke("templates:pick-template"),
  importTemplate: (sourcePath) => ipcRenderer.invoke("templates:import", sourcePath),
  setDefaultTemplate: (fileName) => ipcRenderer.invoke("templates:set-default", fileName),
  pickInputFiles: () => ipcRenderer.invoke("files:pick-inputs"),
  detectPlanFields: (payload) => ipcRenderer.invoke("plans:detect-fields", payload),
  pickDirectory: (kind) => ipcRenderer.invoke("files:pick-directory", kind),
  clearInputFiles: () => ipcRenderer.invoke("files:clear-inputs"),
  pickInputFile: () =>
    ipcRenderer.invoke("files:pick-inputs").then((paths) => paths?.[0] ?? null),
  openPath: (targetPath) => ipcRenderer.invoke("files:open-path", targetPath),
  generatePlans: (payload) => ipcRenderer.invoke("plans:generate", payload),
  generatePlan: async (payload) => {
    const inputPath = payload?.inputPath;
    const result = await ipcRenderer.invoke("plans:generate", {
      inputPaths: inputPath ? [inputPath] : []
    });
    return result?.items?.[0] ?? null;
  }
});
