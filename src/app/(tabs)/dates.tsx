import { useEffect, useMemo, useState } from "react";

import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  View,
} from "react-native";

import {
  CircleCheck,
  Plus,
  Search,
  TriangleAlert,
  X,
} from "lucide-react-native";

import ScreenLayout from "@/components/shared/ScreenLayout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";
import { AlphadateService } from "@/lib/services/api/alphadateApiService";
import { AlphabetDatesResponse } from "@/lib/services/api/responses/alphabetDatesResponse";
import { cn } from "@/lib/utils";

type DateItem = AlphabetDatesResponse["dates"][number];

export type DateFormErrors = {
  title?: string;
  description?: string;
  form?: string;
};

const MOCK_SERVER_DATES: DateItem[] = [
  {
    userId: "server",
    dateId: "server-01",
    letter: "a",
    title: "Anniversary dinner",
    description: "Reserve a table for two downtown.",
    tags: ["romantic"],
  },
  {
    userId: "server",
    dateId: "server-02",
    letter: "b",
    title: "Book club meeting",
    description: "Monthly meetup to discuss the latest novel.",
    tags: ["friends", "books"],
  },
  {
    userId: "server",
    dateId: "server-03",
    letter: "c",
    title: "Coffee with Alex",
    description: "Catch up over coffee at the new place.",
    tags: ["friends"],
  },
  {
    userId: "server",
    dateId: "server-04",
    letter: "m",
    title: "Mountain hike",
    description: "Trail starts early, bring water and snacks.",
    tags: ["outdoors", "sports"],
  },
  {
    userId: "server",
    dateId: "server-05",
    letter: "m",
    title: "Movie marathon",
    description: "Sci-fi classics back to back.",
    tags: ["friends", "home"],
  },
  {
    userId: "server",
    dateId: "server-06",
    letter: "p",
    title: "Painting workshop",
    description: "Beginner friendly two-hour session.",
    tags: ["art"],
  },
];

type DateSearchFilter = {
  key: string;
  matches: (date: DateItem, query: string) => boolean;
};

const DATE_SEARCH_FILTERS: DateSearchFilter[] = [
  {
    key: "title",
    matches: (date, query) => date.title.toLowerCase().includes(query),
  },
];

function searchDates(dates: DateItem[], query: string): DateItem[] {
  const normalizedQuery = query.trim().toLowerCase();

  if (normalizedQuery.length === 0) {
    return dates;
  }

  return dates.filter((date) =>
    DATE_SEARCH_FILTERS.some((filter) => filter.matches(date, normalizedQuery))
  );
}

function parseTags(tags: string): string[] {
  return tags
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}

