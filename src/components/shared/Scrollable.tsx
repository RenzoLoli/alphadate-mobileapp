import { RefreshControl, ScrollView } from "react-native";

type Props = {
  children: React.ReactNode;
  className?: string;
  refreshing?: boolean;
  onRefresh?: () => void;
};

export default function Scrollable({
  children,
  className = "",
  onRefresh,
  refreshing = false,
}: Props) {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      className={`flex-1 ${className}`}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing ?? false}
            onRefresh={onRefresh}
            tintColor="primary"
          />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  );
}
