import { Runtime } from "foldkit";

import { view } from "../features/notes/view.js";
import { Message } from "./notes/message.js";
import { Model } from "./notes/model.js";
import { NoteRpc } from "./notes/note-rpc.js";
import { init, update } from "./notes/update.js";

import "./styles.css";

const application = Runtime.makeApplication({
  Model,
  container: document.querySelector("#root"),
  devTools: import.meta.env.DEV ? { Message } : false,
  init,
  resources: NoteRpc.layer,
  update,
  view,
});

Runtime.hydrate(application);
