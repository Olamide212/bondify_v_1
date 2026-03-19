import React, { useState } from "react";
import {
  SafeAreaView,
  Text,
  View,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import NextButton from "../../../../components/ui/NextButton";
import { useRouter } from "expo-router";
import TextInput from "../../../../components/inputs/TextInput";
import Info from "../../../../components/ui/Info";
import AccordionItem from "../../../../components/ui/AccordionItem";
import { useProfileSetup } from "../../../../hooks/useProfileSetup";
import Button from "../../../../components/ui/Button";
import { ScrollView } from "react-native-gesture-handler";

const ProfileAnswers = () => {
  const [answers, setAnswers] = useState({});
  const { updateProfileStep } = useProfileSetup({ isOnboarding: true });

  const router = useRouter();

  const updateAnswer = (question, answer) => {
    setAnswers((prev) => ({ ...prev, [question]: answer }));
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
      >
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false} paddingBottom={20}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-1 px-2">
            <View className="flex-1 mt-8">
              <Text className="text-[25px] font-PlusJakartaSansBold text-app mb-2">
                Write your profile answers
              </Text>
              <Text className="text-black font-PlusJakartaSans">
                Select a prompt that excites you in the list below and write your
                answers
              </Text>

              <View className="mt-4">
                <AccordionItem question="What’s one thing you’re currently obsessed with?">
                  <TextInput placeholder="Type your answer..." value={answers["What’s one thing you’re currently obsessed with?"] || ""} onChangeText={(text) => updateAnswer("What’s one thing you’re currently obsessed with?", text)} />
                </AccordionItem>

                <AccordionItem question="What makes you laugh the most...">
                  <TextInput placeholder="Type your answer..." value={answers["What makes you laugh the most..."] || ""} onChangeText={(text) => updateAnswer("What makes you laugh the most...", text)} />
                </AccordionItem>

                <AccordionItem question="What's a fun fact about you?">
                  <TextInput placeholder="Type your answer..." value={answers["What's a fun fact about you?"] || ""} onChangeText={(text) => updateAnswer("What's a fun fact about you?", text)} />
                </AccordionItem>
                <AccordionItem question="My biggest obsession in life is...">
                  <TextInput placeholder="Type your answer..." value={answers["My biggest obsession in life is..."] || ""} onChangeText={(text) => updateAnswer("My biggest obsession in life is...", text)} />
                </AccordionItem>
                <AccordionItem question="One thing i am looking for in a partner..">
                  <TextInput placeholder="Type your answer..." value={answers["One thing i am looking for in a partner.."] || ""} onChangeText={(text) => updateAnswer("One thing i am looking for in a partner..", text)} />
                </AccordionItem>
              </View>
              <Info title="Pick a maximum of 3 questions for your profile" />
            </View>

            <View className="w-full items-end pb-6 mt-6">
              <Button
                title="Continue"
                variant="primary"
                disabled={Object.values(answers).filter((a) => a.trim() !== "").length === 0}
                onPress={async () => {
                  const questions = Object.entries(answers)
                    .filter(([, answer]) => answer.trim() !== "")
                    .map(([question, answer]) => ({ question, answer }));
                  await updateProfileStep({ questions });
                  router.push("/upload-photo");
              }} />
            </View>
          </View>
        </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ProfileAnswers;
