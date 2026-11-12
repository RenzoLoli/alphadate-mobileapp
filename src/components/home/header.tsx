import { useMemo } from "react";

import { TouchableOpacity, View } from "react-native";

import { PlusSquare } from "lucide-react-native";

import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";

interface HomeHeaderProps {
  onPressPlus?: () => void;
}

const messages = [
  "¡Qué lindo día para una cita!",
  "Interesante...",
  "Sí... sabes que quieres.",
  "¿Por qué no?",
  "¡Bienvenido a Alphadate!",
];

export default function HomeHeader({ onPressPlus }: HomeHeaderProps) {
  const getRandomMessage = useMemo(() => {
    return () => messages[Math.floor(Math.random() * messages.length)];
  }, []);

  return (
    <View className="fixed flex-row items-center justify-between gap-1 rounded-md py-4">
      <Text className="text-xl font-medium">{getRandomMessage()}</Text>
      <TouchableOpacity
        onPress={onPressPlus}
        className="mx-2 flex-row items-center gap-4"
      >
        <Icon as={PlusSquare} size={64} />
      </TouchableOpacity>
    </View>
  );
}
