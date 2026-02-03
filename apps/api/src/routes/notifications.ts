import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { notificationsService } from '../modules/notifications/notifications.service';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Get all notifications for logged-in user
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const notifications = await notificationsService.getUserNotifications(userId);

    res.json({ notifications });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get unread notification count
router.get('/unread-count', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const count = await notificationsService.getUnreadCount(userId);

    res.json({ count });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Mark a notification as read
router.put('/:id/read', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    const notification = await notificationsService.markAsRead(id, userId);

    res.json({ notification });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Mark all notifications as read
router.put('/mark-all-read', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    await notificationsService.markAllAsRead(userId);

    res.json({ message: 'All notifications marked as read' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a notification
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    await notificationsService.deleteNotification(id, userId);

    res.json({ message: 'Notification deleted' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
