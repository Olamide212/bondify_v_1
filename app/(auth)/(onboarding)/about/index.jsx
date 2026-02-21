import React, { useState } from "react";
import {
  SafeAreaView,
  Text,
  View,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  TextInput,
} from "react-native";
import NextButton from "../../../../components/ui/NextButton";
import { useRouter } from "expo-router";
import Info from "../../../../components/ui/Info";
import { Video, Mic } from "lucide-react-native";
import Button from "../../../../components/ui/Button"
import { useProfileSetup } from "../../../../hooks/useProfileSetup";


const About = () => {
  const [aboutText, setAboutText] = useState("");
  const router = useRouter();
  const { updateProfileStep } = useProfileSetup({ isOnboarding: true });


  // const preDefineText = {
  //   "", "", ""
  // }


  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-1 px-3">
            <View className="flex-1 mt-8">
              <Text className="text-3xl font-SatoshiBold  mb-4">
                Tell us a little about yourself
              </Text>

              <TextInput
                placeholder="Write your cool intro here..."
                placeholderTextColor="#999"
                value={aboutText}
                onChangeText={setAboutText}
                multiline
                numberOfLines={10}
                style={{
                  backgroundColor: "#f1f1f1",
                  color: "#000",
                  height: 100,
                  padding: 16,
                  borderRadius: 12,
                  textAlignVertical: "top",
                  fontSize: 16,
                }}
              />



            {/*  <View className="mt-4 p-4 rounded-2xl ">
                <Text className="text-center text-xl font-SatoshiMedium">
                  Or you can answer with
                </Text>

                <View className="flex-row  justify-between items-center rounded-lg my-8">
                  <View className="bg-pink-50 p-8 rounded-lg flex-row items-center gap-3 relative">
                    <Video color="#FF0066" />
                    <Text className="text-2xl font-SatoshiMedium">Video</Text>

                    <View className="absolute bottom-[75px] ">
                      <Text className="bg-primary py-1 px-3 text-xs text-white rounded-s-full rounded-se-full font-SatoshiBold">
                        Recommended
                      </Text>
                    </View>
                  </View>
                  <View className="bg-pink-50 p-8 rounded-lg flex-row items-center gap-3">
                    <Mic color="#FF0066" />
                    <Text className="text-2xl font-SatoshiMedium">Audio</Text>
                  </View>
                </View>
                <View className=" p-4 bg-pink-50 border-[0.2px] border-primary rounded-lg flex-row items-center gap-3">
                  <View className="w-10 h-10 bg-primary justify-center items-center rounded-full">
                    <Video size={20} color="white" />
                  </View>

                  <Text className="text-lg font-SatoshiMedium flex-1">
                    Answering with a video will boost your profile visibility
                    and help you find a relationship faster
                  </Text>
                </View>
              </View>*/}
            </View>

            <View className="w-full items-end pb-6">
              <Button
                title="Continue"
                variant="gradient"
                onPress={async () => {
                  await updateProfileStep({ bio: aboutText });
                  router.push("/interests");
                }}
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default About;
