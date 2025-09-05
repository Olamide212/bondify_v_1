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

import RadioSelect from "../../../../components/inputs/RadioSelect";
import Info from "../../../../components/ui/Info";
import { ScrollView } from "react-native-gesture-handler";
import Button from "../../../../components/ui/Button"


const Religion = () => {
  const [gender, setGender] = useState("");

  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-1 px-2">
            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="flex-1 mt-8">
                <Text className="text-3xl font-SatoshiBold text-app mb-2">
                  Your religion or spiritual belief?
                </Text>

                <View>
                  <RadioSelect
                    value={gender}
                    onChange={setGender}
                    options={[
                      { label: "Christian", value: "christian" },
                      { label: "Catholic", value: "catholic" },
                      { label: "Islam", value: "muslim" },
                      { label: "Hinduism", value: "hindu" },
                      { label: "Buddhism", value: "Buddhism" },
                      { label: "Judaism", value: "Judaism" },
                      { label: "Sikhism", value: "Sikhism" },
                      {
                        label: "Spiritual but not religious",
                        value: "spiritual",
                      },
                      { label: "Atheist", value: "Atheist" },
                      { label: "Agnostic", value: "Agnostic" },
                      { label: "Prefer not to say", value: "prefer not say" },
                      { label: "Others", value: "others" },
                    ]}
                    className="mt-2"
                  />
                </View>
                <Info title="You can change this details later from your profile" />
              </View>
            </ScrollView>
            <View className="w-full items-end mt-4">
              <Button
                title="Continue"
                variant="gradient"
                onPress={() => router.push("/religion-question")}
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Religion;
