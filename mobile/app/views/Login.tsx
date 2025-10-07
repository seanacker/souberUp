import React from "react";
import { View, Text, TextInput, Button } from "react-native";
import { useAuth } from "../auth/AuthContext";

export function LoginScreen() {
  const { signIn } = useAuth();
  const [phone, setPhone] = React.useState<string>();
  const [password, setPassword] = React.useState<string>();
  const [error, setError] = React.useState<string | null>(null);

  const onSubmit = async () => {
    setError(null);
    if (!phone || !password) return
    try {
      await signIn(phone, password);
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <View style={{ padding: 24 }}>
      <Text>Login</Text>
      <TextInput
        placeholder="+49…"
        value={phone}
        onChangeText={setPhone}
        autoCapitalize="none"
        keyboardType="phone-pad"
        style={{ borderWidth: 1, marginTop: 12, padding: 8 }}
      />
      <TextInput
        placeholder="password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{ borderWidth: 1, marginTop: 12, padding: 8 }}
      />
      {error ? <Text style={{ color: "red" }}>{error}</Text> : null}
      <Button title="Sign in" onPress={onSubmit} disabled={!password || !phone}/>
    </View>
  );
}
