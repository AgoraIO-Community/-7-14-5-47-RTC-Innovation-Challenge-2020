"use strict";

import { app, protocol, BrowserWindow, screen, ipcMain } from "electron";
import { createProtocol } from "vue-cli-plugin-electron-builder/lib";
import os from "os";
import installExtension, { VUEJS_DEVTOOLS } from "electron-devtools-installer";
const isDevelopment = process.env.NODE_ENV !== "production";
import createToken from "./createToken";

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win: BrowserWindow | null;

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: "app", privileges: { secure: true, standard: true } }
]);

function createWindow() {
  const display = screen.getPrimaryDisplay();
  // Create the browser window.
  win = new BrowserWindow({
    x: parseInt((display.size.width * 0.1).toString(), 10),
    y: parseInt((display.size.height * 0.1).toString(), 10),
    width: parseInt((display.size.width * 0.8).toString(), 10),
    height: parseInt((display.size.height * 0.8).toString(), 10),
    title: os.platform() === "darwin" ? "Touch 🐟 Artifact" : "Touch Fish Artifact",
    webPreferences: {
      // Use pluginOptions.nodeIntegration, leave this alone
      // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
      nodeIntegration: (process.env
        .ELECTRON_NODE_INTEGRATION as unknown) as boolean,
      // 需设置为false 否则浏览器无法读取本地资源
      webSecurity: false,
      devTools: process.env.NODE_ENV === "development" ? true : false,
      webviewTag: true,
      autoplayPolicy: "no-user-gesture-required"
    }
  });

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    win.loadURL(process.env.WEBPACK_DEV_SERVER_URL as string);
    if (!process.env.IS_TEST) { win.webContents.openDevTools(); }
  } else {
    createProtocol("app");
    // Load the index.html when not in development
    win.loadURL("app://./index.html");
  }

  ipcMain.on("leave", () => {
    if (win) {
      win.destroy();
    }
  });

  win.on("closed", () => {
    win = null;
  });
}

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow();
  }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", async () => {
  console.log(app.getAppPath());
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    // Devtools extensions are broken in Electron  6/7/<8.25 on Windows
    // See https://github.com/nklayman/vue-cli-plugin-electron-builder/issues/378 for more info
    // Electron will not launch with Devtools extensions installed on Windows 10 with dark mode
    // If you are not using Windows 10 dark mode, you may uncomment the following lines (and the import at the top of the file)
    // In addition, if you upgrade to Electron ^8.2.5 or ^9.0.0 then devtools should work fine

    try {
      await installExtension(VUEJS_DEVTOOLS);
    } catch (e) {
      console.log("Vue Devtools failed to install:", e.toString());
    }
  }
  ipcMain.handle("getToken", (e, args) => {
    return createToken(args);
  });

  createWindow();
});

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === "win32") {
    process.on("message", (data) => {
      if (data === "graceful-exit") {
        app.quit();
      }
    });
  } else {
    process.on("SIGTERM", () => {
      app.quit();
    });
  }
}
