import { PrismaClient } from '@prisma/client';
import { notificationsService } from '../notifications/notifications.service';

const prisma = new PrismaClient();

// Service to handle price alerts
// Simple logic: user sets alert, we check prices periodically

export const priceAlertsService = {
  // Create a new price alert
  async createAlert(data: {
    userId: string;
    asset: string;
    targetPrice: number;
    condition: string;
  }) {
    // Check if valid asset
    if (!['gold', 'silver'].includes(data.asset)) {
      throw new Error('Invalid asset. Must be gold or silver');
    }

    // Check if valid condition
    if (!['above', 'below'].includes(data.condition)) {
      throw new Error('Invalid condition. Must be above or below');
    }

    // Check target price is positive
    if (data.targetPrice <= 0) {
      throw new Error('Target price must be positive');
    }

    // Debug log
    console.log('Creating alert with data:', {
      userId: data.userId,
      asset: data.asset,
      targetPrice: data.targetPrice,
      condition: data.condition
    });

    const alert = await prisma.priceAlert.create({
      data: {
        userId: data.userId,
        asset: data.asset,
        targetPrice: data.targetPrice,
        condition: data.condition,
        isActive: true,
        triggered: false,
      },
    });

    return alert;
  },

  // Get all alerts for a user
  async getUserAlerts(userId: string) {
    const alerts = await prisma.priceAlert.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return alerts;
  },

  // Get active alerts for a user
  async getActiveAlerts(userId: string) {
    const alerts = await prisma.priceAlert.findMany({
      where: {
        userId,
        isActive: true,
        triggered: false,
      },
      orderBy: { createdAt: 'desc' },
    });

    return alerts;
  },

  // Delete an alert
  async deleteAlert(alertId: string, userId: string) {
    const alert = await prisma.priceAlert.findFirst({
      where: {
        id: alertId,
        userId,
      },
    });

    if (!alert) {
      throw new Error('Alert not found');
    }

    await prisma.priceAlert.delete({
      where: { id: alertId },
    });

    return { success: true };
  },

  // Check all active alerts against current prices
  // This should be called periodically (every minute or when price updates)
  async checkAlerts() {
    // Get current prices
    const goldPrice = await prisma.assetPrice.findUnique({
      where: { asset: 'gold' },
    });

    const silverPrice = await prisma.assetPrice.findUnique({
      where: { asset: 'silver' },
    });

    if (!goldPrice || !silverPrice) {
      return; // no prices set yet
    }

    // Get all active, non-triggered alerts
    const alerts = await prisma.priceAlert.findMany({
      where: {
        isActive: true,
        triggered: false,
      },
    });

    // Check each alert
    for (const alert of alerts) {
      const currentPrice = alert.asset === 'gold' ? goldPrice.priceUsd : silverPrice.priceUsd;

      let shouldTrigger = false;

      if (alert.condition === 'above' && currentPrice >= alert.targetPrice) {
        shouldTrigger = true;
      } else if (alert.condition === 'below' && currentPrice <= alert.targetPrice) {
        shouldTrigger = true;
      }

      if (shouldTrigger) {
        // Trigger the alert
        await prisma.priceAlert.update({
          where: { id: alert.id },
          data: {
            triggered: true,
            triggeredAt: new Date(),
            isActive: false, // deactivate after trigger
          },
        });

        // Create notification for user
        await notificationsService.createNotification({
          userId: alert.userId,
          title: `Price Alert: ${alert.asset.toUpperCase()} reached $${alert.targetPrice}`,
          message: `${alert.asset.toUpperCase()} is now ${alert.condition} $${alert.targetPrice} per gram. Current price: $${currentPrice.toFixed(2)}`,
          type: 'alert',
          metadata: {
            alertId: alert.id,
            asset: alert.asset,
            targetPrice: alert.targetPrice,
            currentPrice: currentPrice,
          },
        });
      }
    }
  },
};
