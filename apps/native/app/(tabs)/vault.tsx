import { useDeferredValue, useState } from "react";
import {
  FlatList,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { Chip, Searchbar, Text } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { appIconSource } from "@/components/app-icon";
import { DocumentCard } from "@/components/document-card";
import { EmptyVault } from "@/components/empty-vault";
import { PageHeader, Screen } from "@/components/screen";
import { useVault } from "@/contexts/vault-context";
import { colors, radii, spacing, typography } from "@/lib/theme";
import {
  DOCUMENT_KIND_DEFINITIONS,
  type DocumentKind,
  type VaultDocument,
} from "@/types/document";

type Filter = "all" | DocumentKind;

export default function VaultScreen() {
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
    <Screen
      scroll={false}
      style={[styles.screenContent, { paddingTop: Math.max(insets.top, spacing.xl) }]}
    >
      <PageHeader
        title="Vault"
        showSettings
      />

      <Searchbar
        value={query}
        onChangeText={setQuery}
        placeholder="Search documents"
        accessibilityLabel="Search documents"
        clearAccessibilityLabel="Clear search"
        returnKeyType="search"
        elevation={0}
        icon={appIconSource("search")}
        clearIcon={appIconSource("close")}
        iconColor={colors.forest}
        placeholderTextColor={colors.inkMuted}
        inputStyle={styles.searchInput}
        style={styles.searchBox}
      />

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
        <Text style={styles.resultCount}>
          {filtered.length} {filtered.length === 1 ? "DOCUMENT" : "DOCUMENTS"}
        </Text>
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
        keyboardDismissMode="on-drag"
        ListEmptyComponent={<EmptyVault compact />}
      />
    </Screen>
  );
}

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Chip
      mode={active ? "flat" : "outlined"}
      selected={active}
      showSelectedCheck={false}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.chip, active ? styles.chipActive : null]}
      textStyle={[styles.chipText, active ? styles.chipTextActive : null]}
    >
      {label}
    </Chip>
  );
}

const styles = StyleSheet.create({
  screenContent: { paddingBottom: 0 },
  searchBox: {
    height: 56,
    borderRadius: radii.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.rule,
  },
  searchInput: {
    color: colors.ink,
    fontFamily: typography.body,
    fontSize: 15,
    minHeight: 0,
  },
  filters: { gap: spacing.sm, paddingVertical: spacing.lg },
  chip: {
    borderColor: colors.rule,
    borderRadius: radii.full,
    backgroundColor: colors.card,
  },
  chipActive: { backgroundColor: colors.signal, borderColor: colors.signal },
  chipText: {
    color: colors.inkMuted,
    fontFamily: typography.label,
    fontSize: 12,
    letterSpacing: 0,
  },
  chipTextActive: { color: colors.forestDark },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  resultCount: {
    color: colors.forestDark,
    fontFamily: typography.label,
    fontSize: 12,
    letterSpacing: 0.5,
  },
  list: { flexGrow: 1, paddingTop: spacing.xs },
  column: { alignItems: "stretch" },
  cell: { paddingHorizontal: spacing.sm, paddingBottom: spacing.lg },
});
