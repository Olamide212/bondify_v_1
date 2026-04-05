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
    icon: <HeartHandshake size={24} color={'#fff'} />,
    title: "Be Respectful",
    description: "Treat others with kindness and courtesy.",
  },
  {
    icon: <MessageCircleMore size={24} color={'#fff'}/>,
    title: "Authentic Conversations",
    description: "Be yourself and engage in honest conversations.",
  },
  {
    icon: <ThumbsDown size={24} color={'#fff'} />,
    title: "No Harassment",
    description: "Hate speech, bullying, or harassment won’t be tolerated.",
  },
  {
    icon: <ShieldCheck size={24} color={'#fff'} />,
    title: "Stay Safe",
    description:
      "Protect your personal information and report suspicious behavior.",
  },
  {
    icon: <Smile size={24} color={'#fff'} />,
    title: "Spread Positivity",
    description: "Create a welcoming space for everyone.",
  },
];
