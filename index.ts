import { config as dotenvConfig } from "dotenv";
import express from "express";

dotenvConfig();

const app = express();

const server = require("http").createServer(app);

const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});

interface IActiveUser {
  socketId: string;
  id: number;
  name: string;
  avatar: string;
  bio: string;
  email: string;
  birthday: null | string;
  other_name: string | null;
  cover_image: string | null;
}

let activeUsers: IActiveUser[] = [];

io.on("connection", (socket) => {
  //User online
  console.log("connectionn");
  socket.on("add-user-active", (user) => {
    if (!activeUsers.some((item) => item.id === user?.id)) {
      activeUsers.push({ ...user, socketId: socket.id });
    }
    console.log("called");
    io.emit("get-user-active", activeUsers);
  });

  socket.on("disconnect", () => {
    activeUsers = activeUsers.filter((item) => item.socketId !== socket.id);
    io.emit("get-user-active", activeUsers);
  });

  socket.on("send-message", (data) => {
    const currentRecieve = activeUsers.find((item) => item.id === data.receive_id.id);
    if (currentRecieve) {
      socket.to(currentRecieve.socketId).emit("get-new-message", data);
    }
  });

  socket.on("recall-message", (data: { receiveId: number; messageId: number; authorId: number }) => {
    const currentReceive = activeUsers.find((item) => item.id == data.receiveId);
    console.log("recall", data, currentReceive);
    if (currentReceive) {
      socket.to(currentReceive.socketId).emit("get-recall-message", data);
    }
  });

  socket.on("react-message", (data: { messageId: number | string; userId: number; react: string; id: number | string; receiveId: number }) => {
    const currentReceive = activeUsers.find((item) => item.id === data.receiveId);
    if (currentReceive) {
      socket.to(currentReceive.socketId).emit("get-react-message", data);
    }
  });

  socket.on("seen-message", (data: { receiveId: number; messageId: number }) => {
    const currentReceive = activeUsers.find((item) => item.id === data.receiveId);
    if (currentReceive) {
      socket.to(currentReceive.socketId).emit("get-seen-message", data);
    }
  });
});

const PORT = process.env.PORT || 5151;

app.get("/", (req, res) => {
  res.send("Datisekai socket server!");
});

server.listen(PORT, () => {
  console.log(`Server socket datisekai is running on port ${PORT}`);
});
