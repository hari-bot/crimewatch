"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  BarChart3,
  PieChart,
  TrendingUp,
  Calendar,
  FileText,
  Filter,
  Download,
} from "lucide-react";
import { statusTypes } from "@/constants/incident-types";
import type { Incident } from "@/types";
import { exportAnalyticsCSV } from "@/utils/admin-dashboard-utils";

interface AnalyticsViewProps {
  loading: boolean;
  incidents: Incident[];
  analyticsData: any;
  analyticsTimeframe: string;
  setAnalyticsTimeframe: (timeframe: string) => void;
  hotspots: { center: [number, number]; count: number; radius: number }[];
  toast: any;
}

export default function AnalyticsView({
  loading,
  incidents,
  analyticsData,
  analyticsTimeframe,
  setAnalyticsTimeframe,
  hotspots,
  toast,
}: AnalyticsViewProps) {
  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Crime Analytics Dashboard</h2>
        <div className="flex items-center gap-4">
          <Select
            value={analyticsTimeframe}
            onValueChange={setAnalyticsTimeframe}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last 7 Days</SelectItem>
              <SelectItem value="month">Last 30 Days</SelectItem>
              <SelectItem value="year">Last 12 Months</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => exportAnalyticsCSV(incidents, toast)}
          >
            <Download className="h-4 w-4" />
            Export Data
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading analytics data...</div>
      ) : !analyticsData ? (
        <div className="text-center py-8 text-muted-foreground">
          No incident data available for analysis
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Total Incidents
                    </p>
                    <h3 className="text-2xl font-bold">
                      {analyticsData.totalIncidents}
                    </h3>
                  </div>
                  <FileText className="h-8 w-8 text-primary opacity-80" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Resolution Rate
                    </p>
                    <h3 className="text-2xl font-bold">
                      {analyticsData.resolutionRate.toFixed(1)}%
                    </h3>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500 opacity-80" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Avg. Resolution Time
                    </p>
                    <h3 className="text-2xl font-bold">
                      {analyticsData.avgResolutionTime.toFixed(1)} hrs
                    </h3>
                  </div>
                  <Clock className="h-8 w-8 text-blue-500 opacity-80" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Crime Hotspots
                    </p>
                    <h3 className="text-2xl font-bold">{hotspots.length}</h3>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-500 opacity-80" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Incidents Over Time
                </CardTitle>
                <CardDescription>
                  Number of reported incidents by{" "}
                  {analyticsTimeframe === "week"
                    ? "day"
                    : analyticsTimeframe === "month"
                    ? "week"
                    : "month"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={analyticsData.timeData}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="count"
                        name="Incidents"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Incidents by Type
                </CardTitle>
                <CardDescription>
                  Distribution of incidents across different crime categories
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={analyticsData.byType}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {analyticsData.byType.map(
                          (entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          )
                        )}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Incidents by Status
                </CardTitle>
                <CardDescription>
                  Current status of all reported incidents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={analyticsData.byStatus}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" name="Incidents">
                        {analyticsData.byStatus.map(
                          (entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          )
                        )}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Incidents by Time of Day
                </CardTitle>
                <CardDescription>
                  When incidents are most frequently reported
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={analyticsData.byTimeOfDay}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" name="Incidents" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Status Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Incident Status Breakdown
              </CardTitle>
              <CardDescription>
                Detailed view of incident processing status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {statusTypes.map((status) => (
                  <div
                    key={status.id}
                    className="flex flex-col items-center p-4 border rounded-lg"
                  >
                    <div
                      className="p-3 rounded-full mb-2"
                      style={{ backgroundColor: `${status.color}20` }}
                    >
                      <status.icon
                        className="h-6 w-6"
                        style={{ color: status.color }}
                      />
                    </div>
                    <h3 className="text-lg font-semibold">{status.label}</h3>
                    <p className="text-3xl font-bold mt-2">
                      {
                        incidents.filter(
                          (incident) => incident.status === status.id
                        ).length
                      }
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {(
                        (incidents.filter(
                          (incident) => incident.status === status.id
                        ).length /
                          incidents.length) *
                        100
                      ).toFixed(1)}
                      % of total
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
