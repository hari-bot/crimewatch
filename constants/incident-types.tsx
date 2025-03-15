import { Clock, Search, CheckCircle, Trash2 } from "lucide-react";

// Define crime types with their respective colors
export const crimeTypes = [
  { id: "theft", label: "Theft", color: "#FF5733" },
  { id: "assault", label: "Assault", color: "#C70039" },
  { id: "vandalism", label: "Vandalism", color: "#FFC300" },
  { id: "burglary", label: "Burglary", color: "#900C3F" },
  { id: "other", label: "Other", color: "#581845" },
];

// Define status types
export const statusTypes = [
  { id: "pending", label: "Pending", icon: Clock, color: "#FFC107" },
  {
    id: "investigating",
    label: "Investigating",
    icon: Search,
    color: "#2196F3",
  },
  { id: "resolved", label: "Resolved", icon: CheckCircle, color: "#4CAF50" },
  { id: "dismissed", label: "Dismissed", icon: Trash2, color: "#9E9E9E" },
];
