/**
 * eventService.js
 * Handles all /api/events endpoints.
 */

import apiClient from "../utils/axiosInstance";

export const EVENT_CATEGORIES = [
  { key: "dating",  label: "💘 Dating"  },
  { key: "social",  label: "🎉 Social"  },
  { key: "sports",  label: "⚽ Sports"  },
  { key: "arts",    label: "🎨 Arts"    },
  { key: "music",   label: "🎵 Music"   },
  { key: "food",    label: "🍽️ Food"    },
  { key: "travel",  label: "✈️ Travel"  },
  { key: "tech",    label: "💻 Tech"    },
  { key: "other",   label: "📌 Other"   },
];

export const RSVP_STATUS = {
  GOING:      "going",
  INTERESTED: "interested",
  NOT_GOING:  "not_going",
};

const EventService = {
  /**
   * Fetch upcoming events. Pass coordinates to filter by distance.
   * @param {{
   *   page?: number, limit?: number, category?: string,
   *   latitude?: number, longitude?: number, radius?: number
   * }} params
   * @returns {{ data: Event[], pagination }}
   */
  getEvents: async (params = {}) => {
    const response = await apiClient.get("/api/events", { params });
    return response.data;
  },

  /**
   * Get full details for one event including attendees.
   * @param {string} eventId
   */
  getEvent: async (eventId) => {
    const response = await apiClient.get(`/api/events/${eventId}`);
    return response.data;
  },

  /**
   * Create a new event.
   * Pass coverImageUri (local URI from expo-image-picker) to attach a cover photo.
   *
   * @param {{
   *   title: string, description?: string, category?: string,
   *   date: string, endDate?: string,
   *   address?: string, city?: string, country?: string,
   *   latitude?: number, longitude?: number,
   *   isOnline?: boolean, onlineLink?: string,
   *   maxAttendees?: number, isPremiumOnly?: boolean, isPublic?: boolean,
   *   tags?: string[],
   *   coverImageUri?: string, coverImageName?: string, coverImageMime?: string,
   * }} data
   * @returns {Event}
   */
  createEvent: async ({
    coverImageUri,
    coverImageName = "cover.jpg",
    coverImageMime = "image/jpeg",
    tags,
    ...fields
  }) => {
    const formData = new FormData();

    Object.entries(fields).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    if (tags) {
      formData.append("tags", Array.isArray(tags) ? tags.join(",") : tags);
    }

    if (coverImageUri) {
      formData.append("coverImage", {
        uri: coverImageUri,
        name: coverImageName,
        type: coverImageMime,
      });
    }

    const response = await apiClient.post("/api/events", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  /**
   * Update an existing event (creator only).
   * Only the fields you pass will be updated.
   *
   * @param {string} eventId
   * @param {{ title?, description?, category?, date?, status?,
   *           coverImageUri?, tags?, maxAttendees?, isPublic? }} data
   */
  updateEvent: async (
    eventId,
    {
      coverImageUri,
      coverImageName = "cover.jpg",
      coverImageMime = "image/jpeg",
      tags,
      ...fields
    }
  ) => {
    const formData = new FormData();

    Object.entries(fields).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    if (tags) {
      formData.append("tags", Array.isArray(tags) ? tags.join(",") : tags);
    }

    if (coverImageUri) {
      formData.append("coverImage", {
        uri: coverImageUri,
        name: coverImageName,
        type: coverImageMime,
      });
    }

    const response = await apiClient.patch(`/api/events/${eventId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  /**
   * Delete an event (creator only).
   * @param {string} eventId
   */
  deleteEvent: async (eventId) => {
    const response = await apiClient.delete(`/api/events/${eventId}`);
    return response.data;
  },

  /**
   * RSVP to an event.
   * @param {string} eventId
   * @param {'going'|'interested'|'not_going'} status
   */
  rsvpEvent: async (eventId, status) => {
    const response = await apiClient.post(`/api/events/${eventId}/rsvp`, { status });
    return response.data;
  },

  /**
   * Get all events the current user has created or is attending.
   * @returns {{ created: Event[], attending: Event[] }}
   */
  getMyEvents: async () => {
    const response = await apiClient.get("/api/events/mine");
    return response.data;
  },
};

export default EventService;
