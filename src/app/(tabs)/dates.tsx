import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  AccessibilityInfo,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from "react-native";

import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import {
  CircleCheck,
  Dices,
  Plus,
  Search,
  SlidersHorizontal,
  TriangleAlert,
  X,
} from "lucide-react-native";

import AlphabetWheel from "@/components/home/alphabetWheel";
import DateFormSheet, {
  type DateFormValues,
} from "@/components/home/dateFormSheet";
import RecommendationCard from "@/components/home/recommendationCard";
import { SafeModalContent } from "@/components/shared/SafeModalContent";
import ScreenLayout from "@/components/shared/ScreenLayout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";
import { AlphadateService } from "@/lib/services/api/alphadateApiService";
import { AlphabetDatesResponse } from "@/lib/services/api/responses/alphabetDatesResponse";
import { cn } from "@/lib/utils";
import { type Letter, normalizeLetter } from "@/lib/utils/letters";

type DateItem = AlphabetDatesResponse["dates"][number];

export type DateFormErrors = {
  title?: string;
  description?: string;
  form?: string;
};

const ACCENT_MAP: Record<string, string> = {
  á: "a",
  à: "a",
  ä: "a",
  â: "a",
  ã: "a",
  å: "a",
  é: "e",
  è: "e",
  ë: "e",
  ê: "e",
  í: "i",
  ì: "i",
  ï: "i",
  î: "i",
  ó: "o",
  ò: "o",
  ö: "o",
  ô: "o",
  õ: "o",
  ú: "u",
  ù: "u",
  ü: "u",
  û: "u",
  ñ: "n",
  ç: "c",
  ý: "y",
  ÿ: "y",
};

/**
 * Lowercase and fold accents so "cumpleanos" still finds "cumpleaños".
 *
 * Hand-rolled instead of `String.prototype.normalize` because Hermes does not
 * ship ICU normalization on every runtime this app targets.
 */
function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\u0000-\u007e]/g, (char) => ACCENT_MAP[char] ?? char);
}

function tokenize(query: string): string[] {
  return normalizeText(query).split(/\s+/).filter(Boolean);
}

/**
 * Ranks a title match: an exact hit beats a prefix, a prefix beats a hit in
 * the middle. Used only to order results, never to filter them.
 */
function titleScore(title: string, tokens: string[]): number {
  const value = normalizeText(title);

  let score = 0;

  for (const token of tokens) {
    if (value === token) {
      score += 10;
    } else if (value.startsWith(token)) {
      score += 6;
    } else if (value.includes(token)) {
      score += 4;
    }
  }

  return score;
}

/**
 * Title-only search plus the special filters (initial letter and tags).
 *
 * Every token must appear in the title, in any order, so `cena playa` finds
 * "Cena en la playa". Description and tags are shown on the card but never
 * searched: they are metadata, not the thing the user remembers. Tags live in
 * the filter panel, where they narrow the list instead of guessing the query.
 */
function filterDates(
  dates: DateItem[],
  query: string,
  letter: Letter | undefined,
  selectedTags: string[]
): DateItem[] {
  const tokens = tokenize(query);
  const wantedTags = new Set(selectedTags);

  const filtered = dates.filter((date) => {
    if (letter !== undefined && normalizeLetter(date.letter) !== letter) {
      return false;
    }

    if (
      wantedTags.size > 0 &&
      !date.tags.some((tag) => wantedTags.has(normalizeText(tag)))
    ) {
      return false;
    }

    if (tokens.length === 0) {
      return true;
    }

    const title = normalizeText(date.title);
    return tokens.every((token) => title.includes(token));
  });

  if (tokens.length === 0) {
    return filtered;
  }

  return [...filtered].sort((a, b) => {
    const byScore = titleScore(b.title, tokens) - titleScore(a.title, tokens);
    return byScore !== 0 ? byScore : a.title.localeCompare(b.title);
  });
}

function parseTags(tags: string): string[] {
  return tags
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}

interface FilterChipProps {
  label: string;
  active: boolean;
  /** Screen-reader name; the visual label is often a single letter. */
  accessibilityLabel?: string;
  onPress: () => void;
}

