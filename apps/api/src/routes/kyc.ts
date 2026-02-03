import { Router, Request, Response } from 'express';
import { kycService } from '../modules/kyc/kyc.service';
import { authMiddleware } from '../middleware/auth.middleware';
import { z } from 'zod';

const router = Router();

// All KYC routes need login
// Admin routes also check if user has admin role

// POST /api/v1/kyc/upload
// Upload a document (ID proof, address proof, or selfie)
const uploadSchema = z.object({
  documentType: z.enum(['id_proof', 'address_proof', 'selfie']),
  fileName: z.string(),
  fileData: z.string() // Base64 encoded file
});

router.post('/upload', authMiddleware, async (req: Request, res: Response) => {
  try {
    const data = uploadSchema.parse(req.body);
    const userId = req.user!.id;

    const document = await kycService.uploadDocument(
      userId,
      data.documentType,
      data.fileName,
      data.fileData
    );

    res.json({
      success: true,
      message: 'Document uploaded successfully',
      document: {
        id: document.id,
        documentType: document.documentType,
        fileName: document.fileName,
        status: document.status
      }
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to upload document'
    });
  }
});

// GET /api/v1/kyc/my-documents
// Get all my uploaded documents
router.get('/my-documents', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const documents = await kycService.getUserDocuments(userId);

    res.json({
      success: true,
      documents
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get documents'
    });
  }
});

// GET /api/v1/kyc/document/:documentId
// View a specific document (with file data)
router.get('/document/:documentId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;
    const document = await kycService.getDocument(documentId);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check if this document belongs to the user (or user is admin)
    if (document.userId !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      document
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get document'
    });
  }
});

// POST /api/v1/kyc/submit
// Submit KYC for admin review
router.post('/submit', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const user = await kycService.submitForReview(userId);

    res.json({
      success: true,
      message: 'KYC submitted for review',
      user: {
        kycStatus: user.kycStatus,
        kycSubmittedAt: user.kycSubmittedAt
      }
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to submit KYC'
    });
  }
});

// Admin routes below this line
// These routes check if user is admin

// GET /api/v1/kyc/admin/pending
// Get all pending KYC submissions (admin only)
router.get('/admin/pending', authMiddleware, async (req: Request, res: Response) => {
  try {
    // Check if user is admin
    if (req.user!.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const submissions = await kycService.getPendingSubmissions();

    res.json({
      success: true,
      submissions
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get pending submissions'
    });
  }
});

// POST /api/v1/kyc/admin/approve
// Approve a user's KYC (admin only)
const reviewSchema = z.object({
  userId: z.string(),
  reason: z.string().optional()
});

router.post('/admin/approve', authMiddleware, async (req: Request, res: Response) => {
  try {
    // Check if user is admin
    if (req.user!.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { userId } = reviewSchema.parse(req.body);
    const adminId = req.user!.id;

    const user = await kycService.approveKyc(userId, adminId);

    res.json({
      success: true,
      message: 'KYC approved',
      user: {
        id: user.id,
        email: user.email,
        kycStatus: user.kycStatus
      }
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to approve KYC'
    });
  }
});

// POST /api/v1/kyc/admin/reject
// Reject a user's KYC (admin only)
router.post('/admin/reject', authMiddleware, async (req: Request, res: Response) => {
  try {
    // Check if user is admin
    if (req.user!.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const data = reviewSchema.parse(req.body);
    
    if (!data.reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const adminId = req.user!.id;
    const user = await kycService.rejectKyc(data.userId, adminId, data.reason);

    res.json({
      success: true,
      message: 'KYC rejected',
      user: {
        id: user.id,
        email: user.email,
        kycStatus: user.kycStatus
      }
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to reject KYC'
    });
  }
});

export default router;
