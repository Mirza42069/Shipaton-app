import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useDeferredValue, useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DocumentCard } from "@/components/document-card";
import { EmptyVault } from "@/components/empty-vault";
import { useVault } from "@/contexts/vault-context";
import { colors, typography } from "@/lib/theme";
import {
  DOCUMENT_KIND_DEFINITIONS,
  type DocumentKind,
  type VaultDocument,
} from "@/types/document";

type Filter = "all" | DocumentKind;

export default function VaultScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { documents } = useVault();
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const [filter, setFilter] = useState<Filter>("all");
  const columns = width >= 1050 ? 3 : width >= 680 ? 2 : 1;
  const filtered = documents.filter((document) => {
    const matchesKind = filter === "all" || document.kind === filter;
    const matchesQuery =
      !deferredQuery ||
      document.title.toLowerCase().includes(deferredQuery) ||
      document.originalName.toLowerCase().includes(deferredQuery) ||
      document.notes.toLowerCase().includes(deferredQuery);
    return matchesKind && matchesQuery;
  });

  function renderDocument({ item }: { item: VaultDocument }) {
    return (
      <View style={[styles.cell, columns > 1 ? { width: `${100 / columns}%` } : null]}>
        <DocumentCard document={item} />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: Math.max(insets.top, 18) }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>ENCRYPTED INDEX</Text>
          <Text style={styles.title}>The vault</Text>
        </View>
        <Pressable
          accessibilityLabel="Add document"
          onPress={() => router.push("/add")}
          style={({ pressed }) => [styles.add, pressed && styles.pressed]}
        >
          <Ionicons name="add" size={26} color={colors.signal} />
        </Pressable>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={20} color={colors.inkMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search names, notes, file names"
          placeholderTextColor={colors.inkMuted}
          style={styles.searchInput}
          returnKeyType="search"
        />
        {query ? (
          <Pressable onPress={() => setQuery("")} hitSlop={8}>
            <Ionicons name="close-circle" size={20} color={colors.inkMuted} />
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
      >
        <FilterChip label="All" active={filter === "all"} onPress={() => setFilter("all")} />
        {DOCUMENT_KIND_DEFINITIONS.map((kind) => (
          <FilterChip
            key={kind.value}
            label={kind.label}
            active={filter === kind.value}
            onPress={() => setFilter(kind.value)}
          />
        ))}
      </ScrollView>

      <View style={styles.resultRow}>
        <Text style={styles.resultCount}>{filtered.length} FILES</Text>
        <Text style={styles.resultRule}>LOCAL / AES-256</Text>
      </View>

      <FlatList
        key={columns}
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderDocument}
        numColumns={columns}
        contentContainerStyle={[styles.list, { paddingBottom: Math.max(insets.bottom, 20) + 92 }]}
        columnWrapperStyle={columns > 1 ? styles.column : undefined}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<EmptyVault compact />}
      />
    </View>
  );
}

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active ? styles.chipActive : null]}>
      <Text style={[styles.chipText, active ? styles.chipTextActive : null]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  header: {
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  eyebrow: {
    color: colors.forest,
    fontFamily: typography.label,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.7,
  },
  title: {
    color: colors.ink,
    fontFamily: typography.display,
    fontSize: 38,
    fontWeight: "700",
    letterSpacing: -1,
    marginTop: 2,
  },
  add: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.forest,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: { transform: [{ scale: 0.96 }] },
  searchBox: {
    marginHorizontal: 20,
    minHeight: 51,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.rule,
    paddingHorizontal: 15,
  },
  searchInput: {
    flex: 1,
    color: colors.ink,
    fontFamily: typography.body,
    fontSize: 14,
    paddingVertical: 14,
  },
  filters: { gap: 8, paddingHorizontal: 20, paddingVertical: 16 },
  chip: {
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: colors.rule,
    borderRadius: 20,
    backgroundColor: colors.card,
  },
  chipActive: { backgroundColor: colors.forest, borderColor: colors.forest },
  chipText: {
    color: colors.inkMuted,
    fontFamily: typography.label,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  chipTextActive: { color: colors.signal },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  resultCount: {
    color: colors.rust,
    fontFamily: typography.label,
    fontWeight: "800",
    fontSize: 11,
    letterSpacing: 1.1,
  },
  resultRule: {
    color: colors.inkMuted,
    fontFamily: typography.label,
    fontSize: 10,
    letterSpacing: 1,
  },
  list: { flexGrow: 1, paddingHorizontal: 10, paddingTop: 8 },
  column: { alignItems: "stretch" },
  cell: { paddingHorizontal: 10, paddingBottom: 28 },
});
