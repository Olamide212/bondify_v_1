// data/mockData.js
export const matchedUsers = [
  {
    id: "1",
    name: "Emma",
    profileImage:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=600&fit=crop",
    isOnline: true,
    matchedDate: new Date(Date.now() - 86400000 * 2),
    lastMessage:
      "It's the Bear Mountain trail! We should go together sometime ☺️",
    unread: 0,
  },
  {
    id: "2",
    name: "Sophia",
    profileImage:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop",
    isOnline: true,
    matchedDate: new Date(Date.now() - 86400000 * 3),
    lastMessage: "Are you free this weekend?",
    unread: 2,
  },
  {
    id: "3",
    name: "Olivia",
    profileImage:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=600&fit=crop",
    isOnline: false,
    matchedDate: new Date(Date.now() - 86400000 * 5),
    lastMessage: "Thanks for the recommendation!",
    unread: 0,
  },
  {
    id: "4",
    name: "Liam",
    profileImage:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop",
    isOnline: true,
    matchedDate: new Date(Date.now() - 86400000 * 1),
    lastMessage: "Where should we meet?",
    unread: 1,
  },
  {
    id: "5",
    name: "Liam",
    profileImage:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop",
    isOnline: true,
    matchedDate: new Date(Date.now() - 86400000 * 1),
    lastMessage: "Where should we meet?",
    unread: 1,
  },
];

export const initialMessages = [
  {
    id: "1",
    text: "Hey! Thanks for the super like! 😊",
    timestamp: new Date(Date.now() - 86400000),
    sender: "them",
    status: "read",
    type: "text",
  },
  {
    id: "2",
    text: "You're welcome! I loved your profile, especially the hiking photos 🏔️",
    timestamp: new Date(Date.now() - 86400000 + 300000),
    sender: "me",
    status: "read",
    type: "text",
  },
  {
    id: "3",
    text: "That's so sweet! I actually just got back from a weekend trip to the mountains",
    timestamp: new Date(Date.now() - 86400000 + 600000),
    sender: "them",
    status: "read",
    type: "text",
  },
  {
    id: "4",
    imageUrl:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop",
    timestamp: new Date(Date.now() - 86400000 + 900000),
    sender: "them",
    status: "read",
    type: "image",
  },
  {
    id: "5",
    text: "Wow, that view is incredible! Which trail was that?",
    timestamp: new Date(Date.now() - 3600000),
    sender: "me",
    status: "delivered",
    type: "text",
  },
  {
    id: "6",
    text: "It's the Bear Mountain trail! We should go together sometime ☺️",
    timestamp: new Date(Date.now() - 1800000),
    sender: "them",
    status: "read",
    type: "text",
  },
  {
    id: "7",
    voiceNote: true,
    voiceDuration: 15,
    timestamp: new Date(Date.now() - 300000),
    sender: "me",
    status: "sent",
    type: "voice",
  },
];
