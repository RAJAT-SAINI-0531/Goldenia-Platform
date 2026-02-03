import { prisma } from '../../config/database';

// This file handles KYC (Know Your Customer) operations
// Simple approach - users upload documents, admin reviews them

export const kycService = {
  // Upload a document (ID proof, address proof, or selfie)
  // We store the file as base64 string in database (simple way, no separate file server needed)
  async uploadDocument(
    userId: string,
    documentType: string,
    fileName: string,
    fileData: string
  ) {
    // Check if this type of document already exists
    const existing = await prisma.kycDocument.findFirst({
      where: {
        userId,
        documentType,
        status: { in: ['pending', 'approved'] }
      }
    });

    // If exists and approved, don't allow re-upload
    if (existing && existing.status === 'approved') {
      throw new Error('This document is already approved');
    }

    // If exists and pending, delete the old one (allow re-upload)
    if (existing && existing.status === 'pending') {
      await prisma.kycDocument.delete({
        where: { id: existing.id }
      });
    }

    // Create new document record
    const document = await prisma.kycDocument.create({
      data: {
        userId,
        documentType,
        fileName,
        fileData
      }
    });

    return document;
  },

  // Get all documents for a user
  async getUserDocuments(userId: string) {
    const documents = await prisma.kycDocument.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    // Don't send fileData in list (it's big), only send it when viewing single document
    return documents.map(doc => ({
      id: doc.id,
      documentType: doc.documentType,
      fileName: doc.fileName,
      status: doc.status,
      rejectionReason: doc.rejectionReason,
      createdAt: doc.createdAt
    }));
  },

  // Get a specific document (with file data)
  async getDocument(documentId: string) {
    const document = await prisma.kycDocument.findUnique({
      where: { id: documentId }
    });
    return document;
  },

  // Submit KYC for review
  // User must have uploaded all 3 documents (id_proof, address_proof, selfie)
  async submitForReview(userId: string) {
    // Check if user has all required documents
    const documents = await prisma.kycDocument.findMany({
      where: {
        userId,
        status: 'pending'
      }
    });

    const hasIdProof = documents.some(d => d.documentType === 'id_proof');
    const hasAddressProof = documents.some(d => d.documentType === 'address_proof');
    const hasSelfie = documents.some(d => d.documentType === 'selfie');

    if (!hasIdProof || !hasAddressProof || !hasSelfie) {
      throw new Error('Please upload all required documents (ID proof, Address proof, Selfie)');
    }

    // Update user KYC status to pending
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        kycStatus: 'pending',
        kycSubmittedAt: new Date()
      }
    });

    return user;
  },

  // Admin: Get all pending KYC submissions
  async getPendingSubmissions() {
    const users = await prisma.user.findMany({
      where: {
        kycStatus: 'pending'
      },
      include: {
        kycDocuments: {
          where: {
            status: 'pending'
          }
        }
      },
      orderBy: {
        kycSubmittedAt: 'asc'
      }
    });

    return users;
  },

  // Admin: Approve KYC
  async approveKyc(userId: string, adminId: string) {
    // Approve all pending documents
    await prisma.kycDocument.updateMany({
      where: {
        userId,
        status: 'pending'
      },
      data: {
        status: 'approved',
        reviewedBy: adminId,
        reviewedAt: new Date()
      }
    });

    // Update user status
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        kycStatus: 'verified',
        kycVerifiedAt: new Date(),
        kycLevel: 'tier1' // Basic verification
      }
    });

    return user;
  },

  // Admin: Reject KYC
  async rejectKyc(userId: string, adminId: string, reason: string) {
    // Reject all pending documents
    await prisma.kycDocument.updateMany({
      where: {
        userId,
        status: 'pending'
      },
      data: {
        status: 'rejected',
        rejectionReason: reason,
        reviewedBy: adminId,
        reviewedAt: new Date()
      }
    });

    // Update user status
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        kycStatus: 'rejected',
        kycRejectionReason: reason
      }
    });

    return user;
  }
};
