import { Link } from "expo-router";
import type { Href } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { formatDueDate, urgencyLabel } from "@/src/lib/format";
import { theme } from "@/src/theme/tokens";
import type { Task, TaskUrgency } from "@/src/types/api";

const urgencyColors: Record<TaskUrgency, string> = {
  low: "#7D9773",
  medium: "#C3922E",
  high: "#D46A4F",
  critical: "#A94442"
};

type TaskCardProps = {
  task: Task;
  href?: Href;
  listName?: string;
  onToggle?: (nextCompleted: boolean) => void;
};

function TaskCardBody({ task, listName }: { task: Task; listName?: string }) {
  return (
    <View style={styles.body}>
      <View style={styles.row}>
        <Text numberOfLines={2} style={[styles.title, task.completed && styles.completedTitle]}>
          {task.title}
        </Text>
        <View
          style={[
            styles.badge,
            {
              backgroundColor: urgencyColors[task.urgency]
            }
          ]}
        >
          <Text style={styles.badgeLabel}>{urgencyLabel(task.urgency)}</Text>
        </View>
      </View>
      {task.notes ? (
        <Text numberOfLines={2} style={styles.notes}>
          {task.notes}
        </Text>
      ) : null}
      <View style={styles.metaRow}>
        <Text style={styles.metaText}>{formatDueDate(task.dueDate)}</Text>
        {listName ? <Text style={styles.metaText}>{listName}</Text> : null}
        <Text style={styles.metaText}>{task.completed ? "Completed" : "Open"}</Text>
      </View>
    </View>
  );
}

export function TaskCard({ task, href, listName, onToggle }: TaskCardProps) {
  return (
    <View style={styles.card}>
      <Pressable
        onPress={() => onToggle?.(!task.completed)}
        style={[styles.toggle, task.completed && styles.toggleCompleted]}
      >
        <Text style={[styles.toggleLabel, task.completed && styles.toggleLabelCompleted]}>
          {task.completed ? "Done" : "Open"}
        </Text>
      </Pressable>
      {href ? (
        <Link href={href} asChild>
          <Pressable style={styles.linkArea}>
            <TaskCardBody listName={listName} task={task} />
          </Pressable>
        </Link>
      ) : (
        <View style={styles.linkArea}>
          <TaskCardBody listName={listName} task={task} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "stretch",
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 14
  },
  toggle: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: 999,
    minWidth: 58,
    paddingHorizontal: 10,
    paddingVertical: 10
  },
  toggleCompleted: {
    backgroundColor: theme.colors.cardAccent
  },
  toggleLabel: {
    color: theme.colors.subtleText,
    fontSize: 12,
    fontWeight: "700"
  },
  toggleLabelCompleted: {
    color: theme.colors.background
  },
  linkArea: {
    flex: 1
  },
  body: {
    gap: 10
  },
  row: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between"
  },
  title: {
    color: theme.colors.text,
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    lineHeight: 22
  },
  completedTitle: {
    color: theme.colors.mutedText,
    textDecorationLine: "line-through"
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  badgeLabel: {
    color: theme.colors.background,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase"
  },
  notes: {
    color: theme.colors.subtleText,
    fontSize: 14,
    lineHeight: 20
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12
  },
  metaText: {
    color: theme.colors.mutedText,
    fontSize: 12,
    fontWeight: "600"
  }
});