function FilterChip({
  label,
  active,
  accessibilityLabel,
  onPress,
}: FilterChipProps) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={4}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={accessibilityLabel ?? label}
      className={cn(
        "h-8 min-w-8 flex-row items-center justify-center rounded-full border px-3 active:opacity-80",
        active ? "border-primary bg-primary" : "border-border bg-background"
      )}
    >
      <Text
        className={cn(
          "text-xs",
          active
            ? "font-medium text-primary-foreground"
            : "text-muted-foreground"
        )}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function Dates() {
  const router = useRouter();
  const { create } = useLocalSearchParams<{ create?: string }>();

  const [query, setQuery] = useState("");
  const [selectedLetter, setSelectedLetter] = useState<Letter | undefined>();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [success, setSuccess] = useState<string | undefined>();

  const [recommendations, setRecommendations] = useState<DateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | undefined>();

  const [addingId, setAddingId] = useState<string | undefined>();
  const [addError, setAddError] = useState<
    { dateId: string; message: string } | undefined
  >();

  const [editTarget, setEditTarget] = useState<DateItem | undefined>();
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | undefined>();

  const [formVisible, setFormVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<DateFormErrors>({});

  const [filtersVisible, setFiltersVisible] = useState(false);

  const [raffleVisible, setRaffleVisible] = useState(false);
  const [spinToken, setSpinToken] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [raffleResult, setRaffleResult] = useState<DateItem | undefined>();
  const raffleScrollRef = useRef<ScrollView>(null);

  const filteredDates = useMemo(
    () => filterDates(recommendations, query, selectedLetter, selectedTags),
    [recommendations, query, selectedLetter, selectedTags]
  );

  /**
   * Only the letters that actually have recommendations, in alphabetical
   * order. Showing all 26 would turn a one-tap filter into a scavenger hunt.
   */
  const availableLetters = useMemo(() => {
    const letters = new Set<Letter>();

    for (const date of recommendations) {
      const letter = normalizeLetter(date.letter);

      if (letter) {
        letters.add(letter);
      }
    }

    return [...letters].sort((a, b) => a.localeCompare(b));
  }, [recommendations]);

  /**
   * Tags available to filter with, most used first. Derived from every
   * recommendation so the panel does not reshuffle while filtering.
   */
  const availableTags = useMemo(() => {
    const counts = new Map<
      string,
      { key: string; label: string; count: number }
    >();

    for (const date of recommendations) {
      for (const tag of date.tags) {
        const key = normalizeText(tag);
        const entry = counts.get(key);

        if (entry) {
          entry.count += 1;
        } else {
          counts.set(key, { key, label: tag, count: 1 });
        }
      }
    }

    return [...counts.values()].sort(
      (a, b) => b.count - a.count || a.label.localeCompare(b.label)
    );
  }, [recommendations]);

  const activeFilterCount =
    (selectedLetter !== undefined ? 1 : 0) + selectedTags.length;

  const hasActiveFilters = query.trim().length > 0 || activeFilterCount > 0;

  const activeFilterSummary = [
    selectedLetter !== undefined ? `Letra ${selectedLetter.toUpperCase()}` : "",
    ...selectedTags.map(
      (key) => availableTags.find((tag) => tag.key === key)?.label ?? key
    ),
  ]
    .filter(Boolean)
    .join(" · ");

  function toggleTag(key: string) {
    setSelectedTags((prev) =>
      prev.includes(key) ? prev.filter((tag) => tag !== key) : [...prev, key]
    );
  }

  function openFilters() {
    setFiltersVisible(true);
  }

  function closeFilters() {
    setFiltersVisible(false);
  }

  function clearFilters() {
    setQuery("");
    setSelectedLetter(undefined);
    setSelectedTags([]);
    setFiltersVisible(false);
  }

  /** Panel-only reset: the search text belongs to its own field. */
  function clearSpecialFilters() {
    setSelectedLetter(undefined);
    setSelectedTags([]);
  }

  function openRaffle() {
    setRaffleResult(undefined);
    setSpinning(false);
    setRaffleVisible(true);
  }

  function closeRaffle() {
    setRaffleVisible(false);
    setRaffleResult(undefined);
    setSpinning(false);
  }

  function startSpin() {
    if (spinning || availableLetters.length === 0) {
      return;
    }

    setRaffleResult(undefined);
    setSpinning(true);
    setSpinToken((token) => token + 1);
  }

  function handleWheelResult(letter: Letter) {
    if (!raffleVisible) {
      return;
    }

    setSpinning(false);

    const candidates = recommendations.filter(
      (date) => normalizeLetter(date.letter) === letter
    );
    const picked = candidates[Math.floor(Math.random() * candidates.length)];

    if (!picked) {
      return;
    }

    setRaffleResult(picked);
    AccessibilityInfo.announceForAccessibility(`Salió ${picked.title}`);
  }

  const applying = addingId !== undefined || isSavingEdit || isSubmitting;

  const loadRecommendations = useCallback(async () => {
    const alphadateService = new AlphadateService();

    return alphadateService.getAlphabetRecommendations();
  }, []);

  const applyResponse = useCallback((response: AlphabetDatesResponse) => {
    if (!response.ok) {
      // Keep whatever is already on screen: a failed refresh must not wipe it.
      setLoadError(response.message);
      return;
    }

    setRecommendations(response.dates);
    setLoadError(undefined);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const effect = async () => {
        const response = await loadRecommendations();

        if (active) {
          applyResponse(response);
          setLoading(false);
        }
      };

      effect();

      return () => {
        active = false;
      };
    }, [applyResponse, loadRecommendations])
  );

  useEffect(() => {
    if (!success) {
      return;
    }

    const timer = setTimeout(() => setSuccess(undefined), 5000);
    return () => clearTimeout(timer);
  }, [success]);

  // The result lands under the wheel, which on short screens sits below the
  // fold: bring it into view once the card has laid out.
  useEffect(() => {
    if (!raffleResult) {
      return;
    }

    const timer = setTimeout(() => {
      raffleScrollRef.current?.scrollToEnd({ animated: true });
    }, 120);

    return () => clearTimeout(timer);
  }, [raffleResult]);

  // Home's "New" action deep-links here asking for the create form.
  useEffect(() => {
    if (create !== "1") {
      return;
    }

    setSuccess(undefined);
    setTitle("");
    setDescription("");
    setTags("");
    setErrors({});
    setFormVisible(true);
    router.setParams({ create: undefined });
  }, [create, router]);

  async function handleRefresh() {
    if (refreshing) {
      return;
    }

    setRefreshing(true);
    const response = await loadRecommendations();
    applyResponse(response);
    setRefreshing(false);
  }

  async function handleAdd(date: DateItem): Promise<boolean> {
    if (addingId) {
      return false;
    }

    setAddingId(date.dateId);
    setAddError(undefined);
    setSuccess(undefined);

    const alphadateService = new AlphadateService();
    const response = await alphadateService.createAlphabetDate({
      title: date.title,
      description: date.description,
      tags: date.tags,
    });

    setAddingId(undefined);

    if (!response.ok) {
      setAddError({ dateId: date.dateId, message: response.message });
      return false;
    }

    setRecommendations((prev) =>
      prev.filter((item) => item.dateId !== date.dateId)
    );
    setSuccess(`"${date.title}" ya está en tu Alphadate.`);
    return true;
  }

  /** The roulette only closes once the date really made it in. */
  async function handleRaffleAdd(date: DateItem) {
    const added = await handleAdd(date);

    if (added) {
      closeRaffle();
    }
  }

  function openEdit(date: DateItem) {
    setAddError(undefined);
    setEditError(undefined);
    setEditTarget(date);
  }

  /** Editing from the raffle closes it first: the form is its own sheet. */
  function openRaffleEdit(date: DateItem) {
    closeRaffle();
    openEdit(date);
  }

  async function handleEditSave(values: DateFormValues) {
    if (!editTarget || isSavingEdit) {
      return;
    }

    setIsSavingEdit(true);
    setSuccess(undefined);

    const alphadateService = new AlphadateService();
    const response = await alphadateService.createAlphabetDate({
      title: values.title,
      description: values.description,
      tags: values.tags,
    });

    setIsSavingEdit(false);

    if (!response.ok) {
      setEditError(response.message);
      return;
    }

    setRecommendations((prev) =>
      prev.filter((item) => item.dateId !== editTarget.dateId)
    );
    setEditTarget(undefined);
    setSuccess(`"${values.title}" ya está en tu Alphadate.`);
  }

  function validate(): DateFormErrors {
    const nextErrors: DateFormErrors = {};

    if (title.trim().length < 3) {
      nextErrors.title = "Usa al menos 3 caracteres.";
    }

    if (description.trim().length < 3) {
      nextErrors.description = "Usa al menos 3 caracteres.";
    }

    return nextErrors;
  }

  function resetForm() {
    setTitle("");
    setDescription("");
    setTags("");
    setErrors({});
  }

  function openForm() {
    setSuccess(undefined);
    resetForm();
    setFormVisible(true);
  }

  function closeForm() {
    if (isSubmitting) {
      return;
    }

    setFormVisible(false);
    resetForm();
  }

  async function handleCreate() {
    setIsSubmitting(true);

    try {
      const nextErrors = validate();

      if (Object.keys(nextErrors).length > 0) {
        setErrors(nextErrors);
        return;
      }

      const alphadateService = new AlphadateService();
      const response = await alphadateService.createAlphabetDate({
        title: title.trim(),
        description: description.trim(),
        tags: parseTags(tags),
      });

      if (!response.ok) {
        setErrors({ form: response.message });
        return;
      }

      setFormVisible(false);
      resetForm();
      setSuccess(`"${title.trim()}" ya está en tu Alphadate.`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScreenLayout>
      {/* The sheets and modals below are always mounted, and each one counts as
          a flex item even while hidden. Spacing lives on the inner view so they
          cannot add dead space at the bottom of the screen. */}
      <View className="flex-1">
        <View className="gap-4">
          <View className="flex-row items-center justify-between gap-3">
            <Text variant="h3">Citas</Text>
            <View className="flex-row items-center gap-2">
              <Button
                variant="outline"
                onPress={openRaffle}
                disabled={loading}
                accessibilityLabel="Sortear una cita"
                className="px-3"
              >
                <Icon as={Dices} size={16} />
                <Text>Sortear</Text>
              </Button>
              <Button
                variant="outline"
                onPress={openForm}
                accessibilityLabel="Crear cita"
                className="px-3"
              >
                <Icon as={Plus} size={16} />
                <Text>Nueva</Text>
              </Button>
            </View>
          </View>

          {success && (
            <Alert icon={CircleCheck} iconClassName="text-primary">
              <View className="flex-row items-start justify-between gap-2">
                <View className="flex-1 gap-0.5">
                  <AlertTitle>Cita agregada</AlertTitle>
                  <AlertDescription>{success}</AlertDescription>
                </View>
                <Button
                  variant="ghost"
                  size="icon"
                  onPress={() => setSuccess(undefined)}
                  accessibilityLabel="Cerrar"
                  className="-mr-2 -mt-1"
                >
                  <Icon as={X} className="text-muted-foreground" size={16} />
                </Button>
              </View>
            </Alert>
          )}

          {!!loadError && recommendations.length > 0 && (
            <Alert variant="destructive" icon={TriangleAlert}>
              <View className="flex-row items-start justify-between gap-2">
                <View className="flex-1 gap-0.5">
                  <AlertTitle>No pudimos cargar las recomendaciones</AlertTitle>
                  <AlertDescription>{loadError}</AlertDescription>
                </View>
                <Button
                  variant="ghost"
                  size="icon"
                  onPress={() => setLoadError(undefined)}
                  accessibilityLabel="Cerrar"
                  className="-mr-2 -mt-1"
                >
                  <Icon as={X} className="text-muted-foreground" size={16} />
                </Button>
              </View>
              <Button
                variant="outline"
                size="sm"
                className="ml-6 mt-1 h-11 self-start"
                onPress={handleRefresh}
                disabled={refreshing}
              >
                <Text>{refreshing ? "Reintentando..." : "Reintentar"}</Text>
              </Button>
            </Alert>
          )}

          <View className="flex-row items-center gap-2">
            <View className="h-10 flex-1 flex-row items-center rounded-md border border-input bg-background pl-3 shadow-sm shadow-black/5 dark:bg-input/30">
              <Icon as={Search} size={16} className="text-muted-foreground" />
              <Input
                value={query}
                onChangeText={setQuery}
                placeholder="Buscar por título"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
                accessibilityLabel="Buscar recomendaciones por título"
                className="h-full flex-1 border-0 bg-transparent px-2 text-base shadow-none"
              />
              {query.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="mr-1 h-8 w-8 rounded-full"
                  onPress={() => setQuery("")}
                  accessibilityLabel="Borrar el texto de búsqueda"
                  hitSlop={4}
                >
                  <Icon as={X} size={14} className="text-muted-foreground" />
                </Button>
              )}
            </View>

            <Button
              variant="outline"
              onPress={openFilters}
              accessibilityLabel={
                activeFilterCount > 0
                  ? `Abrir filtros, ${activeFilterCount} activos`
                  : "Abrir filtros"
              }
            >
              <Icon as={SlidersHorizontal} size={16} />
              <Text>
                {activeFilterCount > 0
                  ? `Filtros (${activeFilterCount})`
                  : "Filtros"}
              </Text>
            </Button>
          </View>

          {activeFilterCount > 0 && (
            <Text variant="muted" numberOfLines={1} className="text-xs">
              Filtros: {activeFilterSummary}
            </Text>
          )}

          {!loading && recommendations.length > 0 && (
            <View className="flex-row items-center justify-between gap-3">
              <Text variant="muted" className="text-xs">
                {filteredDates.length} de {recommendations.length}{" "}
                recomendaciones
              </Text>
              {hasActiveFilters && (
                <Pressable
                  onPress={clearFilters}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Quitar la búsqueda y todos los filtros"
                >
                  <Text className="text-xs font-medium text-primary">
                    Limpiar todo
                  </Text>
                </Pressable>
              )}
            </View>
          )}
        </View>

        {loading ? (
          <View className="flex-1 items-center justify-center pb-10">
            <Text variant="muted">Cargando recomendaciones...</Text>
          </View>
        ) : (
          <FlatList
            className="flex-1"
            data={filteredDates}
            keyExtractor={(item) => item.dateId}
            contentContainerClassName="gap-3 pb-6"
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
              />
            }
            ListEmptyComponent={
              <View className="items-center gap-3 rounded-lg border border-dashed border-border px-4 py-10">
                {loadError ? (
                  <>
                    <Text className="text-center text-sm text-muted-foreground">
                      Las recomendaciones no están disponibles en este momento.
                    </Text>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-11"
                      onPress={handleRefresh}
                      disabled={refreshing}
                    >
                      <Text>
                        {refreshing ? "Reintentando..." : "Reintentar"}
                      </Text>
                    </Button>
                  </>
                ) : hasActiveFilters ? (
                  <>
                    <Text variant="muted">
                      No hay recomendaciones que coincidan con el filtro.
                    </Text>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9"
                      onPress={clearFilters}
                    >
                      <Text>Limpiar todo</Text>
                    </Button>
                  </>
                ) : (
                  <>
                    <Text className="text-center text-sm text-muted-foreground">
                      No hay recomendaciones nuevas por ahora. Crea tu propia
                      cita.
                    </Text>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-11"
                      onPress={openForm}
                    >
                      <Icon as={Plus} size={14} />
                      <Text>Nueva cita</Text>
                    </Button>
                  </>
                )}
              </View>
            }
            renderItem={({ item }) => (
              <RecommendationCard
                date={item}
                adding={addingId === item.dateId}
                disabled={applying}
                error={
                  addError?.dateId === item.dateId
                    ? addError.message
                    : undefined
                }
                onAdd={handleAdd}
                onEdit={openEdit}
              />
            )}
          />
        )}
      </View>

      <DateFormSheet
        date={editTarget}
        saving={isSavingEdit}
        error={editError}
        heading="Agregar"
        hint="Ajústala antes de que entre a tu Alphadate. Su letra sigue al título."
        errorTitle="No pudimos agregar la cita"
        saveLabel="Agregar"
        savingLabel="Agregando..."
        onCancel={() => {
          if (!isSavingEdit) {
            setEditTarget(undefined);
            setEditError(undefined);
          }
        }}
        onSave={handleEditSave}
      />

      <SafeModalContent
        visible={filtersVisible}
        transparent
        animationType="slide"
        onRequestClose={closeFilters}
      >
        <View className="flex-1 justify-end bg-black/50">
          <Pressable
            className="flex-1"
            onPress={closeFilters}
            accessibilityLabel="Cerrar"
          />
          <View className="gap-5 rounded-t-3xl border-t border-border bg-card p-5 pb-8">
            <View className="flex-row items-center justify-between">
              <Text variant="h4">Filtros</Text>
              <Button
                variant="ghost"
                size="icon"
                onPress={closeFilters}
                accessibilityLabel="Cerrar"
                className="-mr-2"
              >
                <Icon as={X} className="text-muted-foreground" size={18} />
              </Button>
            </View>

            <ScrollView
              className="max-h-[60vh]"
              contentContainerClassName="gap-6"
              keyboardShouldPersistTaps="handled"
            >
              {availableLetters.length > 1 && (
                <View className="gap-2">
                  <Text variant="muted" className="text-xs font-medium">
                    Letra inicial
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    <FilterChip
                      label="Todas"
                      accessibilityLabel="Ver todas las letras"
                      active={selectedLetter === undefined}
                      onPress={() => setSelectedLetter(undefined)}
                    />
                    {availableLetters.map((letter) => (
                      <FilterChip
                        key={letter}
                        label={letter.toUpperCase()}
                        accessibilityLabel={`Filtrar por la letra ${letter.toUpperCase()}`}
                        active={selectedLetter === letter}
                        onPress={() =>
                          setSelectedLetter((current) =>
                            current === letter ? undefined : letter
                          )
                        }
                      />
                    ))}
                  </View>
                </View>
              )}

              {availableTags.length > 0 && (
                <View className="gap-2">
                  <Text variant="muted" className="text-xs font-medium">
                    Etiquetas
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {availableTags.map((tag) => (
                      <FilterChip
                        key={tag.key}
                        label={tag.label}
                        accessibilityLabel={`Filtrar por la etiqueta ${tag.label}`}
                        active={selectedTags.includes(tag.key)}
                        onPress={() => toggleTag(tag.key)}
                      />
                    ))}
                  </View>
                </View>
              )}
            </ScrollView>

            <View className="flex-row gap-3">
              <Button
                variant="outline"
                size="lg"
                className="flex-1"
                onPress={clearSpecialFilters}
              >
                <Text>Limpiar</Text>
              </Button>
              <Button size="lg" className="flex-1" onPress={closeFilters}>
                <Text>Listo</Text>
              </Button>
            </View>
          </View>
        </View>
      </SafeModalContent>

      <SafeModalContent
        visible={raffleVisible}
        transparent
        animationType="slide"
        onRequestClose={closeRaffle}
      >
        <View className="flex-1 justify-end bg-black/50">
          <Pressable
            className="flex-1"
            onPress={closeRaffle}
            accessibilityLabel="Cerrar"
          />
          <View className="gap-5 rounded-t-3xl border-t border-border bg-card p-5 pb-8">
            <View className="flex-row items-start justify-between gap-3">
              <View className="flex-1 gap-1">
                <Text variant="h4">Sorteo</Text>
                <Text variant="muted" className="text-sm">
                  Gira la ruleta y deja que el azar elija tu próxima cita.
                </Text>
              </View>
              <Button
                variant="ghost"
                size="icon"
                onPress={closeRaffle}
                accessibilityLabel="Cerrar"
                className="-mr-2 -mt-2"
              >
                <Icon as={X} className="text-muted-foreground" size={18} />
              </Button>
            </View>

            <ScrollView
              ref={raffleScrollRef}
              className="max-h-[70vh]"
              contentContainerClassName="gap-5"
              showsVerticalScrollIndicator={false}
            >
              {availableLetters.length === 0 ? (
                <View className="items-center gap-3 rounded-lg border border-dashed border-border px-4 py-8">
                  <Text className="text-center text-sm text-muted-foreground">
                    No hay recomendaciones para sortear por ahora.
                  </Text>
                </View>
              ) : (
                <>
                  <View className="items-center">
                    <AlphabetWheel
                      targets={availableLetters}
                      spinToken={spinToken}
                      highlight={
                        raffleResult
                          ? normalizeLetter(raffleResult.letter)
                          : undefined
                      }
                      onResult={handleWheelResult}
                    />
                  </View>

                  <Button
                    size="lg"
                    onPress={startSpin}
                    disabled={spinning}
                    accessibilityState={{ busy: spinning }}
                  >
                    <Icon as={Dices} size={18} />
                    <Text>
                      {spinning
                        ? "Girando..."
                        : raffleResult
                          ? "Sortear otra"
                          : "Girar la ruleta"}
                    </Text>
                  </Button>

                  {raffleResult ? (
                    <RecommendationCard
                      date={raffleResult}
                      adding={addingId === raffleResult.dateId}
                      disabled={applying}
                      compact
                      error={
                        addError?.dateId === raffleResult.dateId
                          ? addError.message
                          : undefined
                      }
                      onAdd={handleRaffleAdd}
                      onEdit={openRaffleEdit}
                    />
                  ) : (
                    <Text variant="muted" className="text-center text-sm">
                      {spinning
                        ? "Buscando una cita..."
                        : 'Toca "Girar la ruleta" para empezar.'}
                    </Text>
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </SafeModalContent>

      <SafeModalContent
        visible={formVisible}
        transparent
        animationType="slide"
        onRequestClose={closeForm}
      >
        <View className="flex-1 justify-end bg-black/50">
          <Pressable
            className="flex-1"
            onPress={closeForm}
            accessibilityLabel="Cerrar"
          />
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <View className="gap-5 rounded-t-3xl border-t border-border bg-card p-5 pb-8">
              <View className="flex-row items-center justify-between">
                <Text variant="h4">Nueva cita</Text>
                <Button
                  variant="ghost"
                  size="icon"
                  onPress={closeForm}
                  accessibilityLabel="Cerrar"
                  className="-mr-2"
                >
                  <Icon as={X} className="text-muted-foreground" size={18} />
                </Button>
              </View>

              {!!errors.form && (
                <Alert variant="destructive" icon={TriangleAlert}>
                  <AlertTitle>No pudimos crear la cita</AlertTitle>
                  <AlertDescription>{errors.form}</AlertDescription>
                </Alert>
              )}

              <View className="gap-2">
                <Label nativeID="date-title" htmlFor="date-title">
                  Título
                </Label>
                <Input
                  id="date-title"
                  aria-labelledby="date-title"
                  value={title}
                  onChangeText={setTitle}
                  onBlur={() => setErrors(validate())}
                  placeholder="Cenamos? Salimos? Noche de Pelis?"
                  editable={!isSubmitting}
                  aria-invalid={!!errors.title}
                  className={cn(errors.title && "border-destructive")}
                />
                {!!errors.title && (
                  <Text className="text-sm text-destructive">
                    {errors.title}
                  </Text>
                )}
              </View>

              <View className="gap-2">
                <Label nativeID="date-description" htmlFor="date-description">
                  Descripción
                </Label>
                <Input
                  id="date-description"
                  aria-labelledby="date-description"
                  value={description}
                  onChangeText={setDescription}
                  onBlur={() => setErrors(validate())}
                  placeholder="¿De qué se trata esta cita?"
                  multiline
                  editable={!isSubmitting}
                  aria-invalid={!!errors.description}
                  className={cn(
                    "h-24 py-2",
                    errors.description && "border-destructive"
                  )}
                />
                {!!errors.description && (
                  <Text className="text-sm text-destructive">
                    {errors.description}
                  </Text>
                )}
              </View>

              <View className="gap-2">
                <Label nativeID="date-tags" htmlFor="date-tags">
                  Etiquetas
                </Label>
                <Input
                  id="date-tags"
                  aria-labelledby="date-tags"
                  value={tags}
                  onChangeText={setTags}
                  placeholder="amigos, viaje, ideas"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isSubmitting}
                />
                <Text variant="muted" className="text-xs">
                  Separa las etiquetas con comas.
                </Text>
              </View>

              <View className="flex-row gap-3">
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1"
                  onPress={closeForm}
                  disabled={isSubmitting}
                >
                  <Text>Cancelar</Text>
                </Button>
                <Button
                  size="lg"
                  className="flex-1"
                  onPress={handleCreate}
                  disabled={isSubmitting}
                >
                  <Text>{isSubmitting ? "Creando..." : "Crear"}</Text>
                </Button>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </SafeModalContent>
    </ScreenLayout>
  );
}
