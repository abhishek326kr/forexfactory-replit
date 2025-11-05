/**
 * Client-side Object Storage Service
 * Handles interactions with the object storage API from the frontend
 */
export class ObjectStorageService {
  /**
   * Set the ACL (Access Control List) for an uploaded object
   * @param objectName - The name/key of the object in storage
   * @param permission - The permission level (e.g., "public-read")
   */
  async setObjectAcl(objectName: string, permission: string = "public-read") {
    try {
      const response = await fetch("/api/admin/object-acl", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          objectName,
          permission
        })
      });

      if (!response.ok) {
        throw new Error("Failed to set object ACL");
      }

      return await response.json();
    } catch (error) {
      console.error("Error setting object ACL:", error);
      throw error;
    }
  }

  /**
   * Get a presigned URL for uploading an object
   */
  async getUploadUrl() {
    try {
      const response = await fetch("/api/admin/upload", {
        method: "POST"
      });

      if (!response.ok) {
        throw new Error("Failed to get upload URL");
      }

      return await response.json();
    } catch (error) {
      console.error("Error getting upload URL:", error);
      throw error;
    }
  }
}