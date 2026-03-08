/**
 * verificationService.js
 * Handles all /api/verification endpoints.
 *
 * The submit call is multipart/form-data — this service builds
 * the FormData object so you only pass a local image URI.
 */

import apiClient from "../utils/axiosInstance";

export const VERIFICATION_STATUS = {
  UNVERIFIED:   "unverified",
  PENDING:      "pending",
  UNDER_REVIEW: "under_review",
  VERIFIED:     "verified",
  REJECTED:     "rejected",
};

export const ID_TYPES = [
  { key: "national_id",     label: "National ID Card" },
  { key: "passport",        label: "International Passport" },
  { key: "drivers_license", label: "Driver's Licence" },
  { key: "other",           label: "Other Government ID" },
];

const VerificationService = {
  /**
   * Submit a selfie-holding-ID photo for manual review.
   * Use expo-image-picker to get the local imageUri first.
   *
   * @param {{
   *   imageUri: string,
   *   imageName?: string,
   *   imageMimeType?: string,
   *   idType: 'national_id'|'passport'|'drivers_license'|'other'
   * }} data
   * @returns {{ id, status, submittedAt }}
   *
   * @example
   *   const asset = result.assets[0];
   *   await VerificationService.submitVerification({
   *     imageUri: asset.uri,
   *     idType: 'national_id',
   *   });
   */
  submitVerification: async ({
    imageUri,
    imageName = "id_selfie.jpg",
    imageMimeType = "image/jpeg",
    idType,
  }) => {
    const formData = new FormData();
    formData.append("idSelfie", {
      uri: imageUri,
      name: imageName,
      type: imageMimeType,
    });
    formData.append("idType", idType);

    const response = await apiClient.post("/api/verification/submit", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  /**
   * Get the current user's verification status.
   * @returns {{
   *   status: 'unverified'|'pending'|'under_review'|'verified'|'rejected',
   *   idType?: string,
   *   submittedAt?: string,
   *   reviewedAt?: string,
   *   rejectionReason?: string
   * }}
   */
  getVerificationStatus: async () => {
    const response = await apiClient.get("/api/verification/status");
    return response.data;
  },

  // ─── Admin only ───────────────────────────────────────────────

  /**
   * [Admin] List pending / under-review submissions (oldest first).
   * @param {{ page?: number, limit?: number }} params
   */
  listPendingVerifications: async (params = {}) => {
    const response = await apiClient.get("/api/verification/admin/pending", { params });
    return response.data;
  },

  /**
   * [Admin] Approve or reject a verification submission.
   * @param {string} verificationId
   * @param {{ action: 'approve'|'reject', rejectionReason?: string }} data
   */
  reviewVerification: async (verificationId, data) => {
    const response = await apiClient.patch(
      `/api/verification/admin/${verificationId}/review`,
      data
    );
    return response.data;
  },
};

export default VerificationService;