export default function Dates() {
  const [query, setQuery] = useState("");
  const [success, setSuccess] = useState<string | undefined>();

  const [formVisible, setFormVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<DateFormErrors>({});

  const filteredDates = useMemo(
    () => searchDates(MOCK_SERVER_DATES, query),
    [query]
  );

  useEffect(() => {
    if (!success) {
      return;
    }

    const timer = setTimeout(() => setSuccess(undefined), 5000);
    return () => clearTimeout(timer);
  }, [success]);

  function validate(): DateFormErrors {
    const nextErrors: DateFormErrors = {};

    if (title.trim().length === 0) {
      nextErrors.title = "Enter a title.";
    }

    if (description.trim().length === 0) {
      nextErrors.description = "Enter a description.";
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
      setSuccess(
        "Your date was added to your alphabet. Home will show it on its next refresh."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScreenLayout>
      <View className="flex-1 gap-4">
        <View className="gap-4">
          <View className="gap-1.5">
            <Text variant="h3">Dates</Text>
            <Text variant="muted">Search your dates or create a new one.</Text>
          </View>

          {success && (
            <Alert icon={CircleCheck} iconClassName="text-primary">
              <View className="flex-row items-start justify-between gap-2">
                <View className="flex-1 gap-0.5">
                  <AlertTitle>Date created</AlertTitle>
                  <AlertDescription>{success}</AlertDescription>
                </View>
                <Button
                  variant="ghost"
                  size="icon"
                  onPress={() => setSuccess(undefined)}
                  accessibilityLabel="Dismiss"
                  className="-mr-2 -mt-1"
                >
                  <Icon as={X} className="text-muted-foreground" size={16} />
                </Button>
              </View>
            </Alert>
          )}

          <View className="flex-row items-center gap-2">
            <View className="relative flex-1 justify-center">
              <Icon
                as={Search}
                className="absolute left-3 text-muted-foreground"
                size={16}
              />
              <Input
                value={query}
                onChangeText={setQuery}
                placeholder="Search by title..."
                autoCapitalize="none"
                autoCorrect={false}
                accessibilityLabel="Search dates"
                className="pl-9"
              />
            </View>

            <Button onPress={openForm} accessibilityLabel="Create date">
              <Icon as={Plus} size={16} />
              <Text>New</Text>
            </Button>
          </View>

          <Text variant="muted" className="text-xs">
            {filteredDates.length} of {MOCK_SERVER_DATES.length} dates
          </Text>
        </View>

        <FlatList
          className="flex-1"
          data={filteredDates}
          keyExtractor={(item) => item.dateId}
          contentContainerClassName="gap-3 pb-6"
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View className="items-center gap-2 rounded-lg border border-dashed border-border py-10">
              <Text variant="muted">No dates match your search.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Card className="gap-3 py-4">
              <CardHeader className="gap-2 px-5">
                <View className="flex-row items-center justify-between gap-2">
                  <CardTitle className="text-base">{item.title}</CardTitle>
                  <View className="rounded-full bg-primary px-2 py-0.5">
                    <Text className="text-xs font-semibold uppercase text-primary-foreground">
                      {item.letter}
                    </Text>
                  </View>
                </View>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
              <CardContent className="px-5">
                <View className="flex-row flex-wrap gap-2">
                  {item.tags.map((tag) => (
                    <View
                      key={tag}
                      className="rounded-full border border-border bg-secondary px-2 py-1"
                    >
                      <Text className="text-xs text-secondary-foreground">
                        {tag}
                      </Text>
                    </View>
                  ))}
                </View>
              </CardContent>
            </Card>
          )}
        />
      </View>

      <Modal
        visible={formVisible}
        transparent
        animationType="slide"
        onRequestClose={closeForm}
      >
        <View className="flex-1 justify-end bg-black/50">
          <Pressable
            className="flex-1"
            onPress={closeForm}
            accessibilityLabel="Dismiss"
          />
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <View className="gap-5 rounded-t-3xl border-t border-border bg-card p-5 pb-8">
              <View className="flex-row items-center justify-between">
                <Text variant="h4">New date</Text>
                <Button
                  variant="ghost"
                  size="icon"
                  onPress={closeForm}
                  accessibilityLabel="Close"
                  className="-mr-2"
                >
                  <Icon as={X} className="text-muted-foreground" size={18} />
                </Button>
              </View>

              {!!errors.form && (
                <Alert variant="destructive" icon={TriangleAlert}>
                  <AlertTitle>We couldn&apos;t create the date</AlertTitle>
                  <AlertDescription>{errors.form}</AlertDescription>
                </Alert>
              )}

              <View className="gap-2">
                <Label nativeID="date-title" htmlFor="date-title">
                  Title
                </Label>
                <Input
                  id="date-title"
                  aria-labelledby="date-title"
                  value={title}
                  onChangeText={setTitle}
                  onBlur={() => setErrors(validate())}
                  placeholder="Dinner at sunset"
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
                  Description
                </Label>
                <Input
                  id="date-description"
                  aria-labelledby="date-description"
                  value={description}
                  onChangeText={setDescription}
                  onBlur={() => setErrors(validate())}
                  placeholder="What is this date about?"
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
                  Tags
                </Label>
                <Input
                  id="date-tags"
                  aria-labelledby="date-tags"
                  value={tags}
                  onChangeText={setTags}
                  placeholder="friends, travel, ideas"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isSubmitting}
                />
                <Text variant="muted" className="text-xs">
                  Separate tags with commas.
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
                  <Text>Cancel</Text>
                </Button>
                <Button
                  size="lg"
                  className="flex-1"
                  onPress={handleCreate}
                  disabled={isSubmitting}
                >
                  <Text>{isSubmitting ? "Creating..." : "Create"}</Text>
                </Button>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </ScreenLayout>
  );
}
