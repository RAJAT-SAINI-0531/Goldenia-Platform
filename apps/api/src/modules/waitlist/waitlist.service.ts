import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Add someone to the waitlist
export async function addToWaitlist(email: string, name?: string) {
  try {
    // Check if email already exists
    const existing = await prisma.waitlist.findUnique({
      where: { email }
    });

    if (existing) {
      // Already on the waitlist
      return {
        success: false,
        message: 'You are already on the waitlist!'
      };
    }

    // Add new email to waitlist
    const waitlistEntry = await prisma.waitlist.create({
      data: {
        email,
        name: name || null
      }
    });

    return {
      success: true,
      message: 'Successfully joined the waitlist!',
      data: waitlistEntry
    };

  } catch (error) {
    console.error('Error adding to waitlist:', error);
    throw new Error('Failed to join waitlist');
  }
}

// Get all waitlist entries (for admin later)
export async function getAllWaitlistEntries() {
  try {
    const entries = await prisma.waitlist.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return entries;
  } catch (error) {
    console.error('Error fetching waitlist:', error);
    throw error;
  }
}
