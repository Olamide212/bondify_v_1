import { Plus } from "lucide-react-native";
import { useState } from "react";
import { FlatList, Modal, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "../ui/Button";

const QUESTIONS = [
  "What’s your love language?",
  "What’s your perfect first date?",
  "What’s your biggest passion?",
  "What are you currently reading?",
  "What makes you laugh the most?",
  "What’s your dream travel destination?",
  "What’s a fun fact about you?",
  "What’s your go-to comfort food?",
  "What song always lifts your mood?",
  "What’s the best advice you’ve ever received?",
  "What’s something on your bucket list?",
  "What do you value most in a relationship?",
];

const ProfileAnswers = ({ profile, onUpdateField }) => {
  const [answers, setAnswers] = useState(profile?.questions || []); // store {question, answer}
  const [showModal, setShowModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [answer, setAnswer] = useState("");

  const handleSave = async () => {
    if (!selectedQuestion || !answer.trim()) return;

    const updatedAnswers = [
      ...answers,
      { question: selectedQuestion, answer },
    ];

    setAnswers(updatedAnswers);
    await onUpdateField?.("questions", updatedAnswers);

    // Reset modal state
    setShowModal(false);
    setSelectedQuestion(null);
    setAnswer("");
  };

  return (
    <View className="px-6 py-4 bg-white mx-4 rounded-2xl mt-4">
      {/* Show answers */}
      {answers.length > 0 ? (
        answers.map((item, index) => (
          <View key={index} className="mb-4">
            <Text className="text-black text-2xl font-SatoshiMedium mb-1">
              {item.question}
            </Text>
            <Text className="font-Satoshi text-lg text-gray-700">
              {item.answer}
            </Text>
          </View>
        ))
      ) : (
        <Text className="text-gray-400  font-SatoshiMediumItalic">
          No answers yet.
        </Text>
      )}

      {/* Add Question Button */}
      <TouchableOpacity onPress={() => setShowModal(true)}>
        <View className="flex-row justify-between items-center mt-2">
          <Text className="font-SatoshiBold text-primary text-lg">
            Add a question...
          </Text>
          <View className="w-6 h-6 rounded-full bg-primary items-center justify-center">
            <Plus size={14} color="#fff" />
          </View>
        </View>
      </TouchableOpacity>

      {/* Modal */}
      <Modal visible={showModal} animationType="slide">
        <SafeAreaView className="flex-1 bg-white p-6">
          {!selectedQuestion ? (
            <>
              <Text className="text-xl text-center font-SatoshiBold mb-4">
                Choose a question
              </Text>
              <FlatList
                data={QUESTIONS}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    className="p-3 pb-4 border-b border-gray-200"
                    onPress={() => setSelectedQuestion(item)}
                  >
                    <Text className="text-lg font-SatoshiMedium">{item}</Text>
                  </TouchableOpacity>
                )}
              />
            </>
          ) : (
            <>
              <Text className="text-xl text-center font-SatoshiBold mb-4">
                {selectedQuestion}
              </Text>
              <TextInput
                placeholder="Type your answer..."
                value={answer}
                onChangeText={setAnswer}
                className="border-b border-black  px-3 py-5 text-lg font-SatoshiMedium mb-4"
                multiline
              />
              <View className='flex-1 justify-end'>
                <TouchableOpacity
                  onPress={() => setSelectedQuestion(null)}
                  className="mt-3"
                >
                  <Text className="text-primary font-SatoshiMedium text-center">
                    Choose another question
                  </Text>
                </TouchableOpacity>

                <Button
                  className="border border-primary bg-white mt-4"
                  variant="secondary"
                  title="Save Answer"
                  onPress={handleSave}
                />
                <Button
                  className="mt-4 "
                  title="Cancel"
                  variant="primary"
                  onPress={() => setShowModal(false)}
                />
              </View>
            </>
          )}
        </SafeAreaView>
      </Modal>
    </View>
  );
};

export default ProfileAnswers;
