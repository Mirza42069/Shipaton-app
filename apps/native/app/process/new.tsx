import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { Button, IconButton, Text, TextInput } from "react-native-paper";

import { appIconSource } from "@/components/app-icon";
import { MaterialCard, PageHeader, Screen, SectionHeading } from "@/components/screen";
import { useProcesses } from "@/contexts/process-context";
import { colors, radii, spacing, typography } from "@/lib/theme";

export default function NewProcessScreen() {
  const router = useRouter();
  const { createCustom } = useProcesses();
  const [title, setTitle] = useState("");
  const [requirements, setRequirements] = useState([""]);
  const [saving, setSaving] = useState(false);

  function updateRequirement(index: number, value: string) {
    setRequirements((current) => current.map((item, itemIndex) => itemIndex === index ? value : item));
  }

  async function save() {
    const validRequirements = requirements.map((item) => item.trim()).filter(Boolean);
    if (!title.trim() || !validRequirements.length || saving) return;
    setSaving(true);
    try {
      const id = await createCustom(title, validRequirements);
      router.replace({ pathname: "/process/[id]", params: { id } });
    } catch (error) {
      Alert.alert("Process not created", error instanceof Error ? error.message : "Try again.");
      setSaving(false);
    }
  }

  return (
    <Screen style={styles.content}>
      <PageHeader eyebrow="CUSTOM CHECKLIST" title="Create a process" detail="Add every proof or requirement you need to prepare." />
      <MaterialCard style={styles.form}>
        <TextInput mode="outlined" label="Process name" value={title} onChangeText={setTitle} maxLength={100} disabled={saving} style={styles.input} />
      </MaterialCard>

      <View style={styles.requirements}>
        <SectionHeading title="Requirements" detail="You can edit and reorder these later" />
        <MaterialCard style={styles.requirementList}>
          {requirements.map((requirement, index) => (
            <View key={index} style={[styles.requirement, index > 0 ? styles.divider : null]}>
              <View style={styles.number}><Text style={styles.numberText}>{String(index + 1).padStart(2, "0")}</Text></View>
              <TextInput
                mode="flat"
                value={requirement}
                onChangeText={(value) => updateRequirement(index, value)}
                placeholder="e.g. Proof of address"
                maxLength={100}
                disabled={saving}
                style={styles.requirementInput}
                underlineStyle={styles.noUnderline}
              />
              {requirements.length > 1 ? (
                <IconButton
                  icon={appIconSource("delete")}
                  iconColor={colors.rust}
                  size={19}
                  disabled={saving}
                  accessibilityLabel={`Remove requirement ${index + 1}`}
                  onPress={() => setRequirements((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                />
              ) : null}
            </View>
          ))}
        </MaterialCard>
        <Button
          mode="outlined"
          icon={appIconSource("add")}
          disabled={saving || requirements.length >= 30}
          onPress={() => setRequirements((current) => [...current, ""])}
          style={styles.addButton}
        >
          Add requirement
        </Button>
      </View>

      <Button
        mode="contained"
        icon={appIconSource("check-circle")}
        loading={saving}
        disabled={saving || !title.trim() || !requirements.some((item) => item.trim())}
        onPress={() => void save()}
        contentStyle={styles.saveContent}
        style={styles.saveButton}
      >
        Start process
      </Button>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { width: "100%", maxWidth: 720, alignSelf: "center" },
  form: { padding: spacing.lg },
  input: { backgroundColor: colors.card },
  requirements: { marginTop: spacing.xxxl },
  requirementList: { marginBottom: spacing.lg },
  requirement: { minHeight: 76, flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingHorizontal: spacing.md },
  divider: { borderTopWidth: 1, borderTopColor: colors.rule },
  number: { width: 38, height: 38, borderRadius: radii.full, alignItems: "center", justifyContent: "center", backgroundColor: colors.forestSoft },
  numberText: { color: colors.forestDark, fontFamily: typography.label, fontSize: 10 },
  requirementInput: { flex: 1, backgroundColor: colors.card, fontFamily: typography.body },
  noUnderline: { backgroundColor: "transparent" },
  addButton: { alignSelf: "flex-start", borderRadius: radii.full, borderColor: colors.forest },
  saveButton: { borderRadius: radii.full, marginTop: spacing.xxxl },
  saveContent: { minHeight: 58 },
});
