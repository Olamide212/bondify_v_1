import { View, Text, TouchableOpacity, Modal, FlatList, TextInput } from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Plus } from "lucide-react-native";
import Button from "../../components/ui/Button"

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

const MySelf = () => {
  const [answers, setAnswers] = useState([]); // store {question, answer}
  const [showModal, setShowModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [answer, setAnswer] = useState("");

  const handleSave = () => {
    if (!selectedQuestion || !answer.trim()) return;

    // Add to answers list
    setAnswers((prev) => [
      ...prev,
      { question: selectedQuestion, answer },
    ]);

    // Reset modal state
    setShowModal(false);
    setSelectedQuestion(null);
    setAnswer("");
  };

  return (
    <View className="px-6 py-4 bg-[#121212] mx-4 rounded-2xl mt-4">
      <Text className="mb-2 font-PlusJakartaSansMedium text-lg text-gray-400">
        My Answers
      </Text>

      {/* Show answers */}
      {answers.length > 0 ? (
        answers.map((item, index) => (
          <View key={index} className="mb-4">
            <Text className="text-white text-2xl font-PlusJakartaSansMedium mb-1">
              {item.question}
            </Text>
            <Text className="font-PlusJakartaSans text-lg text-gray-300">
              {item.answer}
            </Text>
          </View>
        ))
      ) : (
        <Text className="text-gray-400  font-PlusJakartaSansMedium">No answers yet.</Text>
      )}

      {/* Add Question Button */}
      <TouchableOpacity onPress={() => setShowModal(true)}>
        <View className="flex-row justify-between items-center mt-2">
          <Text className="font-PlusJakartaSansBold text-primary text-lg">
            Add a question...
          </Text>
          <View className="w-6 h-6 rounded-full bg-primary items-center justify-center">
            <Plus size={14} color="#fff" />
          </View>
        </View>
      </TouchableOpacity>

      {/* Modal */}
      <Modal visible={showModal} animationType="slide">
        <SafeAreaView style={{flex: 1}} className="bg-[#121212] p-6">
          {!selectedQuestion ? (
            <>
              
              <Text className="text-xl text-center font-PlusJakartaSansBold mb-4">
                Choose a question
              </Text>
              <FlatList
                data={QUESTIONS}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    className="p-3 pb-4 border-b border-gray-600"
                    onPress={() => setSelectedQuestion(item)}
                  >
                    <Text className="text-lg font-PlusJakartaSansMedium">{item}</Text>
                  </TouchableOpacity>
                )}
              />
            </>
          ) : (
            <>
              <Text className="text-xl text-center font-PlusJakartaSansBold mb-4">
                {selectedQuestion}
              </Text>
              <TextInput
                placeholder="Type your answer..."
                value={answer}
                onChangeText={setAnswer}
                className="border border-gray-600 rounded-lg p-3 text-lg font-PlusJakartaSansMedium mb-4"
                multiline
              />
              <TouchableOpacity
                onPress={() => setSelectedQuestion(null)}
                className="mt-3"
              >
                <Text className="text-primary font-PlusJakartaSansMedium text-center">
                  Choose another question
                </Text>
              </TouchableOpacity>
          
              <Button
                className="border border-primary bg-[#121212] mt-4"
                variant="secondary"
                title="Save Answer"
                onPress={handleSave}
              />
            </>
          )}

          <Button
            className="mt-4 "
            title="Cancel"
            variant="primary"
            onPress={() => setShowModal(false)}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
};

export default MySelf;
