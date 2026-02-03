import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Service to handle all notification operations
// Keep it simple - just create, read, and mark as read

export const notificationsService = {
  // Create a new notification for a user
  async createNotification(data: {
    userId: string;
    title: string;
    message: string;
    type: string;
    metadata?: any;
  }) {
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type,
        metadata: data.metadata || {},
        isRead: false,
      },
    });

    return notification;
  },

  // Get all notifications for a user
  async getUserNotifications(userId: string, limit = 50) {
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return notifications;
  },

  // Get unread count for a user
  async getUnreadCount(userId: string) {
    const count = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    return count;
  },

  // Mark notification as read
  async markAsRead(notificationId: string, userId: string) {
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId, // make sure user owns this notification
      },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    return updated;
  },

  // Mark all notifications as read for a user
  async markAllAsRead(userId: string) {
    await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: { isRead: true },
    });

    return { success: true };
  },

  // Delete a notification
  async deleteNotification(notificationId: string, userId: string) {
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    await prisma.notification.delete({
      where: { id: notificationId },
    });

    return { success: true };
  },
};
