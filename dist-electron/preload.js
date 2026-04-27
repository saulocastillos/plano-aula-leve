import u from "electron";
function p(n) {
  return n && n.__esModule && Object.prototype.hasOwnProperty.call(n, "default") ? n.default : n;
}
var o = {}, a;
function l() {
  if (a) return o;
  a = 1;
  const { contextBridge: n, ipcRenderer: t } = u;
  return n.exposeInMainWorld("profeApi", {
    getAppState: () => t.invoke("app:get-state"),
    getSettings: () => t.invoke("settings:get"),
    saveSettings: (e) => t.invoke("settings:save", e),
    saveInstruction: (e) => t.invoke("instructions:save", e),
    resetDefaultInstruction: () => t.invoke("instructions:reset-default"),
    setDefaultInstruction: (e) => t.invoke("instructions:set-default", e),
    pickInputFiles: () => t.invoke("files:pick-inputs"),
    pickInputFile: () => t.invoke("files:pick-inputs").then((e) => (e == null ? void 0 : e[0]) ?? null),
    openPath: (e) => t.invoke("files:open-path", e),
    generatePlans: (e) => t.invoke("plans:generate", e),
    generatePlan: async (e) => {
      var s;
      const r = e == null ? void 0 : e.inputPath, i = await t.invoke("plans:generate", {
        inputPaths: r ? [r] : []
      });
      return ((s = i == null ? void 0 : i.items) == null ? void 0 : s[0]) ?? null;
    }
  }), o;
}
var c = l();
const f = /* @__PURE__ */ p(c);
export {
  f as default
};
