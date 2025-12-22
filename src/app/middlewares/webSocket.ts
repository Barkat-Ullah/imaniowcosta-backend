import { Server } from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import { verifyToken } from '../utils/verifyToken';
import config from '../../config';
import { Secret } from 'jsonwebtoken';
import { prisma } from '../utils/prisma';

interface ExtendedWebSocket extends WebSocket {
  userId?: string;
  role?: 'USER';
}

export const onlineUsers = new Set<string>();
const userSockets = new Map<string, ExtendedWebSocket>();

export async function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws: ExtendedWebSocket) => {
    console.log('New user connected');

    ws.on('message', async (data: string) => {
      try {
        const parsedData = JSON.parse(data);
        switch (parsedData.event) {
          case 'authenticate': {
            const token = parsedData.token;

            if (!token) {
              console.log('No token provided');
              ws.close();
              return;
            }

            const user = verifyToken(token, config.jwt.access_secret as Secret);

            if (!user) {
              console.log('Invalid token');
              ws.close();
              return;
            }

            const { id } = user;

            ws.userId = id;
            ws.role = user.role as 'USER';
            onlineUsers.add(id);
            userSockets.set(id, ws);

            // Fetch full user details
            const userDetails = await prisma.user.findUnique({
              where: { id },
              select: {
                id: true,
                fullName: true,
                email: true,
                image: true,
                role: true,
                phoneNumber: true,
              },
            });

            broadcastToAll(wss, {
              event: 'userStatus',
              data: { ...userDetails, isOnline: true },
            });
            break;
          }

          // One-to-One Message
          case 'message': {
            const { receiverId, message } = parsedData;

            if (!ws.userId || !receiverId || !message) {
              console.log('Invalid message payload');
              return;
            }

            let room = await prisma.room.findFirst({
              where: {
                OR: [
                  { senderId: ws.userId, receiverId },
                  { senderId: receiverId, receiverId: ws.userId },
                ],
              },
            });

            if (!room) {
              room = await prisma.room.create({
                data: { senderId: ws.userId, receiverId },
              });
            }

            const chat = await prisma.chat.create({
              data: {
                senderId: ws.userId,
                receiverId,
                roomId: room.id,
                message,
              },
              include: {
                sender: {
                  select: {
                    id: true,
                    fullName: true,
                    email: true,
                    image: true,
                    role: true,
                  },
                },
                receiver: {
                  select: {
                    id: true,
                    fullName: true,
                    email: true,
                    image: true,
                    role: true,
                  },
                },
              },
            });

            const receiverSocket = userSockets.get(receiverId);
            if (receiverSocket) {
              receiverSocket.send(
                JSON.stringify({ event: 'message', data: chat }),
              );
            }
            ws.send(JSON.stringify({ event: 'message', data: chat }));
            break;
          }

          // Fetch One-to-One Chats
          case 'fetchChats': {
            const { receiverId } = parsedData;
            if (!ws.userId) {
              console.log('User not authenticated');
              return;
            }

            const room = await prisma.room.findFirst({
              where: {
                OR: [
                  { senderId: ws.userId, receiverId },
                  { senderId: receiverId, receiverId: ws.userId },
                ],
              },
            });

            if (!room) {
              ws.send(JSON.stringify({ event: 'fetchChats', data: [] }));
              return;
            }

            const chats = await prisma.chat.findMany({
              where: { roomId: room.id },
              orderBy: { createdAt: 'asc' },
              include: {
                sender: {
                  select: {
                    id: true,
                    fullName: true,
                    email: true,
                    image: true,
                    role: true,
                  },
                },
                receiver: {
                  select: {
                    id: true,
                    fullName: true,
                    email: true,
                    image: true,
                    role: true,
                  },
                },
              },
            });

            await prisma.chat.updateMany({
              where: { roomId: room.id, receiverId: ws.userId },
              data: { isRead: true },
            });

            ws.send(
              JSON.stringify({
                event: 'fetchChats',
                data: chats,
              }),
            );
            break;
          }

          // Online Users
          case 'onlineUsers': {
            const onlineUserList = Array.from(onlineUsers);
            const users = await prisma.user.findMany({
              where: { id: { in: onlineUserList } },
              select: {
                id: true,
                fullName: true,
                email: true,
                image: true,
                role: true,
                phoneNumber: true,
                status: true,
              },
            });
            ws.send(
              JSON.stringify({
                event: 'onlineUsers',
                data: users,
              }),
            );
            break;
          }

          // Unread One-to-One Messages
          case 'unReadMessages': {
            const { receiverId } = parsedData;
            if (!ws.userId || !receiverId) {
              console.log('Invalid unread messages payload');
              return;
            }

            const room = await prisma.room.findFirst({
              where: {
                OR: [
                  { senderId: ws.userId, receiverId },
                  { senderId: receiverId, receiverId: ws.userId },
                ],
              },
            });

            if (!room) {
              ws.send(JSON.stringify({ event: 'noUnreadMessages', data: [] }));
              return;
            }

            const unReadMessages = await prisma.chat.findMany({
              where: { roomId: room.id, isRead: false, receiverId: ws.userId },
              include: {
                sender: {
                  select: {
                    id: true,
                    fullName: true,
                    email: true,
                    image: true,
                    role: true,
                  },
                },
              },
            });

            const unReadCount = unReadMessages.length;

            ws.send(
              JSON.stringify({
                event: 'unReadMessages',
                data: { messages: unReadMessages, count: unReadCount },
              }),
            );
            break;
          }

          // One-to-One Message List
          case 'messageList': {
            try {
              const rooms = await prisma.room.findMany({
                where: {
                  OR: [{ senderId: ws.userId }, { receiverId: ws.userId }],
                },
                include: {
                  chat: {
                    orderBy: {
                      createdAt: 'desc',
                    },
                    take: 1,
                    include: {
                      sender: {
                        select: {
                          id: true,
                          fullName: true,
                          email: true,
                          image: true,
                          role: true,
                        },
                      },
                    },
                  },
                },
              });

              const userIds = rooms.map(room => {
                return room.senderId === ws.userId
                  ? room.receiverId
                  : room.senderId;
              });

              const userInfos = await prisma.user.findMany({
                where: {
                  id: {
                    in: userIds,
                  },
                },
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                  image: true,
                  role: true,
                  phoneNumber: true,
                  status: true,
                },
              });

              const userWithLastMessages = rooms.map(room => {
                const otherUserId =
                  room.senderId === ws.userId ? room.receiverId : room.senderId;
                const userInfo = userInfos.find(
                  userInfo => userInfo.id === otherUserId,
                );

                return {
                  user: userInfo || null,
                  lastMessage: room.chat[0] || null,
                  roomId: room.id,
                };
              });

              ws.send(
                JSON.stringify({
                  event: 'messageList',
                  data: userWithLastMessages,
                }),
              );
            } catch (error) {
              console.error(
                'Error fetching user list with last messages:',
                error,
              );
              ws.send(
                JSON.stringify({
                  event: 'error',
                  message: 'Failed to fetch users with last messages',
                }),
              );
            }
            break;
          }

          default:
            console.log('Unknown event type:', parsedData.event);
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
      }
    });

    ws.on('close', async () => {
      const extendedWs = ws as ExtendedWebSocket;
      if (extendedWs.userId) {
        const userId = extendedWs.userId;
        const role = extendedWs.role;

        onlineUsers.delete(userId);
        userSockets.delete(userId);

        // Fetch user details for disconnect broadcast
        const userDetails = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            fullName: true,
            email: true,
            image: true,
            role: true,
          },
        });

        broadcastToAll(wss, {
          event: 'userStatus',
          data: { ...userDetails, isOnline: false },
        });
      }
      console.log('User disconnected');
    });
  });

  return wss;
}

function broadcastToAll(wss: WebSocketServer, message: object) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}
