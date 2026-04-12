import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { useDispatch, useSelector } from "react-redux";
import GlobalPhoneInput from "../../../components/inputs/PhoneInput";
import TextInput from "../../../components/inputs/TextInput";
import Button from "../../../components/ui/Button";
import { useToast } from "../../../context/ToastContext";
import { signup } from "../../../slices/authSlice";

const Register = () => {
  const [formData, setFormData] = useState({
    countryCode: "",
    phone: "",
    firstName: "",
    lastName: "",
    userName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.auth);
  const { showToast } = useToast();
  const router = useRouter();

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const { firstName, lastName, userName, phone, email, password, confirmPassword } = formData;
    const newErrors = {};

    if (!firstName.trim()) newErrors.firstName = "First name is required";
    if (!lastName.trim()) newErrors.lastName = "Last name is required";
    if (!userName.trim()) newErrors.userName = "Username is required";
    if (!email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Enter a valid email";
    if (!phone) newErrors.phone = "Phone number is required";
    else if (!/^\d{10}$/.test(phone)) newErrors.phone = "Must be exactly 10 digits";
    if (!password) newErrors.password = "Password is required";
    else if (password.length < 8) newErrors.password = "Minimum 8 characters";
    if (!confirmPassword) newErrors.confirmPassword = "Please confirm your password";
    else if (password !== confirmPassword) newErrors.confirmPassword = "Passwords do not match";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validateForm()) {
      showToast({
        message: "Please fix the errors above",
        variant: "error",
      });
      return;
    }

    const { firstName, lastName, userName, phone, countryCode, email, password } = formData;

    try {
      await dispatch(
        signup({
          firstName,
          lastName,
          userName,
          email,
          phoneNumber: `${phone}`,
          countryCode: countryCode,
          password,
        })
      ).unwrap();

      router.push("/validation");
    } catch (errMessage) {
      showToast({
        message: errMessage || "Signup failed",
        variant: "error",
      });
    }
  };

  return (
    <SafeAreaView style={{flex: 1}} className="bg-[#121212]" >
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{flex: 1}} className="px-5">
            {/* Scrollable Inputs */}
            <ScrollView
              contentContainerStyle={{ paddingBottom: 20 }}
              showsVerticalScrollIndicator={false}
            >
              <Text className="text-3xl font-PlusJakartaSansBold text-white mt-4 mb-1">
                Join Bondies
              </Text>
              <Text className="text-white text-lg font-PlusJakartaSansMedium mb-7">
                Find your perfect match with just a few steps. Sign up now and
                join millions of people finding love on Bondies.
              </Text>




              <TextInput
                placeholder="First name"
                value={formData.firstName}
                onChangeText={(text) => handleChange("firstName", text)}
                error={errors.firstName}
              />

              <TextInput
                placeholder="Last name"
                value={formData.lastName}
                onChangeText={(text) => handleChange("lastName", text)}
                error={errors.lastName}
              />

              <View>
                <TextInput
                  placeholder="Username/Display name"
                  value={formData.userName}
                  onChangeText={(text) => handleChange("userName", text)}
                  error={errors.userName}
                />
              </View>
              {/* 📱 Phone Input */}
              <GlobalPhoneInput
                phoneNumber={formData.phone}
                countryCode={formData.countryCode}
                onChangePhoneNumber={(digits) => handleChange("phone", digits)}
                onChangeCountryCode={(code) =>
                  handleChange("countryCode", code)
                }
                error={errors.phone}
              />

              <TextInput
                placeholder="Enter your email address"
                keyboardType="email-address"
                autoCapitalize="none"
                value={formData.email}
                onChangeText={(text) => handleChange("email", text)}
                error={errors.email}
              />

              <TextInput
                placeholder="Create a password (min 8 characters)"
                value={formData.password}
                onChangeText={(text) => handleChange("password", text)}
                secureTextEntry
                error={errors.password}
              />

              <TextInput
                placeholder="Confirm password"
                value={formData.confirmPassword}
                onChangeText={(text) => handleChange("confirmPassword", text)}
                secureTextEntry
                error={errors.confirmPassword}
              />
              {/* Footer */}
              <View className="pb-6">
                <Button
                  title="Create Account"
                  variant="primary"
                  loading={loading}
                  onPress={handleSignup}
                />

                <View className="flex-row justify-center items-center gap-1 mt-4">
                  <Text className="text-lg text-white font-PlusJakartaSansMedium">
                    Already have an account?
                  </Text>
                  <Pressable onPress={() => router.push("/login")}>
                    <Text className="text-lg font-PlusJakartaSansMedium text-primary">
                      Login
                    </Text>
                  </Pressable>
                 
                </View>
                 {/* <Pressable className='mt-5 text-center px-3 py-4 bg-black text-white rounded'  onPress={() => router.push("/favorite-videos")}>
                    <Text className='text-white text-center'>Go to About</Text>
                  </Pressable> */}
              </View>
            </ScrollView>


          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Register;
