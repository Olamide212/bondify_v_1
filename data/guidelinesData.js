import {
  HeartHandshake,
  MessageCircleMore,
  ThumbsDown,
  ShieldCheck,
  Smile,
} from "lucide-react-native";
import {colors} from "../constant/colors"


export const guidelines = [
  {
    icon: <HeartHandshake size={24} color={'#000'} />,
    title: "Be Respectful",
    description: "Treat others with kindness and courtesy.",
  },
  {
    icon: <MessageCircleMore size={24} color={'#000'}/>,
    title: "Authentic Conversations",
    description: "Be yourself and engage in honest conversations.",
  },
  {
    icon: <ThumbsDown size={24} color={'#000'} />,
    title: "No Harassment",
    description: "Hate speech, bullying, or harassment won’t be tolerated.",
  },
  {
    icon: <ShieldCheck size={24} color={'#000'} />,
    title: "Stay Safe",
    description:
      "Protect your personal information and report suspicious behavior.",
  },
  {
    icon: <Smile size={24} color={'#000'} />,
    title: "Spread Positivity",
    description: "Create a welcoming space for everyone.",
  },
];
